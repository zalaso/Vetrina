import { bot } from "./src/bot.js";
import { config } from "./src/config.js";

/**
 * Avvio locale in modalità polling (solo per sviluppo).
 * Attenzione: se il webhook è già registrato su Telegram, il polling
 * lo rimuove temporaneamente; rilancialo poi con `npm run set-webhook`.
 */
console.log(`Bot di ${config.shopName} avviato in locale (polling). Ctrl+C per fermare.`);
bot.start();
