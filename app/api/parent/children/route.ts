import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

export async function GET(req:Request){
 try{
  const auth=req.headers.get("authorization");if(!auth?.startsWith("Bearer "))return NextResponse.json({error:"Ikke logget ind."},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,service=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!service)return NextResponse.json({error:"Serveren mangler Supabase-konfiguration."},{status:500});
  const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
  const{data:authData,error:authError}=await admin.auth.getUser(auth.slice(7));const user=authData.user;if(authError||!user)return NextResponse.json({error:"Sessionen kunne ikke bekræftes."},{status:401});

  const[{data:links,error:linkError},{data:memberships,error:membershipError}]=await Promise.all([
   admin.from("parent_students").select("student_id").eq("parent_id",user.id),
   admin.from("school_memberships").select("school_id").eq("user_id",user.id).eq("role","parent").eq("active",true)
  ]);
  if(linkError||membershipError)return NextResponse.json({error:(linkError||membershipError)?.message||"Forældreadgang kunne ikke kontrolleres."},{status:400});
  const linkedIds=(links||[]).map((x:any)=>Number(x.student_id)).filter(Number.isFinite),activeSchools=new Set((memberships||[]).map((x:any)=>Number(x.school_id)));
  if(!linkedIds.length||!activeSchools.size)return NextResponse.json({children:[]});

  const{data:students,error:studentError}=await admin.from("students").select("id,name,class_id").in("id",linkedIds).order("name");if(studentError)return NextResponse.json({error:studentError.message},{status:400});
  const classIds=[...new Set((students||[]).map((s:any)=>s.class_id).filter((x:any)=>x!==null).map(Number))];
  if(!classIds.length)return NextResponse.json({children:[]});
  const{data:classes,error:classError}=await admin.from("classes").select("id,name,school_id").in("id",classIds);if(classError)return NextResponse.json({error:classError.message},{status:400});
  const classMap=new Map((classes||[]).map((c:any)=>[Number(c.id),c]));
  const allowedStudents=(students||[]).filter((s:any)=>{const c=classMap.get(Number(s.class_id));return c&&activeSchools.has(Number(c.school_id))});
  const ids=allowedStudents.map((s:any)=>Number(s.id)),allowedClassIds=[...new Set(allowedStudents.map((s:any)=>Number(s.class_id)))];
  if(!ids.length)return NextResponse.json({children:[]});

  let assignments:any[]=[],recipients=new Map<number,number[]>(),scheduleByClass=new Map<number,any[]>(),absenceByStudent=new Map<number,any[]>();
  const[{data:a},{data:schedule},{data:absence}]=await Promise.all([
   admin.from("assignments").select("id,title,type,class_id").in("class_id",allowedClassIds).order("id",{ascending:false}),
   admin.from("schedule_entries").select("id,class_id,weekday,start_time,end_time,subject,teacher,room,entry_kind").in("class_id",allowedClassIds).order("weekday").order("start_time"),
   admin.from("student_absence").select("id,student_id,absence_date,status,note,source,reported_by,created_at").in("student_id",ids).order("absence_date",{ascending:false}).limit(100)
  ]);
  assignments=a||[];
  if(assignments.length){const assignmentIds=assignments.map((x:any)=>Number(x.id));const{data:r}=await admin.from("assignment_students").select("assignment_id,student_id").in("assignment_id",assignmentIds);(r||[]).forEach((x:any)=>{const aid=Number(x.assignment_id),list=recipients.get(aid)||[];list.push(Number(x.student_id));recipients.set(aid,list)})}
  (schedule||[]).forEach((x:any)=>{const k=Number(x.class_id),list=scheduleByClass.get(k)||[];list.push(x);scheduleByClass.set(k,list)});
  (absence||[]).forEach((x:any)=>{const k=Number(x.student_id),list=absenceByStudent.get(k)||[];list.push(x);absenceByStudent.set(k,list)});

  return NextResponse.json({children:allowedStudents.map((s:any)=>{
   const sid=Number(s.id),cid=s.class_id===null?null:Number(s.class_id),c=cid===null?null:classMap.get(cid);
   const visibleAssignments=assignments.filter((a:any)=>{if(Number(a.class_id)!==cid)return false;const chosen=recipients.get(Number(a.id));return !chosen||chosen.length===0||chosen.includes(sid)}).map((a:any)=>({id:Number(a.id),title:String(a.title),type:String(a.type||"Opgave")}));
   return{id:sid,name:String(s.name),class_id:cid,class_name:c?String(c.name):null,assignments:visibleAssignments,schedule:cid===null?[]:scheduleByClass.get(cid)||[],absence:absenceByStudent.get(sid)||[]};
  })});
 }catch{return NextResponse.json({error:"Forældrekoblingen kunne ikke hentes."},{status:500})}
}
