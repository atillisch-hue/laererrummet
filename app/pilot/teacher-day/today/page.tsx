"use client";

import {useState} from "react";
import NoticeboardDayOverview from "../../../NoticeboardDayOverview";

const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

export default function TeacherDayToday(){
 const[selectedDate,setSelectedDate]=useState(()=>iso(new Date()));
 const moveDay=(amount:number)=>{
  const d=new Date(selectedDate+"T12:00:00");
  d.setDate(d.getDate()+amount);
  setSelectedDate(iso(d));
 };
 const today=()=>setSelectedDate(iso(new Date()));

 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"26px 32px"}}>
   <div style={{maxWidth:900,margin:"0 auto"}}>
    <p style={{fontSize:11,fontWeight:900,letterSpacing:1.4,opacity:.7,margin:"0 0 5px"}}>RELEASE 0.1 · LÆRERENS ARBEJDSDAG</p>
    <h1 style={{fontFamily:"Georgia,serif",fontSize:36,margin:"0 0 6px"}}>I dag</h1>
    <p style={{margin:0,opacity:.8}}>Dagens undervisning og møder — uden resten af platformens støj.</p>
   </div>
  </header>
  <section style={{maxWidth:900,margin:"0 auto",padding:"24px 24px 80px"}}>
   <NoticeboardDayOverview selectedDate={selectedDate} onMoveDay={moveDay} onToday={today}/>
  </section>
 </main>;
}
