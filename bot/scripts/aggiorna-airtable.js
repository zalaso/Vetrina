/**
 * Crea la tabella "Sessioni", dove il bot ricorda le operazioni in attesa di
 * conferma (serve perché su Vercel ogni messaggio può essere gestito da
 * un'istanza diversa, che non condivide la memoria con le precedenti).
 *
 * Lo script è ripetibile: se la tabella esiste già, lo rileva e si ferma.
 * Richiede il solo scope "schema.bases:write" (non serve "schema.bases:read":
 * invece di leggere prima lo schema, proviamo a creare e interpretiamo l'esito).
 *
 * Nota: lo stato "Ritirato" del campo Stato NON va creato qui. Airtable lo
 * aggiunge da solo alla prima scrittura, perché il bot scrive con typecast.
 *
 * Uso: npm run aggiorna-airtable
 */
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error("Servono AIRTABLE_API_KEY e AIRTABLE_BASE_ID nel file .env");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
};

/** La tabella risponde alle letture dei record? Allora esiste ed è usabile. */
async function tabellaUsabile(nome) {
  const r = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(nome)}?pageSize=1`,
    { headers }
  );
  return r.ok;
}

if (await tabellaUsabile("Sessioni")) {
  console.log('• Tabella "Sessioni": esiste già ed è raggiungibile. Niente da fare.');
} else {
  const r = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Sessioni",
      description:
        "Uso interno del bot: operazioni in attesa di conferma. Non modificare a mano.",
      fields: [
        { name: "Chat", type: "singleLineText" },
        {
          name: "Dati",
          type: "multilineText",
          description: "Contenuto tecnico dell'operazione in sospeso",
        },
        {
          name: "Scadenza",
          type: "singleLineText",
          description: "Data e ora oltre cui l'operazione va considerata annullata",
        },
      ],
    }),
  });

  if (r.ok) {
    console.log('✅ Tabella "Sessioni" creata.');
  } else {
    const dettaglio = await r.text();
    if (r.status === 403) {
      console.error(
        '❌ Il token non ha il permesso di creare tabelle.\n' +
          '   Aggiungi lo scope "schema.bases:write" su https://airtable.com/create/tokens\n' +
          "   oppure crea la tabella a mano (istruzioni nel README).\n"
      );
    } else {
      console.error(`❌ Creazione fallita (${r.status}): ${dettaglio}\n`);
    }
    process.exitCode = 1;
  }
}

/* Verifica finale: il bot riuscirà davvero a usarla? */
if (process.exitCode !== 1) {
  const ok = await tabellaUsabile("Sessioni");
  console.log(
    ok
      ? "✅ Verifica: il bot può leggere e scrivere la tabella. Tutto pronto."
      : "⚠️  La tabella risulta creata ma non raggiungibile in lettura: controlla che il token abbia accesso a questa base."
  );
}
