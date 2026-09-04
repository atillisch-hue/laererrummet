import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

const allowed=["teacher","staff","leader","parent","board","admin"];
const personnelGroups=new Set(["teacher","pedagogue","substitute","administration","other"]);
const MIN_ACCOUNT_PASSWORD_LENGTH=12;

function primaryRole(roles:string[]){
 for(const role of ["admin","leader","teacher","staff","board","parent"]){if(roles.includes(role))return role}
 return roles[0]||"staff";
}

function normalizeAbbreviation(value:unknown){return String(value||"").trim().toUpperCase()}
function normalizeRoles(value:unknown):string[]{
 const requested:unknown[]=Array.isArray(value)?value:[];
 return Array.from(new Set<string>(requested.filter((r):r is string=>typeof r==="string"&&allowed.includes(r))));
}

async function getAdmin(req:Request,body:any){
 const authHeader=req.headers.get("authorization");
 if(!authHeader?.startsWith("Bearer "))return{error:"Ikke logget ind.",status:401}as const;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!service)return{error:"Serveren mangler Supabase-konfiguration.",status:500}as const;
 const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
 const{data,error}=await admin.auth.getUser(authHeader.slice(7));
 if(error||!data.user)return{error:"Sessionen kunne ikke bekræftes.",status:401}as const;
 const requestedSchoolId=Number(body.school_id||0);
 let q=admin.from("school_memberships").select("school_id").eq("user_id",data.user.id).eq("role","admin").eq("active",true);
 if(requestedSchoolId)q=q.eq("school_id",requestedSchoolId);
 const{data:memberships,error:membershipError}=await q.limit(1);
 if(membershipError)return{error:"Skoleadgangen kunne ikke bekræftes.",status:500}as const;
 const schoolId=requestedSchoolId||memberships?.[0]?.school_id;
 if(!schoolId||!memberships?.length)return{error:"Kun administratorer på skolen kan ændre brugere.",status:403}as const;
 return{admin,me:data.user,schoolId};
}

async function verifyTarget(admin:any,schoolId:number,userId:string){
 const{data,error}=await admin.from("school_memberships").select("id").eq("school_id",schoolId).eq("user_id",userId).limit(1);
 return!error&&Boolean(data?.length);
}

async function syncActiveCache(admin:any,userId:string){
 const{data}=await admin.from("school_memberships").select("id").eq("user_id",userId).eq("active",true).limit(1);
 await admin.from("user_profiles").update({active:Boolean(data?.length)}).eq("user_id",userId);
}

async function syncRoleCaches(admin:any,userId:string){
 const{data:memberships}=await admin.from("school_memberships").select("role").eq("user_id",userId).eq("active",true);
 const roles=normalizeRoles((memberships||[]).map((m:any)=>m.role));
 const primary=primaryRole(roles);
 await admin.auth.admin.updateUserById(userId,{app_metadata:{roles,role:roles.length?primary:null}});
 await admin.from("user_roles").delete().eq("user_id",userId);
 if(roles.length)await admin.from("user_roles").insert(roles.map(role=>({user_id:userId,role})));
 if(roles.length)await admin.from("user_profiles").update({role:primary}).eq("user_id",userId);
 await syncActiveCache(admin,userId);
}

function adminGuardError(message:string){
 if(message.includes("at least one active administrator"))return"Skolen skal altid have mindst én aktiv administrator.";
 if(message.includes("remove your own admin role"))return"Du kan ikke fjerne din egen admin-rolle.";
 if(message.includes("deactivate your own access"))return"Du kan ikke deaktivere din egen adgang.";
 return"Skoleadgangen kunne ikke ændres sikkert.";
}

export async function PATCH(req:Request){
 try{
  const body=await req.json(),access=await getAdmin(req,body);
  if("error" in access)return NextResponse.json({error:access.error},{status:access.status});
  const id=String(body.id||"");if(!id)return NextResponse.json({error:"Bruger mangler."},{status:400});
  if(!(await verifyTarget(access.admin,access.schoolId,id)))return NextResponse.json({error:"Brugeren tilhører ikke den skole, du administrerer."},{status:403});

  const staffProfile=body.staff_profile&&typeof body.staff_profile==="object"?body.staff_profile:null;
  if(staffProfile){
   const displayName=String(staffProfile.display_name||"").trim();
   const abbreviation=normalizeAbbreviation(staffProfile.abbreviation);
   const personnelGroup=String(staffProfile.personnel_group||"");
   if(!displayName)return NextResponse.json({error:"Medarbejderen skal have et navn."},{status:400});
   if(abbreviation.length<2||abbreviation.length>4||/\s/.test(abbreviation))return NextResponse.json({error:"Forkortelsen skal være 2–4 tegn uden mellemrum."},{status:400});
   if(!personnelGroups.has(personnelGroup))return NextResponse.json({error:"Ugyldig personalegruppe."},{status:400});
   const{data:duplicate,error:duplicateError}=await access.admin.from("staff_directory_profiles").select("user_id").eq("school_id",access.schoolId).ilike("abbreviation",abbreviation).neq("user_id",id).limit(1);
   if(duplicateError)return NextResponse.json({error:"Forkortelsen kunne ikke kontrolleres."},{status:500});
   if(duplicate?.length)return NextResponse.json({error:`Forkortelsen ${abbreviation} bruges allerede på skolen.`},{status:409});
  }

  if(Array.isArray(body.roles)){
   const roles=normalizeRoles(body.roles);
   if(!roles.length)return NextResponse.json({error:"Brugeren skal have mindst én rolle."},{status:400});
   if(roles.length!==new Set(body.roles).size)return NextResponse.json({error:"En eller flere roller er ugyldige."},{status:400});
   const{error:roleError}=await access.admin.rpc("service_replace_school_user_roles",{
    p_actor_user_id:access.me.id,
    p_school_id:access.schoolId,
    p_user_id:id,
    p_roles:roles
   });
   if(roleError)return NextResponse.json({error:adminGuardError(roleError.message)},{status:400});
   await syncRoleCaches(access.admin,id);
  }

  if(staffProfile){
   const displayName=String(staffProfile.display_name).trim();
   const abbreviation=normalizeAbbreviation(staffProfile.abbreviation);
   const personnelGroup=String(staffProfile.personnel_group);
   const{error:profileError}=await access.admin.from("user_profiles").update({display_name:displayName,updated_at:new Date().toISOString()}).eq("user_id",id);
   if(profileError)return NextResponse.json({error:"Navnet kunne ikke gemmes."},{status:500});
   const{error:staffError}=await access.admin.from("staff_directory_profiles").upsert({school_id:access.schoolId,user_id:id,abbreviation,personnel_group:personnelGroup,updated_at:new Date().toISOString()},{onConflict:"school_id,user_id"});
   if(staffError)return NextResponse.json({error:staffError.code==="23505"?`Forkortelsen ${abbreviation} bruges allerede på skolen.`:"Personaleprofilen kunne ikke gemmes."},{status:staffError.code==="23505"?409:500});
  }

  if(body.password!==undefined){
   const password=String(body.password||"");
   if(password.length<MIN_ACCOUNT_PASSWORD_LENGTH)return NextResponse.json({error:`Adgangskoden skal være mindst ${MIN_ACCOUNT_PASSWORD_LENGTH} tegn.`},{status:400});
   const{error}=await access.admin.auth.admin.updateUserById(id,{password});if(error)return NextResponse.json({error:error.message},{status:400});
  }

  if(body.disabled!==undefined){
   const disabled=Boolean(body.disabled);
   const{error:activeError}=await access.admin.rpc("service_set_school_user_active",{
    p_actor_user_id:access.me.id,
    p_school_id:access.schoolId,
    p_user_id:id,
    p_active:!disabled
   });
   if(activeError)return NextResponse.json({error:adminGuardError(activeError.message)},{status:400});
   await syncRoleCaches(access.admin,id);
  }

  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Brugeren kunne ikke ændres."},{status:500})}
}

export async function DELETE(){
 return NextResponse.json({error:"Brugere slettes ikke fra den almindelige administration. Deaktivér skoleadgangen i stedet."},{status:405});
}
