import {NextResponse} from "next/server";
import {createClient,SupabaseClient} from "@supabase/supabase-js";

type Child={id:number;name:string;class_id:number|null;class_name:string|null;school_id:number};
type Absence={id:number;student_id:number;absence_date:string;status:string;note:string|null;source:string;reported_by:string|null;created_at:string};

function client(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!service)return null;
 return createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
}
async function userFor(req:Request,admin:SupabaseClient){
 const auth=req.headers.get("authorization");
 if(!auth?.startsWith("Bearer "))return null;
 const{data,error}=await admin.auth.getUser(auth.slice(7));
 return error?null:data.user;
}
async function allowedChildren(admin:SupabaseClient,userId:string):Promise<Child[]>{
 const{data:links}=await admin.from("parent_students").select("student_id").eq("parent_id",userId);
 const ids=(links||[]).map((x:any)=>Number(x.student_id)).filter(Number.isFinite);
 if(!ids.length)return[];
 const{data:students}=await admin.from("students").select("id,name,class_id").in("id",ids);
 const classIds=[...new Set((students||[]).map((s:any)=>s.class_id).filter((x:any)=>x!==null).map(Number))];
 if(!classIds.length)return[];
 const[{data:classes},{data:memberships}]=await Promise.all([
  admin.from("classes").select("id,name,school_id").in("id",classIds),
  admin.from("school_memberships").select("school_id").eq("user_id",userId).eq("role","parent").eq("active",true)
 ]);
 const activeSchools=new Set((memberships||[]).map((m:any)=>Number(m.school_id)));
 const classMap=new Map((classes||[]).map((c:any)=>[Number(c.id),c]));
 return (students||[]).flatMap((s:any)=>{
  const c=classMap.get(Number(s.class_id));
  if(!c||!activeSchools.has(Number(c.school_id)))return[];
  return[{id:Number(s.id),name:String(s.name),class_id:s.class_id===null?null:Number(s.class_id),class_name:String(c.name),school_id:Number(c.school_id)}];
 });
}
const today=()=>new Date().toISOString().slice(0,10);
const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s);

export async function GET(req:Request){
 try{
  const admin=client();if(!admin)return NextResponse.json({error:"Serveren mangler Supabase-konfiguration."},{status:500});
  const user=await userFor(req,admin);if(!user)return NextResponse.json({error:"Ikke logget ind."},{status:401});
  const children=await allowedChildren(admin,user.id);if(!children.length)return NextResponse.json({children:[],absence:[]});
  const ids=children.map(c=>c.id);
  const{data,error}=await admin.from("student_absence").select("id,student_id,absence_date,status,note,source,reported_by,created_at").in("student_id",ids).order("absence_date",{ascending:false}).limit(200);
  if(error)return NextResponse.json({error:error.message},{status:400});
  const absence=((data||[]) as Absence[]).map(a=>({...a,can_manage:a.source==="parent"&&a.reported_by===user.id&&a.absence_date>=today()}));
  return NextResponse.json({children,absence});
 }catch{return NextResponse.json({error:"Fravær kunne ikke hentes."},{status:500})}
}

export async function POST(req:Request){
 try{
  const admin=client();if(!admin)return NextResponse.json({error:"Serveren mangler Supabase-konfiguration."},{status:500});
  const user=await userFor(req,admin);if(!user)return NextResponse.json({error:"Ikke logget ind."},{status:401});
  const body=await req.json(),studentId=Number(body.student_id),absenceDate=String(body.absence_date||""),note=String(body.note||"").trim();
  if(!Number.isFinite(studentId)||!validDate(absenceDate)||absenceDate<today())return NextResponse.json({error:"Fravær kan kun meldes for i dag eller en kommende dag."},{status:400});
  const children=await allowedChildren(admin,user.id);if(!children.some(c=>c.id===studentId))return NextResponse.json({error:"Du kan kun melde fravær for dit eget barn på en skole, hvor du har aktiv forældreadgang."},{status:403});
  const{data:existing}=await admin.from("student_absence").select("id").eq("student_id",studentId).eq("absence_date",absenceDate).maybeSingle();
  if(existing)return NextResponse.json({error:"Der er allerede registreret fravær denne dag."},{status:409});
  const{data:created,error}=await admin.from("student_absence").insert({student_id:studentId,absence_date:absenceDate,status:"sick",note:note||null,source:"parent",reported_by:user.id}).select("id,student_id,absence_date,status,note,source,reported_by,created_at").single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({absence:created});
 }catch{return NextResponse.json({error:"Sygemeldingen kunne ikke gemmes."},{status:500})}
}

export async function PATCH(req:Request){
 try{
  const admin=client();if(!admin)return NextResponse.json({error:"Serveren mangler Supabase-konfiguration."},{status:500});
  const user=await userFor(req,admin);if(!user)return NextResponse.json({error:"Ikke logget ind."},{status:401});
  const body=await req.json(),id=Number(body.id),absenceDate=String(body.absence_date||""),note=String(body.note||"").trim();
  if(!Number.isFinite(id)||!validDate(absenceDate)||absenceDate<today())return NextResponse.json({error:"Ugyldig dato."},{status:400});
  const{data:row}=await admin.from("student_absence").select("id,student_id,absence_date,source,reported_by").eq("id",id).maybeSingle();
  if(!row)return NextResponse.json({error:"Fraværet findes ikke."},{status:404});
  const children=await allowedChildren(admin,user.id);
  if(row.source!=="parent"||row.reported_by!==user.id||row.absence_date<today()||!children.some(c=>c.id===Number(row.student_id)))return NextResponse.json({error:"Denne registrering er historik eller tilhører ikke dig."},{status:403});
  const{data:conflict}=await admin.from("student_absence").select("id").eq("student_id",row.student_id).eq("absence_date",absenceDate).neq("id",id).maybeSingle();
  if(conflict)return NextResponse.json({error:"Der er allerede registreret fravær denne dag."},{status:409});
  const{data:updated,error}=await admin.from("student_absence").update({absence_date:absenceDate,note:note||null}).eq("id",id).select("id,student_id,absence_date,status,note,source,reported_by,created_at").single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({absence:updated});
 }catch{return NextResponse.json({error:"Fraværet kunne ikke opdateres."},{status:500})}
}

export async function DELETE(req:Request){
 try{
  const admin=client();if(!admin)return NextResponse.json({error:"Serveren mangler Supabase-konfiguration."},{status:500});
  const user=await userFor(req,admin);if(!user)return NextResponse.json({error:"Ikke logget ind."},{status:401});
  const body=await req.json(),id=Number(body.id);if(!Number.isFinite(id))return NextResponse.json({error:"Ugyldigt fravær."},{status:400});
  const{data:row}=await admin.from("student_absence").select("id,student_id,absence_date,source,reported_by").eq("id",id).maybeSingle();
  if(!row)return NextResponse.json({ok:true});
  const children=await allowedChildren(admin,user.id);
  if(row.source!=="parent"||row.reported_by!==user.id||row.absence_date<today()||!children.some(c=>c.id===Number(row.student_id)))return NextResponse.json({error:"Denne registrering er historik eller tilhører ikke dig."},{status:403});
  const{error}=await admin.from("student_absence").delete().eq("id",id);if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Fraværet kunne ikke annulleres."},{status:500})}
}
