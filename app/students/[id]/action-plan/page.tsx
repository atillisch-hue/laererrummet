"use client";

import Link from "next/link";
import {use,useEffect,useState} from "react";
import {supabase} from "../../../../lib/supabase";

type Student={id:number;name:string};
type Plan={id:number;title:string;status:string};
type Action={id:number;title:string;description:string|null;category:string;responsible_user_id:string|null;due_date:string|null;status:string};
type User={user_id:string;display_name:string;role:string};
type Followup={id:number;action_id:number;note:string;created_at:string};

const cats=[['academic','Fagligt'],['social','Socialt'],['wellbeing','Trivsel'],['attendance','Fravær'],['support','Støtte'],['home_school','Skole-hjem'],['other','Andet']];
const cat=(x:string)=>cats.find(c=>c[0]===x)?.[1]||x;
const smallButton:React.CSSProperties={padding:'7px 9px',border:'1px solid #d4d0c7',borderRadius:8,background:'white',color:'#526159',fontWeight:800,cursor:'pointer',fontSize:12};

export default function ActionPlanPage({params}:{params:Promise<{id:string}>}){
 const{id}=use(params),studentId=Number(id);
 const[student,setStudent]=useState<Student|null>(null);
 const[plan,setPlan]=useState<Plan|null>(null);
 const[actions,setActions]=useState<Action[]>([]);
 const[users,setUsers]=useState<User[]>([]);
 const[followups,setFollowups]=useState<Followup[]>([]);
 const[title,setTitle]=useState('');
 const[description,setDescription]=useState('');
 const[category,setCategory]=useState('academic');
 const[responsible,setResponsible]=useState('');
 const[due,setDue]=useState('');
 const[notes,setNotes]=useState<Record<number,string>>({});
 const[ready,setReady]=useState(false);
 const[error,setError]=useState('');
 const[editingId,setEditingId]=useState<number|null>(null);
 const[editTitle,setEditTitle]=useState('');
 const[editDescription,setEditDescription]=useState('');
 const[editCategory,setEditCategory]=useState('academic');
 const[editResponsible,setEditResponsible]=useState('');
 const[editDue,setEditDue]=useState('');
 const[editingPlanTitle,setEditingPlanTitle]=useState(false);
 const[planTitle,setPlanTitle]=useState('Handleplan');

 async function load(){
  const[{data:s},{data:p},{data:u}]=await Promise.all([
   supabase.from('students').select('id,name').eq('id',studentId).single(),
   supabase.from('student_action_plans').select('id,title,status').eq('student_id',studentId).eq('status','active').maybeSingle(),
   supabase.rpc('get_meeting_user_directory')
  ]);
  setStudent(s as Student);setUsers((u||[]) as User[]);setPlan(p as Plan|null);setPlanTitle((p as Plan|null)?.title||'Handleplan');
  if(p){
   const{data:a}=await supabase.from('student_plan_actions').select('id,title,description,category,responsible_user_id,due_date,status').eq('plan_id',p.id).order('created_at');
   setActions((a||[]) as Action[]);
   const ids=(a||[]).map((x:any)=>x.id);
   if(ids.length){const{data:f}=await supabase.from('student_plan_followups').select('id,action_id,note,created_at').in('action_id',ids).order('created_at',{ascending:false});setFollowups((f||[]) as Followup[])}else setFollowups([]);
  }else{setActions([]);setFollowups([])}
 }
 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();if(!data.session){location.replace('/?teacher=1');return}await load();setReady(true)})()},[studentId]);

 async function ensurePlan(){
  if(plan)return plan.id;
  const{data:{user}}=await supabase.auth.getUser();if(!user)return null;
  const{data,error:e}=await supabase.from('student_action_plans').insert({student_id:studentId,title:'Handleplan',created_by:user.id}).select('id,title,status').single();
  if(e){setError(e.message);return null}setPlan(data as Plan);setPlanTitle(data.title);return data.id;
 }
 async function savePlanTitle(){
  if(!plan||!planTitle.trim())return;
  const{error:e}=await supabase.from('student_action_plans').update({title:planTitle.trim()}).eq('id',plan.id);
  if(e)setError(e.message);else{setEditingPlanTitle(false);await load()}
 }
 async function addAction(){
  if(!title.trim())return;
  const planId=await ensurePlan();const{data:{user}}=await supabase.auth.getUser();if(!planId||!user)return;
  const{error:e}=await supabase.from('student_plan_actions').insert({plan_id:planId,title:title.trim(),description:description.trim()||null,category,responsible_user_id:responsible||null,due_date:due||null,created_by:user.id});
  if(e)setError(e.message);else{setTitle('');setDescription('');setResponsible('');setDue('');await load()}
 }
 function startEdit(a:Action){
  setEditingId(a.id);setEditTitle(a.title);setEditDescription(a.description||'');setEditCategory(a.category);setEditResponsible(a.responsible_user_id||'');setEditDue(a.due_date||'');setError('');
 }
 async function saveEdit(id:number){
  if(!editTitle.trim())return;
  const{error:e}=await supabase.from('student_plan_actions').update({title:editTitle.trim(),description:editDescription.trim()||null,category:editCategory,responsible_user_id:editResponsible||null,due_date:editDue||null}).eq('id',id).eq('status','active');
  if(e){setError(e.message);return}setEditingId(null);await load();
 }
 async function removeAction(a:Action){
  if(followups.some(f=>f.action_id===a.id)){setError('Indsatsen har opfølgninger og er derfor en del af historikken. Afslut den i stedet for at slette den.');return}
  if(!confirm('Vil du slette denne indsats?'))return;
  const{error:e}=await supabase.from('student_plan_actions').delete().eq('id',a.id);
  if(e)setError(e.message);else await load();
 }
 async function toggle(a:Action){
  const{error:e}=await supabase.from('student_plan_actions').update({status:a.status==='completed'?'active':'completed',completed_at:a.status==='completed'?null:new Date().toISOString()}).eq('id',a.id);
  if(e)setError(e.message);else{if(editingId===a.id)setEditingId(null);await load()}
 }
 async function addFollowup(actionId:number){
  const note=(notes[actionId]||'').trim();if(!note)return;
  const{data:{user}}=await supabase.auth.getUser();if(!user)return;
  const{error:e}=await supabase.from('student_plan_followups').insert({action_id:actionId,note,created_by:user.id});
  if(e)setError(e.message);else{setNotes(v=>({...v,[actionId]:''}));await load()}
 }
 const name=(id:string|null)=>users.find(u=>u.user_id===id)?.display_name||'Ingen ansvarlig';

 if(!ready)return <main style={shell}>Åbner handleplan…</main>;
 return <main style={{minHeight:'100vh',background:'#f5f3ee',color:'#26342e'}}>
  <header style={{background:'#243d33',color:'white',padding:'22px 32px'}}><div style={{maxWidth:950,margin:'auto'}}><Link href={`/students/${studentId}`} style={{color:'white',fontWeight:800,textDecoration:'none'}}>← {student?.name||'Elev'}</Link><p style={{fontSize:11,fontWeight:900,letterSpacing:1.4,opacity:.7,margin:'22px 0 3px'}}>HANDLEPLAN · PERSONALE</p><h1 style={{fontFamily:'Georgia,serif',fontSize:36,margin:0}}>{student?.name}</h1></div></header>
  <section style={shell}>
   {error&&<div style={warning}>{error}</div>}
   {plan&&<section style={{...card,marginBottom:18,background:'#eef2ed'}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><div><p style={eyebrow}>AKTIV HANDLEPLAN</p>{editingPlanTitle?<input value={planTitle} onChange={e=>setPlanTitle(e.target.value)} style={{...input,maxWidth:420,fontFamily:'Georgia,serif',fontSize:22}}/>:<h2 style={{...h2,marginBottom:0}}>{plan.title}</h2>}</div><div style={{display:'flex',gap:7}}>{editingPlanTitle?<><button onClick={savePlanTitle} style={{...smallButton,background:'#365044',color:'white',borderColor:'#365044'}}>Gem navn</button><button onClick={()=>{setEditingPlanTitle(false);setPlanTitle(plan.title)}} style={smallButton}>Annullér</button></>:<button onClick={()=>setEditingPlanTitle(true)} style={smallButton}>Redigér navn</button>}</div></div></section>}

   <section style={card}><p style={eyebrow}>NY INDSATS</p><h2 style={h2}>Hvad arbejder vi med?</h2><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Fx Støtte til at komme godt ind i første lektion" style={input}/><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Beskriv indsatsen og hvad I vil se efter…" style={textarea}/><div style={grid}><select value={category} onChange={e=>setCategory(e.target.value)} style={input}>{cats.map(c=><option key={c[0]} value={c[0]}>{c[1]}</option>)}</select><select value={responsible} onChange={e=>setResponsible(e.target.value)} style={input}><option value="">Vælg ansvarlig</option>{users.map(u=><option key={u.user_id} value={u.user_id}>{u.display_name}</option>)}</select><input type="date" value={due} onChange={e=>setDue(e.target.value)} style={input}/></div><button onClick={addAction} disabled={!title.trim()} style={primary}>+ Opret indsats</button></section>

   <section style={{marginTop:18}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'end'}}><div><p style={eyebrow}>INDSATSER</p><h2 style={h2}>{actions.filter(a=>a.status==='active').length} aktive · {actions.filter(a=>a.status==='completed').length} afsluttede</h2></div></div>
    {!actions.length?<div style={card}>Der er endnu ingen indsatser i handleplanen.</div>:<div style={{display:'grid',gap:12}}>{actions.map(a=>{
     const itemFollowups=followups.filter(f=>f.action_id===a.id),editing=editingId===a.id,active=a.status==='active';
     return <article key={a.id} style={{...card,opacity:active?1:.72}}>
      {editing&&active?<div style={{display:'grid',gap:9}}><p style={eyebrow}>REDIGÉR INDSATS</p><input value={editTitle} onChange={e=>setEditTitle(e.target.value)} style={input}/><textarea value={editDescription} onChange={e=>setEditDescription(e.target.value)} style={textarea}/><div style={grid}><select value={editCategory} onChange={e=>setEditCategory(e.target.value)} style={input}>{cats.map(c=><option key={c[0]} value={c[0]}>{c[1]}</option>)}</select><select value={editResponsible} onChange={e=>setEditResponsible(e.target.value)} style={input}><option value="">Ingen ansvarlig</option>{users.map(u=><option key={u.user_id} value={u.user_id}>{u.display_name}</option>)}</select><input type="date" value={editDue} onChange={e=>setEditDue(e.target.value)} style={input}/></div><div style={{display:'flex',gap:7,flexWrap:'wrap'}}><button onClick={()=>saveEdit(a.id)} style={{...smallButton,background:'#365044',color:'white',borderColor:'#365044'}}>Gem</button><button onClick={()=>setEditingId(null)} style={smallButton}>Annullér</button>{itemFollowups.length===0&&<button onClick={()=>removeAction(a)} style={{...smallButton,color:'#8a3c34'}}>Slet indsats</button>}</div></div>:<>
       <div style={{display:'flex',justifyContent:'space-between',gap:15,alignItems:'start',flexWrap:'wrap'}}><div style={{flex:'1 1 420px'}}><span style={pill}>{cat(a.category)}</span><h3 style={{fontFamily:'Georgia,serif',fontSize:23,margin:'8px 0 5px',textDecoration:active?'none':'line-through'}}>{a.title}</h3>{a.description&&<p style={hint}>{a.description}</p>}<small style={meta}>Ansvarlig: {name(a.responsible_user_id)}{a.due_date?` · Deadline ${new Date(a.due_date+'T12:00').toLocaleDateString('da-DK')}`:''}</small></div><div style={{display:'flex',gap:7,flexWrap:'wrap',justifyContent:'flex-end'}}>{active&&<button onClick={()=>startEdit(a)} style={smallButton}>Redigér</button>}{active&&itemFollowups.length===0&&<button onClick={()=>removeAction(a)} style={{...smallButton,color:'#8a3c34'}}>Slet</button>}<button onClick={()=>toggle(a)} style={secondary}>{active?'✓ Markér færdig':'Genåbn'}</button></div></div>
       {active&&itemFollowups.length>0&&<small style={{display:'block',marginTop:9,color:'#8a6e42',fontWeight:800}}>Har opfølgninger · bevares som historik og kan derfor ikke slettes.</small>}
       <div style={{marginTop:16,paddingTop:14,borderTop:'1px solid #eee'}}><strong>Opfølgning</strong>{itemFollowups.map(f=><div key={f.id} style={followup}><span>{f.note}</span><small style={meta}>{new Date(f.created_at).toLocaleString('da-DK')}</small></div>)}{active?<><div style={{display:'flex',gap:8,marginTop:9}}><input value={notes[a.id]||''} onChange={e=>setNotes(v=>({...v,[a.id]:e.target.value}))} placeholder="Ny opfølgning…" style={{...input,marginTop:0}}/><button onClick={()=>addFollowup(a.id)} style={secondary}>Gem</button></div><small style={{display:'block',marginTop:7,color:'#777'}}>Opfølgninger er historik og kan ikke redigeres eller slettes bagefter.</small></>:<small style={{display:'block',marginTop:8,color:'#777'}}>Afsluttet indsats · genåbn for at arbejde videre.</small>}</div>
      </>}
     </article>;
    })}</div>}
   </section>
  </section>
 </main>;
}

const shell:React.CSSProperties={maxWidth:950,margin:'auto',padding:'32px 24px 70px'};
const card:React.CSSProperties={background:'white',border:'1px solid #ddd9d0',borderRadius:14,padding:21};
const h2:React.CSSProperties={fontFamily:'Georgia,serif',fontSize:27,margin:'6px 0 14px'};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:'#718077',margin:0};
const input:React.CSSProperties={width:'100%',boxSizing:'border-box',padding:11,border:'1px solid #d8d5cd',borderRadius:8,background:'white',marginTop:9};
const textarea:React.CSSProperties={...input,minHeight:90,resize:'vertical'};
const grid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:9};
const primary:React.CSSProperties={marginTop:14,padding:'11px 15px',border:0,borderRadius:8,background:'#365044',color:'white',fontWeight:900,cursor:'pointer'};
const secondary:React.CSSProperties={padding:'8px 10px',border:'1px solid #d4d8d4',borderRadius:8,background:'#f5f3ee',color:'#365044',fontWeight:800,cursor:'pointer',whiteSpace:'nowrap'};
const hint:React.CSSProperties={color:'#707670',lineHeight:1.5};
const meta:React.CSSProperties={display:'block',color:'#718077',marginTop:5};
const pill:React.CSSProperties={fontSize:11,fontWeight:900,background:'#e7eee9',padding:'5px 8px',borderRadius:999};
const followup:React.CSSProperties={background:'#faf9f6',padding:10,borderRadius:8,marginTop:7};
const warning:React.CSSProperties={padding:14,background:'#fff3cd',borderRadius:9,marginBottom:14};
