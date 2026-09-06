"use client";

import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {supabase} from "../lib/supabase";
import {hasRole} from "../lib/roles";

type Area="teaching"|"staff"|"leadership"|"admin"|"board"|"parent"|null;

const teachingRoots=[
 "/noticeboard",
 "/students",
 "/student-profile",
 "/teacher-dashboard",
 "/teacher-overview",
 "/create-assignment",
 "/grammar",
 "/preparation",
 "/math",
 "/danish",
 "/formelsamling"
];

const staffRoots=[
 "/teacher-room",
 "/calendar",
 "/archive",
 "/my-tasks",
 "/substitute"
];

const leadershipRoots=[
 "/admin/planning",
 "/admin/schedule",
 "/admin/settings",
 "/admin/tasks"
];

function starts(path:string,root:string){return path===root||path.startsWith(root+"/")}
function protectedArea(path:string):Area{
 if(path==="/admin")return "leadership";
 if(leadershipRoots.some(root=>starts(path,root)))return "leadership";
 if(starts(path,"/admin"))return "admin";
 if(starts(path,"/board"))return "board";
 if(starts(path,"/parent"))return "parent";
 if(teachingRoots.some(root=>starts(path,root)))return "teaching";
 if(staffRoots.some(root=>starts(path,root)))return "staff";
 return null;
}

function landingFor(user:NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>["user"]){
 if(hasRole(user,"teacher"))return "/noticeboard";
 if(hasRole(user,"leader"))return "/admin";
 if(hasRole(user,"staff"))return "/teacher-room";
 if(hasRole(user,"admin"))return "/admin";
 if(hasRole(user,"parent"))return "/parent";
 if(hasRole(user,"board"))return "/board";
 return "/";
}

function mfaSetupUrl(pathname:string){return `/account/security?required=1&next=${encodeURIComponent(pathname)}`}
function mfaChallengeUrl(pathname:string){return `/mfa?next=${encodeURIComponent(pathname)}`}

export default function AccessGuard({children}:{children:React.ReactNode}){
 const pathname=usePathname();
 const area=protectedArea(pathname);
 const[allowed,setAllowed]=useState(!area);

 useEffect(()=>{
  let active=true;
  if(!area){setAllowed(true);return()=>{active=false}};
  setAllowed(false);
  (async()=>{
   const{data}=await supabase.auth.getSession();
   if(!active)return;
   const user=data.session?.user;
   if(!user){window.location.replace("/");return}
   const teacher=hasRole(user,"teacher"),staff=hasRole(user,"staff"),leader=hasRole(user,"leader"),admin=hasRole(user,"admin"),parent=hasRole(user,"parent"),board=hasRole(user,"board");
   const ok=area==="teaching"?teacher:
    area==="staff"?(teacher||staff||leader||admin):
    area==="leadership"?(leader||admin):
    area==="admin"?admin:
    area==="parent"?parent:
    area==="board"?board:false;
   if(!ok){window.location.replace(landingFor(user));return}

   if(area==="leadership"||area==="admin"){
    const{data:aal,error}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if(!active)return;
    if(error){window.location.replace(mfaSetupUrl(pathname));return}
    if(aal.currentLevel!=="aal2"){
     window.location.replace(aal.nextLevel==="aal2"?mfaChallengeUrl(pathname):mfaSetupUrl(pathname));
     return;
    }
   }
   setAllowed(true);
  })();
  return()=>{active=false};
 },[area,pathname]);

 if(!allowed)return <main className="login"><div className="loginCard"><h1>Klasseværelset</h1><p>Kontrollerer adgang…</p></div></main>;
 return <>{children}</>;
}
