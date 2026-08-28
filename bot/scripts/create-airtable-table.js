/**
 * Crea la tabella "Oggetti" nella base Airtable indicata da AIRTABLE_BASE_ID,
 * con lo schema esatto usato da bot e sito.
 *
 * Prerequisiti:
 *  - una base Airtable già creata (anche vuota);
 *  - un Personal Access Token con scope "schema.bases:write" e
 *    "data.records:write" sulla base.
 *
 * Uso: npm run create-airtable-table
 */
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error("Servono AIRTABLE_API_KEY e AIRTABLE_BASE_ID nel file .env");
  process.exit(1);
}

const scelte = (nomi) => ({ choices: nomi.map((name) => ({ name })) });

const tabella = {
  name: "Oggetti",
  description: "Catalogo del negozio, gestito dal bot Telegram",
  fields: [
    // Il primo campo è il campo primario.
    // Nota: il campo "ID" (Autonumber) NON si può creare via API;
    // se lo vuoi, aggiungilo a mano su Airtable (tipo "Autonumber")
    // prima di andare online. Il sito funziona anche senza.
    { name: "Nome", type: "singleLineText" },
    {
      name: "Categoria",
      type: "singleSelect",
      options: scelte([
        "Mobili",
        "Sedute",
        "Quadri",
        "Oggettistica",
        "Illuminazione",
        "Altro",
      ]),
    },
    { name: "Epoca", type: "singleLineText" },
    { name: "Materiale", type: "singleLineText" },
    { name: "Dimensioni", type: "singleLineText" },
    { name: "Descrizione breve", type: "multilineText" },
    { name: "Descrizione lunga", type: "multilineText" },
    {
      name: "Foto",
      type: "multilineText",
      description: "URL Cloudinary, uno per riga (li inserisce il bot)",
    },
    {
      name: "Prezzo di vendita",
      type: "number",
      options: { precision: 0 },
    },
    {
      name: "Prezzo di acquisto",
      type: "number",
      options: { precision: 0 },
      description: "MAI mostrato sul sito",
    },
    {
      name: "Stato",
      type: "singleSelect",
      options: scelte(["Disponibile", "Venduto", "Bozza"]),
    },
    { name: "Data inserimento", type: "date", options: { dateFormat: { name: "iso" } } },
    { name: "Data vendita", type: "date", options: { dateFormat: { name: "iso" } } },
    { name: "Note private", type: "multilineText" },
    {
      name: "Chat",
      type: "singleLineText",
      description: "Campo tecnico del bot: chat Telegram che ha creato il record",
    },
    {
      name: "Fase",
      type: "singleLineText",
      description: "Campo tecnico del bot: fase della bozza in lavorazione",
    },
  ],
};

const risposta = await fetch(
  `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tabella),
  }
);

if (risposta.ok) {
  console.log('✅ Tabella "Oggetti" creata con tutti i campi.');
} else {
  console.error(`Errore ${risposta.status}:`, await risposta.text());
  process.exitCode = 1;
}
