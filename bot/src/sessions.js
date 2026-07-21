/**
 * Memoria di lavoro per le conversazioni (candidati di vendita/modifica).
 * È una semplice Map in memoria: in ambiente serverless può azzerarsi
 * tra un messaggio e l'altro. Non è un problema: se i dati non ci sono
 * più, il bot chiede gentilmente di ripetere la richiesta.
 */

const sessioni = new Map();
const DURATA_MS = 15 * 60 * 1000; // 15 minuti

export function salvaSessione(chatId, dati) {
  sessioni.set(String(chatId), { ...dati, scadenza: Date.now() + DURATA_MS });
}

export function leggiSessione(chatId) {
  const dati = sessioni.get(String(chatId));
  if (!dati) return null;
  if (Date.now() > dati.scadenza) {
    sessioni.delete(String(chatId));
    return null;
  }
  return dati;
}

export function cancellaSessione(chatId) {
  sessioni.delete(String(chatId));
}
