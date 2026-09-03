"use client";

import {useEffect,useState,type ReactNode} from "react";
import {useParams} from "next/navigation";
import {supabase} from "../../../../lib/supabase";
import WorkResumeTracker from "../../../WorkResumeTracker";

type Meta={id:number;school_id:number;title:string;meeting_type:string;starts_at:string};

export default function MeetingWorkLayout({children}:{children:ReactNode}){
 const{id}=useParams<{id:string}>(),meetingId=Number(id);
 const[meeting,setMeeting]=useState<Meta|null>(null);
 useEffect(()=>{let active=true;(async()=>{if(!Number.isFinite(meetingId)||meetingId<=0)return;const{data}=await supabase.from("calendar_meetings").select("id,school_id,title,meeting_type,starts_at").eq("id",meetingId).maybeSingle();if(active)setMeeting((data||null) as Meta|null)})();return()=>{active=false}},[meetingId]);
 const subtitle=meeting?`${meeting.meeting_type} · ${new Date(meeting.starts_at).toLocaleString("da-DK",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}`:null;
 return <><>{meeting&&<WorkResumeTracker schoolId={meeting.school_id} objectType="meeting" objectKey={meeting.id} title={meeting.title} subtitle={subtitle} href={`/calendar/meeting/${meeting.id}`}/>}</>{children}</>;
}
