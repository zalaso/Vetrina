import { config } from "./config.js";

/**
 * Trascrizione dei messaggi vocali con Whisper (OpenAI).
 * Riceve il buffer dell'audio (formato .oga di Telegram) e
 * restituisce il testo in italiano.
 */
export async function trascriviVocale(buffer, nomeFile = "vocale.oga") {
  if (!config.openaiApiKey) {
    throw new Error("OPENAI_API_KEY non impostata: impossibile trascrivere i vocali");
  }

  const form = new FormData();
  form.append("file", new Blob([buffer]), nomeFile);
  form.append("model", "whisper-1");
  form.append("language", "it");

  const risposta = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.openaiApiKey}` },
    body: form,
  });
  if (!risposta.ok) {
    throw new Error(`Whisper ${risposta.status}: ${await risposta.text()}`);
  }
  const dati = await risposta.json();
  return (dati.text ?? "").trim();
}
