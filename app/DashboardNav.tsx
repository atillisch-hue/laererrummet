"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function DashboardNav(){
  const pathname=usePathname();
  useEffect(()=>{
    if(pathname!=="/")return;
    const enhance=()=>{
      const content=document.querySelector("main.shell section.content") as HTMLElement|null;
      if(!content)return;

      const grid=content.querySelector(".grid") as HTMLElement|null;
      if(grid){
        const cards=Array.from(grid.children) as HTMLElement[];
        const assignmentCreator=cards.find(card=>card.textContent?.includes("Opret opgave"));
        if(assignmentCreator)assignmentCreator.style.display="none";
        grid.style.gridTemplateColumns="1fr";
      }

      const header=content.querySelector("header");
      if(header&&!document.getElementById("teacher-dashboard-actions")){
        const actions=document.createElement("div");
        actions.id="teacher-dashboard-actions";
        actions.style.cssText="display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-left:auto";
        const makeLink=(href:string,text:string,primary=false)=>{const a=document.createElement("a");a.href=href;a.textContent=text;a.style.cssText=`display:inline-flex;align-items:center;padding:10px 13px;border-radius:9px;text-decoration:none;font-weight:800;font-size:14px;white-space:nowrap;${primary?"background:#26352f;color:white;border:1px solid #26352f":"background:white;color:#27352d;border:1px solid #d8d5cd"}`;return a};
        actions.append(makeLink("/create-assignment","+ Opret opgave",true),makeLink("/teacher-overview","Opgaver & besvarelser"),makeLink("/grammar","Grammatik"));
        const old=document.getElementById("teacher-overview-link");if(old)old.remove();
        const avatar=header.querySelector(".avatar");if(avatar)header.insertBefore(actions,avatar);else header.appendChild(actions);
      }
    };
    enhance();const observer=new MutationObserver(enhance);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect();
  },[pathname]);
  return null;
}
