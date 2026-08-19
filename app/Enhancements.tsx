"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Enhancements(){
  const pathname=usePathname();
  const[saved,setSaved]=useState(false);

  useEffect(()=>{
    if(pathname!=="/")return;
    const enhance=()=>{
      const writing=document.querySelector(".writing section");
      if(writing&&!document.getElementById("manual-save-wrap")){
        const oldStatus=writing.querySelector(".saved");
        const wrap=document.createElement("div");
        wrap.id="manual-save-wrap";
        wrap.style.cssText="display:flex;align-items:center;gap:12px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap";
        const status=document.createElement("span");
        status.id="manual-save-status";
        status.textContent="Autosave er aktiv";
        status.style.cssText="font-size:14px;color:#657068;font-weight:700";
        const button=document.createElement("button");
        button.type="button";
        button.textContent="Gem opgave";
        button.style.cssText="border:0;border-radius:9px;background:#435c4a;color:white;padding:11px 18px;font-weight:800;cursor:pointer;font-size:14px";
        button.onclick=()=>{
          if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
          status.textContent="Gemt ✓";
          button.textContent="Gemt ✓";
          button.style.opacity=".82";
          setSaved(true);
          window.setTimeout(()=>{button.textContent="Gem opgave";button.style.opacity="1";status.textContent="Autosave er aktiv";setSaved(false)},1800);
        };
        if(oldStatus)oldStatus.remove();
        wrap.append(status,button);
        writing.appendChild(wrap);
      }

      const teacherContent=document.querySelector("main.shell section.content");
      const teacherHeader=teacherContent?.querySelector("header");
      if(teacherHeader&&!document.getElementById("teacher-overview-link")){
        const link=document.createElement("a");
        link.id="teacher-overview-link";
        link.href="/teacher-overview";
        link.textContent="Opgaver & besvarelser →";
        link.style.cssText="display:inline-flex;align-items:center;margin-left:auto;margin-right:12px;padding:10px 13px;border:1px solid #d8d5cd;border-radius:9px;background:#fff;color:#27352d;text-decoration:none;font-weight:800;font-size:14px";
        const avatar=teacherHeader.querySelector(".avatar");
        if(avatar)teacherHeader.insertBefore(link,avatar);else teacherHeader.appendChild(link);
      }
    };
    enhance();
    const observer=new MutationObserver(enhance);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[pathname,saved]);

  return null;
}
