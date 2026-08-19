"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Enhancements(){
  const pathname=usePathname();
  const[saved,setSaved]=useState(false);

  useEffect(()=>{
    if(pathname!=="/")return;
    const enhance=()=>{
      const writing=document.querySelector(".writing section");
      if(writing&&!document.getElementById("manual-save-wrap")){
        const oldStatus=writing.querySelector(".saved");
        const wrap=document.createElement("div");wrap.id="manual-save-wrap";wrap.style.cssText="display:flex;align-items:center;gap:12px;justify-content:space-between;margin-top:18px;flex-wrap:wrap";
        const progress=document.createElement("span");progress.id="student-writing-progress";progress.style.cssText="font-size:14px;color:#657068;font-weight:700";
        const actions=document.createElement("div");actions.style.cssText="display:flex;align-items:center;gap:12px;margin-left:auto";
        const status=document.createElement("span");status.id="manual-save-status";status.textContent="Alt er gemt ✓";status.style.cssText="font-size:14px;color:#55705d;font-weight:700";
        const button=document.createElement("button");button.type="button";button.textContent="Gem opgave";button.style.cssText="border:0;border-radius:9px;background:#435c4a;color:white;padding:11px 18px;font-weight:800;cursor:pointer;font-size:14px";
        const updateProgress=()=>{const fields=Array.from(writing.querySelectorAll("textarea")) as HTMLTextAreaElement[];const filled=fields.filter(f=>f.value.trim()).length;progress.textContent=`${filled} af ${fields.length} felter udfyldt`;};
        button.onclick=()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();status.textContent="Gemt ✓";button.textContent="Gemt ✓";button.style.opacity=".82";setSaved(true);window.setTimeout(()=>{button.textContent="Gem opgave";button.style.opacity="1";status.textContent="Alt er gemt ✓";setSaved(false)},1800)};
        writing.addEventListener("input",()=>{status.textContent="Gemmer…";updateProgress();window.setTimeout(()=>{if(status.textContent==="Gemmer…")status.textContent="Alt er gemt ✓"},700)});
        if(oldStatus)oldStatus.remove();actions.append(status,button);wrap.append(progress,actions);writing.appendChild(wrap);updateProgress();
      }

      const teacherContent=document.querySelector("main.shell section.content");
      const teacherHeader=teacherContent?.querySelector("header");
      if(teacherHeader&&!document.getElementById("teacher-overview-link")){
        const link=document.createElement("a");link.id="teacher-overview-link";link.href="/teacher-overview";link.textContent="Opgaver & besvarelser →";link.style.cssText="display:inline-flex;align-items:center;margin-left:auto;margin-right:12px;padding:10px 13px;border:1px solid #d8d5cd;border-radius:9px;background:#fff;color:#27352d;text-decoration:none;font-weight:800;font-size:14px";
        const avatar=teacherHeader.querySelector(".avatar");if(avatar)teacherHeader.insertBefore(link,avatar);else teacherHeader.appendChild(link);
      }

      const studentRows=Array.from(document.querySelectorAll("main.shell .students .student")) as HTMLElement[];
      studentRows.forEach((row,index)=>{
        if(row.querySelector(".delete-student-button"))return;
        const name=(row.querySelector("b")?.textContent||"").trim();if(!name)return;
        const del=document.createElement("button");del.type="button";del.className="delete-student-button";del.textContent="Slet";del.title=`Slet ${name}`;del.style.cssText="border:1px solid #d9b9b4;border-radius:7px;background:#fff7f5;color:#9b3b32;padding:7px 9px;font-weight:700;cursor:pointer";
        del.onclick=async()=>{
          const ok=window.confirm(`Slet ${name}?\n\nElevens gemte arbejde bliver også slettet permanent. Denne handling kan ikke fortrydes.`);if(!ok)return;
          del.disabled=true;del.textContent="Sletter…";
          const className=(document.querySelector("main.shell section.content header h1")?.textContent||"").trim();
          const{data:cls,error:classError}=await supabase.from("classes").select("id").eq("name",className).limit(1).maybeSingle();
          if(classError||!cls){alert("Kunne ikke finde elevens klasse. Prøv igen.");del.disabled=false;del.textContent="Slet";return}
          const{data:matches,error:studentError}=await supabase.from("students").select("id,name").eq("class_id",cls.id).eq("name",name);
          if(studentError||!matches?.length){alert("Kunne ikke finde eleven i databasen.");del.disabled=false;del.textContent="Slet";return}
          if(matches.length>1){alert("Der er flere elever med samme navn i klassen. Sletning er stoppet af sikkerhedshensyn.");del.disabled=false;del.textContent="Slet";return}
          const studentId=matches[0].id;
          const{error:draftError}=await supabase.from("drafts").delete().eq("student_id",studentId);if(draftError){alert("Kunne ikke slette elevens besvarelser: "+draftError.message);del.disabled=false;del.textContent="Slet";return}
          const{error:deleteError}=await supabase.from("students").delete().eq("id",studentId);if(deleteError){alert("Kunne ikke slette eleven: "+deleteError.message);del.disabled=false;del.textContent="Slet";return}
          window.location.reload();
        };
        row.appendChild(del);
      });
    };
    enhance();const observer=new MutationObserver(enhance);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect();
  },[pathname,saved]);
  return null;
}
