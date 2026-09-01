"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import {supabase} from "../../../../lib/supabase";
import {hasRole} from "../../../../lib/roles";

type Room={id:number;school_id:number;class_id:number;subject_id:number;title:string|null;intro:string|null;active:boolean};
type Klass={id:number;name:string};
type Subject={id:number;name:string};
type Item={id:number;class_subject_id:number;item_type:"post"|"section"|"link"|"material"|"note";title:string|null;body:string|null;url:string|null;position:number;visible_to_students:boolean;created_at:string};

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:20};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"11px 12px",border:"1px solid #cbc7bd",borderRadius:8,font:"inherit",background:"white"};
const labels:Record<Item["item_type"],string>={post:"Opslag",section:"Sektion",link:"Link",material:"Materiale",note:"Lærernote"};

export default function SubjectRoom(){
 const params=useParams<{roomId:string}>();
 const roomId=Number(params.roomId);
 const[ready,setReady]=useState(false),[room,setRoom]=useState<Room|null>(null),[klass,setKlass]=useState<Klass|null>(null),[subject,setSubject]=useState<Subject|null>(null),[items,setItems]=useState<Item[]>([]),[canEdit,setCanEdit]=useState(false),[title,setTitle]=useState(""),[intro,setIntro]=useState(""),[editingIntro,setEditingIntro]=useState(false),[itemType,setItemType]=useState<Item["item_type"]>("post"),[itemTitle,setItemTitle]=useState(""),[body,setBody]=useState(""),[url,setUrl]=useState(""),[visible,setVisible]=useState(true),[showAdd,setShowAdd]=useState(false),[saving,setSaving]=useState(false),[message,setMessage]=useState("");

 const load=async()=>{
  if(!Number.isFinite(roomId)||roomId<=0){setMessage("Faglokalet er ugyldigt.");setReady(true);return}
  const{data:auth}=await supabase.auth.getSession();const user=auth.session?.user;if(!user){location.replace("/");return}
  const[rRes,iRes,tRes]=await Promise.all([
   supabase.from("class_subjects").select("id,school_id,class_id,subject_id,title,intro,active").eq("id",roomId).maybeSingle(),
   supabase.from("subject_room_items").select("id,class_subject_id,item_type,title,body,url,position,visible_to_students,created_at").eq("class_subject_id",roomId).order("position").order("created_at"),
   supabase.from("class_subject_teachers").select("user_id").eq("class_subject_id",roomId).eq("user_id",user.id).maybeSingle()
  ]);
  if(rRes.error||!rRes.data){setMessage("Du har ikke adgang til faglokalet.");setReady(true);return}
  const r=rRes.data as Room;
  const[cRes,sRes]=await Promise.all([
   supabase.from("classes").select("id,name").eq("id",r.class_id).maybeSingle(),
   supabase.from("subjects").select("id,name").eq("id",r.subject_id).maybeSingle()
  ]);
  setRoom(r);setKlass((cRes.data||null) as Klass|null);setSubject((sRes.data||null) as Subject|null);setItems((iRes.data||[]) as Item[]);setTitle(r.title||((sRes.data as Subject|null)?.name||"Fag"));setIntro(r.intro||"");setCanEdit(!!tRes.data||hasRole(user,"admin"));setReady(true);
 };
 useEffect(()=>{load()},[roomId]);

 const sorted=useMemo(()=>[...items].sort((a,b)=>a.position-b.position||a.created_at.localeCompare(b.created_at)),[items]);

 const saveRoom=async()=>{
  if(!room||!canEdit)return;setSaving(true);setMessage("");
  const{error}=await supabase.from("class_subjects").update({title:title.trim()||subject?.name||"Fag",intro:intro.trim()||null}).eq("id",room.id);
  if(error)setMessage(error.message);else{setEditingIntro(false);setMessage("Faglokalet er gemt ✓");await load()}
  setSaving(false);
 };

 const addItem=async()=>{
  if(!room||!canEdit)return;
  const hasContent=itemTitle.trim()||body.trim()||url.trim();if(!hasContent){setMessage("Skriv en titel, tekst eller et link først.");return}
  setSaving(true);setMessage("");
  const nextPosition=(items.reduce((m,x)=>Math.max(m,x.position),-1)+1);
  const{error}=await supabase.from("subject_room_items").insert({class_subject_id:room.id,item_type:itemType,title:itemTitle.trim()||null,body:body.trim()||null,url:url.trim()||null,position:nextPosition,visible_to_students:visible});
  if(error)setMessage(error.message);else{setItemTitle("");setBody("");setUrl("");setVisible(true);setShowAdd(false);await load()}
  setSaving(false);
 };

 const removeItem=async(id:number)=>{if(!canEdit)return;const{error}=await supabase.from("subject_room_items").delete().eq("id",id);if(error)setMessage(error.message);else await load()};

 if(!ready)return <main style={{padding:50}}>Åbner faglokalet…</main>;
 if(!room)return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:40}}><section style={{...card,maxWidth:700,margin:"auto"}}><h1>Faglokalet kunne ikke åbnes</h1><p>{message}</p><Link href="/teacher-dashboard">← Klasseværelset</Link></section></main>;

 const displayTitle=room.title||subject?.name||"Fag";
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}><div style={{maxWidth:1050,margin:"auto"}}><Link href={`/students/subjects?class=${room.class_id}`} style={{color:"#e7ddd0",fontWeight:800,textDecoration:"none"}}>← {klass?.name||"Faglokaler"}</Link><p style={{fontSize:11,fontWeight:900,letterSpacing:1.5,opacity:.65,margin:"20px 0 5px"}}>{(klass?.name||"KLASSE").toUpperCase()} · {(subject?.name||"FAG").toUpperCase()}</p><h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:"0 0 5px"}}>{displayTitle}</h1><p style={{margin:0,opacity:.78}}>{room.intro||"Et digitalt faglokale, som faglærerne kan indrette efter undervisningen."}</p></div></header>

  <section style={{maxWidth:1050,margin:"auto",padding:"30px 24px 80px"}}>
   {message&&<div style={{padding:"12px 14px",background:message.includes("✓")?"#e7eee9":"#fff3cd",borderRadius:10,marginBottom:14}}>{message}</div>}

   {canEdit&&<section style={{...card,marginBottom:16,background:"#eef2ed"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}><div><small style={{fontWeight:900,color:"#718077"}}>FAGLÆRER</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:21,marginTop:3}}>Indret faglokalet</strong></div><div style={{display:"flex",gap:8}}><button onClick={()=>setEditingIntro(v=>!v)} style={secondary}>{editingIntro?"Luk":"Navn & intro"}</button><button onClick={()=>setShowAdd(v=>!v)} style={primary}>{showAdd?"Luk":"+ Tilføj indhold"}</button></div></div>
    {editingIntro&&<div style={{display:"grid",gap:10,marginTop:15}}><label style={{fontWeight:800}}>Faglokalets navn<input value={title} onChange={e=>setTitle(e.target.value)} style={{...input,marginTop:6}}/></label><label style={{fontWeight:800}}>Kort intro<textarea value={intro} onChange={e=>setIntro(e.target.value)} rows={4} style={{...input,marginTop:6}} placeholder="Fx: Her finder I vores aktuelle danskforløb, materialer og opgaver."/></label><button disabled={saving} onClick={saveRoom} style={{...primary,justifySelf:"start"}}>{saving?"Gemmer…":"Gem faglokale"}</button></div>}
    {showAdd&&<div style={{borderTop:"1px solid #d8dfd8",marginTop:16,paddingTop:16}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}><label style={{fontWeight:800}}>Type<select value={itemType} onChange={e=>setItemType(e.target.value as Item["item_type"])} style={{...input,marginTop:6}}>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label style={{fontWeight:800}}>Titel<input value={itemTitle} onChange={e=>setItemTitle(e.target.value)} style={{...input,marginTop:6}} placeholder="Fx Aktuelt forløb"/></label></div><label style={{fontWeight:800,display:"block",marginTop:10}}>Tekst<textarea value={body} onChange={e=>setBody(e.target.value)} rows={5} style={{...input,marginTop:6}} placeholder="Skriv opslag, beskrivelse eller note…"/></label>{(itemType==="link"||itemType==="material")&&<label style={{fontWeight:800,display:"block",marginTop:10}}>Link / adresse<input value={url} onChange={e=>setUrl(e.target.value)} style={{...input,marginTop:6}} placeholder="https://…"/></label>}<label style={{display:"flex",gap:8,alignItems:"center",marginTop:12,fontWeight:800}}><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/> Skal kunne vises til eleverne</label><button disabled={saving} onClick={addItem} style={{...primary,marginTop:13}}>{saving?"Gemmer…":"Tilføj til faglokalet"}</button></div>}
   </section>}

   <section style={{display:"grid",gap:12}}>
    {sorted.length===0?<div style={card}><small style={{fontWeight:900,color:"#718077"}}>TOMT FAGLOKALE</small><h2 style={{fontFamily:"Georgia,serif",margin:"6px 0"}}>Her er plads endnu</h2><p style={{color:"#707670",marginBottom:0}}>{canEdit?"Tilføj et opslag, et aktuelt forløb, et link eller et materiale ovenfor.":"Faglæreren har ikke lagt indhold ind endnu."}</p></div>:sorted.map(item=>{
     const sectionItem=item.item_type==="section";
     return <article key={item.id} style={{...card,background:sectionItem?"#e9eee9":"white",position:"relative"}}>{canEdit&&<button onClick={()=>removeItem(item.id)} aria-label="Fjern indhold" style={{position:"absolute",right:10,top:9,border:0,background:"transparent",fontSize:18,cursor:"pointer",color:"#687068"}}>×</button>}<div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",paddingRight:24}}><small style={{fontWeight:900,color:"#718077"}}>{labels[item.item_type].toUpperCase()}</small>{!item.visible_to_students&&<small style={{fontWeight:900,color:"#8a6e42",background:"#f7edd7",padding:"3px 6px",borderRadius:999}}>KUN LÆRERE</small>}</div>{item.title&&<h2 style={{fontFamily:"Georgia,serif",fontSize:sectionItem?27:23,margin:"7px 0"}}>{item.title}</h2>}{item.body&&<p style={{whiteSpace:"pre-wrap",lineHeight:1.6,color:"#555f58",margin:"7px 0"}}>{item.body}</p>}{item.url&&<a href={item.url} target="_blank" rel="noreferrer" style={{display:"inline-block",marginTop:8,color:"#486b59",fontWeight:900}}>Åbn link →</a>}</article>
    })}
   </section>

   <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:18}}><Link href={`/teacher-overview?class=${room.class_id}`} style={secondaryLink}>Opgaver & besvarelser →</Link><Link href="/grammar?mode=assign" style={secondaryLink}>Tildel træning →</Link><Link href="/preparation" style={secondaryLink}>Åbn Forberedelsen →</Link></div>
  </section>
 </main>;
}

const primary:React.CSSProperties={border:0,borderRadius:9,padding:"10px 14px",background:"#486b59",color:"white",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={border:"1px solid #c8d2ca",borderRadius:9,padding:"9px 12px",background:"white",color:"#365044",fontWeight:800,cursor:"pointer"};
const secondaryLink:React.CSSProperties={...secondary,textDecoration:"none",display:"inline-flex",alignItems:"center"};
