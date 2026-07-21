import { config } from "./config.js";

/**
 * Accesso alla tabella "Oggetti" su Airtable via REST API.
 * I nomi dei campi devono coincidere con quelli della base.
 */

const TABELLA = "Oggetti";

/** Nomi dei campi in Airtable */
export const F = {
  id: "ID",
  nome: "Nome",
  categoria: "Categoria",
  epoca: "Epoca",
  materiale: "Materiale",
  descrizioneBreve: "Descrizione breve",
  descrizioneLunga: "Descrizione lunga",
  foto: "Foto",
  prezzoVendita: "Prezzo di vendita",
  prezzoAcquisto: "Prezzo di acquisto",
  stato: "Stato",
  dataInserimento: "Data inserimento",
  dataVendita: "Data vendita",
  notePrivate: "Note private",
  dimensioni: "Dimensioni",
  // Campi tecnici usati solo dal bot
  chat: "Chat",
  fase: "Fase",
};

function urlBase() {
  return `https://api.airtable.com/v0/${config.airtableBaseId}/${encodeURIComponent(TABELLA)}`;
}

async function chiamata(metodo, percorso = "", body = undefined) {
  const risposta = await fetch(`${urlBase()}${percorso}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${config.airtableApiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!risposta.ok) {
    throw new Error(`Airtable ${metodo} ${risposta.status}: ${await risposta.text()}`);
  }
  return risposta.json();
}

export async function creaRecord(fields) {
  const dati = await chiamata("POST", "", { records: [{ fields }], typecast: true });
  return dati.records[0];
}

export async function aggiornaRecord(recordId, fields) {
  const dati = await chiamata("PATCH", "", {
    records: [{ id: recordId, fields }],
    typecast: true,
  });
  return dati.records[0];
}

export async function getRecord(recordId) {
  return chiamata("GET", `/${recordId}`);
}

async function lista(filterByFormula) {
  const records = [];
  let offset;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (filterByFormula) params.set("filterByFormula", filterByFormula);
    if (offset) params.set("offset", offset);
    const dati = await chiamata("GET", `?${params}`);
    records.push(...dati.records);
    offset = dati.offset;
  } while (offset);
  return records;
}

export async function listaDisponibili() {
  return lista(`{${F.stato}} = "Disponibile"`);
}

export async function listaVendutiAnno(anno) {
  return lista(
    `AND({${F.stato}} = "Venduto", YEAR({${F.dataVendita}}) = ${anno})`
  );
}

/**
 * Trova la bozza "attiva" di una chat: l'ultimo record in Stato Bozza
 * creato da quella chat, se toccato negli ultimi 30 minuti.
 * È il modo in cui il bot ricorda a che punto era anche senza memoria.
 */
export async function trovaBozzaAttiva(chatId) {
  const records = await lista(
    `AND({${F.stato}} = "Bozza", {${F.chat}} = "${chatId}")`
  );
  if (records.length === 0) return null;
  records.sort((a, b) =>
    (b.fields[F.dataInserimento] ?? "").localeCompare(a.fields[F.dataInserimento] ?? "")
  );
  return records[0];
}

/** Le foto sono salvate come testo, un URL per riga */
export function fotoDaRecord(record) {
  return (record.fields[F.foto] ?? "")
    .split(/\s+/)
    .filter((r) => r.startsWith("http"));
}

export function oggiISO() {
  return new Date().toISOString().slice(0, 10);
}
