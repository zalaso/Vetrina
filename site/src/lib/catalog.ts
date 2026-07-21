import type { Oggetto } from "./types";
import { oggettiMock } from "../data/mock";
import { airtableConfigurato, leggiOggettiDaAirtable } from "./airtable";

/**
 * Punto unico di accesso al catalogo.
 * Se AIRTABLE_API_KEY e AIRTABLE_BASE_ID sono impostate, legge da Airtable
 * in fase di build; altrimenti usa i dati mock (comodo in sviluppo).
 *
 * Gli oggetti in Stato "Bozza" (non ancora confermati dal titolare) e
 * "Ritirato" (tolti dal catalogo senza vendita) non arrivano mai al sito:
 * vengono esclusi qui, quindi per loro non viene generata nemmeno la
 * pagina di dettaglio.
 */

const STATI_NASCOSTI = ["Bozza", "Ritirato"];

let cache: Oggetto[] | null = null;

export async function getOggetti(): Promise<Oggetto[]> {
  if (cache) return cache;

  const visibili = (oggetti: Oggetto[]) =>
    oggetti.filter((o) => !STATI_NASCOSTI.includes(o.stato));

  if (airtableConfigurato()) {
    cache = visibili(await leggiOggettiDaAirtable());
  } else {
    console.warn(
      "[catalogo] AIRTABLE_API_KEY / AIRTABLE_BASE_ID non impostate: uso i dati mock."
    );
    cache = visibili(oggettiMock);
  }

  return cache;
}

export async function getDisponibili(): Promise<Oggetto[]> {
  return (await getOggetti()).filter((o) => o.stato === "Disponibile");
}

export async function getVenduti(): Promise<Oggetto[]> {
  return (await getOggetti()).filter((o) => o.stato === "Venduto");
}

export async function getOggetto(id: string): Promise<Oggetto | undefined> {
  return (await getOggetti()).find((o) => o.id === id);
}

/** Oggetti mostrati nella sezione "in evidenza" della home */
export async function getInEvidenza(max = 4): Promise<Oggetto[]> {
  return (await getDisponibili()).slice(0, max);
}
