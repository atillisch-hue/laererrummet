"use client";

import {useEffect} from "react";
import {supabase} from "../lib/supabase";

export type ResumeObjectType="subject_unit"|"lesson"|"meeting"|"assignment"|"student";
export type ResumeWorkInput={schoolId:number|null|undefined;objectType:ResumeObjectType;objectKey:string|number|null|undefined;title:string;subtitle?:string|null;href:string};

export async function rememberWork({schoolId,objectType,objectKey,title,subtitle,href}:ResumeWorkInput){
 if(!schoolId||!objectKey||!title.trim()||!href.startsWith("/"))return false;
 const{data}=await supabase.auth.getSession();
 const user=data.session?.user;if(!user)return false;
 const{error}=await supabase.from("user_resume_work_state").upsert({
  user_id:user.id,
  school_id:schoolId,
  object_type:objectType,
  object_key:String(objectKey),
  title:title.trim().slice(0,180),
  subtitle:subtitle?.trim().slice(0,220)||null,
  href,
  updated_at:new Date().toISOString()
 },{onConflict:"user_id"});
 return !error;
}

export default function WorkResumeTracker(props:ResumeWorkInput){
 useEffect(()=>{
  if(!props.schoolId||!props.objectKey||!props.title.trim()||!props.href.startsWith("/"))return;
  const timer=window.setTimeout(()=>{void rememberWork(props)},650);
  return()=>window.clearTimeout(timer);
 },[props.schoolId,props.objectType,props.objectKey,props.title,props.subtitle,props.href]);
 return null;
}
