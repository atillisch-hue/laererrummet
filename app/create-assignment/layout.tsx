"use client";

import {useEffect,useState,type ReactNode} from "react";
import {useSearchParams} from "next/navigation";
import {supabase} from "../../lib/supabase";
import WorkResumeTracker from "../WorkResumeTracker";

type AssignmentMeta={id:number;title:string;class_subject_id:number|null;class_id:number};
type RoomMeta={id:number;school_id:number};
type ClassMeta={id:number;school_id:number};

export default function AssignmentWorkLayout({children}:{children:ReactNode}){
 const search=useSearchParams(),editId=Number(search.get("edit")||0);
 const[meta,setMeta]=useState<{assignment:AssignmentMeta;schoolId:number}|null>(null);
 useEffect(()=>{let active=true;(async()=>{
  if(!editId)return;
  const{data:a}=await supabase.from("assignments").select("id,title,class_subject_id,class_id").eq("id",editId).maybeSingle();if(!active||!a)return;
  const assignment=a as AssignmentMeta;let schoolId:number|null=null;
  if(assignment.class_subject_id){const{data:r}=await supabase.from("class_subjects").select("id,school_id").eq("id",assignment.class_subject_id).maybeSingle();schoolId=typeof (r as RoomMeta|null)?.school_id==="number"?(r as RoomMeta).school_id:null}
  if(!schoolId){const{data:c}=await supabase.from("classes").select("id,school_id").eq("id",assignment.class_id).maybeSingle();schoolId=typeof (c as ClassMeta|null)?.school_id==="number"?(c as ClassMeta).school_id:null}
  if(active&&schoolId)setMeta({assignment,schoolId});
 })();return()=>{active=false}},[editId]);
 return <>{meta&&<WorkResumeTracker schoolId={meta.schoolId} objectType="assignment" objectKey={meta.assignment.id} title={meta.assignment.title} subtitle="Opgave · redigering" href={`/create-assignment?edit=${meta.assignment.id}`}/>} {children}</>;
}
