"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

const items=[
 {href:"/board",label:"Oversigt",exact:true},
 {href:"/board/meetings",label:"Møder & beslutninger",exact:false}
];

export default function BoardSubnav(){
 const pathname=usePathname();
 return <nav aria-label="Bestyrelsen" style={{background:"#f1ede3",borderBottom:"1px solid #ded8cc"}}><div style={{maxWidth:1160,margin:"0 auto",padding:"9px 24px",display:"flex",gap:7,flexWrap:"wrap"}}>{items.map(item=>{const active=item.exact?pathname===item.href:pathname.startsWith(item.href);return <Link key={item.href} href={item.href} style={{padding:"7px 10px",borderRadius:8,textDecoration:"none",fontSize:12,fontWeight:850,border:active?"1px solid #486b59":"1px solid #d7d1c5",background:active?"#486b59":"white",color:active?"white":"#486b59"}}>{item.label}</Link>})}</div></nav>;
}
