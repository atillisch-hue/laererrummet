"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {supabase} from "../../lib/supabase";
import {hasRole} from "../../lib/roles";

type Section={label:string;href:string;paths:string[]};

const adminSections:Section[]=[
 {label:"Oversigt",href:"/admin",paths:["/admin"]},
 {label:"Personer & adgang",href:"/admin/people",paths:["/admin/people","/admin/staff","/admin/board-users","/admin/users"]},
 {label:"Klasser & undervisning",href:"/admin/classes",paths:["/admin/classes","/admin/teacher-classes","/admin/student-grade-levels"]},
 {label:"Skoleår & ressourcer",href:"/admin/planning",paths:["/admin/planning"]},
 {label:"Drift",href:"/admin#drift",paths:["/admin/schedule","/admin/absence","/admin/tasks"]},
 {label:"Skolekalender",href:"/admin/settings",paths:["/admin/settings"]}
];
const leaderSections:Section[]=[
 {label:"Ledelsesoverblik",href:"/admin",paths:["/admin"]},
 {label:"Skoleår & ressourcer",href:"/admin/planning",paths:["/admin/planning"]},
 {label:"Skema",href:"/admin/schedule",paths:["/admin/schedule"]},
 {label:"Personaleopgaver",href:"/admin/tasks",paths:["/admin/tasks"]},
 {label:"Skolekalender",href:"/admin/settings",paths:["/admin/settings"]}
];

export default function AdminSectionNav(){
 const pathname=usePathname();
 const[ready,setReady]=useState(false),[admin,setAdmin]=useState(false),[leader,setLeader]=useState(false);
 useEffect(()=>{let live=true;supabase.auth.getSession().then(({data})=>{if(!live)return;const user=data.session?.user;setAdmin(!!user&&hasRole(user,"admin"));setLeader(!!user&&hasRole(user,"leader"));setReady(true)});return()=>{live=false}},[]);
 if(!ready||(!admin&&!leader))return null;
 const sections=admin?adminSections:leaderSections;
 return <nav aria-label={admin?"Administration":"Ledelse"} style={{background:"#f0ede5",borderBottom:"1px solid #d9d5cb",padding:"10px 24px"}}>
  <div style={{maxWidth:1180,margin:"0 auto",display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
   {sections.map(section=>{
    const active=section.paths.some(path=>path==="/admin"?pathname==="/admin":pathname===path||pathname.startsWith(path+"/"));
    return <Link key={section.label} href={section.href} style={{textDecoration:"none",fontSize:12,fontWeight:850,padding:"7px 10px",borderRadius:8,border:`1px solid ${active?"#486b59":"#d8d3c8"}`,background:active?"#486b59":"#faf8f3",color:active?"white":"#506158",whiteSpace:"nowrap"}}>{section.label}</Link>;
   })}
  </div>
 </nav>;
}
