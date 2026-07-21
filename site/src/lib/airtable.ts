import type { Categoria, Oggetto, Stato } from "./types";
import { CATEGORIE } from "./types";

/**
 * Lettura del catalogo da Airtable in fase di build.
 * Campi letti dalla tabella "Oggetti" (i nomi devono coincidere):
 *   ID, Nome, Categoria, Epoca, Materiale, Descrizione breve,
 *   Descrizione lunga, Foto (un URL per riga), Prezzo di vendita,
 *   Stato, Data inserimento, Data vendita, Dimensioni.
 * "Prezzo di acquisto" e "Note private" NON vengono mai letti:
 * il sito non deve conoscerli.
 */

const TABELLA = "Oggetti";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

function campoTesto(fields: Record<string, unknown>, nome: string): string | undefined {
  const v = fields[nome];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function campoNumero(fields: Record<string, unknown>, nome: string): number | undefined {
  const v = fields[nome];
  return typeof v === "number" ? v : undefined;
}

function versoCategoria(valore: string | undefined): Categoria {
  return (CATEGORIE as readonly string[]).includes(valore ?? "")
    ? (valore as Categoria)
    : "Altro";
}

function versoOggetto(record: AirtableRecord): Oggetto | null {
  const f = record.fields;
  const nome = campoTesto(f, "Nome");
  if (!nome) return null;

  const stato = (campoTesto(f, "Stato") ?? "Bozza") as Stato;

  const foto = (campoTesto(f, "Foto") ?? "")
    .split(/\s+/)
    .filter((riga) => riga.startsWith("http"));

  // Un oggetto senza foto non è pubblicabile sul sito
  if (foto.length === 0) return null;

  const idNumerico = campoNumero(f, "ID");

  return {
    id: idNumerico != null ? String(idNumerico) : record.id,
    nome,
    categoria: versoCategoria(campoTesto(f, "Categoria")),
    epoca: campoTesto(f, "Epoca"),
    materiale: campoTesto(f, "Materiale"),
    descrizioneBreve: campoTesto(f, "Descrizione breve") ?? "",
    descrizioneLunga:
      campoTesto(f, "Descrizione lunga") ?? campoTesto(f, "Descrizione breve") ?? "",
    foto,
    prezzo: campoNumero(f, "Prezzo di vendita"),
    stato,
    dataInserimento: campoTesto(f, "Data inserimento"),
    dataVendita: campoTesto(f, "Data vendita"),
    dimensioni: campoTesto(f, "Dimensioni"),
  };
}

export function airtableConfigurato(): boolean {
  return Boolean(
    import.meta.env.AIRTABLE_API_KEY && import.meta.env.AIRTABLE_BASE_ID
  );
}

export async function leggiOggettiDaAirtable(): Promise<Oggetto[]> {
  const apiKey = import.meta.env.AIRTABLE_API_KEY;
  const baseId = import.meta.env.AIRTABLE_BASE_ID;

  const oggetti: Oggetto[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(TABELLA)}`
    );
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const risposta = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!risposta.ok) {
      throw new Error(
        `Airtable ha risposto ${risposta.status}: ${await risposta.text()}`
      );
    }

    const dati = (await risposta.json()) as {
      records: AirtableRecord[];
      offset?: string;
    };

    for (const record of dati.records) {
      const oggetto = versoOggetto(record);
      if (oggetto) oggetti.push(oggetto);
    }

    offset = dati.offset;
  } while (offset);

  // I più recenti prima
  oggetti.sort((a, b) =>
    (b.dataInserimento ?? "").localeCompare(a.dataInserimento ?? "")
  );

  return oggetti;
}
