# Vetrina — setup and operation

Everything needed to run your own instance: installing it from scratch, using it
day to day, and what to check when something breaks.

For what the project is and why, see the [README](../README.md).
Questa guida è disponibile anche [in italiano](GUIDA.md).

---

## Contents

1. [How the pieces fit](#1-how-the-pieces-fit)
2. [What you need](#2-what-you-need)
3. [Creating the Telegram bot](#3-creating-the-telegram-bot)
4. [Setting up Airtable](#4-setting-up-airtable)
5. [Cloudinary for photos](#5-cloudinary-for-photos)
6. [Deploying the site](#6-deploying-the-site)
7. [Deploying the bot](#7-deploying-the-bot)
8. [Filling in the shop's details](#8-filling-in-the-shops-details)
9. [Day-to-day use](#9-day-to-day-use)
10. [Working locally](#10-working-locally)
11. [When something goes wrong](#11-when-something-goes-wrong)

---

## 1. How the pieces fit

Four parts talking to each other:

```
Shopkeeper ──(photos, voice)──▶ Telegram bot ──▶ Airtable (catalogue)
                                     │                  ▲
                                     │  photos          │ read at
                                     ▼                  │ build time
                                Cloudinary              │
                                     │                  │
                                     └──(deploy hook)──▶ Vercel ──▶ Site
```

The site is **static**: it is rebuilt whenever the catalogue changes, so visitors
get an instant page that does not depend on any third-party service being up.

---

## 2. What you need

Free accounts on [Vercel](https://vercel.com), [Airtable](https://airtable.com) and
[Cloudinary](https://cloudinary.com), plus two pay-as-you-go API keys:
[Anthropic](https://console.anthropic.com) (required) and
[OpenAI](https://platform.openai.com) (only for voice notes).

Locally you need [Node.js](https://nodejs.org) 20 or newer.

> **On cost.** Vercel, Airtable and Cloudinary stay on free tiers at this scale.
> The only real spend is the AI: roughly €0.02 per item added, under €0.01 for
> everything else. Topping up $5 on each key covers many months. Both are
> pay-as-you-go, with no subscription.

---

## 3. Creating the Telegram bot

1. Message **@BotFather** on Telegram and send `/newbot`.
2. Pick a name (the shop's) and a username ending in `bot`.
3. BotFather replies with a **token** like `123456789:AAH...` — that is
   `TELEGRAM_BOT_TOKEN`.
4. You also need the **Telegram user IDs** of everyone allowed to use the bot.
   Each person messages **@userinfobot** from their own phone and gets a number.
   Those numbers, comma-separated, are `ALLOWED_TELEGRAM_IDS`; everyone else gets
   a flat "Bot privato".

---

## 4. Setting up Airtable

1. Create an **empty base** (name it whatever you like).
2. With the base open, the URL reads `https://airtable.com/appXXXXXXXXXXXXXX/...`
   — the part starting with `app` is `AIRTABLE_BASE_ID`.
3. Create a **Personal Access Token** at
   <https://airtable.com/create/tokens>, granting it access to that base with:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:write` (only needed for the scripts below)

   The token is `AIRTABLE_API_KEY`.
4. From the `bot` folder, copy `.env.example` to `.env`, fill in at least those two
   keys, then create the tables:

   ```bash
   npm install
   npm run create-airtable-table   # "Oggetti" — the catalogue
   npm run aggiorna-airtable       # "Sessioni" — the bot's own bookkeeping
   ```

### The "Oggetti" table

If you would rather build it by hand, these are the exact fields. Field names are
in Italian because the bot writes to them by name — keep them as they are.

| Field | Type | Notes |
|---|---|---|
| Nome | Text | primary field |
| Categoria | Single select | Mobili, Sedute, Quadri, Oggettistica, Illuminazione, Altro |
| Epoca | Text | period |
| Materiale | Text | material |
| Dimensioni | Text | optional |
| Descrizione breve | Long text | for the catalogue card |
| Descrizione lunga | Long text | for the item page |
| Foto | Long text | Cloudinary URLs, one per line — written by the bot |
| Prezzo di vendita | Number | if empty the site shows "price on request" |
| Prezzo di acquisto | Number | purchase price — **never** shown on the site |
| Stato | Single select | Disponibile, Venduto, Bozza, Ritirato |
| Data inserimento | Date | added on |
| Data vendita | Date | sold on |
| Note private | Long text | never shown on the site |
| Chat | Text | bot bookkeeping |
| Fase | Text | bot bookkeeping |

**The states:**

- **Disponibile** — for sale, in the shop window.
- **Venduto** — sold: appears under "recently sold" and counts towards profit.
- **Ritirato** — withdrawn *without* a sale (kept, broken, added by mistake).
  Disappears from the site and does not touch the figures.
- **Bozza** — a draft in the bot, not yet confirmed.

You can add an **ID** field of type *Autonumber* by hand: if present, item URLs
become `/oggetti/1/` instead of Airtable's internal record ID. Do it before
publishing many pieces, since it changes the URLs of anything already online.

---

## 5. Cloudinary for photos

Sign up and take **Cloud name**, **API Key** and **API Secret** from the dashboard:
these are `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and
`CLOUDINARY_API_SECRET`.

Photos land in the folder named by `CLOUDINARY_FOLDER` (`vetrina` if unset), and
the site requests them already resized and compressed.

---

## 6. Deploying the site

1. Push the repository to GitHub.
2. On Vercel: **Add New → Project**, import the repository and set
   **Root Directory = `site`**.
3. Under **Environment Variables** add at least `AIRTABLE_API_KEY`,
   `AIRTABLE_BASE_ID`, `SITE_URL` and the shop's details (see
   [§8](#8-filling-in-the-shops-details)).
4. **Deploy**.
5. Then create the **deploy hook**: Settings → Git → **Deploy Hooks**, any name,
   branch `main`. The URL you get is `VERCEL_DEPLOY_HOOK_URL` — it is how the bot
   triggers a rebuild after every change.

---

## 7. Deploying the bot

1. On Vercel, import **the same repository** a second time with
   **Root Directory = `bot`**.
2. Under Environment Variables add everything from
   [`bot/.env.example`](../bot/.env.example), including the
   `VERCEL_DEPLOY_HOOK_URL` from the previous step.
3. **Deploy**, and note the project's URL.
4. Locally, in the `bot` folder, add to `.env`:

   ```
   WEBHOOK_URL=https://<your-bot>.vercel.app/api/webhook
   ```

   then run:

   ```bash
   npm run set-webhook
   ```

   This is what tells Telegram where to deliver messages.
5. Send `/start` to the bot. If it answers, everything is wired up.

---

## 8. Filling in the shop's details

The shop is not in the code — it is environment variables. That way one codebase
serves different shops and no personal data ends up on GitHub.

With no variables at all the site shows a **fictional example shop**, which is
useful for seeing it work straight away. The moment you set `SHOP_NAME` the site
belongs to a real shop: from then on, fields you leave empty stay empty instead of
inheriting the made-up details.

| Variable | |
|---|---|
| `SHOP_NAME` | the business name — **this is the switch** |
| `SHOP_PHONE` | international format, e.g. `+393391234567` |
| `SHOP_PHONE_DISPLAY` | as displayed, e.g. `339 123 4567` |
| `SHOP_WHATSAPP` | as above without the `+`, e.g. `393391234567` |

These four are required: if one is missing the build stops with a clear message.
That is deliberate — on Vercel a failed build leaves the previous version online,
which beats publishing a site with broken contact buttons.

Everything else is optional and, when empty, **disappears without leaving a hole**:
no address means no address block and no map; no biography means the "story" page
drops out of the menu and is marked `noindex`.

| Variable | |
|---|---|
| `SHOP_TAGLINE` | short line in the footer |
| `SHOP_DESCRIPTION` | meta description for search engines |
| `SHOP_LOGO_MONOGRAM` · `SHOP_LOGO_WORD` | override the wordmark, normally derived from the name |
| `SHOP_OWNER` · `SHOP_LEGAL_NAME` · `SHOP_VAT` | owner, legal name, VAT number |
| `SHOP_ADDRESS` | street, number, postcode, town — **also generates the map** |
| `SHOP_HOURS` | opening hours, lines separated by `\|` |
| `SHOP_EMAIL` | |
| `SHOP_STORY_PARAGRAPHS` | biography, paragraphs separated by `\|` |
| `SHOP_STORY_TITLE` · `SHOP_STORY_ROLE` · `SHOP_STORY_QUOTE` | title, role, pull quote |
| `SHOP_STORY_PHOTO` | e.g. `/owner.jpg`, with the file in `site/public/` |

**The wordmark draws itself.** The logo at the top of the site and the favicon are
derived from the name: "Bottega del Ponte" becomes a large serif **Bottega** with
**DEL PONTE** spaced underneath. A one-word name leaves just the word. For a real logo, put the
file in `site/public/` and replace the contents of
`site/src/components/Logo.astro` with an `<img>`.

Hours, as an example:

```
SHOP_HOURS=Monday - Friday: 9:30 - 19:00|Saturday: 9:30 - 12:30|Sunday: closed
```

After changing a variable on Vercel you need a new deployment for the site to pick
it up: open the deploy hook in a browser, or Deployments → ⋯ → **Redeploy**.

---

## 9. Day-to-day use

Everything is plain Italian, typed or spoken. **Nothing changes without a button
confirmation.**

**Adding an item** — send one or more photos with a few words of description, for
example *"comò piemontese fine ottocento in noce, pagato quattrocento, lo vendo a
milleduecento"*. The bot drafts the entry and offers **✅ Pubblica** or
**✏️ Correggi**. Send a photo with no caption and it asks what the piece is.

**Correcting** — after ✏️ Correggi, say it however it comes out: *"il prezzo è
1000, non 1200"*.

**Selling** — *"venduto il comò"*. The bot shows the photo and asks for
confirmation. The piece moves to "recently sold" and counts towards profit.

**Withdrawing without a sale** — *"togli la poltrona"*, *"me la tengo"*, *"si è
rotta"*. It leaves the site but is not recorded as sold and does not skew the
figures. When the wording is ambiguous the bot picks this, the cautious option.

**Changing a field** — *"il comò ora costa 1000"*, *"la credenza è del
Settecento"*.

**Changing a photo** — *"cambia la foto del comò"* replaces, *"aggiungi una foto
alla credenza"* appends. After confirmation the bot waits for the new photo.

**Asking** — *"cosa ho in vendita?"*, *"quanto ho guadagnato quest'anno?"*.

`/aiuto` shows the list at any time.

---

## 10. Working locally

**Site** (falls back to the example shop and sample catalogue with no `.env`):

```bash
cd site
npm install
npm run dev        # http://localhost:4321
```

**Bot** (long polling, no webhook):

```bash
cd bot
npm install
npm run dev
```

Note that local polling suspends the webhook. When you are done, restore it with
`npm run set-webhook`.

---

## 11. When something goes wrong

**The bot does not answer at all.** Check that your Telegram ID is in
`ALLOWED_TELEGRAM_IDS` — if not, you get "Bot privato". Then read the bot
project's logs on Vercel.

**The bot answers but the site does not update.** In this order:

1. Is the item in Airtable with state "Disponibile"? If not, the problem is in the
   bot.
2. On Vercel, the **site** project → Deployments: are there recent builds, and are
   they green? A build in **Error** tells you why in its log.
3. No builds at all, with *"the commit author did not have contributing access"*:
   see below.
4. Does the deploy hook point at the right project? The URL contains the project
   ID (`.../deploy/prj_XXXX/...`), which must match the **Project ID** under
   Settings → General of the **site** project, not the bot's.

**Deployments blocked over the commit author.** On Vercel's free plan with a
private repository, deployments are silently rejected when the commit author is
not the project owner: the site keeps serving the old build without an error.
Check that Git's email matches the GitHub account that owns the project:

```bash
git config user.email
```

If your machine uses a different address, set one for this repository only:

```bash
git config user.name  "<your-github-username>"
git config user.email "<id>+<username>@users.noreply.github.com"
```

For the same reason, **do not add `Co-Authored-By:` trailers** to commits: Vercel
reads them as a second contributor and blocks the deployment.

**The site shows the example shop.** `SHOP_NAME` is missing from the project's
environment variables on Vercel. The build log says so too.

**The build stops with "Configurazione incompleta".** One of the required contact
details (`SHOP_PHONE`, `SHOP_PHONE_DISPLAY`, `SHOP_WHATSAPP`) is missing. This is
deliberate — the previous version stays online meanwhile.

**The bot loses its confirmations.** Pending operations live in Airtable's
**Sessioni** table, because on Vercel each message may be handled by a different
instance with no shared memory. If the table is missing the bot still works but
less reliably, and says so in the logs: create it with
`npm run aggiorna-airtable`.
