import crypto from "node:crypto";
import { config } from "./config.js";

/**
 * Caricamento foto su Cloudinary con upload firmato.
 * In Airtable salviamo solo l'URL restituito (secure_url).
 */
export async function caricaFoto(buffer, nomeFile = "foto.jpg") {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = config.cloudinary.folder;

  // Firma: sha1 dei parametri ordinati + api_secret
  const daFirmare = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(daFirmare).digest("hex");

  const form = new FormData();
  form.append("file", new Blob([buffer]), nomeFile);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const risposta = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );
  if (!risposta.ok) {
    throw new Error(`Cloudinary ${risposta.status}: ${await risposta.text()}`);
  }
  const dati = await risposta.json();
  return dati.secure_url;
}

/**
 * Variante ottimizzata di un URL Cloudinary (per anteprime nel bot).
 */
export function anteprima(url) {
  return url.replace("/upload/", "/upload/w_800,q_auto,f_auto/");
}
