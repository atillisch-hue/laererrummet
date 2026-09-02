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
 {id:"personer",eyebrow:"PERSONER",title:"Mennesker og adgang",text:"Konti, roller og de mennesker, der skal kunne arbejde i skolen.",cards:[
  {title:"Brugere & roller",text:"Opret konti, vælg roller, deaktivér adgang og koble forældre til elever.",href:"/admin/users",tag:"ADGANG"},
  {title:"Personale",text:"Navne, initialer, aktive medarbejdere og personaleroller.",href:"/admin/staff",tag:"PERSONALE"},
  {title:"Bestyrelsesbrugere",text:"Administrér bestyrelsens brugere og adgang uden at blande elevfølsomme områder ind.",href:"/admin/board-users",tag:"BESTYRELSE"}
 ]},
 {id:"skolen",eyebrow:"SKOLEN",title:"Skolens struktur",text:"Klasser, elever og hvem der underviser hvor.",cards:[
  {title:"Klasser & elever",text:"Opret og redigér klasser og elever samt administrér elevernes adgangskoder.",href:"/admin/users",tag:"GRUNDSTRUKTUR"},
  {title:"Elevklassetrin",text:"Angiv klassetrin pr. elev — også i blandede klasser. Bruges til trinpasset grammatik og differentiering.",href:"/admin/student-grade-levels",tag:"DIFFERENTIERING"},
  {title:"Lærere & klasser",text:"Tilknyt en eller flere lærere til de klasser, de faktisk arbejder med.",href:"/admin/teacher-classes",tag:"TILKNYTNING"}
 ]},
 {id:"drift",eyebrow:"KALENDER & DRIFT",title:"Det der får skoledagen til at hænge sammen",text:"Skema, fravær, vikarer og de ændringer, der påvirker dagens arbejde.",cards:[
  {title:"Skema",text:"Undervisning, samling, pauser og vagter — hver uge eller i ulige/lige uger.",href:"/admin/schedule",tag:"SKEMA"},
  {title:"Fravær & vikardækning",text:"Elev- og personalefravær, statistik og sikker vikardækning af konkrete lektioner.",href:"/admin/absence",tag:"DRIFT"}
 ]},
 {id:"indstillinger",eyebrow:"INDSTILLINGER & SIKKERHED",title:"Rammer og adgang",text:"De fælles regler for skoleåret og hvem der må se og gøre hvad.",cards:[
  {title:"Skoleopsætning",text:"Skoleår, skoledage, ferieperioder og lukkedage, som kalenderen arbejder ud fra.",href:"/admin/settings",tag:"INDSTILLINGER"},
  {title:"Roller & adgang",text:"Gennemgå brugernes roller og deaktivér adgang, når en person ikke længere skal være aktiv på skolen.",href:"/admin/users",tag:"SIKKERHED"}
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
   <p style={{maxWidth:760,fontSize:17,color:"#5f665f",lineHeight:1.55,margin:"0 0 28px"}}>Her er funktionerne samlet efter det arbejde, du prøver at få gjort — ikke efter hvilke tabeller systemet tilfældigvis bruger.</p>

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
