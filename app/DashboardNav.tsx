"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {supabase} from "../lib/supabase";
import {hasRole} from "../lib/roles";

const items=[
 {label:"Opslagstavlen",href:"/noticeboard",roots:["/noticeboard"]},
 {label:"Klasseværelset",href:"/students",roots:["/students","/student-profile","/teacher-dashboard","/teacher-overview","/create-assignment","/grammar"]},
 {label:"Kalender",href:"/calendar",roots:["/calendar"]},
 {label:"Lærerværelset",href:"/teacher-room",roots:["/teacher-room","/archive","/my-tasks"]},
 {label:"Forberedelsen",href:"/preparation",roots:["/preparation"]}
];

const protectedRoots=[...items.flatMap(x=>x.roots),"/admin","/board","/parent"];
function starts(path:string,root:string){return path===root||path.startsWith(root+"/")}

export default function DashboardNav(){
 const pathname=usePathname();
 const[ready,setReady]=useState(false);
 const[teacher,setTeacher]=useState(false);
 const[admin,setAdmin]=useState(false);
 const[parent,setParent]=useState(false);
 const[board,setBoard]=useState(false);
 const[email,setEmail]=useState("");
 const isProtected=protectedRoots.some(root=>starts(pathname,root));

 useEffect(()=>{
  let active=true;
  const sync=async()=>{
   const{data}=await supabase.auth.getSession();
   if(!active)return;
   const user=data.session?.user;
   setTeacher(!!user&&(hasRole(user,"teacher")||hasRole(user,"admin")));
   setAdmin(!!user&&hasRole(user,"admin"));
   setParent(!!user&&hasRole(user,"parent"));
   setBoard(!!user&&hasRole(user,"board"));
   setEmail(user?.email||"");
   setReady(!!user);
  };
  sync();
  const{data:listener}=supabase.auth.onAuthStateChange(()=>sync());
  return()=>{active=false;listener.subscription.unsubscribe()};
 },[]);

 const logout=async()=>{
  await supabase.auth.signOut();
  window.location.replace("/");
 };

 if(!ready||!isProtected)return null;

 const roleLabel=starts(pathname,"/admin")?"Admin":starts(pathname,"/parent")?"Forælder":starts(pathname,"/board")?"Bestyrelse":teacher?"Lærer":"Bruger";

 return <nav aria-label="Primær navigation" style={{position:"sticky",top:0,zIndex:50,background:"rgba(245,242,234,.97)",borderBottom:"1px solid #ddd9d0",backdropFilter:"blur(10px)"}}>
  <div style={{maxWidth:1240,margin:"0 auto",padding:"10px 18px",display:"flex",alignItems:"center",gap:12,overflowX:"auto"}}>
   <Link href={teacher?"/noticeboard":parent?"/parent":board?"/board":"/"} style={{display:"inline-flex",alignItems:"center",gap:8,color:"#26342e",textDecoration:"none",fontWeight:900,whiteSpace:"nowrap",paddingRight:6}}><span aria-hidden="true">✦</span> Klasseværelset</Link>

   {teacher&&<div style={{display:"flex",gap:6,alignItems:"center",minWidth:"max-content"}}>
    {items.map(item=>{
     const active=item.roots.some(root=>starts(pathname,root));
     return <Link key={item.href} href={item.href} aria-current={active?"page":undefined} style={{display:"inline-flex",alignItems:"center",padding:"9px 12px",borderRadius:9,textDecoration:"none",fontWeight:800,fontSize:13,whiteSpace:"nowrap",border:active?"1px solid #486b59":"1px solid transparent",background:active?"#486b59":"transparent",color:active?"white":"#425249"}}>{item.label}</Link>;
    })}
   </div>}

   <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:7,minWidth:"max-content"}}>
    {board&&<Link href="/board" style={roleButton(starts(pathname,"/board"))}>Bestyrelse</Link>}
    {parent&&<Link href="/parent" style={roleButton(starts(pathname,"/parent"))}>Forælder</Link>}
    {admin&&<Link href="/admin" style={roleButton(starts(pathname,"/admin"))}>Administration</Link>}
    <span title={email||roleLabel} style={{display:"inline-flex",alignItems:"center",padding:"7px 9px",borderRadius:999,background:"#e8ece8",color:"#526159",fontSize:11,fontWeight:900,whiteSpace:"nowrap"}}>{roleLabel}</span>
    <button onClick={logout} style={{display:"inline-flex",alignItems:"center",padding:"8px 11px",borderRadius:9,fontWeight:900,fontSize:12,whiteSpace:"nowrap",border:"1px solid #cfcac0",color:"#526159",background:"#fff",cursor:"pointer"}}>Log ud</button>
   </div>
  </div>
 </nav>;
}

function roleButton(active:boolean):React.CSSProperties{return{display:"inline-flex",alignItems:"center",padding:"8px 10px",borderRadius:9,textDecoration:"none",fontWeight:800,fontSize:12,whiteSpace:"nowrap",border:active?"1px solid #486b59":"1px solid #cfcac0",color:active?"white":"#526159",background:active?"#486b59":"#fff"}}
