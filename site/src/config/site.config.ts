/**
 * Dati aziendali di Bottega del Ponte.
 * Compila i valori segnati con [DA COMPILARE] prima di pubblicare il sito.
 * Tutto il resto del sito legge da qui: non serve toccare altri file.
 */
export const siteConfig = {
  /** Nome dell'attività, usato in titoli e intestazioni */
  nomeAttivita: "Bottega del Ponte",

  /** Frase breve mostrata nella hero della home */
  slogan: "Mobili e oggetti d'epoca, scelti uno a uno.",

  /** Nome e cognome del titolare */
  titolare: "Anna Ferretti",

  /** Ragione sociale per il footer */
  ragioneSociale: "Ferretti Anna",

  /** Partita IVA */
  partitaIva: "00000000000",

  /**
   * Codice fiscale — NON mostrato sul sito (per una ditta individuale
   * la legge richiede solo la P.IVA nel footer). Tenuto qui a portata
   * di mano per fatture e documenti.
   */
  codiceFiscale: "[rimosso]",

  /**
   * Telefono in formato internazionale senza spazi.
   * Usato per il link "chiama".
   */
  telefono: "+390550000000",

  /** Telefono come mostrato a schermo */
  telefonoVisibile: "055 000 0000",

  /**
   * Numero WhatsApp in formato internazionale senza "+" né spazi.
   */
  whatsapp: "390550000000",

  /** Indirizzo del negozio — [DA COMPILARE] */
  indirizzo: "[DA COMPILARE: via, numero civico, CAP, città]",

  /**
   * URL di incorporamento Google Maps per la pagina Contatti.
   * Su Google Maps: Condividi > Incorpora una mappa > copia il valore src.
   * [DA COMPILARE]
   */
  mappaEmbedUrl: "",

  /** Orari di apertura, una riga per voce — [DA COMPILARE] */
  orari: [
    "[DA COMPILARE: es. Lunedì - Venerdì: 9:30 - 12:30, 15:30 - 19:00]",
    "[DA COMPILARE: es. Sabato: 9:30 - 12:30]",
    "[DA COMPILARE: es. Domenica: chiuso]",
  ],

  /** Email di contatto (facoltativa, lasciare "" per nasconderla) */
  email: "",

  /**
   * Contenuti della pagina "La storia" (chi è il titolare).
   * Compila i paragrafi con la storia vera: come è iniziata la passione,
   * da quanti anni fa questo mestiere, cosa cerca nei pezzi che sceglie.
   */
  storia: {
    /** Titolo grande della pagina */
    titolo: "Una vita tra le cose belle",
    /** Sottotitolo sotto il nome */
    sottotitolo: "Antiquario",
    /**
     * URL della foto del titolare (mettila in /public, es. "/lorenzo.jpg",
     * oppure lascia "" per il segnaposto provvisorio)
     */
    foto: "",
    /** Paragrafi della biografia, uno per blocco — [DA COMPILARE] */
    paragrafi: [
      "[DA COMPILARE: come è nata la passione di Anna per l'antiquariato, es. 'Anna Ferretti ha iniziato a frequentare i mercati e le botteghe da ragazzo...']",
      "[DA COMPILARE: l'esperienza, es. 'In più di trent'anni ha selezionato e rimesso in vita mobili, sedute, quadri e oggetti...']",
      "[DA COMPILARE: il modo di lavorare, es. 'Ogni pezzo viene scelto di persona, controllato e, quando serve, restaurato con rispetto per la sua storia...']",
    ],
    /** Una frase sua, in evidenza (facoltativa, lascia "" per nasconderla) */
    citazione: "[DA COMPILARE: una frase del titolare, es. 'Un mobile antico non si compra: si adotta.']",
  },
} as const;

/** Testo precompilato del messaggio WhatsApp dalla pagina di un oggetto */
export function whatsappLink(nomeOggetto?: string): string {
  const testo = nomeOggetto
    ? `Buongiorno, sono interessato a: ${nomeOggetto}`
    : "Buongiorno, vorrei chiedere un'informazione.";
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(testo)}`;
}
