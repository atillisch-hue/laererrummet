"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Enhancements(){
  const pathname=usePathname();
  const[saved,setSaved]=useState(false);

  useEffect(()=>{
    if(pathname!=="/")return;
    let feedbackLoading=false;

    const captureStudentCode=()=>{
      const input=document.querySelector('input[placeholder="Skriv din kode"]') as HTMLInputElement|null;
      const form=input?.closest("form");
      if(form&&!form.getAttribute("data-code-capture")){
        form.setAttribute("data-code-capture","1");
        form.addEventListener("submit",()=>{const code=input?.value.trim().toUpperCase();if(code)sessionStorage.setItem("klassevaerelset-student-code",code)});
      }
    };

    const addFeedback=async(writing:Element)=>{
      if(feedbackLoading||document.getElementById("student-teacher-feedback"))return;
      const code=sessionStorage.getItem("klassevaerelset-student-code");if(!code)return;
      feedbackLoading=true;
      const{data,error}=await supabase.rpc("student_feedback",{p_access_code:code});
      feedbackLoading=false;if(error)return;
      const items=Array.isArray(data?.feedback)?data.feedback:[];
      if(!items.length)return;
      const heading=document.querySelector(".studentContent h1")?.textContent?.trim()||"";
      if(!heading)return;
      const buttons=Array.from(document.querySelectorAll(".studentAssignments button"));
      let assignmentId:number|null=null;
      const assignmentButton=buttons.find(b=>b.querySelector("strong")?.textContent?.trim()===heading) as HTMLElement|undefined;
      if(assignmentButton?.dataset.assignmentId)assignmentId=Number(assignmentButton.dataset.assignmentId);
      let item=assignmentId?items.find((x:{assignment_id:number})=>x.assignment_id===assignmentId):null;
      if(!item&&items.length===1)item=items[0];
      if(!item?.text?.trim())return;
      const card=document.createElement("div");card.id="student-teacher-feedback";card.style.cssText="margin-top:22px;padding:20px 22px;border:1px solid #d8c79e;border-radius:13px;background:#fffaf0;color:#27352d";
      const label=document.createElement("div");label.textContent="FEEDBACK FRA DIN LÆRER";label.style.cssText="font-size:10px;font-weight:800;letter-spacing:1.6px;color:#8a7045;margin-bottom:8px";
      const title=document.createElement("strong");title.textContent="Din lærers kommentar";title.style.cssText="display:block;font-family:Georgia,serif;font-size:20px;margin-bottom:8px";
      const text=document.createElement("p");text.textContent=item.text;text.style.cssText="white-space:pre-wrap;line-height:1.6;margin:0;color:#4f554f";
      card.append(label,title,text);writing.appendChild(card);
    };

    const enhance=()=>{
      captureStudentCode();
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
      if(writing)addFeedback(writing);

      const teacherContent=document.querySelector("main.shell section.content");const teacherHeader=teacherContent?.querySelector("header");
      if(teacherHeader&&!document.getElementById("teacher-overview-link")){const link=document.createElement("a");link.id="teacher-overview-link";link.href="/teacher-overview";link.textContent="Opgaver & besvarelser →";link.style.cssText="display:inline-flex;align-items:center;margin-left:auto;margin-right:12px;padding:10px 13px;border:1px solid #d8d5cd;border-radius:9px;background:#fff;color:#27352d;text-decoration:none;font-weight:800;font-size:14px";const avatar=teacherHeader.querySelector(".avatar");if(avatar)teacherHeader.insertBefore(link,avatar);else teacherHeader.appendChild(link)}

      const studentRows=Array.from(document.querySelectorAll("main.shell .students .student")) as HTMLElement[];
      studentRows.forEach(row=>{if(row.querySelector(".delete-student-button"))return;const name=(row.querySelector("b")?.textContent||"").trim();if(!name)return;const del=document.createElement("button");del.type="button";del.className="delete-student-button";del.textContent="Slet";del.title=`Slet ${name}`;del.style.cssText="border:1px solid #d9b9b4;border-radius:7px;background:#fff7f5;color:#9b3b32;padding:7px 9px;font-weight:700;cursor:pointer";del.onclick=async()=>{const ok=window.confirm(`Slet ${name}?\n\nElevens gemte arbejde bliver også slettet permanent. Denne handling kan ikke fortrydes.`);if(!ok)return;del.disabled=true;del.textContent="Sletter…";const className=(document.querySelector("main.shell section.content header h1")?.textContent||"").trim();const{data:cls,error:classError}=await supabase.from("classes").select("id").eq("name",className).limit(1).maybeSingle();if(classError||!cls){alert("Kunne ikke finde elevens klasse. Prøv igen.");del.disabled=false;del.textContent="Slet";return}const{data:matches,error:studentError}=await supabase.from("students").select("id,name").eq("class_id",cls.id).eq("name",name);if(studentError||!matches?.length){alert("Kunne ikke finde eleven i databasen.");del.disabled=false;del.textContent="Slet";return}if(matches.length>1){alert("Der er flere elever med samme navn i klassen. Sletning er stoppet af sikkerhedshensyn.");del.disabled=false;del.textContent="Slet";return}const studentId=matches[0].id;const{error:draftError}=await supabase.from("drafts").delete().eq("student_id",studentId);if(draftError){alert("Kunne ikke slette elevens besvarelser: "+draftError.message);del.disabled=false;del.textContent="Slet";return}const{error:deleteError}=await supabase.from("students").delete().eq("id",studentId);if(deleteError){alert("Kunne ikke slette eleven: "+deleteError.message);del.disabled=false;del.textContent="Slet";return}window.location.reload()};row.appendChild(del)});
    };
    enhance();const observer=new MutationObserver(enhance);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect();
  },[pathname,saved]);
  return null;
}
