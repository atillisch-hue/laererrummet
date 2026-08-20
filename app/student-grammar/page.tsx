"use client";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";
import {extraLibrary,type GrammarQuestion as Q} from "./grammar-library";

const coreLibrary:Record<string,Record<string,Q[]>>={
 "Udsagnsord":{
  basis:[
   {q:"Hvilket ord er udsagnsord? ‘Maja løber hjem.’",options:["Maja","løber","hjem","ingen"],answer:"løber",why:"‘Løber’ fortæller, hvad Maja gør."},
   {q:"Hvilket ord kan du sætte ‘at’ foran?",options:["glad","cykle","cykel","hurtig"],answer:"cykle",why:"Man kan sige ‘at cykle’."},
   {q:"Hvilket udsagnsord står i datid?",options:["spiser","spiste","spise","spis"],answer:"spiste",why:"‘Spiste’ fortæller, at handlingen allerede er sket."},
   {q:"Find udsagnsordet: ‘Børnene griner højt.’",options:["Børnene","griner","højt","Børnene griner"],answer:"griner",why:"‘Griner’ fortæller, hvad børnene gør."},
   {q:"Hvilket ord er IKKE et udsagnsord?",options:["løbe","tænker","stol","sov"],answer:"stol",why:"‘Stol’ er et navneord."}
  ],
  traening:[
   {q:"Hvilket ord er udsagnsord i ‘Maja løber hurtigt hjem.’?",options:["Maja","løber","hurtigt","hjem"],answer:"løber",why:"‘Løber’ fortæller, hvad Maja gør."},
   {q:"Hvilket ord er udsagnsord i ‘Børnene byggede en hule.’?",options:["Børnene","byggede","en","hule"],answer:"byggede",why:"‘Byggede’ beskriver handlingen og står i datid."},
   {q:"Hvilken sætning indeholder et udsagnsord i nutid?",options:["Hun sang højt.","Hun synger højt.","Hun har sunget højt.","Hun ville synge højt."],answer:"Hun synger højt.",why:"‘Synger’ står i nutid."},
   {q:"Hvad sker der, når ‘gik’ ændres til ‘listede’?",options:["Intet","Bevægelsen bliver mere præcis og skaber en stemning.","Det bliver et spørgsmål.","Ordet bliver et navneord."],answer:"Bevægelsen bliver mere præcis og skaber en stemning.",why:"‘Listede’ viser mere præcist, hvordan personen bevæger sig."},
   {q:"Vælg det mest præcise udsagnsord: ‘Hunden ___ hen mod døren.’",options:["var","bevægede sig","styrtede","gjorde"],answer:"styrtede",why:"‘Styrtede’ giver et tydeligt billede af hurtig bevægelse."}
  ],
  udfordring:[
   {q:"Hvilket udsagnsord skaber mest uro: ‘Hun ___ gennem gangen’?",options:["gik","var","stormede","befandt sig"],answer:"stormede",why:"‘Stormede’ rummer fart og kraft."},
   {q:"Hvorfor kan præcise udsagnsord gøre en tekst stærkere?",options:["De gør altid teksten længere.","De kan vise handling og stemning uden ekstra forklaringer.","De fjerner alle navneord.","De gør teksten mere formel."],answer:"De kan vise handling og stemning uden ekstra forklaringer.",why:"Et præcist verbum kan bære meget betydning."},
   {q:"‘Han sagde vredt’ kan omskrives mest præcist til…",options:["Han var og sagde.","Han hvæsede.","Han talte noget.","Han gjorde en lyd."],answer:"Han hvæsede.",why:"‘Hvæsede’ samler talehandlingen og måden, den udføres på."},
   {q:"Hvilken ændring påvirker fortællingens tempo mest?",options:["gik → sprintede","hus → bygning","hun → personen","rød → mørkerød"],answer:"gik → sprintede",why:"Udsagnsordet ændrer oplevelsen af bevægelsens hastighed."},
   {q:"Form → funktion → effekt ved ‘sneg’?",options:["Navneord → ting → farve","Udsagnsord → beskriver bevægelse → kan skabe spænding eller forsigtighed","Tillægsord → beskriver person → humor","Ingen sammenhæng"],answer:"Udsagnsord → beskriver bevægelse → kan skabe spænding eller forsigtighed",why:"Her kobles grammatisk form til funktion og læserens oplevelse."}
  ]
 },
 "Navneord":{
  basis:[
   {q:"Hvilket ord er et navneord?",options:["løber","cykel","hurtigt","glad"],answer:"cykel",why:"‘Cykel’ er navnet på en ting."},
   {q:"Hvilket ord kan du sætte ‘en’ foran?",options:["bog","læse","smuk","meget"],answer:"bog",why:"Man kan sige ‘en bog’."},
   {q:"Find navneordet: ‘Katten sover.’",options:["Katten","sover","begge","ingen"],answer:"Katten",why:"‘Katten’ betegner et dyr."},
   {q:"Hvilket er et egennavn?",options:["by","pige","Odense","skole"],answer:"Odense",why:"Odense er navnet på et bestemt sted."},
   {q:"Hvilket ord er IKKE et navneord?",options:["venskab","bord","danser","sommer"],answer:"danser",why:"‘Danser’ er her et udsagnsord."}
  ],
  traening:[
   {q:"Hvilket navneord er abstrakt?",options:["stol","hund","frihed","blyant"],answer:"frihed",why:"‘Frihed’ er et begreb."},
   {q:"Hvilken sætning har et navneord i flertal?",options:["Pigen løber.","Bøgerne ligger her.","Han sover.","Det regner."],answer:"Bøgerne ligger her.",why:"‘Bøgerne’ står i bestemt flertal."},
   {q:"Hvilket ord er et sammensat navneord?",options:["skolegård","skole","går","hurtigst"],answer:"skolegård",why:"‘Skolegård’ er dannet af skole + gård."},
   {q:"Hvilken ændring gør beskrivelsen mere konkret?",options:["ting → cykel","løb → bevægede sig","glad → meget","hun → de"],answer:"ting → cykel",why:"‘Cykel’ er mere præcist end ‘ting’."},
   {q:"Hvorfor er navneord vigtige i en tekst?",options:["De viser kun tid.","De navngiver det, teksten handler om.","De erstatter alle udsagnsord.","De laver automatisk komma."],answer:"De navngiver det, teksten handler om.",why:"Navneord giver læseren personer, steder, ting og begreber."}
  ],
  udfordring:[
   {q:"Hvilket navneord gør ‘Der stod et ___ på bordet’ mest konkret?",options:["noget","objekt","krus","ting"],answer:"krus",why:"‘Krus’ giver det mest præcise billede."},
   {q:"Hvad kan mange abstrakte navneord gøre ved en tekst?",options:["Gøre den mere sanselig automatisk","Gøre den mere begrebsorienteret og mindre konkret","Fjerne emnet","Gøre alle sætninger korte"],answer:"Gøre den mere begrebsorienteret og mindre konkret",why:"Abstrakte navneord retter opmærksomheden mod ideer."},
   {q:"Hvilken formulering viser mest frem for at forklare?",options:["Han følte frygt.","Frygten var stor.","Hans hænder rystede om dørhåndtaget.","Der var en følelse."],answer:"Hans hænder rystede om dørhåndtaget.",why:"Den konkrete detalje lader læseren udlede følelsen."},
   {q:"Hvilket valg skaber størst præcision?",options:["person → menneske","køretøj → rusten varevogn","ting → genstand","sted → område"],answer:"køretøj → rusten varevogn",why:"Det specifikke navneord skaber et tydeligere billede."},
   {q:"Form → funktion → effekt: ‘ensomhed’?",options:["Navneord → navngiver et abstrakt begreb → kan samle tekstens tema","Udsagnsord → handling → fart","Tillægsord → farve → humor","Biord → tid → rim"],answer:"Navneord → navngiver et abstrakt begreb → kan samle tekstens tema",why:"Et abstrakt navneord kan fungere som et centralt tema."}
  ]
 }
};
const library:Record<string,Record<string,Q[]>>={...coreLibrary,...extraLibrary};

export default function StudentGrammar(){
 const[loading,setLoading]=useState(true),[assignment,setAssignment]=useState<any>(null),[error,setError]=useState(""),[answers,setAnswers]=useState<Record<number,string>>({}),[submitted,setSubmitted]=useState(false),[saving,setSaving]=useState(false),[saveState,setSaveState]=useState("");
 useEffect(()=>{(async()=>{const code=sessionStorage.getItem("klassevaerelset-student-code");const id=new URLSearchParams(window.location.search).get("assignment");if(!code||!id){setError("Åbn opgaven fra din elevside.");setLoading(false);return}const{data,error}=await supabase.rpc("student_grammar_assignments",{p_access_code:code});if(error||!data?.ok){setError("Kunne ikke hente grammatikopgaven.");setLoading(false);return}const found=(data.assignments||[]).find((x:any)=>String(x.id)===id);if(!found){setError("Denne opgave er ikke tildelt din klasse.");setLoading(false);return}setAssignment(found);setLoading(false)})()},[]);
 const questions=useMemo(()=>assignment?library[assignment.topic]?.[assignment.level]||[]:[],[assignment]);
 const score=questions.filter((q,i)=>answers[i]===q.answer).length;
 const submit=async()=>{if(!assignment||Object.keys(answers).length!==questions.length)return;setSubmitted(true);setSaving(true);setSaveState("Gemmer resultat…");const code=sessionStorage.getItem("klassevaerelset-student-code");const{data,error}=await supabase.rpc("save_student_grammar_attempt",{p_access_code:code,p_assignment_id:assignment.id,p_answers:answers,p_score:score,p_max_score:questions.length});setSaveState(error||!data?.ok?"Resultatet kunne ikke gemmes":"Resultatet er gemt ✓");setSaving(false)};
 if(loading)return <main style={{padding:50}}>Åbner grammatikopgaven…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"42px 24px 80px"}}><section style={{maxWidth:900,margin:"0 auto"}}><a href="/?student=1" style={{color:"#526b60",fontWeight:800,textDecoration:"none"}}>← Til mine opgaver</a>{error?<div style={{marginTop:30,background:"white",padding:28,borderRadius:14,border:"1px solid #ddd9d0"}}><h1>Hov</h1><p>{error}</p></div>:<><p style={{marginTop:38,fontSize:11,fontWeight:800,letterSpacing:1.7,color:"#718077"}}>GRAMMATIK · {assignment.area.toUpperCase()}</p><h1 style={{fontFamily:"Georgia,serif",fontSize:42,margin:"8px 0"}}>{assignment.title}</h1><p style={{fontSize:18,color:"#707670",lineHeight:1.55}}>Arbejd dig gennem opgaverne. Når du retter, får du både svar og forklaring — så grammatik handler om mere end rigtigt og forkert.</p>{questions.length===0?<div style={{marginTop:30,background:"white",padding:28,borderRadius:14,border:"1px solid #ddd9d0"}}><h2>{assignment.topic}</h2><p>Opgaver til dette emne er på vej.</p></div>:<><div style={{display:"grid",gap:16,marginTop:28}}>{questions.map((q,i)=><article key={i} style={{background:"white",padding:24,borderRadius:14,border:"1px solid #ddd9d0"}}><div style={{fontSize:11,fontWeight:800,letterSpacing:1.4,color:"#718077"}}>OPGAVE {i+1} AF {questions.length}</div><h2 style={{fontFamily:"Georgia,serif",fontSize:22,lineHeight:1.35,margin:"10px 0 16px"}}>{q.q}</h2><div style={{display:"grid",gap:8}}>{q.options.map(opt=>{const chosen=answers[i]===opt,correct=submitted&&opt===q.answer,wrong=submitted&&chosen&&opt!==q.answer;return <button key={opt} disabled={submitted} onClick={()=>setAnswers(a=>({...a,[i]:opt}))} style={{padding:"12px 14px",textAlign:"left",borderRadius:9,border:`2px solid ${correct?'#5f8068':wrong?'#b86b62':chosen?'#526b60':'#e1ddd5'}`,background:correct?'#edf5ef':wrong?'#fff0ed':chosen?'#edf1ec':'#fff',fontWeight:chosen||correct?800:600,cursor:submitted?'default':'pointer'}}>{opt}</button>})}</div>{submitted&&<div style={{marginTop:14,padding:"12px 14px",borderRadius:9,background:answers[i]===q.answer?'#edf5ef':'#fff7e8',lineHeight:1.5}}><strong>{answers[i]===q.answer?'Rigtigt ✓':'Ikke helt endnu'}</strong><br/>{q.why}</div>}</article>)}</div>{!submitted?<button disabled={Object.keys(answers).length!==questions.length||saving} onClick={submit} style={{marginTop:22,width:"100%",padding:"14px 18px",border:0,borderRadius:10,background:"#365044",color:"white",fontWeight:800,fontSize:16,opacity:Object.keys(answers).length!==questions.length?.45:1,cursor:Object.keys(answers).length!==questions.length?'not-allowed':'pointer'}}>Ret mine svar</button>:<div style={{marginTop:22,padding:24,borderRadius:14,background:"#273f35",color:"white",textAlign:"center"}}><div style={{fontSize:12,fontWeight:800,letterSpacing:1.5,opacity:.75}}>DIT RESULTAT</div><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:38,marginTop:6}}>{score} / {questions.length}</strong><p style={{marginBottom:10,opacity:.9}}>{score===questions.length?'Stærkt. Du har styr på det her.':score>=3?'Godt på vej. Brug forklaringerne til at blive endnu skarpere.':'Læs forklaringerne — de viser dig, hvad du skal kigge efter næste gang.'}</p><small style={{opacity:.75,fontWeight:700}}>{saveState}</small></div>}</>}</>}</section></main>
}
