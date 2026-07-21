import { chiamataTabella } from "./airtable.js";

/**
 * Memoria di lavoro delle conversazioni: operazioni in attesa di conferma
 * (candidati di vendita, ritiro, modifica, attesa di una nuova foto).
 *
 * È salvata su Airtable, non in memoria, perché il bot gira come funzione
 * serverless: ogni messaggio può essere gestito da un'istanza diversa, che
 * non condivide la memoria con quelle precedenti. Con una memoria locale le
 * conferme funzionavano in modo imprevedibile.
 */

const TABELLA = "Sessioni";
const DURATA_MINUTI = 20;

const F = { chat: "Chat", dati: "Dati", scadenza: "Scadenza" };

/** Restituisce il record di sessione della chat, se esiste */
async function trovaRecord(chatId) {
  const params = new URLSearchParams({
    pageSize: "1",
    filterByFormula: `{${F.chat}} = "${chatId}"`,
  });
  const dati = await chiamataTabella(TABELLA, "GET", `?${params}`);
  return dati.records[0] ?? null;
}

export async function salvaSessione(chatId, dati) {
  const fields = {
    [F.chat]: String(chatId),
    [F.dati]: JSON.stringify(dati),
    [F.scadenza]: new Date(Date.now() + DURATA_MINUTI * 60_000).toISOString(),
  };

  const esistente = await trovaRecord(chatId);
  if (esistente) {
    await chiamataTabella(TABELLA, "PATCH", "", {
      records: [{ id: esistente.id, fields }],
    });
  } else {
    await chiamataTabella(TABELLA, "POST", "", { records: [{ fields }] });
  }
}

export async function leggiSessione(chatId) {
  const record = await trovaRecord(chatId);
  if (!record) return null;

  const scadenza = record.fields[F.scadenza];
  if (scadenza && Date.now() > new Date(scadenza).getTime()) {
    // Scaduta: la ripuliamo e facciamo finta che non ci fosse
    await chiamataTabella(TABELLA, "DELETE", `/${record.id}`).catch(() => {});
    return null;
  }

  try {
    return JSON.parse(record.fields[F.dati] ?? "null");
  } catch {
    return null;
  }
}

export async function cancellaSessione(chatId) {
  const record = await trovaRecord(chatId);
  if (record) {
    await chiamataTabella(TABELLA, "DELETE", `/${record.id}`).catch(() => {});
  }
}
