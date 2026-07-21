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
  telegramToken: obbligatoria("TELEGRAM_BOT_TOKEN"),
  anthropicApiKey: obbligatoria("ANTHROPIC_API_KEY"),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  airtableApiKey: obbligatoria("AIRTABLE_API_KEY"),
  airtableBaseId: obbligatoria("AIRTABLE_BASE_ID"),
  cloudinary: {
    cloudName: obbligatoria("CLOUDINARY_CLOUD_NAME"),
    apiKey: obbligatoria("CLOUDINARY_API_KEY"),
    apiSecret: obbligatoria("CLOUDINARY_API_SECRET"),
  },
  deployHookUrl: process.env.VERCEL_DEPLOY_HOOK_URL ?? "",
  /** ID Telegram autorizzati (numeri) */
  allowedIds: (process.env.ALLOWED_TELEGRAM_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number),
};
