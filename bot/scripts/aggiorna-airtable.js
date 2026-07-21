/**
 * Aggiorna lo schema Airtable per le funzioni aggiunte dopo il primo rilascio:
 *
 *  1. crea la tabella "Sessioni", dove il bot ricorda le operazioni in attesa
 *     di conferma (serve perché su Vercel ogni messaggio può essere gestito da
 *     un'istanza diversa, che non condivide la memoria con le precedenti);
 *  2. aggiunge lo stato "Ritirato" al campo Stato della tabella "Oggetti",
 *     per distinguere un pezzo tolto dal catalogo da uno realmente venduto.
 *
 * Lo script è ripetibile: se una cosa esiste già, la salta.
 * Serve un token con scope "schema.bases:write".
 *
 * Uso: npm run aggiorna-airtable
 */
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error("Servono AIRTABLE_API_KEY e AIRTABLE_BASE_ID nel file .env");
  process.exit(1);
}

const meta = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
const headers = {
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
};

async function leggiTabelle() {
  const r = await fetch(meta, { headers });
  if (!r.ok) throw new Error(`Lettura schema fallita (${r.status}): ${await r.text()}`);
  return (await r.json()).tables;
}

let tabelle = await leggiTabelle();

/* --- 1. Tabella "Sessioni" ------------------------------------------------ */

if (tabelle.some((t) => t.name === "Sessioni")) {
  console.log('• Tabella "Sessioni": esiste già, salto.');
} else {
  const r = await fetch(meta, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Sessioni",
      description:
        "Uso interno del bot: operazioni in attesa di conferma. Non toccare.",
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
  if (!r.ok) throw new Error(`Creazione "Sessioni" fallita (${r.status}): ${await r.text()}`);
  console.log('✅ Tabella "Sessioni" creata.');
}

/* --- 2. Stato "Ritirato" -------------------------------------------------- */

tabelle = await leggiTabelle();
const oggetti = tabelle.find((t) => t.name === "Oggetti");
if (!oggetti) throw new Error('Tabella "Oggetti" non trovata nella base.');

const stato = oggetti.fields.find((f) => f.name === "Stato");
if (!stato) throw new Error('Campo "Stato" non trovato nella tabella Oggetti.');

const scelte = stato.options?.choices ?? [];
if (scelte.some((c) => c.name === "Ritirato")) {
  console.log('• Stato "Ritirato": esiste già, salto.');
} else {
  const r = await fetch(`${meta}/${oggetti.id}/fields/${stato.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      options: {
        // Le scelte esistenti vanno ripassate con il loro id, altrimenti
        // Airtable le considera rimosse.
        choices: [...scelte.map((c) => ({ id: c.id, name: c.name })), { name: "Ritirato" }],
      },
    }),
  });
  if (!r.ok) throw new Error(`Aggiunta stato "Ritirato" fallita (${r.status}): ${await r.text()}`);
  console.log('✅ Stato "Ritirato" aggiunto al campo Stato.');
}

console.log("\nSchema aggiornato.");
