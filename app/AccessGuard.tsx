"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { hasRole } from "../lib/roles";

const teacherRoots=["/noticeboard","/students","/teacher-dashboard","/teacher-overview","/teacher-room","/create-assignment","/grammar","/preparation"];

function starts(path:string,root:string){return path===root||path.startsWith(root+"/")}
function protectedArea(path:string){
 if(starts(path,"/admin"))return "admin";
 if(starts(path,"/board"))return "board";
 if(starts(path,"/parent"))return "parent";
 if(teacherRoots.some(root=>starts(path,root)))return "teacher";
 return null;
}

export default function AccessGuard({children}:{children:React.ReactNode}){
 const pathname=usePathname();
 const area=protectedArea(pathname);
 const[allowed,setAllowed]=useState(!area);

 useEffect(()=>{
  let active=true;
  if(!area){setAllowed(true);return()=>{active=false}};
  setAllowed(false);
  supabase.auth.getSession().then(({data})=>{
   if(!active)return;
   const user=data.session?.user;
   if(!user){window.location.replace("/");return}
   const ok=area==="admin"?hasRole(user,"admin"):
    area==="board"?(hasRole(user,"board")||hasRole(user,"admin")):
    area==="parent"?hasRole(user,"parent"):
    (hasRole(user,"teacher")||hasRole(user,"admin"));
   if(!ok){
    if(hasRole(user,"teacher")||hasRole(user,"admin"))window.location.replace("/noticeboard");
    else if(hasRole(user,"parent"))window.location.replace("/parent");
    else if(hasRole(user,"board"))window.location.replace("/board");
    else window.location.replace("/");
    return;
   }
   setAllowed(true);
  });
  return()=>{active=false};
 },[area,pathname]);

 if(!allowed)return <main className="login"><div className="loginCard"><h1>Klasseværelset</h1><p>Kontrollerer adgang…</p></div></main>;
 return <>{children}</>;
}
