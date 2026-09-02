import type { GrammarQuestion } from "./grammar-library";
import { structureExtraLibrary } from "./structure-extra";

type GrammarBank = Record<string, Record<string, GrammarQuestion[]>>;

const baseCoreGrammarLibrary: GrammarBank = {
  Udsagnsord: {
    basis: [
      {q:"Hvilket ord er udsagnsord? ‘Maja løber hjem.’",options:["Maja","løber","hjem","ingen"],answer:"løber",why:"‘Løber’ fortæller, hvad Maja gør."},
      {q:"Hvilket ord kan du sætte ‘at’ foran?",options:["glad","cykle","cykel","hurtig"],answer:"cykle",why:"Man kan sige ‘at cykle’."},
      {q:"Hvilket udsagnsord står i datid?",options:["spiser","spiste","spise","spis"],answer:"spiste",why:"‘Spiste’ fortæller, at handlingen allerede er sket."},
      {q:"Find udsagnsordet: ‘Børnene griner højt.’",options:["Børnene","griner","højt","Børnene griner"],answer:"griner",why:"‘Griner’ fortæller, hvad børnene gør."},
      {q:"Hvilket ord er IKKE et udsagnsord?",options:["løbe","tænker","stol","sov"],answer:"stol",why:"‘Stol’ er et navneord."}
    ],
    traening: [
      {q:"Hvilket ord er udsagnsord i ‘Maja løber hurtigt hjem.’?",options:["Maja","løber","hurtigt","hjem"],answer:"løber",why:"‘Løber’ fortæller, hvad Maja gør."},
      {q:"Hvilket ord er udsagnsord i ‘Børnene byggede en hule.’?",options:["Børnene","byggede","en","hule"],answer:"byggede",why:"‘Byggede’ beskriver handlingen og står i datid."},
      {q:"Hvilken sætning indeholder et udsagnsord i nutid?",options:["Hun sang højt.","Hun synger højt.","Hun har sunget højt.","Hun ville synge højt."],answer:"Hun synger højt.",why:"‘Synger’ står i nutid."},
      {q:"Hvad sker der, når ‘gik’ ændres til ‘listede’?",options:["Intet","Bevægelsen bliver mere præcis og skaber en stemning.","Det bliver et spørgsmål.","Ordet bliver et navneord."],answer:"Bevægelsen bliver mere præcis og skaber en stemning.",why:"‘Listede’ viser mere præcist, hvordan personen bevæger sig."},
      {q:"Vælg det mest præcise udsagnsord: ‘Hunden ___ hen mod døren.’",options:["var","bevægede sig","styrtede","gjorde"],answer:"styrtede",why:"‘Styrtede’ giver et tydeligt billede af hurtig bevægelse."}
    ],
    udfordring: [
      {q:"Hvilket udsagnsord skaber mest uro: ‘Hun ___ gennem gangen’?",options:["gik","var","stormede","befandt sig"],answer:"stormede",why:"‘Stormede’ rummer fart og kraft."},
      {q:"Hvorfor kan præcise udsagnsord gøre en tekst stærkere?",options:["De gør altid teksten længere.","De kan vise handling og stemning uden ekstra forklaringer.","De fjerner alle navneord.","De gør teksten mere formel."],answer:"De kan vise handling og stemning uden ekstra forklaringer.",why:"Et præcist verbum kan bære meget betydning."},
      {q:"‘Han sagde vredt’ kan omskrives mest præcist til…",options:["Han var og sagde.","Han hvæsede.","Han talte noget.","Han gjorde en lyd."],answer:"Han hvæsede.",why:"‘Hvæsede’ samler talehandlingen og måden, den udføres på."},
      {q:"Hvilken ændring påvirker fortællingens tempo mest?",options:["gik → sprintede","hus → bygning","hun → personen","rød → mørkerød"],answer:"gik → sprintede",why:"Udsagnsordet ændrer oplevelsen af bevægelsens hastighed."},
      {q:"Form → funktion → effekt ved ‘sneg’?",options:["Navneord → ting → farve","Udsagnsord → beskriver bevægelse → kan skabe spænding eller forsigtighed","Tillægsord → beskriver person → humor","Ingen sammenhæng"],answer:"Udsagnsord → beskriver bevægelse → kan skabe spænding eller forsigtighed",why:"Her kobles grammatisk form til funktion og læserens oplevelse."}
    ]
  },
  Navneord: {
    basis: [
      {q:"Hvilket ord er et navneord?",options:["løber","cykel","hurtigt","glad"],answer:"cykel",why:"‘Cykel’ er navnet på en ting."},
      {q:"Hvilket ord kan du sætte ‘en’ foran?",options:["bog","læse","smuk","meget"],answer:"bog",why:"Man kan sige ‘en bog’."},
      {q:"Find navneordet: ‘Katten sover.’",options:["Katten","sover","begge","ingen"],answer:"Katten",why:"‘Katten’ betegner et dyr."},
      {q:"Hvilket er et egennavn?",options:["by","pige","Odense","skole"],answer:"Odense",why:"Odense er navnet på et bestemt sted."},
      {q:"Hvilket ord er IKKE et navneord?",options:["venskab","bord","danser","sommer"],answer:"danser",why:"‘Danser’ er her et udsagnsord."}
    ],
    traening: [
      {q:"Hvilket navneord er abstrakt?",options:["stol","hund","frihed","blyant"],answer:"frihed",why:"‘Frihed’ er et begreb."},
      {q:"Hvilken sætning har et navneord i flertal?",options:["Pigen løber.","Bøgerne ligger her.","Han sover.","Det regner."],answer:"Bøgerne ligger her.",why:"‘Bøgerne’ står i bestemt flertal."},
      {q:"Hvilket ord er et sammensat navneord?",options:["skolegård","skole","går","hurtigst"],answer:"skolegård",why:"‘Skolegård’ er dannet af skole + gård."},
      {q:"Hvilken ændring gør beskrivelsen mere konkret?",options:["ting → cykel","løb → bevægede sig","glad → meget","hun → de"],answer:"ting → cykel",why:"‘Cykel’ er mere præcist end ‘ting’."},
      {q:"Hvorfor er navneord vigtige i en tekst?",options:["De viser kun tid.","De navngiver det, teksten handler om.","De erstatter alle udsagnsord.","De laver automatisk komma."],answer:"De navngiver det, teksten handler om.",why:"Navneord giver læseren personer, steder, ting og begreber."}
    ],
    udfordring: [
      {q:"Hvilket navneord gør ‘Der stod et ___ på bordet’ mest konkret?",options:["noget","objekt","krus","ting"],answer:"krus",why:"‘Krus’ giver det mest præcise billede."},
      {q:"Hvad kan mange abstrakte navneord gøre ved en tekst?",options:["Gøre den mere sanselig automatisk","Gøre den mere begrebsorienteret og mindre konkret","Fjerne emnet","Gøre alle sætninger korte"],answer:"Gøre den mere begrebsorienteret og mindre konkret",why:"Abstrakte navneord retter opmærksomheden mod ideer."},
      {q:"Hvilken formulering viser mest frem for at forklare?",options:["Han følte frygt.","Frygten var stor.","Hans hænder rystede om dørhåndtaget.","Der var en følelse."],answer:"Hans hænder rystede om dørhåndtaget.",why:"Den konkrete detalje lader læseren udlede følelsen."},
      {q:"Hvilket valg skaber størst præcision?",options:["person → menneske","køretøj → rusten varevogn","ting → genstand","sted → område"],answer:"køretøj → rusten varevogn",why:"Det specifikke navneord skaber et tydeligere billede."},
      {q:"Form → funktion → effekt: ‘ensomhed’?",options:["Navneord → navngiver et abstrakt begreb → kan samle tekstens tema","Udsagnsord → handling → fart","Tillægsord → farve → humor","Biord → tid → rim"],answer:"Navneord → navngiver et abstrakt begreb → kan samle tekstens tema",why:"Et abstrakt navneord kan fungere som et centralt tema."}
    ]
  }
};

function mergeBanks(...sources: GrammarBank[]): GrammarBank {
  const result: GrammarBank = {};
  for (const source of sources) {
    for (const [topic, levels] of Object.entries(source)) {
      result[topic] ||= {};
      for (const [level, questions] of Object.entries(levels)) {
        result[topic][level] = [...(result[topic][level] || []), ...questions];
      }
    }
  }
  return result;
}

export const coreGrammarLibrary: GrammarBank = mergeBanks(baseCoreGrammarLibrary, structureExtraLibrary);
