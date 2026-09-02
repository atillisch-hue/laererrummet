"use client";

import {useEffect,useRef,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

type FileRow={id:string;school_id:number;area:string;object_path:string;display_name:string;mime_type:string|null;size_bytes:number|null;created_at:string;archived:boolean};

const MAX_BYTES=20*1024*1024;
const allowed=new Set([
 "application/pdf",
 "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
 "application/vnd.openxmlformats-officedocument.presentationml.presentation",
 "application/msword","application/vnd.ms-excel","application/vnd.ms-powerpoint",
 "text/plain","text/csv","image/jpeg","image/png","image/webp"
]);
const extensionMime:Record<string,string>={pdf:"application/pdf",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",doc:"application/msword",xls:"application/vnd.ms-excel",ppt:"application/vnd.ms-powerpoint",txt:"text/plain",csv:"text/csv",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp"};
const mimeFor=(file:File)=>file.type||extensionMime[file.name.split(".").pop()?.toLowerCase()||""]||"";
const safeName=(name:string)=>{const cleaned=name.normalize("NFKD").replace(/[^A-Za-z0-9._-]+/g,"_").replace(/^_+|_+$/g,"");return cleaned||"fil"};
const fileSize=(bytes:number|null)=>bytes===null?"Ukendt størrelse":bytes<1024?`${bytes} B`:bytes<1024*1024?`${(bytes/1024).toFixed(1)} KB`:`${(bytes/(1024*1024)).toFixed(1)} MB`;

export default function BoardArchivePage(){
 const[ready,setReady]=useState(false);
 const[schoolId,setSchoolId]=useState<number|null>(null);
 const[files,setFiles]=useState<FileRow[]>([]);
 const[selected,setSelected]=useState<File|null>(null);
 const[busy,setBusy]=useState(false);
 const[message,setMessage]=useState("");
 const[editing,setEditing]=useState<string|null>(null);
 const[editName,setEditName]=useState("");
 const inputRef=useRef<HTMLInputElement|null>(null);

 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();const user=data.session?.user;
  if(!user){location.replace("/");return}
  if(!hasRole(user,"board")){location.replace("/noticeboard");return}
  const{data:membership,error}=await supabase.from("school_memberships").select("school_id").eq("user_id",user.id).eq("role","board").eq("active",true).limit(1).maybeSingle();
  if(error||!membership?.school_id){setMessage("Din bestyrelsesrolle er ikke knyttet til en aktiv skole.");setReady(true);return}
  const sid=Number(membership.school_id);setSchoolId(sid);await load(sid);setReady(true);
 })()},[]);

 async function load(sid=schoolId){
  if(!sid)return;
  const{data,error}=await supabase.from("school_files").select("id,school_id,area,object_path,display_name,mime_type,size_bytes,created_at,archived").eq("school_id",sid).eq("area","board").eq("archived",false).order("created_at",{ascending:false});
  if(error)setMessage("Dokumentarkivet kunne ikke hentes.");else setFiles((data||[]) as FileRow[]);
 }

 async function upload(){
  if(!selected||!schoolId||busy)return;
  const mime=mimeFor(selected);
  if(!mime||!allowed.has(mime)){setMessage("Filtypen er ikke tilladt. Brug PDF, Office-dokument, tekst/CSV eller JPG/PNG/WebP.");return}
  if(selected.size>MAX_BYTES){setMessage("Filen er større end 20 MB.");return}
  setBusy(true);setMessage("");
  const objectPath=`school-${schoolId}/board/${crypto.randomUUID()}/${safeName(selected.name)}`;
  const uploadResult=await supabase.storage.from("school-files").upload(objectPath,selected,{contentType:mime,upsert:false,cacheControl:"3600"});
  if(uploadResult.error){setMessage("Filen kunne ikke uploades: "+uploadResult.error.message);setBusy(false);return}
  const meta=await supabase.from("school_files").insert({school_id:schoolId,area:"board",object_path:objectPath,display_name:selected.name,mime_type:mime,size_bytes:selected.size});
  if(meta.error){await supabase.storage.from("school-files").remove([objectPath]);setMessage("Filen blev ikke registreret korrekt og er derfor fjernet igen.");setBusy(false);return}
  setSelected(null);if(inputRef.current)inputRef.current.value="";setMessage("Filen er lagt i bestyrelsens private arkiv ✓");await load(schoolId);setBusy(false);
 }

 async function openFile(file:FileRow){
  const{data,error}=await supabase.storage.from("school-files").createSignedUrl(file.object_path,60);
  if(error||!data?.signedUrl){setMessage("Filen kunne ikke åbnes.");return}
  window.open(data.signedUrl,"_blank","noopener,noreferrer");
 }
 async function rename(file:FileRow){
  const name=editName.trim();if(!name)return;
  const{error}=await supabase.from("school_files").update({display_name:name}).eq("id",file.id);
  if(error)setMessage("Filnavnet kunne ikke gemmes.");else{setEditing(null);setEditName("");setMessage("Filnavnet er opdateret ✓");await load(file.school_id)}
 }
 async function remove(file:FileRow){
  if(!confirm(`Vil du slette ${file.display_name}?`))return;setBusy(true);setMessage("");
  const storageResult=await supabase.storage.from("school-files").remove([file.object_path]);
  if(storageResult.error){setMessage("Selve filen kunne ikke slettes.");setBusy(false);return}
  const{error}=await supabase.from("school_files").delete().eq("id",file.id);
  if(error)setMessage("Filen er fjernet fra storage, men arkivregistreringen kunne ikke ryddes. Prøv igen.");else{setMessage("Filen er slettet.");await load(file.school_id)}
  setBusy(false);
 }

 if(!ready)return <main style={{padding:50}}>Henter dokumentarkiv…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}><section style={{maxWidth:1050,margin:"0 auto",padding:"42px 24px 70px"}}>
  <p style={eyebrow}>DOKUMENTARKIV</p><h1 style={{fontFamily:"Georgia,serif",fontSize:40,margin:"7px 0 8px"}}>Bestyrelsens filer</h1><p style={{maxWidth:760,color:"#687068",fontSize:17,lineHeight:1.55}}>Filerne ligger i en privat skolebucket. Kun aktive bestyrelsesmedlemmer på samme skole kan se eller administrere dem. Links til filer udløber efter kort tid.</p>
  {message&&<div style={{margin:"18px 0",padding:12,background:message.includes("kunne ikke")||message.includes("ikke tilladt")||message.includes("større")?"#fff0ed":"#e7eee9",borderRadius:9,fontWeight:700}}>{message}</div>}

  {schoolId&&<section style={card}><p style={eyebrow}>UPLOAD</p><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"6px 0 8px"}}>Læg et dokument i arkivet</h2><p style={{color:"#707670",margin:"0 0 14px"}}>PDF, Word, Excel, PowerPoint, tekst/CSV og almindelige billeder. Maks. 20 MB.</p><div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}><input ref={inputRef} type="file" onChange={e=>setSelected(e.target.files?.[0]||null)} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp"/><button onClick={upload} disabled={!selected||busy} style={{...primary,opacity:!selected||busy?.55:1}}>{busy?"Arbejder…":"Upload fil →"}</button></div>{selected&&<small style={{display:"block",marginTop:9,color:"#687068"}}>{selected.name} · {fileSize(selected.size)}</small>}</section>}

  <section style={{...card,marginTop:18}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start"}}><div><p style={eyebrow}>ARKIV</p><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"6px 0 0"}}>Dokumenter</h2></div><span style={countChip}>{files.length}</span></div>{files.length===0?<p style={{color:"#777168",marginBottom:0}}>Der er endnu ingen filer i bestyrelsens arkiv.</p>:<div style={{display:"grid",gap:8,marginTop:16}}>{files.map(file=><article key={file.id} style={{padding:"12px 13px",border:"1px solid #e2ded5",borderRadius:10,background:"#faf9f6"}}>{editing===file.id?<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><input value={editName} onChange={e=>setEditName(e.target.value)} style={input}/><button onClick={()=>rename(file)} style={smallPrimary}>Gem navn</button><button onClick={()=>{setEditing(null);setEditName("")}} style={smallButton}>Annullér</button></div>:<div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"start",flexWrap:"wrap"}}><div style={{flex:"1 1 300px",minWidth:0}}><strong style={{overflowWrap:"anywhere"}}>{file.display_name}</strong><small style={{display:"block",marginTop:4,color:"#727772"}}>{fileSize(file.size_bytes)} · {new Date(file.created_at).toLocaleDateString("da-DK",{day:"numeric",month:"short",year:"numeric"})}</small></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button onClick={()=>openFile(file)} style={smallPrimary}>Åbn</button><button onClick={()=>{setEditing(file.id);setEditName(file.display_name)}} style={smallButton}>Omdøb</button><button onClick={()=>remove(file)} disabled={busy} style={{...smallButton,color:"#8a3c34"}}>Slet</button></div></div>}</article>)}</div>}</section>
 </section></main>;
}

const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.4,color:"#718077",margin:0};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:21};
const primary:React.CSSProperties={border:0,borderRadius:9,padding:"10px 14px",background:"#486b59",color:"white",fontWeight:900,cursor:"pointer"};
const smallButton:React.CSSProperties={border:"1px solid #d2cec5",background:"white",borderRadius:7,padding:"7px 9px",fontWeight:800,cursor:"pointer"};
const smallPrimary:React.CSSProperties={...smallButton,background:"#486b59",borderColor:"#486b59",color:"white"};
const input:React.CSSProperties={minWidth:220,flex:"1 1 320px",padding:9,border:"1px solid #d2cec5",borderRadius:8,background:"white"};
const countChip:React.CSSProperties={minWidth:30,height:30,borderRadius:999,display:"grid",placeItems:"center",background:"#edf1ec",color:"#486b59",fontWeight:900,fontSize:12};
