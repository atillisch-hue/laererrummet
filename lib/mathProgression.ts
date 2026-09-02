export const mathLevelMinimumGrade:Record<string,number>={
 talstart:0,
 grund:2,
 mellem:4,
 udskoling:7,
 anvendt:4,
};

export const mathSkillMinimumGrade:Record<string,number>={
 "Tal og mængder":0,
 "Plus og minus":0,
 "Gange og division":2,
 "Regnestrategier":1,
 "Negative tal":4,
 "Regnearternes rækkefølge":5,
 "Potenser og rødder":6,
 "Brøker":3,
 "Decimaltal":4,
 "Procent":5,
 "Forhold":5,
 "Proportionalitet":6,
 "Længde og enheder":1,
 "Omkreds":3,
 "Areal":4,
 "Rumfang":5,
 "Geometriske figurer":1,
 "Vinkler":4,
 "Koordinatsystem":5,
 "Målestoksforhold":5,
 "Mønstre":1,
 "Variable":5,
 "Ligninger":6,
 "Funktioner":7,
 "Formler":5,
 "Tabeller og diagrammer":2,
 "Gennemsnit, median og typetal":5,
 "Statistik":5,
 "Sandsynlighed":4,
 "Kritisk dataforståelse":7,
 "Penge og budget":2,
 "Tid og planlægning":1,
 "Måling i praksis":2,
 "Problemløsning og modeller":3,
 "Overslag og rimelighed":3,
 "Forklar din metode":2,
 "Strategivalg":3,
 "Matematisk argumentation":7,
 "Modellering":6,
};

export function mathSkillMinimum(skill:string){return mathSkillMinimumGrade[skill]??0}
export function mathTrainingAllowed(skill:string|null,levelId:string,gradeLevel:number|null){
 if(gradeLevel===null)return true;
 const effective=Math.max(0,Math.min(10,gradeLevel));
 return (mathLevelMinimumGrade[levelId]??0)<=effective && (skill?mathSkillMinimum(skill):0)<=effective;
}

export function mathGradeBandLabel(grade:number){
 if(grade<=2)return "indskoling · talforståelse";
 if(grade<=4)return "indskoling/mellemtrin · strategier";
 if(grade<=6)return "mellemtrin · sammenhænge";
 return "udskoling · ræsonnement og modellering";
}
