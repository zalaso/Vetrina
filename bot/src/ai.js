import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";

/**
 * Tutte le chiamate all'AI (Anthropic) del bot.
 * Il modello risponde sempre con JSON puro, che noi estraiamo
 * in modo tollerante. In caso di problemi restituiamo null e il
 * bot risponde con una frase cortese, mai con errori tecnici.
 */

const client = new Anthropic({ apiKey: config.anthropicApiKey });
const MODELLO = "claude-sonnet-4-6";

const CATEGORIE = [
  "Mobili",
  "Sedute",
  "Quadri",
  "Oggettistica",
  "Illuminazione",
  "Altro",
];

/** Estrae il primo blocco JSON dalla risposta del modello. */
function estraiJSON(testo) {
  const pulito = testo.replace(/```json|```/g, "").trim();
  const inizio = pulito.indexOf("{");
  const fine = pulito.lastIndexOf("}");
  if (inizio === -1 || fine === -1) return null;
  try {
    return JSON.parse(pulito.slice(inizio, fine + 1));
  } catch {
    return null;
  }
}

async function chiedi(system, contenutoUtente) {
  const risposta = await client.messages.create({
    model: MODELLO,
    max_tokens: 1500,
    system,
    messages: [{ role: "user", content: contenutoUtente }],
  });
  const blocco = risposta.content.find((b) => b.type === "text");
  return blocco ? estraiJSON(blocco.text) : null;
}

/**
 * Da una descrizione (testo o trascrizione) + foto, estrae i campi
 * dell'oggetto e genera le descrizioni per il sito.
 */
export async function estraiOggetto(testo, fotoUrls = []) {
  const system = `Sei l'assistente di HD Design, una bottega di antiquariato italiana.
Dal messaggio del titolare (e dalle foto, se presenti) estrai i dati di un oggetto in vendita.
Rispondi SOLO con un JSON con questi campi (usa null se un dato non c'è):
{
  "nome": "nome breve e commerciale dell'oggetto, es. 'Comò piemontese in noce'",
  "categoria": una tra ${JSON.stringify(CATEGORIE)} (deducila dalle foto se non dichiarata),
  "epoca": "es. 'Fine Ottocento'",
  "materiale": "es. 'Noce massello'",
  "dimensioni": "solo se dette esplicitamente, es. 'L 120 × P 55 × H 98 cm'",
  "prezzoVendita": numero in euro o null,
  "prezzoAcquisto": numero in euro o null (quanto l'ha pagato il titolare),
  "descrizioneBreve": "1 frase per la card del sito, italiano elegante ma sobrio",
  "descrizioneLunga": "3-4 frasi per la pagina di dettaglio, tono da galleria: elegante, concreto, mai pomposo. Non inventare dati storici non verificabili."
}
Attenzione: 'pagato X' o 'preso a X' = prezzoAcquisto; 'lo vendo a Y' o 'chiedo Y' = prezzoVendita.
I numeri detti a voce possono essere in lettere ('quattrocento' = 400).`;

  const contenuto = [];
  for (const url of fotoUrls.slice(0, 3)) {
    contenuto.push({ type: "image", source: { type: "url", url } });
  }
  contenuto.push({ type: "text", text: `Messaggio del titolare: "${testo}"` });

  return chiedi(system, contenuto);
}

/**
 * Applica una correzione in linguaggio naturale ai campi già estratti.
 */
export async function applicaCorrezione(campiAttuali, testoCorrezione) {
  const system = `Sei l'assistente di HD Design (bottega di antiquariato italiana).
Il titolare vuole correggere i dati di un oggetto. Ti do i dati attuali e la sua richiesta.
Rispondi SOLO con il JSON completo dei dati aggiornati, stesso formato di quello ricevuto:
cambia solo ciò che chiede, mantieni il resto identico. Se cambia un dato citato nelle
descrizioni (prezzo escluso: il prezzo non compare mai nelle descrizioni), aggiorna anche quelle.`;

  const contenuto = [
    {
      type: "text",
      text: `Dati attuali:\n${JSON.stringify(campiAttuali, null, 2)}\n\nCorrezione richiesta: "${testoCorrezione}"`,
    },
  ];
  return chiedi(system, contenuto);
}

/**
 * Interpreta un comando libero (vendita, modifica, consultazione).
 * `oggetti` è la lista dei Disponibili: [{id, nome, descrizione, prezzo}].
 */
export async function interpretaComando(testo, oggetti) {
  const elenco = oggetti
    .map((o) => `${o.id} | ${o.nome} | ${o.descrizione ?? ""} | ${o.prezzo ?? "s.p."}`)
    .join("\n");

  const annoCorrente = new Date().getFullYear();

  const system = `Sei l'assistente di HD Design (bottega di antiquariato italiana).
Il titolare gestisce il catalogo scrivendo frasi libere. Interpreta la sua richiesta.
Rispondi SOLO con un JSON:
{
  "azione": "vendita" | "modifica" | "elenco" | "guadagno" | "aiuto" | "altro",
  "candidati": [/* per vendita/modifica: gli id degli oggetti che corrispondono,
                  dal più probabile al meno probabile, max 5. Cerca in nome e descrizione. */],
  "modifiche": {/* solo per modifica: i campi da cambiare tra
                  "nome","categoria","epoca","materiale","dimensioni",
                  "prezzoVendita","prezzoAcquisto" con i nuovi valori */},
  "anno": /* solo per guadagno: l'anno richiesto, default ${annoCorrente} */
}
Note:
- "venduto il comò", "ho venduto la poltrona", "togli lo specchio" => azione "vendita"
  (anche togliere/rimuovere si tratta come vendita).
- "il comò ora costa 1000", "cambia il prezzo della credenza" => azione "modifica".
- "cosa ho in vendita?", "che oggetti ho?" => "elenco".
- "quanto ho guadagnato quest'anno/nel 2025?" => "guadagno".
- Se chiede aiuto o saluta => "aiuto". Se non capisci => "altro".

Oggetti disponibili (id | nome | descrizione | prezzo):
${elenco || "(nessuno)"}`;

  return chiedi(system, [{ type: "text", text: `Richiesta: "${testo}"` }]);
}
