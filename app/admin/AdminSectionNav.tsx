"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

const sections=[
 {label:"Oversigt",href:"/admin",paths:["/admin"]},
 {label:"Personer",href:"/admin#personer",paths:["/admin/users","/admin/staff","/admin/board-users"]},
 {label:"Skolen",href:"/admin#skolen",paths:["/admin/teacher-classes"]},
 {label:"Skoleår & ressourcer",href:"/admin/planning",paths:["/admin/planning"]},
 {label:"Kalender & drift",href:"/admin#drift",paths:["/admin/schedule","/admin/absence"]},
 {label:"Indstillinger & sikkerhed",href:"/admin#indstillinger",paths:["/admin/settings"]}
];

export default function AdminSectionNav(){
 const pathname=usePathname();
 return <nav aria-label="Administration" style={{background:"#f0ede5",borderBottom:"1px solid #d9d5cb",padding:"10px 24px"}}>
  <div style={{maxWidth:1180,margin:"0 auto",display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
   {sections.map(section=>{
    const active=section.paths.some(path=>path==="/admin"?pathname==="/admin":pathname.startsWith(path));
    return <Link key={section.label} href={section.href} style={{textDecoration:"none",fontSize:12,fontWeight:850,padding:"7px 10px",borderRadius:8,border:`1px solid ${active?"#486b59":"#d8d3c8"}`,background:active?"#486b59":"#faf8f3",color:active?"white":"#506158",whiteSpace:"nowrap"}}>{section.label}</Link>;
   })}
  </div>
 </nav>;
}
