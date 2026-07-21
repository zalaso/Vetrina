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

/**
 * Ripiego: se la tabella "Sessioni" non esiste ancora (schema non aggiornato)
 * o Airtable non risponde, si usa la memoria locale. Torna il comportamento
 * inaffidabile di prima, ma il bot continua a funzionare invece di rispondere
 * con un errore.
 */
const memoriaLocale = new Map();
let avvisoGiaDato = false;

function ripiego(errore) {
  if (!avvisoGiaDato) {
    console.warn(
      `[sessioni] Tabella "${TABELLA}" non raggiungibile, uso la memoria locale. ` +
        `Esegui "npm run aggiorna-airtable" per renderle affidabili. Dettaglio: ${errore.message}`
    );
    avvisoGiaDato = true;
  }
}

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
  const scadenza = new Date(Date.now() + DURATA_MINUTI * 60_000).toISOString();
  try {
    const fields = {
      [F.chat]: String(chatId),
      [F.dati]: JSON.stringify(dati),
      [F.scadenza]: scadenza,
    };
    const esistente = await trovaRecord(chatId);
    if (esistente) {
      await chiamataTabella(TABELLA, "PATCH", "", {
        records: [{ id: esistente.id, fields }],
      });
    } else {
      await chiamataTabella(TABELLA, "POST", "", { records: [{ fields }] });
    }
  } catch (errore) {
    ripiego(errore);
    memoriaLocale.set(String(chatId), { dati, scadenza });
  }
}

export async function leggiSessione(chatId) {
  const scaduta = (scadenza) =>
    scadenza && Date.now() > new Date(scadenza).getTime();

  try {
    const record = await trovaRecord(chatId);
    if (!record) return null;

    if (scaduta(record.fields[F.scadenza])) {
      await chiamataTabella(TABELLA, "DELETE", `/${record.id}`).catch(() => {});
      return null;
    }
    try {
      return JSON.parse(record.fields[F.dati] ?? "null");
    } catch {
      return null;
    }
  } catch (errore) {
    ripiego(errore);
    const voce = memoriaLocale.get(String(chatId));
    if (!voce) return null;
    if (scaduta(voce.scadenza)) {
      memoriaLocale.delete(String(chatId));
      return null;
    }
    return voce.dati;
  }
}

export async function cancellaSessione(chatId) {
  memoriaLocale.delete(String(chatId));
  try {
    const record = await trovaRecord(chatId);
    if (record) {
      await chiamataTabella(TABELLA, "DELETE", `/${record.id}`).catch(() => {});
    }
  } catch (errore) {
    ripiego(errore);
  }
}
