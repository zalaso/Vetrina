# Guida a Vetrina

Guida pratica in italiano: come installare il sistema da zero, come si usa tutti i
giorni, e cosa guardare quando qualcosa non va.

Per la descrizione del progetto in generale, vedi il [README](../README.md).

---

## Indice

1. [Com'è fatto](#1-comè-fatto)
2. [Cosa serve](#2-cosa-serve)
3. [Creare il bot su Telegram](#3-creare-il-bot-su-telegram)
4. [Preparare Airtable](#4-preparare-airtable)
5. [Cloudinary per le foto](#5-cloudinary-per-le-foto)
6. [Pubblicare il sito](#6-pubblicare-il-sito)
7. [Pubblicare il bot](#7-pubblicare-il-bot)
8. [Riempire i dati della bottega](#8-riempire-i-dati-della-bottega)
9. [Come si usa, tutti i giorni](#9-come-si-usa-tutti-i-giorni)
10. [Lavorare in locale](#10-lavorare-in-locale)
11. [Quando qualcosa non va](#11-quando-qualcosa-non-va)

---

## 1. Com'è fatto

Quattro pezzi che si parlano fra loro:

```
Titolare ──(foto, vocali)──▶ Bot Telegram ──▶ Airtable (catalogo)
                                  │                  ▲
                                  │  foto            │ letto durante
                                  ▼                  │ la compilazione
                             Cloudinary              │
                                  │                  │
                                  └──(deploy hook)──▶ Vercel ──▶ Sito
```

Il sito è **statico**: viene ricompilato ogni volta che il catalogo cambia, quindi
per il visitatore è immediato e non dipende da nessun servizio esterno.

---

## 2. Cosa serve

Account gratuiti su [Vercel](https://vercel.com), [Airtable](https://airtable.com),
[Cloudinary](https://cloudinary.com), più due chiavi a consumo:
[Anthropic](https://console.anthropic.com) (indispensabile) e
[OpenAI](https://platform.openai.com) (solo per i messaggi vocali).

Sul computer serve [Node.js](https://nodejs.org) 20 o superiore.

> **Sui costi.** Vercel, Airtable e Cloudinary restano gratuiti a questi volumi.
> Le uniche spese sono le due chiavi AI: circa 2 centesimi per ogni oggetto
> inserito, meno di un centesimo per tutto il resto. Caricare 5 dollari su
> ciascuna copre parecchi mesi. Sono servizi a consumo, senza abbonamento.

---

## 3. Creare il bot su Telegram

1. Su Telegram cerca **@BotFather** e scrivi `/newbot`.
2. Scegli un nome (quello del negozio) e uno username che finisca per `bot`.
3. BotFather risponde con un **token** tipo `123456789:AAH...`: è
   `TELEGRAM_BOT_TOKEN`.
4. Servono poi gli **ID Telegram** delle persone autorizzate. Ognuna, dal proprio
   telefono, scrive a **@userinfobot**, che risponde con un numero. Quei numeri
   separati da virgola sono `ALLOWED_TELEGRAM_IDS`; chiunque altro riceve
   "Bot privato".

---

## 4. Preparare Airtable

1. Crea una **base vuota** (chiamala come vuoi).
2. Aprendola, l'indirizzo è `https://airtable.com/appXXXXXXXXXXXXXX/...`: la parte
   che inizia con `app` è `AIRTABLE_BASE_ID`.
3. Crea un **Personal Access Token** da
   <https://airtable.com/create/tokens>, con accesso a quella base e questi scope:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:write` (serve solo per gli script qui sotto)

   Il token è `AIRTABLE_API_KEY`.
4. Dalla cartella `bot`, compila `.env` (copiandolo da `.env.example`) almeno con
   queste due chiavi, poi crea le tabelle:

   ```bash
   npm install
   npm run create-airtable-table   # tabella "Oggetti", il catalogo
   npm run aggiorna-airtable       # tabella "Sessioni", uso interno del bot
   ```

### La tabella "Oggetti"

Se preferisci crearla a mano, questi sono i campi esatti:

| Campo | Tipo | Note |
|---|---|---|
| Nome | Testo | campo primario |
| Categoria | Single select | Mobili, Sedute, Quadri, Oggettistica, Illuminazione, Altro |
| Epoca | Testo | |
| Materiale | Testo | |
| Dimensioni | Testo | facoltativo |
| Descrizione breve | Testo lungo | per la scheda nel catalogo |
| Descrizione lunga | Testo lungo | per la pagina dell'oggetto |
| Foto | Testo lungo | URL Cloudinary, uno per riga: li scrive il bot |
| Prezzo di vendita | Numero | se vuoto il sito mostra "Prezzo su richiesta" |
| Prezzo di acquisto | Numero | **mai** mostrato sul sito |
| Stato | Single select | Disponibile, Venduto, Bozza, Ritirato |
| Data inserimento | Data | |
| Data vendita | Data | |
| Note private | Testo lungo | mai mostrate sul sito |
| Chat | Testo | uso interno del bot |
| Fase | Testo | uso interno del bot |

**Gli stati:**

- **Disponibile** — in vetrina.
- **Venduto** — compare fra i "Venduti di recente" e conta nel guadagno.
- **Ritirato** — tolto dal catalogo *senza* vendita (tenuto, rotto, inserito per
  sbaglio). Sparisce dal sito e non tocca i conti.
- **Bozza** — in lavorazione sul bot, non ancora confermato.

Puoi aggiungere a mano un campo **ID** di tipo *Autonumber*: se c'è, gli indirizzi
delle schede diventano `/oggetti/1/` invece del codice interno di Airtable.
Conviene farlo prima di pubblicare molti pezzi, perché dopo cambierebbero gli
indirizzi di quelli già online.

---

## 5. Cloudinary per le foto

Registrati e prendi dalla Dashboard **Cloud name**, **API Key** e **API Secret**:
sono `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Le foto finiscono nella cartella indicata da `CLOUDINARY_FOLDER`
(`vetrina` se non la imposti) e il sito le richiede già
ridimensionate e compresse.

---

## 6. Pubblicare il sito

1. Metti il repository su GitHub.
2. Su Vercel: **Add New → Project**, importa il repository e imposta
   **Root Directory = `site`**.
3. Nelle **Environment Variables** aggiungi almeno `AIRTABLE_API_KEY`,
   `AIRTABLE_BASE_ID`, `SITE_URL` e i dati della bottega (vedi
   [§8](#8-riempire-i-dati-della-bottega)).
4. **Deploy**.
5. Poi crea il **deploy hook**: Settings → Git → **Deploy Hooks**, nome a piacere,
   branch `main`. L'URL che ottieni è `VERCEL_DEPLOY_HOOK_URL`, e serve al bot per
   far ricompilare il sito a ogni modifica.

---

## 7. Pubblicare il bot

1. Su Vercel importa **lo stesso repository** una seconda volta, con
   **Root Directory = `bot`**.
2. Nelle Environment Variables metti tutte le voci di
   [`bot/.env.example`](../bot/.env.example), compreso il
   `VERCEL_DEPLOY_HOOK_URL` del punto precedente.
3. **Deploy**, e prendi nota dell'indirizzo del progetto.
4. Dal computer, nella cartella `bot`, aggiungi al `.env` la riga

   ```
   WEBHOOK_URL=https://<indirizzo-del-bot>.vercel.app/api/webhook
   ```

   e lancia:

   ```bash
   npm run set-webhook
   ```

   È il comando che dice a Telegram dove consegnare i messaggi.
5. Scrivi `/start` al bot: se risponde, è tutto collegato.

---

## 8. Riempire i dati della bottega

I dati non stanno nel codice: sono variabili d'ambiente. Così lo stesso progetto
serve botteghe diverse e nessun dato personale finisce su GitHub.

Senza nessuna variabile il sito mostra una **bottega di esempio**, utile per
vederlo funzionare subito. Appena imposti `SHOP_NAME` il sito diventa quello di una
bottega vera: da quel momento i campi che lasci vuoti restano vuoti, invece di
mostrare i dati inventati.

| Variabile | |
|---|---|
| `SHOP_NAME` | nome dell'attività — **è l'interruttore** |
| `SHOP_PHONE` | telefono internazionale, es. `+393391234567` |
| `SHOP_PHONE_DISPLAY` | come si legge, es. `339 123 4567` |
| `SHOP_WHATSAPP` | come sopra senza `+`, es. `393391234567` |

Queste quattro sono obbligatorie: se ne manca una la compilazione si ferma con un
messaggio chiaro. È voluto — su Vercel un deploy fallito lascia online la versione
precedente, che è meglio di un sito con i pulsanti di contatto rotti.

Tutte le altre sono facoltative e, se vuote, **spariscono senza lasciare buchi**:
niente indirizzo significa niente riquadro indirizzo e niente mappa; niente
biografia significa che la pagina "La storia" esce dal menu e resta fuori dai
motori di ricerca.

| Variabile | |
|---|---|
| `SHOP_TAGLINE` | frase breve nel footer |
| `SHOP_DESCRIPTION` | descrizione per i motori di ricerca |
| `SHOP_LOGO_MONOGRAM` · `SHOP_LOGO_WORD` | forzano il marchio, che di norma si ricava dal nome |
| `SHOP_OWNER` · `SHOP_LEGAL_NAME` · `SHOP_VAT` | titolare, ragione sociale, P.IVA |
| `SHOP_ADDRESS` | via, civico, CAP, città — **genera la mappa da sola** |
| `SHOP_HOURS` | orari, righe separate da `\|` |
| `SHOP_EMAIL` | |
| `SHOP_STORY_PARAGRAPHS` | biografia, paragrafi separati da `\|` |
| `SHOP_STORY_TITLE` · `SHOP_STORY_ROLE` · `SHOP_STORY_QUOTE` | titolo, qualifica, frase in evidenza |
| `SHOP_STORY_PHOTO` | es. `/titolare.jpg`, con la foto dentro `site/public/` |

**Il marchio si disegna da solo.** Il logo in cima al sito e la favicon si
ricavano dal nome: "HD Design" diventa una **HD** grande in serif con
**DESIGN** spaziato sotto. Se il nome è di una parola sola resta solo quella.
Per un logo tuo, metti il file in `site/public/` e sostituisci il contenuto di
`site/src/components/Logo.astro` con un `<img>`.

Esempio per gli orari:

```
SHOP_HOURS=Lunedì - Venerdì: 9:30 - 19:00|Sabato: 9:30 - 12:30|Domenica: chiuso
```

Dopo aver cambiato una variabile su Vercel bisogna far ripartire un deploy perché
il sito la veda: apri il deploy hook nel browser, oppure Deployments → ⋯ →
**Redeploy**.

---

## 9. Come si usa, tutti i giorni

Tutto in italiano normale, scritto o a voce. **Niente cambia senza una conferma con
i bottoni.**

**Aggiungere un oggetto** — manda una o più foto con due parole di descrizione.
Per esempio: *"comò piemontese fine ottocento in noce, pagato quattrocento, lo
vendo a milleduecento"*. Il bot prepara la scheda e chiede **✅ Pubblica** o
**✏️ Correggi**. Se mandi una foto senza dire niente, ti chiede lui che oggetto è.

**Correggere** — dopo ✏️ Correggi, scrivi la correzione come viene: *"il prezzo è
1000, non 1200"*.

**Vendere** — *"venduto il comò"*. Il bot mostra la foto e chiede conferma. Il pezzo
finisce fra i "Venduti di recente" e conta nel guadagno.

**Togliere senza vendere** — *"togli la poltrona"*, *"me la tengo"*, *"si è
rotta"*. Sparisce dal sito ma non risulta venduto e non sporca i conti. Nel dubbio
fra le due cose il bot sceglie questa, che è la più prudente.

**Cambiare un dato** — *"il comò ora costa 1000"*, *"la credenza è del
Settecento"*.

**Cambiare una foto** — *"cambia la foto del comò"* la sostituisce, *"aggiungi una
foto alla credenza"* la aggiunge. Dopo la conferma il bot aspetta la foto nuova.

**Chiedere** — *"cosa ho in vendita?"*, *"quanto ho guadagnato quest'anno?"*.

In ogni momento `/aiuto` rimostra l'elenco.

---

## 10. Lavorare in locale

**Sito** (usa la bottega e il catalogo di esempio se manca il `.env`):

```bash
cd site
npm install
npm run dev        # http://localhost:4321
```

**Bot** (in polling, senza webhook):

```bash
cd bot
npm install
npm run dev
```

Attenzione: il polling locale sospende il webhook. Quando hai finito, rimettilo con
`npm run set-webhook`.

---

## 11. Quando qualcosa non va

**Il bot non risponde per niente.** Controlla di essere fra gli
`ALLOWED_TELEGRAM_IDS` (se non lo sei, risponde "Bot privato"). Poi guarda i log
del progetto bot su Vercel.

**Il bot risponde ma il sito non si aggiorna.** In quest'ordine:

1. L'oggetto è su Airtable con Stato "Disponibile"? Se no, il problema è nel bot.
2. Su Vercel, progetto del **sito** → Deployments: ci sono build recenti? Sono
   verdi? Una build **Error** ti dice il motivo nel registro.
3. Nessuna build affatto, con il messaggio *"the commit author did not have
   contributing access"*: è la trappola descritta qui sotto.
4. Il deploy hook punta al progetto giusto? L'URL contiene l'identificativo
   (`.../deploy/prj_XXXX/...`), che deve coincidere con il **Project ID** in
   Settings → General del progetto del **sito**, non del bot.

**Deploy bloccati per l'autore dei commit.** Sul piano gratuito di Vercel, con
repository privato, i deploy vengono rifiutati in silenzio se l'autore dei commit
non è il proprietario del progetto: il sito continua a servire la vecchia versione
senza dare errore. Verifica che l'indirizzo email di Git corrisponda all'account
GitHub proprietario:

```bash
git config user.email
```

Se il computer usa un indirizzo diverso, impostalo per questo solo repository:

```bash
git config user.name  "<il-tuo-utente-github>"
git config user.email "<id>+<utente>@users.noreply.github.com"
```

Per lo stesso motivo, **non aggiungere righe `Co-Authored-By:` ai commit**: Vercel
le legge come un secondo contributore e blocca la pubblicazione.

**Il sito mostra la bottega di esempio.** Manca `SHOP_NAME` fra le variabili
d'ambiente del progetto su Vercel. Il messaggio compare anche nel registro della
build.

**La compilazione si ferma dicendo "Configurazione incompleta".** Manca uno dei
recapiti obbligatori (`SHOP_PHONE`, `SHOP_PHONE_DISPLAY`, `SHOP_WHATSAPP`).
È voluto: intanto resta online la versione precedente.

**Le conferme del bot si perdono.** Il bot tiene le operazioni in sospeso nella
tabella **Sessioni** di Airtable, perché su Vercel ogni messaggio può essere
gestito da un'istanza diversa che non condivide la memoria. Se la tabella non
esiste, il bot funziona lo stesso ma in modo meno affidabile, e lo scrive nei log:
crea la tabella con `npm run aggiorna-airtable`.
