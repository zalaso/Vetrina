import { webhookCallback } from "grammy";
import { bot } from "../src/bot.js";

/**
 * Entry point serverless (Vercel) per il webhook Telegram.
 * L'URL va registrato con: npm run set-webhook
 */
export default webhookCallback(bot, "https", {
  timeoutMilliseconds: 55_000,
});
