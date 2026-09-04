# Bozza di rilascio — v0.1.0

Proposta, non eseguita. Il tag e la release vanno creati a mano quando decidi che
il momento è quello. Qui sotto: il messaggio del tag, le note di rilascio pronte da
incollare, e cosa converrebbe sistemare prima.

---

## 1. Il tag

Tag annotato, così il messaggio resta nel repository e non solo su GitHub:

```bash
git tag -a v0.1.0 -m "Primo rilascio utilizzabile: catalogo e vetrina gestiti da Telegram, configurabili per qualsiasi bottega senza toccare il codice."
git push origin v0.1.0
```

Perché `v0.1.0` e non `v1.0.0`: il progetto gira in produzione ed è completo per il
caso d'uso per cui è nato, ma è stato installato **una volta sola**. Un `1.0`
promette una stabilità che nessuno ha ancora messo alla prova su una seconda
bottega. Lo `0.1.0` dice esattamente quello che è: funzionante, riutilizzabile,
non ancora collaudato da terzi.

---

## 2. Note di rilascio

Da incollare nella release di GitHub. In inglese, come il README principale.

### Titolo

> **v0.1.0 — First usable release**

### Corpo

```markdown
A catalogue and shop window for a small shop, run entirely from a Telegram chat.
The shopkeeper photographs a piece, says a few words, taps a button; a minute later
it is online, priced and ready for enquiries over WhatsApp.

This is the first release that anyone other than its original shop can install.

### What is in it

- **Telegram bot** — adds items from photos and voice notes, marks pieces sold or
  withdrawn, changes prices and photographs, answers "what do I have for sale?" and
  "what did I earn this year?". Every change is confirmed with a button first, and
  a failure is an apology rather than a stack trace.
- **Static shop window** — Astro, built from the catalogue, served from a CDN. Home,
  catalogue with category filters, item pages with a photo gallery, an optional
  "story" page, contacts with an auto-generated map.
- **The shop is configuration, not code** — every business detail is an environment
  variable. With none set, the site runs as a fictional example shop with a sample
  catalogue, so a fresh clone works before anything is connected.
- **A wordmark that draws itself** — logo and favicon are derived from the shop
  name, so a new instance has an identity without supplying a single image.
- **Documentation in two languages** — setup and day-to-day operation in
  [English](docs/SETUP.md) and [Italian](docs/GUIDA.md).

### Design constraint

The person using it must never see an error, a form, or a decision they did not ask
to make. Every rule in the bot follows from that.

### Requirements

Node 20+. Free tiers of Vercel, Airtable and Cloudinary; an Anthropic API key, and
an OpenAI key if you want voice notes. Running cost is roughly €0.02 per item added
and under €2/month for a shop adding 30 pieces a month.

### Known limitations

- The bot's prompts, its replies and the site's page text are **in Italian**. Three
  files to translate for another language; the README says which.
- Installed and proven on **one shop**. The second installation is likely to find
  something.
- No automated tests: CI builds the site and syntax-checks the bot, nothing more.
- Item URLs use Airtable's internal record IDs unless you add an `ID` autonumber
  field by hand before publishing.

MIT licensed.
```

---

## 3. Cosa converrebbe fare prima di taggare

Nessuno di questi punti blocca il rilascio, ma il primo cambia cosa vede chi arriva:

1. **Le tre immagini** in `docs/img/` (`home.png`, `item.png`, `telegram.png`). Il
   README le referenzia già: finché mancano, la sezione mostra tre icone rotte, che
   su una release annunciata fanno una brutta impressione.
2. **Una prova di installazione da zero**, seguendo `docs/SETUP.md` alla lettera su
   una macchina pulita, con una base Airtable nuova. È l'unico modo di sapere se la
   guida è davvero completa: è stata scritta da chi il sistema lo aveva già montato.
3. **Decidere il campo `ID`** su Airtable. Aggiungerlo dopo cambia gli indirizzi dei
   pezzi già pubblicati; se ha da essere, che sia prima di un rilascio pubblico.
4. **`CHANGELOG.md`**, se pensi ci sarà una `v0.2.0`. Con un solo rilascio le note
   della release bastano.

---

## 4. Dopo il tag

- Su GitHub: *Releases → Draft a new release*, scegli il tag `v0.1.0`, incolla il
  corpo qui sopra.
- Il badge della CI è ancorato a `main` e continuerà a riflettere il ramo, non il
  tag: è quello che si vuole.
- Vercel non usa i tag: la pubblicazione resta legata ai push su `main`, quindi
  taggare non fa partire nessun deploy.
