import type {TrainingQuestion} from "./freeTrainingQuestions";

const choiceOnlySkills=new Set([
 "Regnestrategier","Geometriske figurer","Kritisk dataforståelse","Forklar din metode","Strategivalg","Matematisk argumentation","Modellering","Overslag og rimelighed"
]);

function compact(value:string){return value.normalize("NFC").trim().toLocaleLowerCase("da-DK").replace(/\s+/g,"").replace(/,/g,".").replace(/kr\.?/g,"kr")}
function numeric(value:string){
 const match=compact(value).match(/^(-?\d+(?:\.\d+)?)(%|mm|cm|m|km|g|kg|ml|l|kr|°|cm²|m²|km²|cm³|m³)?$/);
 if(!match)return null;
 return{value:Number(match[1]),unit:match[2]||""};
}
function fraction(value:string){const match=compact(value).match(/^(-?\d+)\/(-?\d+)$/);if(!match||Number(match[2])===0)return null;return Number(match[1])/Number(match[2])}

export function mathUsesTypedAnswer(skill:string|null,question:TrainingQuestion){
 if(!skill||choiceOnlySkills.has(skill))return false;
 const answer=compact(question.answer);
 return /^-?\d+(?:\.\d+)?(?:%|mm|cm|m|km|g|kg|ml|l|kr|°|cm²|m²|km²|cm³|m³)?$/.test(answer)||/^-?\d+\/-?\d+$/.test(answer)||/^x=-?\d+(?:\.\d+)?$/.test(answer);
}

export function mathAnswerIsCorrect(question:TrainingQuestion,studentAnswer:string){
 const expected=compact(question.answer),given=compact(studentAnswer);
 if(expected===given)return true;
 if(expected.startsWith("x=")&&given===expected.slice(2))return true;
 const ef=fraction(expected),gf=fraction(given);if(ef!==null&&gf!==null)return Math.abs(ef-gf)<1e-9;
 const en=numeric(expected),gn=numeric(given);
 if(en&&gn){
  if(Math.abs(en.value-gn.value)>1e-9)return false;
  return !gn.unit||!en.unit||gn.unit===en.unit;
 }
 return false;
}

const hints:Record<string,string>={
 "Tal og mængder":"Se på tallenes størrelse og placering. Prøv at sige talrækken højt eller tegn mængden.",
 "Plus og minus":"Del tallene op i hundreder, tiere og enere. Regn én del ad gangen.",
 "Gange og division":"Tænk på en tabel, du kender, eller del regnestykket op i mindre stykker.",
 "Regnestrategier":"Spørg dig selv, om du kan runde et tal af, dele det op eller bruge et regnestykke, du allerede kender.",
 "Negative tal":"Tegn eventuelt en tallinje. Bevæg dig mod højre, når tallet bliver større, og mod venstre, når det bliver mindre.",
 "Regnearternes rækkefølge":"Start med parenteser. Derefter gange og division. Plus og minus kommer til sidst.",
 "Potenser og rødder":"Skriv potensen som gentagen multiplikation, eller spørg hvilket tal der ganget med sig selv giver tallet under roden.",
 "Brøker":"Se først på nævnerne. Skal brøkerne have samme nævner, før du kan regne videre?",
 "Decimaltal":"Skriv tallene under hinanden, så komma står under komma.",
 "Procent":"Find først 1 %, 10 % eller 50 %. Brug det som et nemt trin videre til den procent, du skal finde.",
 "Forhold":"Skriv forholdet som to tal, der hører sammen. Se om begge kan divideres eller ganges med det samme tal.",
 "Proportionalitet":"Find værdien for én enhed først. Derefter kan du gange op.",
 "Længde og enheder":"Tjek enheden først. Skal du omregne, før du regner?",
 "Omkreds":"Omkreds er hele vejen rundt om figuren. Hvilke sidelængder skal lægges sammen?",
 "Areal":"Areal handler om fladen inden i figuren. Hvilke mål skal bruges i figurens arealformel?",
 "Rumfang":"Rumfang handler om pladsen inde i en rumlig figur. Tænk længde × bredde × højde for en kasse.",
 "Geometriske figurer":"Se på figurens kendetegn: sider, vinkler, parallelle linjer og symmetri.",
 "Vinkler":"Brug kendte vinkelsummer: en ret linje er 180°, en hel omgang er 360°, og en trekant har 180°.",
 "Koordinatsystem":"Læs x-koordinaten først og y-koordinaten bagefter.",
 "Målestoksforhold":"Find ud af, hvad 1 cm på tegningen svarer til i virkeligheden, før du ganger op.",
 "Mønstre":"Sammenlign to nabotal eller figurer. Hvad ændrer sig fra trin til trin?",
 "Variable":"Tænk på bogstavet som en tom plads, der kan have en talværdi.",
 "Ligninger":"Målet er at få den ukendte alene. Gør det samme på begge sider af lighedstegnet.",
 "Funktioner":"Find sammenhængen mellem x og y. Hvad sker der med y, når x vokser med 1?",
 "Formler":"Skriv først, hvad bogstaverne betyder, og sæt derefter de kendte tal ind i formlen.",
 "Tabeller og diagrammer":"Læs overskrift, akser og enheder før du aflæser værdien.",
 "Gennemsnit, median og typetal":"Vælg først det rigtige mål: gennemsnit = sum delt med antal, median = tallet i midten, typetal = det hyppigste.",
 "Statistik":"Sorter tallene eller lav en lille tabel. Det gør mønstrene lettere at se.",
 "Sandsynlighed":"Tæl de gunstige muligheder og sammenlign med alle mulige udfald.",
 "Kritisk dataforståelse":"Se efter akser, udsnit, manglende oplysninger og om grafen får forskelle til at se større eller mindre ud.",
 "Penge og budget":"Skriv indtægter og udgifter hver for sig. Tjek derefter hvad der er tilbage.",
 "Tid og planlægning":"Sæt tiderne på en tidslinje og regn forskellen i timer og minutter.",
 "Måling i praksis":"Tegn situationen og skriv målene på. Tjek også, om alle mål har samme enhed.",
 "Problemløsning og modeller":"Skriv først: Hvad ved jeg? Hvad skal jeg finde? Hvilke regnearter eller formler forbinder de to?",
 "Overslag og rimelighed":"Rund tallene til noget, der er let at regne med. Brug overslaget til at vurdere, om dit endelige svar virker sandsynligt.",
 "Forklar din metode":"Tænk i tre led: Hvad gjorde du først? Hvorfor? Hvad gjorde du derefter?",
 "Strategivalg":"Vælg den metode, der bruger tallenes særlige egenskaber og giver færrest unødige trin.",
 "Matematisk argumentation":"Et godt argument fortæller både hvad du mener, og hvorfor det altid eller ikke altid passer.",
 "Modellering":"Find de vigtigste oplysninger i virkeligheden, og oversæt dem til tal, variable, en tegning eller en formel."
};

export function mathHintForSkill(skill:string|null){return skill&&hints[skill]?hints[skill]:"Tegn situationen, skriv det du ved, og tag ét regnetrin ad gangen. Du behøver ikke kunne se hele løsningen med det samme."}
