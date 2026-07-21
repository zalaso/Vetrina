/**
 * Registra il webhook del bot su Telegram.
 * Uso: WEBHOOK_URL=https://tuo-bot.vercel.app/api/webhook npm run set-webhook
 * (oppure imposta WEBHOOK_URL nel file .env)
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.WEBHOOK_URL;

if (!token) {
  console.error("Manca TELEGRAM_BOT_TOKEN nel file .env");
  process.exit(1);
}
if (!url) {
  console.error(
    "Manca WEBHOOK_URL. Esempio:\n  WEBHOOK_URL=https://tuo-bot.vercel.app/api/webhook npm run set-webhook"
  );
  process.exit(1);
}

const risposta = await fetch(
  `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(url)}&drop_pending_updates=true`
);
const dati = await risposta.json();
console.log(dati.ok ? `✅ Webhook registrato: ${url}` : dati);
