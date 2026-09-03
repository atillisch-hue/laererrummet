"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../lib/supabase";
import type {ResumeObjectType} from "./WorkResumeTracker";

type Row={user_id:string;school_id:number;object_type:ResumeObjectType;object_key:string;title:string;subtitle:string|null;href:string;updated_at:string};
const labels:Record<ResumeObjectType,string>={subject_unit:"Forløb",lesson:"Lektion",meeting:"Møde",assignment:"Opgave",student:"Elev"};

export default function ResumeWorkCard({compact=false}:{compact?:boolean}){
 const[loading,setLoading]=useState(true),[row,setRow]=useState<Row|null>(null);
 useEffect(()=>{let active=true;(async()=>{const{data:auth}=await supabase.auth.getSession();const user=auth.session?.user;if(!user){if(active)setLoading(false);return}const{data}=await supabase.from("user_resume_work_state").select("user_id,school_id,object_type,object_key,title,subtitle,href,updated_at").eq("user_id",user.id).maybeSingle();if(!active)return;setRow((data||null) as Row|null);setLoading(false)})();return()=>{active=false}},[]);
 const clear=async()=>{if(!row)return;await supabase.from("user_resume_work_state").delete().eq("user_id",row.user_id);setRow(null)};
 if(loading)return compact?null:<section style={card}><small style={eyebrow}>FORTSÆT ARBEJDET</small><div style={{color:"#788078",marginTop:7,fontSize:13}}>Finder din seneste arbejdsposition…</div></section>;
 if(!row)return null;
 const when=new Date(row.updated_at).toLocaleString("da-DK",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
 return <section style={{...card,padding:compact?"13px 14px":18}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"}}><div><small style={eyebrow}>FORTSÆT ARBEJDET · {labels[row.object_type].toUpperCase()}</small><h2 style={{fontFamily:"Georgia,serif",fontSize:compact?18:23,margin:"5px 0 3px"}}>{row.title}</h2>{row.subtitle&&<div style={{fontSize:12,color:"#687068",lineHeight:1.4}}>{row.subtitle}</div>}<small style={{display:"block",marginTop:6,color:"#8a8d87"}}>Sidst åbnet {when}</small></div><button type="button" onClick={clear} title="Fjern genvejen" style={clearButton}>×</button></div>
  <Link href={row.href} style={continueLink}>Fortsæt hvor du slap →</Link>
 </section>;
}

const card:React.CSSProperties={background:"#eef2ed",border:"1px solid #d5dfd7",borderRadius:14,padding:18,color:"#26342e"};
const eyebrow:React.CSSProperties={fontSize:9,fontWeight:900,letterSpacing:1.1,color:"#66786d"};
const continueLink:React.CSSProperties={display:"inline-block",marginTop:10,color:"#365044",fontWeight:900,fontSize:12,textDecoration:"none"};
const clearButton:React.CSSProperties={border:"1px solid #d4d8d3",background:"white",color:"#6c766f",width:27,height:27,borderRadius:999,cursor:"pointer",fontWeight:900,fontSize:16,lineHeight:"20px"};
