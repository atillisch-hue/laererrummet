"use client";

import {useEffect,useState,type ReactNode} from "react";
import {useParams,useSearchParams} from "next/navigation";
import {supabase} from "../../../../lib/supabase";
import WorkResumeTracker from "../../../WorkResumeTracker";

type LessonMeta={schoolId:number;title:string;subtitle:string;key:string;href:string};

export default function LessonWorkLayout({children}:{children:ReactNode}){
 const{scheduleId}=useParams<{scheduleId:string}>(),search=useSearchParams(),entryId=Number(scheduleId),date=search.get("date")||new Date().toISOString().slice(0,10);
 const[meta,setMeta]=useState<LessonMeta|null>(null);
 useEffect(()=>{let active=true;(async()=>{
  if(!Number.isFinite(entryId)||entryId<=0)return;
  const{data:e}=await supabase.from("schedule_entries").select("id,class_id,subject,start_time,end_time").eq("id",entryId).maybeSingle();if(!active||!e)return;
  const[{data:c},{data:l}]=await Promise.all([
   supabase.from("classes").select("name,school_id").eq("id",e.class_id).maybeSingle(),
   supabase.from("lesson_instances").select("subject_unit_id").eq("schedule_entry_id",entryId).eq("lesson_date",date).maybeSingle()
  ]);if(!active||!c||typeof c.school_id!=="number")return;
  let unitTitle="";
  if(l?.subject_unit_id){const{data:u}=await supabase.from("subject_units").select("title").eq("id",l.subject_unit_id).maybeSingle();unitTitle=String(u?.title||"")}
  if(!active)return;
  const time=`${String(e.start_time).slice(0,5)}–${String(e.end_time).slice(0,5)}`,href=`/calendar/lesson/${entryId}?date=${date}`;
  setMeta({schoolId:c.school_id,title:`${e.subject} · ${c.name||"Klasse"}`,subtitle:unitTitle?`${unitTitle} · ${time}`:time,key:`${entryId}:${date}`,href});
 })();return()=>{active=false}},[entryId,date]);
 return <>{meta&&<WorkResumeTracker schoolId={meta.schoolId} objectType="lesson" objectKey={meta.key} title={meta.title} subtitle={meta.subtitle} href={meta.href}/>} {children}</>;
}
