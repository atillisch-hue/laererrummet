"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";
import {hasRole} from "../../lib/roles";
import RoleNoticeboard from "../RoleNoticeboard";
import MeetingActionInbox from "../MeetingActionInbox";

type AdminCard={title:string;text:string;href:string;tag?:string};
type AdminGroup={id:string;eyebrow:string;title:string;text:string;cards:AdminCard[]};

const groups:AdminGroup[]=[
 {id:"personer",eyebrow:"PERSONER & ADGANG",title:"Hvem er en del af skolen?",text:"Personer findes én gang. Herfra styrer du login, roller, relationer og de administrative profiler omkring dem.",cards:[
  {title:"Personer & adgang",text:"Opret konti, vælg roller, deaktivér adgang, administrér elevadgang og koble forældre til børn.",href:"/admin/users",tag:"ADGANG"},
  {title:"Personaleprofiler",text:"Navne, initialer, personalegruppe, funktioner og status for skolens medarbejdere.",href:"/admin/staff",tag:"PERSONALE"},
  {title:"Bestyrelsesadgang",text:"Fokuseret overblik over de personer, der har adgang til bestyrelsens arbejdsrum.",href:"/admin/board-users",tag:"BESTYRELSE"}
 ]},
 {id:"skolen",eyebrow:"KLASSER & UNDERVISNING",title:"Hvordan er skolen bygget op?",text:"Klasser, elever, klassetrin og de undervisere, der er knyttet til dem.",cards:[
  {title:"Klasser & elever",text:"Opret og redigér klasser og elever samt administrér elevernes sikre adgangskoder.",href:"/admin/users",tag:"GRUNDSTRUKTUR"},
  {title:"Klassetrin & differentiering",text:"Angiv klassetrin pr. elev — også i blandede klasser. Det bruges til trinpasset træning og progression.",href:"/admin/student-grade-levels",tag:"KLASSETRIN"},
  {title:"Undervisere & klasser",text:"Tilknyt en eller flere lærere til de klasser, de faktisk arbejder med.",href:"/admin/teacher-classes",tag:"TILKNYTNING"}
 ]},
 {id:"planlaegning",eyebrow:"SKOLEÅR & RESSOURCER",title:"Hvordan hænger skoleåret sammen?",text:"Planlæg undervisningsbehov, norm, opgaver, skolekalender og skemaversioner som én samlet ressourceplan.",cards:[
  {title:"Skoleårsplanlægning",text:"Se aktivt skoleår, normdækning, undervisningsbehov, øvrige opgaver og skemaversion samlet.",href:"/admin/planning",tag:"LEDELSE"},
  {title:"Skolekalender & lukkedage",text:"Vedligehold undervisningsperiode, ferier, lukkedage, specialuger og fælles arrangementer.",href:"/admin/settings",tag:"ÅRSKALENDER"}
 ]},
 {id:"drift",eyebrow:"DAGLIG DRIFT",title:"Hvad skal fungere i hverdagen?",text:"Skema, fravær, vikardækning, personaleopgaver og arbejdstid — hver med én tydelig indgang.",cards:[
  {title:"Skema",text:"Redigér arbejdskladden, kontrollér konflikter og publicér den version, der skal gælde fra en bestemt dato.",href:"/admin/schedule",tag:"SKEMA"},
  {title:"Fravær & vikardækning",text:"Før elevfravær, håndtér personalefravær, statistik og vikardækning.",href:"/admin/absence",tag:"FRAVÆR"},
  {title:"Personaleopgaver",text:"Tildel opgaver til medarbejdere, sæt deadlines og følg op på status.",href:"/admin/tasks",tag:"OPGAVER"},
  {title:"Arbejdstid & norm",text:"Åbn arbejdstidsvisningen direkte for at se og administrere arbejdstid og norm for medarbejdere.",href:"/calendar?view=work",tag:"ARBEJDSTID"}
 ]}
];

export default function AdminPage(){
 const[ready,setReady]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{const user=data.session?.user;if(!user){window.location.replace("/");return}if(!hasRole(user,"admin")){window.location.replace("/noticeboard");return}setReady(true)})},[]);
 if(!ready)return <main style={{padding:50}}>Henter administrationen…</main>;

 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}>
  <section style={{maxWidth:1180,margin:"0 auto",padding:"42px 24px 90px"}}>
   <p className="eyebrow">ADMINISTRATION</p>
   <h1 style={{fontFamily:"Georgia,serif",fontSize:42,margin:"7px 0 8px"}}>Skolens administration</h1>
   <p style={{maxWidth:760,fontSize:17,color:"#5f665f",lineHeight:1.55,margin:"0 0 28px"}}>Vælg efter det arbejde, du vil udføre: mennesker og adgang, skolens struktur, skoleårsplanlægning eller den daglige drift.</p>

   <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16,alignItems:"start"}}>
    <RoleNoticeboard audience="admin"/>
    <MeetingActionInbox/>
   </section>

   <div style={{display:"grid",gap:26,marginTop:34}}>
    {groups.map(group=><section id={group.id} key={group.id} style={{scrollMarginTop:96,background:"#ebe8df",border:"1px solid #ddd8cd",borderRadius:17,padding:20}}>
     <p style={{fontSize:10,fontWeight:900,letterSpacing:1.5,color:"#68766e",margin:0}}>{group.eyebrow}</p>
     <h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"6px 0 5px"}}>{group.title}</h2>
     <p style={{color:"#687068",margin:"0 0 16px",lineHeight:1.5}}>{group.text}</p>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(225px,1fr))",gap:12}}>
      {group.cards.map(card=><Link key={`${group.id}-${card.title}`} href={card.href} style={{textDecoration:"none",color:"inherit",minWidth:0}}>
       <article style={{height:"100%",boxSizing:"border-box",background:"#fff",border:"1px solid #ddd9d0",borderRadius:13,padding:18}}>
        {card.tag&&<span style={{display:"inline-block",fontSize:9,fontWeight:900,letterSpacing:1.1,color:"#5f7167",background:"#edf1ec",borderRadius:999,padding:"4px 7px"}}>{card.tag}</span>}
        <h3 style={{fontFamily:"Georgia,serif",fontSize:20,margin:"11px 0 6px"}}>{card.title}</h3>
        <p style={{fontSize:14,color:"#687068",lineHeight:1.5,margin:"0 0 13px"}}>{card.text}</p>
        <strong style={{fontSize:13,color:"#486b59"}}>Åbn →</strong>
       </article>
      </Link>)}
     </div>
    </section>)}
   </div>
  </section>
 </main>;
}
