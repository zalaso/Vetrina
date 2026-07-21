/** Categorie del catalogo, identiche al single select di Airtable */
export const CATEGORIE = [
  "Mobili",
  "Sedute",
  "Quadri",
  "Oggettistica",
  "Illuminazione",
  "Altro",
] as const;

export type Categoria = (typeof CATEGORIE)[number];

export type Stato = "Disponibile" | "Venduto" | "Bozza";

/** Un oggetto del catalogo, come arriva da Airtable (o dai dati mock) */
export interface Oggetto {
  id: string;
  nome: string;
  categoria: Categoria;
  epoca?: string;
  materiale?: string;
  descrizioneBreve: string;
  descrizioneLunga: string;
  /** URL delle foto (Cloudinary in produzione) */
  foto: string[];
  /** Se assente il sito mostra "Prezzo su richiesta" */
  prezzo?: number;
  stato: Stato;
  dataInserimento?: string;
  dataVendita?: string;
  /** Dimensioni testuali, se note (es. "L 120 × P 55 × H 98 cm") */
  dimensioni?: string;
}

/** Formatta un prezzo in euro senza decimali, es. "€ 1.200" */
export function formatPrezzo(prezzo?: number): string {
  if (prezzo == null) return "Prezzo su richiesta";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(prezzo);
}
