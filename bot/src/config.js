/**
 * Lettura e validazione delle variabili d'ambiente del bot.
 */

function obbligatoria(nome) {
  const valore = process.env[nome];
  if (!valore) {
    throw new Error(`Variabile d'ambiente mancante: ${nome}`);
  }
  return valore;
}

export const config = {
  /**
   * Nome della bottega: compare nelle istruzioni date all'AI, così le
   * descrizioni generate parlano del negozio giusto.
   */
  shopName: process.env.SHOP_NAME?.trim() || "la bottega",

  telegramToken: obbligatoria("TELEGRAM_BOT_TOKEN"),
  anthropicApiKey: obbligatoria("ANTHROPIC_API_KEY"),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  airtableApiKey: obbligatoria("AIRTABLE_API_KEY"),
  airtableBaseId: obbligatoria("AIRTABLE_BASE_ID"),
  cloudinary: {
    cloudName: obbligatoria("CLOUDINARY_CLOUD_NAME"),
    apiKey: obbligatoria("CLOUDINARY_API_KEY"),
    apiSecret: obbligatoria("CLOUDINARY_API_SECRET"),
    /** Cartella in cui finiscono le foto caricate dal bot */
    folder: process.env.CLOUDINARY_FOLDER?.trim() || "vetrina",
  },
  deployHookUrl: process.env.VERCEL_DEPLOY_HOOK_URL ?? "",
  /** ID Telegram autorizzati (numeri) */
  allowedIds: (process.env.ALLOWED_TELEGRAM_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number),
};
