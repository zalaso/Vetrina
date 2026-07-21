# HD Design — Catalogo, sito e bot Telegram

Sistema completo per la bottega d'antiquariato **HD Design**:

- **`site/`** — sito vetrina pubblico (Astro), rigenerato automaticamente a ogni modifica del catalogo;
- **`bot/`** — bot Telegram con cui il titolare gestisce il catalogo mandando foto e messaggi (anche vocali);
- **Airtable** — il database condiviso che fa da catalogo e gestionale;
- **Cloudinary** — l'archivio delle foto (in Airtable si salvano solo gli URL).

Come si parlano i pezzi:

```
Titolare ──(foto/messaggi)──▶ Bot Telegram ──▶ Airtable (tabella "Oggetti")
                                   │                    ▲
                                   └──(deploy hook)──▶ Vercel ricompila il sito
                                                        │
                              Sito Astro ◀──(legge in fase di build)┘
```

---

## 1. Prerequisiti

- Un account [Vercel](https://vercel.com) (gratuito)
- Un account [Airtable](https://airtable.com) (gratuito)
- Un account [Cloudinary](https://cloudinary.com) (piano free)
- Una chiave API [Anthropic](https://console.anthropic.com) (per l'AI del bot)
- Una chiave API [OpenAI](https://platform.openai.com) (solo per trascrivere i vocali)
- [Node.js](https://nodejs.org) 20 o superiore sul tuo computer

---

## 2. Creare il bot con BotFather

1. Su Telegram cerca **@BotFather** e scrivi `/newbot`.
2. Scegli un nome (es. "HD Design Catalogo") e uno username (es. `hddesign_catalogo_bot`).
3. BotFather ti dà un **token** tipo `123456789:AAH...`: è il valore di `TELEGRAM_BOT_TOKEN`.
4. Scopri l'**ID Telegram** del titolare (e il tuo): scrivete un messaggio a **@userinfobot**, che risponde con un numero. Quei numeri, separati da virgola, sono `ALLOWED_TELEGRAM_IDS`. Il bot ignora chiunque altro.

---

## 3. Creare la base Airtable

1. Su Airtable crea una **base vuota** (es. "HD Design").
2. Prendi l'**ID della base**: aprendo la base, l'URL è `https://airtable.com/appXXXXXXXXXXXXXX/...` — la parte che inizia con `app` è `AIRTABLE_BASE_ID`.
3. Crea un **Personal Access Token** da <https://airtable.com/create/tokens> con questi scope sulla base:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:write` (serve solo per lo script del punto 4, poi puoi revocarlo)

   Il token è `AIRTABLE_API_KEY`.
4. Crea la tabella **"Oggetti"** in automatico:

   ```bash
   cd bot
   copy .env.example .env    # su Mac/Linux: cp .env.example .env
   # compila nel file .env: AIRTABLE_API_KEY e AIRTABLE_BASE_ID
   npm install
   npm run create-airtable-table
   ```

   In alternativa puoi creare la tabella a mano, replicando esattamente questi campi:

   | Campo | Tipo | Note |
   |---|---|---|
   | Nome | Testo | campo primario |
   | ID | Autonumber | |
   | Categoria | Single select | Mobili, Sedute, Quadri, Oggettistica, Illuminazione, Altro |
   | Epoca | Testo | |
   | Materiale | Testo | |
   | Dimensioni | Testo | facoltativo, es. "L 120 × P 55 × H 98 cm" |
   | Descrizione breve | Testo lungo | per la card del sito |
   | Descrizione lunga | Testo lungo | per la pagina di dettaglio |
   | Foto | Testo lungo | URL Cloudinary, uno per riga (li scrive il bot) |
   | Prezzo di vendita | Numero | se vuoto il sito mostra "Prezzo su richiesta" |
   | Prezzo di acquisto | Numero | **mai** esposto sul sito |
   | Stato | Single select | Disponibile, Venduto, Bozza, Ritirato |
   | Data inserimento | Data | |
   | Data vendita | Data | |
   | Note private | Testo lungo | |
   | Chat | Testo | campo tecnico del bot |
   | Fase | Testo | campo tecnico del bot |

   Il prezzo di acquisto e le note private restano solo su Airtable: il sito non li legge mai.

   **Significato degli stati:** `Disponibile` è in vetrina; `Venduto` compare nella sezione "Venduti di recente" e conta nel calcolo del guadagno; `Ritirato` è stato tolto dal catalogo *senza* essere venduto (tenuto, rotto o inserito per sbaglio) e non compare da nessuna parte né incide sui conti; `Bozza` è in lavorazione sul bot.

5. Crea la tabella di servizio del bot:

   ```bash
   npm run aggiorna-airtable
   ```

   Aggiunge la tabella **Sessioni**, dove il bot tiene le operazioni in attesa di conferma. Serve perché su Vercel ogni messaggio può essere gestito da un'istanza diversa: senza questa tabella le conferme funzionerebbero in modo imprevedibile. Non va mai modificata a mano.

---

## 4. Configurare Cloudinary

1. Registrati su Cloudinary (piano free).
2. Nella **Dashboard** trovi tre valori: **Cloud name**, **API Key**, **API Secret**.
3. Sono, rispettivamente, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Le foto caricate dal bot finiscono nella cartella `hd-design`; il sito le richiede già ottimizzate (resize e compressione automatici di Cloudinary).

---

## 5. Pubblicare il sito su Vercel

1. Metti questo repository su GitHub.
2. Su Vercel: **Add New → Project**, importa il repository e imposta **Root Directory = `site`** (framework: Astro, rilevato in automatico).
3. Nelle **Environment Variables** del progetto aggiungi:
   - `AIRTABLE_API_KEY`
   - `AIRTABLE_BASE_ID`

   (Senza queste variabili il sito compila comunque, con i dati di esempio.)
4. Deploy. Il sito è online.
5. Crea il **deploy hook**: Settings → Git → **Deploy Hooks** → crea un hook (es. "catalogo") sul branch principale. L'URL che ottieni è `VERCEL_DEPLOY_HOOK_URL`: ogni volta che il bot modifica il catalogo lo chiama e il sito si rigenera in ~1 minuto.
6. Quando avrai il dominio definitivo, aggiorna `site` in [site/astro.config.mjs](site/astro.config.mjs) (serve per sitemap e meta tag).

**Dati aziendali** (nome titolare, P.IVA, telefono, WhatsApp, indirizzo, orari, mappa): sono tutti in [site/src/config/site.config.ts](site/src/config/site.config.ts), segnati con `[DA COMPILARE]`. Compilali e fai un commit: non serve toccare altro.

---

## 6. Pubblicare il bot su Vercel

1. Su Vercel: **Add New → Project**, importa **lo stesso repository** una seconda volta e imposta **Root Directory = `bot`**.
2. Nelle **Environment Variables** aggiungi tutte le variabili di [bot/.env.example](bot/.env.example):
   `TELEGRAM_BOT_TOKEN`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `VERCEL_DEPLOY_HOOK_URL`, `ALLOWED_TELEGRAM_IDS`.
3. Deploy. Prendi nota dell'URL del progetto (es. `https://hd-design-bot.vercel.app`).
4. Registra il **webhook** di Telegram (dal tuo computer, nella cartella `bot/` con il file `.env` compilato):

   ```bash
   # nel file .env imposta anche:
   # WEBHOOK_URL=https://hd-design-bot.vercel.app/api/webhook
   npm run set-webhook
   ```

5. Scrivi `/start` al bot su Telegram: se risponde con il messaggio di benvenuto, è tutto collegato.

---

## 7. Come si usa il bot (per il titolare)

- **Aggiungere un oggetto**: manda una o più foto con due parole di descrizione, scritte o a voce. Esempio: *"comò piemontese fine ottocento in noce, pagato quattrocento, lo vendo a milleduecento"*. Il bot prepara la scheda e chiede conferma con i bottoni **✅ Pubblica** / **✏️ Correggi**.
- **Foto senza descrizione**: il bot chiede *"Che oggetto è?"* — basta rispondere, anche con un vocale.
- **Correggere**: tocca **✏️ Correggi** e scrivi la correzione come viene, es. *"il prezzo è 1000, non 1200"*.
- **Vendita**: scrivi *"venduto il comò"*. Il bot mostra la foto dell'oggetto e chiede **✅ È questo** / **❌ No, un altro**.
- **Togliere senza vendere**: *"togli la poltrona"*, *"me la tengo"*, *"si è rotta"*. Il pezzo passa in **Ritirato**: sparisce dal sito ma non risulta venduto e non entra nel calcolo del guadagno.
- **Cambiare un prezzo o un dato**: *"il comò ora costa 1000"*, *"la credenza è del Settecento"*, stessa conferma con bottoni.
- **Cambiare una foto**: *"cambia la foto del comò"* (sostituisce) oppure *"aggiungi una foto alla credenza"* (aggiunge). Dopo la conferma il bot resta in attesa della foto nuova.
- **Consultare**: *"cosa ho in vendita?"* oppure *"quanto ho guadagnato quest'anno?"*.

Nessuna modifica al catalogo avviene senza una conferma esplicita con i bottoni.

---

## 8. Sviluppo in locale

**Sito** (usa i dati mock se mancano le variabili Airtable):

```bash
cd site
npm install
npm run dev        # http://localhost:4321
```

**Bot** (in modalità polling, senza webhook):

```bash
cd bot
npm install
npm run dev
```

Nota: il polling locale sospende il webhook; quando hai finito, ripristinalo con `npm run set-webhook`.

---

## 9. Se il sito non si aggiorna

Se pubblichi un oggetto dal bot e sul sito non compare, controlla in quest'ordine:

1. **L'oggetto è su Airtable con Stato "Disponibile"?** Se no, il problema è nel bot.
2. **Su Vercel, progetto del sito → Deployments: ci sono build recenti e sono verdi?**
   - Build **Error** → apri il registro e leggi il motivo.
   - **Nessuna build** dopo una modifica → il deploy non è stato nemmeno avviato: vedi il punto 3.
3. **Deployment bloccati con il messaggio *"the commit author did not have contributing access"***.
   Succede quando l'autore dei commit non corrisponde all'account Vercel. Sul piano
   gratuito Vercel rifiuta i commit di un utente diverso dal proprietario su
   repository privati.

   Questo repository è impostato per usare l'identità dell'account **zalaso**:

   ```bash
   git config user.name   # zalaso
   git config user.email  # 255437588+zalaso@users.noreply.github.com
   ```

   Se hai clonato il progetto su un altro computer, ripeti quei due comandi con
   `git config user.name "zalaso"` e
   `git config user.email "255437588+zalaso@users.noreply.github.com"`,
   altrimenti Git userebbe l'indirizzo globale (`guidomarmorini@gmail.com`), che
   GitHub associa a un account diverso e Vercel rifiuta.

   Per lo stesso motivo, **non aggiungere righe `Co-Authored-By:` ai commit**: Vercel
   le legge come un secondo contributore e blocca la pubblicazione.

4. **Il deploy hook punta al progetto giusto?** L'URL contiene l'identificativo del
   progetto (`.../deploy/prj_XXXX/...`): deve coincidere con il **Project ID** che
   trovi in Settings → General del progetto del **sito**, non del bot.

## 10. Struttura del repository

```
├── site/                    Sito vetrina (Astro)
│   ├── src/config/site.config.ts   Dati aziendali [DA COMPILARE]
│   ├── src/lib/catalog.ts          Accesso al catalogo (mock o Airtable)
│   ├── src/lib/airtable.ts         Lettura da Airtable in fase di build
│   ├── src/data/mock.ts            Dati di esempio per lo sviluppo
│   └── src/pages/                  Home, Catalogo, Dettaglio, Contatti
└── bot/                     Bot Telegram (Node + grammY, webhook su Vercel)
    ├── api/webhook.js              Entry point serverless
    ├── src/bot.js                  Flussi conversazionali
    ├── src/ai.js                   Interpretazione messaggi (Anthropic)
    ├── src/transcribe.js           Trascrizione vocali (Whisper)
    ├── src/cloudinary.js           Caricamento foto
    ├── src/airtable.js             Lettura/scrittura catalogo
    └── scripts/                    Setup: tabella Airtable, webhook
```
