/**
 * Configurazione dell'istanza: i dati della bottega.
 *
 * Il repository non contiene dati reali. Qui sotto c'è una bottega di
 * fantasia, che serve a far girare il progetto subito dopo un `git clone`;
 * i valori veri arrivano dalle variabili d'ambiente (file `.env` in locale,
 * Environment Variables del progetto su Vercel in produzione).
 *
 * Così lo stesso codice serve botteghe diverse e nessun dato personale
 * finisce nel controllo di versione.
 *
 * Elenco completo delle variabili: `.env.example`.
 */

/**
 * Modalità esempio: senza SHOP_NAME il sito mostra la bottega di fantasia.
 *
 * È una scelta tutto-o-niente. Appena SHOP_NAME è impostato il sito è di una
 * bottega vera, e i campi non compilati restano vuoti invece di ereditare i
 * dati di esempio, che altrimenti finirebbero online spacciati per veri.
 */
const modalitaEsempio = !import.meta.env.SHOP_NAME;

/** Valore di testo, con il dato di esempio usato solo in modalità esempio */
function testo(valore: unknown, esempio: string): string {
  if (typeof valore === "string" && valore.trim()) return valore.trim();
  return modalitaEsempio ? esempio : "";
}

/**
 * Valore con ripiego sempre attivo, anche fuori dalla modalità esempio.
 * Serve per i dati ricavati da altri (marchio, descrizione), che non possono
 * restare vuoti perché il sito li usa comunque.
 */
function valore(v: unknown, predefinito: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : predefinito;
}

/** Lista separata da "|" (es. gli orari), stessa regola del testo */
function lista(valore: unknown, esempio: string[]): string[] {
  if (typeof valore === "string" && valore.trim()) {
    return valore
      .split("|")
      .map((riga) => riga.trim())
      .filter(Boolean);
  }
  return modalitaEsempio ? esempio : [];
}

export interface SiteConfig {
  /** Nome dell'attività, usato in titoli e intestazioni */
  nomeAttivita: string;
  /** Descrizione per i motori di ricerca e le anteprime di condivisione */
  descrizione: string;
  /**
   * Il marchio disegnato dal sito: un monogramma grande in serif con una
   * parola spaziata sotto. Di norma si ricava dal nome dell'attività
   * ("Bottega del Ponte" → "Bottega" sopra, "del Ponte" sotto); si può forzare con
   * SHOP_LOGO_MONOGRAM e SHOP_LOGO_WORD.
   */
  logo: {
    monogramma: string;
    parola: string;
  };
  /** Frase breve mostrata nel footer */
  slogan: string;
  /** Nome e cognome del titolare */
  titolare: string;
  /** Ragione sociale completa, per il footer */
  ragioneSociale: string;
  /** Partita IVA, obbligatoria nel footer per legge */
  partitaIva: string;
  /** Telefono in formato internazionale senza spazi, per il link "chiama" */
  telefono: string;
  /** Telefono come mostrato a schermo */
  telefonoVisibile: string;
  /** Numero WhatsApp in formato internazionale senza "+" né spazi */
  whatsapp: string;
  /** Indirizzo del negozio; se vuoto sparisce dal sito insieme alla mappa */
  indirizzo: string;
  /** URL di incorporamento della mappa; se vuoto si ricava dall'indirizzo */
  mappaEmbedUrl: string;
  /** Orari di apertura, una voce per riga */
  orari: string[];
  /** Email di contatto, facoltativa */
  email: string;
  /** Contenuti della pagina "La storia"; senza paragrafi la pagina è nascosta */
  storia: {
    titolo: string;
    sottotitolo: string;
    foto: string;
    paragrafi: string[];
    citazione: string;
  };
}

const nomeAttivita = testo(import.meta.env.SHOP_NAME, "Bottega del Ponte");

/* Il marchio si ricava dal nome: la prima parola diventa il monogramma
   grande, le altre la riga spaziata sotto. */
const [primaParola = nomeAttivita, ...restoDelNome] = nomeAttivita
  .split(/\s+/)
  .filter(Boolean);

export const siteConfig: SiteConfig = {
  nomeAttivita,

  descrizione: valore(
    import.meta.env.SHOP_DESCRIPTION,
    `${nomeAttivita}: mobili, sedute, quadri e oggetti d'antiquariato scelti ` +
      "con cura. Vieni a trovarci in negozio o scrivici su WhatsApp."
  ),

  logo: {
    monogramma: valore(import.meta.env.SHOP_LOGO_MONOGRAM, primaParola),
    parola: valore(import.meta.env.SHOP_LOGO_WORD, restoDelNome.join(" ")),
  },

  slogan: testo(
    import.meta.env.SHOP_TAGLINE,
    "Mobili e oggetti d'epoca, scelti uno a uno."
  ),

  titolare: testo(import.meta.env.SHOP_OWNER, "Anna Ferretti"),

  ragioneSociale: testo(
    import.meta.env.SHOP_LEGAL_NAME,
    "Bottega del Ponte di A. Ferretti"
  ),

  partitaIva: testo(import.meta.env.SHOP_VAT, "00000000000"),

  telefono: testo(import.meta.env.SHOP_PHONE, "+390550000000"),

  telefonoVisibile: testo(import.meta.env.SHOP_PHONE_DISPLAY, "055 000 0000"),

  whatsapp: testo(import.meta.env.SHOP_WHATSAPP, "390550000000"),

  indirizzo: testo(
    import.meta.env.SHOP_ADDRESS,
    "Via dell'Esempio 1, 50100 Firenze"
  ),

  mappaEmbedUrl: testo(import.meta.env.SHOP_MAP_EMBED_URL, ""),

  orari: lista(import.meta.env.SHOP_HOURS, [
    "Lunedì - Venerdì: 9:30 - 12:30, 15:30 - 19:00",
    "Sabato: 9:30 - 12:30",
    "Domenica: chiuso",
  ]),

  email: testo(import.meta.env.SHOP_EMAIL, ""),

  storia: {
    titolo: testo(
      import.meta.env.SHOP_STORY_TITLE,
      "Una vita tra le cose belle"
    ),
    sottotitolo: testo(import.meta.env.SHOP_STORY_ROLE, "Antiquaria"),
    foto: testo(import.meta.env.SHOP_STORY_PHOTO, ""),
    paragrafi: lista(import.meta.env.SHOP_STORY_PARAGRAPHS, [
      "Anna Ferretti ha cominciato a frequentare mercati e case da svuotare quando era ancora una ragazza, dietro a un padre che comprava più per curiosità che per mestiere.",
      "Da trent'anni sceglie mobili, sedute, quadri e oggetti uno per uno: prima di entrare in bottega ogni pezzo viene controllato e, quando serve, rimesso in ordine con rispetto per la sua storia.",
      "Non è un magazzino e non vuole esserlo: qui si entra per guardare, e spesso si esce con qualcosa che non si stava cercando.",
    ]),
    citazione: testo(
      import.meta.env.SHOP_STORY_QUOTE,
      "Un mobile antico non si compra: si adotta."
    ),
  },
};

/**
 * Un valore è "compilato" se esiste davvero.
 * Il sito lo usa per nascondere le parti non ancora pronte invece di
 * mostrare campi vuoti o segnaposti ai visitatori.
 */
export function compilato(valore?: string): boolean {
  return Boolean(
    valore && valore.trim() && !valore.includes("[DA COMPILARE")
  );
}

/** Gli orari da mostrare, escluse le righe non compilate */
export function orariCompilati(): string[] {
  return siteConfig.orari.filter((riga) => compilato(riga));
}

/** I paragrafi della biografia, esclusi quelli non scritti */
export function storiaCompilata(): string[] {
  return siteConfig.storia.paragrafi.filter((p) => compilato(p));
}

/** Testo precompilato del messaggio WhatsApp dalla pagina di un oggetto */
export function whatsappLink(nomeOggetto?: string): string {
  const testoMessaggio = nomeOggetto
    ? `Buongiorno, sono interessato a: ${nomeOggetto}`
    : "Buongiorno, vorrei chiedere un'informazione.";
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(testoMessaggio)}`;
}

/**
 * Controllo della configurazione, eseguito durante la compilazione.
 *
 * Se manca un dato indispensabile la compilazione si ferma con un messaggio
 * chiaro. Su Vercel questo è il comportamento giusto: il deploy fallisce e
 * resta online la versione precedente, invece di pubblicare un sito con i
 * contatti rotti.
 */
if (!modalitaEsempio) {
  const obbligatori: Array<[string, string]> = [
    ["SHOP_PHONE", siteConfig.telefono],
    ["SHOP_PHONE_DISPLAY", siteConfig.telefonoVisibile],
    ["SHOP_WHATSAPP", siteConfig.whatsapp],
  ];
  const mancanti = obbligatori
    .filter(([, valore]) => !compilato(valore))
    .map(([nome]) => nome);

  if (mancanti.length > 0) {
    throw new Error(
      `Configurazione incompleta: manca ${mancanti.join(", ")}.\n` +
        "Sono i recapiti del negozio: senza, il sito avrebbe i pulsanti di " +
        "contatto rotti. Impostali fra le variabili d'ambiente (vedi .env.example)."
    );
  }
} else if (import.meta.env.PROD) {
  console.warn(
    "[configurazione] Nessuna variabile SHOP_* impostata: il sito mostra la " +
      "bottega di esempio. Vedi .env.example per pubblicare i dati veri."
  );
}
