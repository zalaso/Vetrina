import { config } from "./config.js";

/**
 * Chiama il deploy hook di Vercel per rigenerare il sito.
 * Non blocca il bot se fallisce: il sito si riallineerà al deploy successivo.
 */
export async function rigeneraSito() {
  if (!config.deployHookUrl) {
    console.warn("[deploy] VERCEL_DEPLOY_HOOK_URL non impostata: sito non rigenerato");
    return;
  }
  try {
    await fetch(config.deployHookUrl, { method: "POST" });
  } catch (errore) {
    console.error("[deploy] chiamata al deploy hook fallita:", errore);
  }
}
