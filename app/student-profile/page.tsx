"use client";

import {useEffect} from "react";

export default function LegacyStudentProfileRedirect(){
 useEffect(()=>{
  const id=Number(new URLSearchParams(window.location.search).get("id"));
  window.location.replace(Number.isFinite(id)&&id>0?`/students/${id}`:"/students");
 },[]);
 return <main style={{padding:50}}>Åbner elevens samlede overblik…</main>;
}
