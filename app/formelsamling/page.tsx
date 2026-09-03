"use client";

import {useMemo,useState} from "react";

type Formula={title:string;formula:string;explain:string;example?:string;grades:string;tags:string[]};
type Group={title:string;description:string;items:Formula[]};

const groups:Group[]=[
 {title:"Tal, brøker & procent",description:"Regn med dele, forhold og ændringer.",items:[
  {title:"Procentdel",formula:"procentdel = helhed × procent / 100",explain:"Brug den, når du skal finde fx 25 % af et tal.",example:"25 % af 240 = 240 × 25 / 100 = 60",grades:"5.–9. kl.",tags:["procent","procentdel"]},
  {title:"Procentvis ændring",formula:"ændring i % = forskel / gammel værdi × 100",explain:"Brug den, når du sammenligner en ny værdi med den oprindelige.",example:"Fra 80 til 100: 20 / 80 × 100 = 25 %",grades:"7.–9. kl.",tags:["procent","ændring"]},
  {title:"Brøk af et tal",formula:"a/b af c = c × a / b",explain:"Del først med nævneren og gang derefter med tælleren.",example:"3/4 af 20 = 20 ÷ 4 × 3 = 15",grades:"4.–7. kl.",tags:["brøk","brøker"]},
  {title:"Brøker med samme nævner",formula:"a/c + b/c = (a+b)/c",explain:"Når nævneren er den samme, lægger du tællerne sammen.",grades:"4.–7. kl.",tags:["brøk","plus"]},
  {title:"Forhold",formula:"a:b kan forkortes ved at dividere begge tal med det samme tal",explain:"Et forhold viser, hvordan to mængder hænger sammen.",example:"12:18 = 2:3",grades:"5.–8. kl.",tags:["forhold","proportionalitet"]}
 ]},
 {title:"Geometri & måling",description:"Omkreds, areal, rumfang og vinkler.",items:[
  {title:"Rektangel · omkreds",formula:"O = 2·l + 2·b",explain:"Læg alle fire sider sammen.",example:"l=6 og b=4 → O=20",grades:"3.–7. kl.",tags:["omkreds","rektangel"]},
  {title:"Rektangel · areal",formula:"A = l · b",explain:"Gang længde med bredde.",grades:"4.–9. kl.",tags:["areal","rektangel"]},
  {title:"Trekant · areal",formula:"A = grundlinje · højde / 2",explain:"Højden skal stå vinkelret på grundlinjen.",grades:"5.–9. kl.",tags:["areal","trekant"]},
  {title:"Cirkel · omkreds",formula:"O = 2 · π · r",explain:"r er radius. π er cirka 3,14.",grades:"7.–9. kl.",tags:["cirkel","omkreds","pi"]},
  {title:"Cirkel · areal",formula:"A = π · r²",explain:"Gang radius med sig selv og derefter med π.",grades:"7.–9. kl.",tags:["cirkel","areal","pi"]},
  {title:"Kasse · rumfang",formula:"V = l · b · h",explain:"Gang længde, bredde og højde.",grades:"5.–9. kl.",tags:["rumfang","kasse"]},
  {title:"Cylinder · rumfang",formula:"V = π · r² · h",explain:"Find først grundfladens areal og gang med højden.",grades:"8.–9. kl.",tags:["rumfang","cylinder"]},
  {title:"Pythagoras",formula:"a² + b² = c²",explain:"Gælder i retvinklede trekanter. c er hypotenusen.",grades:"8.–9. kl.",tags:["pythagoras","trekant"]},
  {title:"Vinkelsum i trekant",formula:"A + B + C = 180°",explain:"De tre indvendige vinkler i en trekant giver altid 180°.",grades:"5.–9. kl.",tags:["vinkler","trekant"]}
 ]},
 {title:"Algebra & funktioner",description:"Ligninger, variable og rette linjer.",items:[
  {title:"Ligninger",formula:"Gør det samme på begge sider af =",explain:"Målet er at få den ukendte alene.",example:"x + 7 = 12 → x = 5",grades:"6.–9. kl.",tags:["ligning","algebra"]},
  {title:"Parentesregel",formula:"a(b + c) = ab + ac",explain:"Gang tallet uden for parentesen med hvert led inde i parentesen.",grades:"7.–9. kl.",tags:["parentes","algebra"]},
  {title:"Lineær funktion",formula:"y = a·x + b",explain:"a er hældningen, og b er skæringen med y-aksen.",grades:"8.–9. kl.",tags:["funktion","lineær"]},
  {title:"Hældning",formula:"a = (y₂ - y₁) / (x₂ - x₁)",explain:"Brug to punkter på en ret linje.",grades:"8.–9. kl.",tags:["funktion","hældning"]}
 ]},
 {title:"Statistik & sandsynlighed",description:"Beskriv data og tilfældighed.",items:[
  {title:"Gennemsnit",formula:"gennemsnit = summen af tallene / antal tal",explain:"Læg alle værdier sammen og del med hvor mange der er.",grades:"5.–9. kl.",tags:["gennemsnit","statistik"]},
  {title:"Sandsynlighed",formula:"P = gunstige udfald / mulige udfald",explain:"Brug den, når alle udfald er lige sandsynlige.",example:"3 røde ud af 10 kugler → P(rød)=3/10",grades:"6.–9. kl.",tags:["sandsynlighed"]}
 ]},
 {title:"Hverdag & målestok",description:"Matematik i praktiske situationer.",items:[
  {title:"Fart",formula:"fart = afstand / tid",explain:"Sørg for, at enhederne passer sammen.",grades:"6.–9. kl.",tags:["fart","tid","afstand"]},
  {title:"Afstand",formula:"afstand = fart · tid",explain:"Brug samme tidsenhed som fartens enhed.",grades:"6.–9. kl.",tags:["fart","tid","afstand"]},
  {title:"Målestok",formula:"virkelig længde = længde på tegning × målestoksfaktor",explain:"Ved 1:100 svarer 1 cm på tegningen til 100 cm i virkeligheden.",grades:"5.–9. kl.",tags:["målestok"]}
 ]}
];

export default function FormulaCollection(){
 const[query,setQuery]=useState("");
 const filtered=useMemo(()=>{const q=query.trim().toLocaleLowerCase("da-DK");if(!q)return groups;return groups.map(group=>({...group,items:group.items.filter(item=>[item.title,item.formula,item.explain,item.grades,...item.tags].join(" ").toLocaleLowerCase("da-DK").includes(q))})).filter(group=>group.items.length)},[query]);
 return <main style={shell}><section style={{maxWidth:1050,margin:"auto"}}>
  <p style={eyebrow}>KLASSEVÆRELSET · MATEMATIK</p><h1 style={h1}>Formelsamling</h1><p style={lead}>Brug den som opslagsværk, mens du arbejder. Søg på fx <strong>procent</strong>, <strong>areal</strong>, <strong>ligning</strong> eller <strong>sandsynlighed</strong>. Denne side er lavet til træning og er ikke en officiel prøveformelsamling.</p>
  <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Søg i formler og begreber…" aria-label="Søg i formelsamlingen" style={search}/>
  <div style={{display:"grid",gap:22,marginTop:26}}>{filtered.map(group=><section key={group.title}><h2 style={h2}>{group.title}</h2><p style={muted}>{group.description}</p><div style={grid}>{group.items.map(item=><article key={item.title} style={card}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"start"}}><strong style={{fontFamily:"Georgia,serif",fontSize:20}}>{item.title}</strong><span style={chip}>{item.grades}</span></div><div style={formula}>{item.formula}</div><p style={{lineHeight:1.5,margin:"12px 0 0",color:"#59645e"}}>{item.explain}</p>{item.example&&<div style={example}><strong>Eksempel</strong><br/>{item.example}</div>}</article>)}</div></section>)}</div>
  {!filtered.length&&<div style={card}><strong>Ingen resultater</strong><p style={muted}>Prøv et andet ord — fx areal, procent eller ligning.</p></div>}
 </section></main>;
}

const shell:React.CSSProperties={minHeight:"100vh",background:"#f5f3ee",padding:"34px 24px 80px",color:"#26342e",fontFamily:"Arial,sans-serif"};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077"};
const h1:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:44,margin:"7px 0"};
const h2:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:28,margin:"0 0 4px"};
const lead:React.CSSProperties={fontSize:17,color:"#68716c",lineHeight:1.6,maxWidth:820};
const muted:React.CSSProperties={fontSize:14,color:"#6d746e",lineHeight:1.5};
const search:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"13px 15px",border:"2px solid #d8d5cd",borderRadius:10,fontSize:16,background:"white",marginTop:12};
const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:12,marginTop:12};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:13,padding:18};
const formula:React.CSSProperties={marginTop:14,padding:"12px 13px",borderRadius:9,background:"#edf1ec",fontFamily:"ui-monospace,SFMono-Regular,Consolas,monospace",fontSize:16,fontWeight:800,color:"#365044",overflowWrap:"anywhere"};
const example:React.CSSProperties={marginTop:12,padding:"10px 12px",borderRadius:9,background:"#fff7e8",fontSize:13,lineHeight:1.5};
const chip:React.CSSProperties={padding:"5px 7px",borderRadius:999,background:"#edf1ec",color:"#526b60",fontSize:10,fontWeight:900,whiteSpace:"nowrap"};
