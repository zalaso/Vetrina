import type { Oggetto } from "../lib/types";

/**
 * Dati mock per lo sviluppo del sito.
 * Le foto sono segnaposto (picsum.photos): in produzione arriveranno
 * da Cloudinary tramite il bot Telegram.
 */
export const oggettiMock: Oggetto[] = [
  {
    id: "1",
    nome: "Comò piemontese in noce",
    categoria: "Mobili",
    epoca: "Fine Ottocento",
    materiale: "Noce massello",
    descrizioneBreve:
      "Comò piemontese di fine Ottocento in noce massello, con tre cassetti e piano sagomato.",
    descrizioneLunga:
      "Elegante comò piemontese della seconda metà dell'Ottocento, realizzato interamente in noce massello. Il fronte mosso ospita tre ampi cassetti con maniglie originali in ottone; il piano sagomato conserva la patina del tempo. Restaurato in modo conservativo, è subito pronto per l'uso quotidiano.",
    foto: [
      "https://picsum.photos/seed/como-noce-1/1200/1500",
      "https://picsum.photos/seed/como-noce-2/1200/1500",
      "https://picsum.photos/seed/como-noce-3/1200/1500",
    ],
    prezzo: 1200,
    stato: "Disponibile",
    dataInserimento: "2026-06-02",
    dimensioni: "L 128 × P 58 × H 96 cm",
  },
  {
    id: "2",
    nome: "Poltrona bergère in velluto verde",
    categoria: "Sedute",
    epoca: "Primi del Novecento",
    materiale: "Faggio, velluto",
    descrizioneBreve:
      "Poltrona bergère dei primi del Novecento, rivestita in velluto verde bosco.",
    descrizioneLunga:
      "Poltrona bergère dei primi del Novecento dalla seduta generosa e avvolgente. La struttura in faggio è stata consolidata, mentre il rivestimento in velluto verde bosco è stato rifatto di recente rispettando le linee originali. Comoda davvero, non solo bella da vedere.",
    foto: [
      "https://picsum.photos/seed/bergere-verde-1/1200/1500",
      "https://picsum.photos/seed/bergere-verde-2/1200/1500",
    ],
    prezzo: 650,
    stato: "Disponibile",
    dataInserimento: "2026-06-10",
  },
  {
    id: "3",
    nome: "Specchiera dorata a foglia",
    categoria: "Oggettistica",
    epoca: "Metà Ottocento",
    materiale: "Legno intagliato, foglia oro",
    descrizioneBreve:
      "Specchiera in legno intagliato e dorato a foglia, metà Ottocento.",
    descrizioneLunga:
      "Specchiera della metà dell'Ottocento in legno finemente intagliato e dorato a foglia. La cimasa a volute incornicia uno specchio al mercurio originale, con il caratteristico velo del tempo che ne conferma l'epoca. Un pezzo che da solo illumina una parete.",
    foto: ["https://picsum.photos/seed/specchiera-oro-1/1200/1500"],
    stato: "Disponibile",
    dataInserimento: "2026-05-18",
    dimensioni: "L 74 × H 112 cm",
  },
  {
    id: "4",
    nome: "Coppia di sedie Thonet n. 14",
    categoria: "Sedute",
    epoca: "Inizio Novecento",
    materiale: "Faggio curvato, paglia di Vienna",
    descrizioneBreve:
      "Coppia di sedie Thonet n. 14 in faggio curvato con seduta in paglia di Vienna.",
    descrizioneLunga:
      "Coppia di sedie Thonet modello n. 14, l'icona del legno curvato. Strutture solide e sedute in paglia di Vienna in ottimo stato. Marchiate a fuoco sotto la seduta. Perfette accostate a un tavolo moderno come a uno antico.",
    foto: [
      "https://picsum.photos/seed/thonet-14-1/1200/1500",
      "https://picsum.photos/seed/thonet-14-2/1200/1500",
    ],
    prezzo: 380,
    stato: "Disponibile",
    dataInserimento: "2026-06-20",
  },
  {
    id: "5",
    nome: "Paesaggio lacustre, olio su tela",
    categoria: "Quadri",
    epoca: "Fine Ottocento",
    materiale: "Olio su tela",
    descrizioneBreve:
      "Olio su tela di fine Ottocento raffigurante un paesaggio lacustre, cornice coeva.",
    descrizioneLunga:
      "Olio su tela di scuola lombarda, fine Ottocento, raffigurante un paesaggio lacustre al tramonto. Firma poco leggibile in basso a destra. La cornice coeva in legno dorato presenta piccole mancanze coerenti con l'età. Un quadro che porta quiete in una stanza.",
    foto: ["https://picsum.photos/seed/paesaggio-olio-1/1500/1200"],
    prezzo: 900,
    stato: "Disponibile",
    dataInserimento: "2026-04-28",
    dimensioni: "L 92 × H 68 cm (con cornice)",
  },
  {
    id: "6",
    nome: "Lampadario impero a gocce",
    categoria: "Illuminazione",
    epoca: "Primo Novecento",
    materiale: "Bronzo, cristallo",
    descrizioneBreve:
      "Lampadario in stile impero a sei luci, bronzo e gocce di cristallo.",
    descrizioneLunga:
      "Lampadario in stile impero a sei luci, con struttura in bronzo e ricca cascata di gocce in cristallo molato. Impianto elettrico rifatto a norma, pronto da appendere. Alla luce accesa il cristallo riempie la stanza di riflessi caldi.",
    foto: ["https://picsum.photos/seed/lampadario-impero-1/1200/1500"],
    stato: "Disponibile",
    dataInserimento: "2026-05-30",
  },
  {
    id: "7",
    nome: "Credenza toscana in castagno",
    categoria: "Mobili",
    epoca: "Metà Ottocento",
    materiale: "Castagno",
    descrizioneBreve:
      "Credenza toscana in castagno, due ante e due cassetti, metà Ottocento.",
    descrizioneLunga:
      "Credenza toscana della metà dell'Ottocento in castagno massello, con due ante a specchiatura e due cassetti sotto il piano. Ferramenta originale. Il legno, pulito e cerato, ha un colore caldo e profondo che solo il tempo sa dare.",
    foto: ["https://picsum.photos/seed/credenza-castagno-1/1200/1500"],
    prezzo: 1450,
    stato: "Venduto",
    dataInserimento: "2026-03-12",
    dataVendita: "2026-06-25",
  },
  {
    id: "8",
    nome: "Vaso in ceramica di Albisola",
    categoria: "Oggettistica",
    epoca: "Anni Cinquanta",
    materiale: "Ceramica smaltata",
    descrizioneBreve:
      "Vaso in ceramica di Albisola degli anni Cinquanta, smalto blu e ocra.",
    descrizioneLunga:
      "Vaso in ceramica di Albisola degli anni Cinquanta, con smalti blu e ocra dal disegno libero, tipico della stagione informale ligure. Integro, senza restauri. Bello da solo, ancora di più con un ramo dentro.",
    foto: ["https://picsum.photos/seed/vaso-albisola-1/1200/1500"],
    prezzo: 240,
    stato: "Venduto",
    dataInserimento: "2026-02-08",
    dataVendita: "2026-05-14",
  },
];
