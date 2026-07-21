import { Bot, InlineKeyboard } from "grammy";
import { config } from "./config.js";
import {
  F,
  creaRecord,
  aggiornaRecord,
  getRecord,
  listaDisponibili,
  listaVendutiAnno,
  trovaBozzaAttiva,
  fotoDaRecord,
  oggiISO,
} from "./airtable.js";
import { caricaFoto, anteprima } from "./cloudinary.js";
import { trascriviVocale } from "./transcribe.js";
import { estraiOggetto, applicaCorrezione, interpretaComando } from "./ai.js";
import { rigeneraSito } from "./deploy.js";
import { salvaSessione, leggiSessione, cancellaSessione } from "./sessions.js";

export const bot = new Bot(config.telegramToken);

const NON_CAPITO = "Non ho capito bene, me lo ripeti con altre parole?";
const ERRORE_GENTILE =
  "Ops, qualcosa non ha funzionato. Riprova tra un momento, per favore.";

/* ----------------------------------------------------------------------------
 * Whitelist: risponde solo agli ID autorizzati.
 * ------------------------------------------------------------------------- */
bot.use(async (ctx, next) => {
  const id = ctx.from?.id;
  if (!id || !config.allowedIds.includes(id)) {
    if (ctx.message || ctx.callbackQuery) {
      await ctx.reply("Bot privato.").catch(() => {});
    }
    return;
  }
  await next();
});

/* ----------------------------------------------------------------------------
 * Utilità
 * ------------------------------------------------------------------------- */

/** Scarica un file di Telegram e restituisce il Buffer. */
async function scaricaFileTelegram(ctx, fileId) {
  const file = await ctx.api.getFile(fileId);
  const url = `https://api.telegram.org/file/bot${config.telegramToken}/${file.file_path}`;
  const risposta = await fetch(url);
  if (!risposta.ok) throw new Error(`Download Telegram ${risposta.status}`);
  return Buffer.from(await risposta.arrayBuffer());
}

function euro(n) {
  if (n == null) return "prezzo su richiesta";
  return `€ ${Number(n).toLocaleString("it-IT")}`;
}

/** Campi AI (camelCase) -> campi Airtable */
function campiPerAirtable(dati) {
  const fields = {};
  if (dati.nome) fields[F.nome] = dati.nome;
  if (dati.categoria) fields[F.categoria] = dati.categoria;
  if (dati.epoca) fields[F.epoca] = dati.epoca;
  if (dati.materiale) fields[F.materiale] = dati.materiale;
  if (dati.dimensioni) fields[F.dimensioni] = dati.dimensioni;
  if (dati.descrizioneBreve) fields[F.descrizioneBreve] = dati.descrizioneBreve;
  if (dati.descrizioneLunga) fields[F.descrizioneLunga] = dati.descrizioneLunga;
  if (dati.prezzoVendita != null) fields[F.prezzoVendita] = Number(dati.prezzoVendita);
  if (dati.prezzoAcquisto != null) fields[F.prezzoAcquisto] = Number(dati.prezzoAcquisto);
  return fields;
}

/** Campi Airtable -> campi AI (per le correzioni) */
function campiPerAI(record) {
  const f = record.fields;
  return {
    nome: f[F.nome] ?? null,
    categoria: f[F.categoria] ?? null,
    epoca: f[F.epoca] ?? null,
    materiale: f[F.materiale] ?? null,
    dimensioni: f[F.dimensioni] ?? null,
    prezzoVendita: f[F.prezzoVendita] ?? null,
    prezzoAcquisto: f[F.prezzoAcquisto] ?? null,
    descrizioneBreve: f[F.descrizioneBreve] ?? null,
    descrizioneLunga: f[F.descrizioneLunga] ?? null,
  };
}

/** Manda il riepilogo di una bozza con i bottoni Pubblica / Correggi. */
async function mandaRiepilogo(ctx, record) {
  const f = record.fields;
  const righe = [
    `📦 *${f[F.nome] ?? "Oggetto"}*`,
    f[F.epoca] ? `Epoca: ${f[F.epoca]}` : null,
    f[F.materiale] ? `Materiale: ${f[F.materiale]}` : null,
    f[F.dimensioni] ? `Dimensioni: ${f[F.dimensioni]}` : null,
    `Categoria: ${f[F.categoria] ?? "Altro"}`,
    `Prezzo di vendita: ${euro(f[F.prezzoVendita])}`,
    f[F.prezzoAcquisto] != null ? `Pagato: ${euro(f[F.prezzoAcquisto])}` : null,
    "",
    f[F.descrizioneBreve] ? `_${f[F.descrizioneBreve]}_` : null,
  ].filter((r) => r !== null);

  const tastiera = new InlineKeyboard()
    .text("✅ Pubblica", `pub:${record.id}`)
    .text("✏️ Correggi", `fix:${record.id}`);

  await ctx.reply(righe.join("\n"), {
    parse_mode: "Markdown",
    reply_markup: tastiera,
  });
}

/* Tipi di operazione che richiedono di individuare un oggetto esistente */
const OPERAZIONI = {
  vendita: {
    prefisso: "vend",
    domanda: "È questo che hai venduto?",
  },
  ritiro: {
    prefisso: "rit",
    domanda: "È questo da togliere dal catalogo?",
  },
  modifica: {
    prefisso: "mod",
    domanda: "È questo da modificare?",
  },
  foto: {
    prefisso: "foto",
    domanda: "È questo il pezzo di cui vuoi cambiare la foto?",
  },
};

/** Mostra un candidato con i bottoni di conferma. */
async function mostraCandidato(ctx, sessione) {
  const recordId = sessione.candidati[sessione.indice];
  if (!recordId) {
    await cancellaSessione(ctx.chat.id);
    await ctx.reply(
      "Non trovo altri oggetti che corrispondono. Prova a descrivermelo con altre parole."
    );
    return;
  }

  const operazione = OPERAZIONI[sessione.tipo];
  const record = await getRecord(recordId);
  const f = record.fields;

  const tastiera = new InlineKeyboard()
    .text("✅ È questo", `${operazione.prefisso}:${record.id}`)
    .text("❌ No, un altro", "altro");

  const didascalia = [
    `*${f[F.nome] ?? "Oggetto"}*`,
    f[F.epoca] ?? null,
    `Prezzo: ${euro(f[F.prezzoVendita])}`,
    `\n${operazione.domanda}`,
  ]
    .filter(Boolean)
    .join("\n");

  const foto = fotoDaRecord(record)[0];
  if (foto) {
    await ctx.replyWithPhoto(anteprima(foto), {
      caption: didascalia,
      parse_mode: "Markdown",
      reply_markup: tastiera,
    });
  } else {
    await ctx.reply(didascalia, { parse_mode: "Markdown", reply_markup: tastiera });
  }
}

/* ----------------------------------------------------------------------------
 * /start e /aiuto
 * ------------------------------------------------------------------------- */
const MESSAGGIO_AIUTO = [
  "Ciao! Sono l'assistente del tuo catalogo. Ecco cosa posso fare:",
  "",
  "📷 *Aggiungere un oggetto*: mandami una o più foto con due parole di descrizione (scritta o vocale). Es: \"comò piemontese fine ottocento, pagato 400, lo vendo a 1200\".",
  "",
  "💰 *Segnare una vendita*: \"venduto il comò\".",
  "",
  "🚫 *Togliere un pezzo senza venderlo*: \"togli la poltrona\", \"me la tengo\".",
  "",
  "✏️ *Cambiare un dato*: \"il comò ora costa 1000\".",
  "",
  "🖼 *Cambiare una foto*: \"cambia la foto del comò\", poi mandami quella nuova.",
  "",
  "📋 *Vedere il catalogo*: \"cosa ho in vendita?\"",
  "",
  "📈 *Sapere quanto hai guadagnato*: \"quanto ho guadagnato quest'anno?\"",
  "",
  "Parla come preferisci: ci penso io a capire.",
].join("\n");

bot.command(["start", "aiuto", "help"], (ctx) =>
  ctx.reply(MESSAGGIO_AIUTO, { parse_mode: "Markdown" })
);

/* ----------------------------------------------------------------------------
 * Foto in arrivo
 * ------------------------------------------------------------------------- */
bot.on("message:photo", async (ctx) => {
  try {
    const didascalia = (ctx.message.caption ?? "").trim();

    // Foto migliore (ultima = risoluzione più alta)
    const fotoTg = ctx.message.photo.at(-1);
    const buffer = await scaricaFileTelegram(ctx, fotoTg.file_id);
    const urlFoto = await caricaFoto(buffer);

    // 1. Stiamo aspettando la nuova foto di un oggetto già pubblicato?
    const sessione = await leggiSessione(ctx.chat.id);
    if (sessione?.tipo === "attesa-foto") {
      const record = await getRecord(sessione.recordId);
      const foto = sessione.sostituisci ? [] : fotoDaRecord(record);
      foto.push(urlFoto);
      const aggiornato = await aggiornaRecord(sessione.recordId, {
        [F.foto]: foto.join("\n"),
      });

      // Le foto successive si aggiungono, non sostituiscono di nuovo
      await salvaSessione(ctx.chat.id, { ...sessione, sostituisci: false });

      await ctx.reply(
        `🖼 Foto aggiornata per *${aggiornato.fields[F.nome]}* (ora ne ha ${foto.length}).\n` +
          "Puoi mandarne altre, oppure lasciar stare: il sito si aggiorna da solo.",
        { parse_mode: "Markdown" }
      );
      await rigeneraSito();
      return;
    }

    // 2. C'è una bozza in lavorazione per questa chat?
    let bozza = await trovaBozzaAttiva(ctx.chat.id);

    if (bozza && ["raccolta-foto", "conferma"].includes(bozza.fields[F.fase])) {
      // Foto aggiuntiva dello stesso oggetto (album o invii successivi)
      const foto = fotoDaRecord(bozza);
      foto.push(urlFoto);
      bozza = await aggiornaRecord(bozza.id, { [F.foto]: foto.join("\n") });

      if (!didascalia) {
        if (bozza.fields[F.fase] === "conferma") {
          await ctx.reply("Aggiunta la foto all'oggetto. 👍");
        }
        return;
      }
      // La didascalia è arrivata con una foto successiva: processala ora
      await processaDescrizione(ctx, bozza, didascalia);
      return;
    }

    // 3. Nuovo oggetto
    bozza = await creaRecord({
      [F.foto]: urlFoto,
      [F.stato]: "Bozza",
      [F.chat]: String(ctx.chat.id),
      [F.fase]: "raccolta-foto",
      [F.dataInserimento]: oggiISO(),
    });

    if (didascalia) {
      await processaDescrizione(ctx, bozza, didascalia);
    } else {
      await ctx.reply(
        "Bella foto! Che oggetto è? Dimmi due parole (anche un vocale va bene)."
      );
    }
  } catch (errore) {
    console.error("[foto]", errore);
    await ctx.reply(ERRORE_GENTILE);
  }
});

/** Passa la descrizione all'AI e propone il riepilogo. */
async function processaDescrizione(ctx, bozza, testo) {
  await ctx.replyWithChatAction("typing");
  const dati = await estraiOggetto(testo, fotoDaRecord(bozza));
  if (!dati || !dati.nome) {
    await ctx.reply(NON_CAPITO);
    return;
  }
  const aggiornata = await aggiornaRecord(bozza.id, {
    ...campiPerAirtable(dati),
    [F.fase]: "conferma",
  });
  await mandaRiepilogo(ctx, aggiornata);
}

/* ----------------------------------------------------------------------------
 * Vocali: trascrizione, poi stesso percorso del testo
 * ------------------------------------------------------------------------- */
bot.on(["message:voice", "message:audio"], async (ctx) => {
  try {
    await ctx.replyWithChatAction("typing");
    const fileId = ctx.message.voice?.file_id ?? ctx.message.audio?.file_id;
    const buffer = await scaricaFileTelegram(ctx, fileId);
    const testo = await trascriviVocale(buffer);
    if (!testo) {
      await ctx.reply("Non sono riuscito a sentire bene il vocale, puoi ripetere?");
      return;
    }
    await gestisciTesto(ctx, testo);
  } catch (errore) {
    console.error("[vocale]", errore);
    await ctx.reply(ERRORE_GENTILE);
  }
});

/* ----------------------------------------------------------------------------
 * Testo libero
 * ------------------------------------------------------------------------- */
bot.on("message:text", async (ctx) => {
  try {
    await gestisciTesto(ctx, ctx.message.text.trim());
  } catch (errore) {
    console.error("[testo]", errore);
    await ctx.reply(ERRORE_GENTILE);
  }
});

async function gestisciTesto(ctx, testo) {
  if (!testo) return;

  // 1. Stiamo aspettando una foto? Un testo qui vuol dire che ha cambiato idea.
  const sessione = await leggiSessione(ctx.chat.id);
  if (sessione?.tipo === "attesa-foto") {
    await cancellaSessione(ctx.chat.id);
  }

  // 2. C'è una bozza che aspetta la descrizione o una correzione?
  const bozza = await trovaBozzaAttiva(ctx.chat.id);
  if (bozza) {
    const fase = bozza.fields[F.fase];
    if (fase === "raccolta-foto") {
      await processaDescrizione(ctx, bozza, testo);
      return;
    }
    if (fase === "correzione") {
      await ctx.replyWithChatAction("typing");
      const corretti = await applicaCorrezione(campiPerAI(bozza), testo);
      if (!corretti) {
        await ctx.reply(NON_CAPITO);
        return;
      }
      const aggiornata = await aggiornaRecord(bozza.id, {
        ...campiPerAirtable(corretti),
        [F.fase]: "conferma",
      });
      await mandaRiepilogo(ctx, aggiornata);
      return;
    }
    // fase "conferma": il titolare deve usare i bottoni, ma se scrive
    // qualcosa lo trattiamo come una correzione diretta.
    if (fase === "conferma") {
      await ctx.replyWithChatAction("typing");
      const corretti = await applicaCorrezione(campiPerAI(bozza), testo);
      if (corretti) {
        const aggiornata = await aggiornaRecord(bozza.id, campiPerAirtable(corretti));
        await mandaRiepilogo(ctx, aggiornata);
        return;
      }
    }
  }

  // 3. Comando libero
  await ctx.replyWithChatAction("typing");
  const disponibili = await listaDisponibili();
  const perAI = disponibili.map((r) => ({
    id: r.id,
    nome: r.fields[F.nome],
    descrizione: r.fields[F.descrizioneBreve],
    prezzo: r.fields[F.prezzoVendita],
  }));

  const intento = await interpretaComando(testo, perAI);
  if (!intento) {
    await ctx.reply(NON_CAPITO);
    return;
  }

  switch (intento.azione) {
    case "vendita":
    case "ritiro":
    case "modifica":
    case "foto": {
      const candidati = (intento.candidati ?? []).filter((id) =>
        disponibili.some((r) => r.id === id)
      );
      if (candidati.length === 0) {
        await ctx.reply(
          "Non ho trovato un oggetto che corrisponde. Me lo descrivi con altre parole?"
        );
        return;
      }
      const nuova = {
        tipo: intento.azione,
        candidati,
        indice: 0,
        modifiche: intento.modifiche ?? {},
        sostituisci: intento.sostituisci ?? false,
      };
      await salvaSessione(ctx.chat.id, nuova);
      await mostraCandidato(ctx, nuova);
      return;
    }

    case "elenco": {
      if (disponibili.length === 0) {
        await ctx.reply("In questo momento non c'è nessun oggetto in vendita.");
        return;
      }
      const righe = disponibili.map(
        (r) => `• ${r.fields[F.nome]} — ${euro(r.fields[F.prezzoVendita])}`
      );
      await ctx.reply(
        `In vendita adesso (${disponibili.length}):\n\n${righe.join("\n")}`
      );
      return;
    }

    case "guadagno": {
      const anno = intento.anno ?? new Date().getFullYear();
      const venduti = await listaVendutiAnno(anno);
      if (venduti.length === 0) {
        await ctx.reply(`Nel ${anno} non risultano vendite.`);
        return;
      }
      let totale = 0;
      for (const r of venduti) {
        const vendita = r.fields[F.prezzoVendita] ?? 0;
        const acquisto = r.fields[F.prezzoAcquisto] ?? 0;
        totale += vendita - acquisto;
      }
      await ctx.reply(
        `Nel ${anno} hai venduto ${venduti.length} oggett${venduti.length === 1 ? "o" : "i"}.\n` +
          `Guadagno (vendita meno acquisto): ${euro(totale)}.`
      );
      return;
    }

    case "aiuto":
      await ctx.reply(MESSAGGIO_AIUTO, { parse_mode: "Markdown" });
      return;

    default:
      await ctx.reply(NON_CAPITO);
  }
}

/* ----------------------------------------------------------------------------
 * Bottoni (callback query)
 * ------------------------------------------------------------------------- */
bot.on("callback_query:data", async (ctx) => {
  const dati = ctx.callbackQuery.data;
  try {
    // ✅ Pubblica bozza
    if (dati.startsWith("pub:")) {
      const recordId = dati.slice(4);
      await aggiornaRecord(recordId, {
        [F.stato]: "Disponibile",
        [F.fase]: "",
        [F.dataInserimento]: oggiISO(),
      });
      await ctx.answerCallbackQuery();
      await ctx.reply("✅ Pubblicato! Il sito si aggiorna in un minuto circa.");
      await rigeneraSito();
      return;
    }

    // ✏️ Correggi bozza
    if (dati.startsWith("fix:")) {
      const recordId = dati.slice(4);
      await aggiornaRecord(recordId, { [F.fase]: "correzione" });
      await ctx.answerCallbackQuery();
      await ctx.reply(
        'Dimmi cosa correggere, come viene: ad esempio "il prezzo è 1000, non 1200".'
      );
      return;
    }

    // ✅ Vendita confermata
    if (dati.startsWith("vend:")) {
      const recordId = dati.slice(5);
      const record = await aggiornaRecord(recordId, {
        [F.stato]: "Venduto",
        [F.dataVendita]: oggiISO(),
      });
      await cancellaSessione(ctx.chat.id);
      await ctx.answerCallbackQuery();
      await ctx.reply(
        `🎉 Segnato come venduto: ${record.fields[F.nome]}.\nIl sito si aggiorna in un minuto circa.`
      );
      await rigeneraSito();
      return;
    }

    // ✅ Ritiro confermato (esce dal catalogo, ma NON è una vendita)
    if (dati.startsWith("rit:")) {
      const recordId = dati.slice(4);
      const record = await aggiornaRecord(recordId, { [F.stato]: "Ritirato" });
      await cancellaSessione(ctx.chat.id);
      await ctx.answerCallbackQuery();
      await ctx.reply(
        `🚫 Tolto dal catalogo: ${record.fields[F.nome]}.\n` +
          "Non risulta venduto, quindi non entra nei guadagni. Il sito si aggiorna in un minuto circa."
      );
      await rigeneraSito();
      return;
    }

    // ✅ Modifica confermata
    if (dati.startsWith("mod:")) {
      const recordId = dati.slice(4);
      const sessione = await leggiSessione(ctx.chat.id);
      if (!sessione?.modifiche || Object.keys(sessione.modifiche).length === 0) {
        await ctx.answerCallbackQuery();
        await ctx.reply(
          "Mi sono perso la modifica da fare. Riscrivimi cosa vuoi cambiare, per favore."
        );
        return;
      }
      const record = await aggiornaRecord(recordId, campiPerAirtable(sessione.modifiche));
      await cancellaSessione(ctx.chat.id);
      await ctx.answerCallbackQuery();
      await ctx.reply(
        `✏️ Aggiornato: ${record.fields[F.nome]}.\nIl sito si aggiorna in un minuto circa.`
      );
      await rigeneraSito();
      return;
    }

    // ✅ Oggetto individuato: ora aspettiamo la foto nuova
    if (dati.startsWith("foto:")) {
      const recordId = dati.slice(5);
      const sessione = await leggiSessione(ctx.chat.id);
      const record = await getRecord(recordId);
      await salvaSessione(ctx.chat.id, {
        tipo: "attesa-foto",
        recordId,
        sostituisci: sessione?.sostituisci ?? false,
      });
      await ctx.answerCallbackQuery();
      await ctx.reply(
        `Va bene: *${record.fields[F.nome]}*.\n` +
          (sessione?.sostituisci
            ? "Mandami la foto nuova e sostituisco quelle che ci sono."
            : "Mandami la foto da aggiungere."),
        { parse_mode: "Markdown" }
      );
      return;
    }

    // ❌ Non è questo: mostra il prossimo candidato
    if (dati === "altro") {
      await ctx.answerCallbackQuery();
      const sessione = await leggiSessione(ctx.chat.id);
      if (!sessione?.candidati) {
        await ctx.reply("Riproviamo: scrivimi di nuovo di quale oggetto si tratta.");
        return;
      }
      sessione.indice += 1;
      await salvaSessione(ctx.chat.id, sessione);
      await mostraCandidato(ctx, sessione);
      return;
    }

    await ctx.answerCallbackQuery();
  } catch (errore) {
    console.error("[bottoni]", errore);
    await ctx.answerCallbackQuery().catch(() => {});
    await ctx.reply(ERRORE_GENTILE);
  }
});
