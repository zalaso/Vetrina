import { bot } from "./src/bot.js";

/**
 * Avvio locale in modalità polling (solo per sviluppo).
 * Attenzione: se il webhook è già registrato su Telegram, il polling
 * lo rimuove temporaneamente; rilancialo poi con `npm run set-webhook`.
 */
console.log("Bot HD Design avviato in locale (polling). Ctrl+C per fermare.");
bot.start();
