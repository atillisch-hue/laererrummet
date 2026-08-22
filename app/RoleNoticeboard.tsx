"use client";
import {useEffect,useState} from "react";
import {supabase} from "../lib/supabase";

type Audience="teacher"|"parent"|"board"|"admin"|"student";
type Note={id:string;text:string;author_email:string;author_id:string;created_at:string;audiences:Audience[]|null};
const colors=["#fff2a8","#f8d7c4","#dcefcf","#dce8f7","#f1d9ee"];

export default function RoleNoticeboard({audience,title="Opslagstavlen"}:{audience:Audience;title?:string}){
 const[notes,setNotes]=useState<Note[]>([]),[userId,setUserId]=useState("");
 const load=async()=>{const{data}=await supabase.from("noticeboard_posts").select("id,text,author_email,author_id,created_at,audiences").contains("audiences",[audience]).order("created_at",{ascending:false});setNotes((data||[]) as Note[])};
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setUserId(data.session?.user.id||""));load()},[audience]);
 const remove=async(id:string)=>{await supabase.from("noticeboard_posts").delete().eq("id",id).eq("author_id",userId);await load()};
 return <section style={{marginTop:30}}><h2 style={{fontFamily:"Georgia,serif",fontSize:30,margin:"0 0 14px"}}>{title}</h2><div style={{background:"#b98552",backgroundImage:"radial-gradient(rgba(84,50,25,.15) 1px, transparent 1px)",backgroundSize:"7px 7px",border:"10px solid #8b5e34",borderRadius:12,padding:24,minHeight:230}}>{notes.length===0?<div style={{padding:16,background:"#fff2a8",width:190,minHeight:190,boxSizing:"border-box"}}>Der er ingen opslag til dig lige nu.</div>:<div style={{display:"flex",flexWrap:"wrap",gap:22,alignItems:"flex-start"}}>{notes.map((n,i)=><article key={n.id} style={{background:colors[i%colors.length],padding:"18px 16px 14px",width:190,minHeight:190,boxSizing:"border-box",position:"relative",boxShadow:"2px 5px 10px rgba(50,35,20,.24)",transform:`rotate(${[-1.4,.8,-.5,1.2][i%4]}deg)`,display:"flex",flexDirection:"column"}}>{n.author_id===userId&&<button aria-label="Fjern opslag" onClick={()=>remove(n.id)} style={{position:"absolute",right:7,top:5,border:0,background:"transparent",fontSize:17,cursor:"pointer"}}>×</button>}<p style={{margin:"0 18px 12px 0",fontSize:15,lineHeight:1.4,whiteSpace:"pre-wrap",flex:1}}>{n.text}</p><small style={{borderTop:"1px solid rgba(50,50,40,.16)",paddingTop:7,color:"#62645d",fontSize:11}}>{n.author_email?.split("@")[0]} · {new Date(n.created_at).toLocaleString("da-DK")}</small></article>)}</div>}</div></section>
}
