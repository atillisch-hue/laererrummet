"use client";

import {useEffect} from "react";
import {supabase} from "../lib/supabase";

export type ResumeObjectType="subject_unit"|"lesson"|"meeting"|"assignment"|"student";

type Props={
 schoolId:number|null|undefined;
 objectType:ResumeObjectType;
 objectKey:string|number|null|undefined;
 title:string;
 subtitle?:string|null;
 href:string;
};

export default function WorkResumeTracker({schoolId,objectType,objectKey,title,subtitle,href}:Props){
 useEffect(()=>{
  if(!schoolId||!objectKey||!title.trim()||!href.startsWith("/"))return;
  const timer=window.setTimeout(async()=>{
   const{data}=await supabase.auth.getSession();
   const user=data.session?.user;if(!user)return;
   await supabase.from("user_resume_work_state").upsert({
    user_id:user.id,
    school_id:schoolId,
    object_type:objectType,
    object_key:String(objectKey),
    title:title.trim().slice(0,180),
    subtitle:subtitle?.trim().slice(0,220)||null,
    href,
    updated_at:new Date().toISOString()
   },{onConflict:"user_id"});
  },650);
  return()=>window.clearTimeout(timer);
 },[schoolId,objectType,objectKey,title,subtitle,href]);
 return null;
}
