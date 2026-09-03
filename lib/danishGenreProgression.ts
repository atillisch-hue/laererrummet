import type {DanishGenre} from "./danishGenreCatalog";

export type DanishWritingSupport={
 band:string;
 coach:string;
 structure:string[];
 checklist:string[];
 focus:string[];
};

function cleanStep(step:string){
 return step
  .replace(/^Præsentér\s+/i,"Fortæl kort om ")
  .replace(/^Udfold\s+/i,"Fortæl mere om ")
  .replace(/^Argumentér\s+/i,"Forklar og begrund ")
  .replace(/^Afrund\s+/i,"Slut af med ")
  .replace(/^Skab\s+/i,"Lav ")
  .replace(/^Inddrag\s+/i,"Brug ")
  .replace(/^Giv\s+/i,"Fortæl ");
}

function lowerSupport(genre:DanishGenre):DanishWritingSupport{
 const steps=genre.structure.slice(0,Math.min(4,genre.structure.length)).map(cleanStep);
 return{
  band:"1.–2. klasse",
  coach:`Du skal skrive en ${genre.name.toLowerCase()}. Tænk først: Hvem skal læse den, og hvad skal læseren forstå, opleve eller få lyst til? Skriv én del ad gangen.`,
  structure:steps.length?steps:["Hvad vil du fortælle?","Skriv begyndelsen","Fortæl det vigtigste","Lav en slutning"],
  checklist:["Kan en anden forstå, hvad teksten handler om?","Har du fået det vigtigste med?","Har teksten en begyndelse og en slutning?","Har du læst teksten igennem én gang?"],
  focus:["Tydeligt indhold","Begyndelse og slutning","Sætninger der giver mening"]
 };
}

function middleSupport(genre:DanishGenre):DanishWritingSupport{
 const steps=genre.structure.slice(0,Math.min(5,genre.structure.length)).map(cleanStep);
 return{
  band:"3.–4. klasse",
  coach:`Skriv med genren ${genre.name} som ramme. Hold øje med rækkefølgen, og tænk på den person, der skal læse teksten.`,
  structure:steps,
  checklist:[...genre.checklist.slice(0,3),"Er teksten delt op, så den er nem at følge?","Har du læst efter for ord, der mangler eller står forkert?"],
  focus:["Genre og rækkefølge","Modtager","Afsnit","Gennemlæsning"]
 };
}

function upperMiddleSupport(genre:DanishGenre):DanishWritingSupport{
 return{
  band:"5.–6. klasse",
  coach:`Brug ${genre.name} bevidst: tænk på formål og modtager, byg teksten op i tydelige afsnit, og brug konkrete eksempler eller detaljer, hvor det styrker teksten.`,
  structure:genre.structure,
  checklist:[...genre.checklist,"Hænger afsnittene tydeligt sammen?","Har du valgt ord og detaljer, der passer til formålet?","Har du bearbejdet teksten efter første udkast?"],
  focus:["Formål og modtager","Sammenhæng mellem afsnit","Konkrete detaljer og eksempler","Bearbejdning"]
 };
}

function lowerSecondarySupport(genre:DanishGenre):DanishWritingSupport{
 return{
  band:"7.–9. klasse",
  coach:`Arbejd bevidst med ${genre.name} som kommunikationssituation: formål, modtager, genretræk, komposition og sproglig virkning skal støtte hinanden. Brug eksempler, belæg eller tekstlige valg, når genren kræver det, og redigér efter et første udkast.`,
  structure:genre.structure,
  checklist:[...genre.checklist,"Er tekstens komposition bevidst og tydelig?","Understøtter sproget den virkning, du ønsker hos modtageren?","Har du skåret gentagelser og upræcise formuleringer væk?","Har du lavet en afsluttende korrektur af sprog, stavning og tegnsætning?"],
  focus:["Kommunikationssituation","Komposition","Belæg og præcision","Sproglig effekt","Redigering og korrektur"]
 };
}

function grade10Support(genre:DanishGenre):DanishWritingSupport{
 const base=lowerSecondarySupport(genre);
 return{
  ...base,
  band:"10. klasse",
  coach:`Skriv ${genre.name} med selvstændige valg. Du skal kunne begrunde komposition, sproglig stil og brug af genretræk ud fra formål og modtager. Bearbejd teksten både på indholds-, struktur- og sprogniveau.`,
  focus:[...base.focus,"Selvstændige genrevalg","Nuancering og bevidst stil"]
 };
}

export function danishWritingSupport(genre:DanishGenre,grade:number|null|undefined):DanishWritingSupport{
 if(grade==null)return{
  band:"Åben progression",
  coach:"Brug genrens formål, modtager og struktur aktivt, mens du skriver.",
  structure:genre.structure,
  checklist:genre.checklist,
  focus:genre.features.slice(0,5)
 };
 if(grade<=2)return lowerSupport(genre);
 if(grade<=4)return middleSupport(genre);
 if(grade<=6)return upperMiddleSupport(genre);
 if(grade<=9)return lowerSecondarySupport(genre);
 return grade10Support(genre);
}
