"use client";

import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";

const shell:React.CSSProperties={maxWidth:620,margin:"0 auto",padding:"54px 24px 90px"};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:22};
const field:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"12px",border:"1px solid #d4d0c7",borderRadius:8,font:"inherit",fontSize:20,letterSpacing:3,textAlign:"center"};
const button:React.CSSProperties={width:"100%",border:0,borderRadius:8,padding:"11px 14px",background:"#365044",color:"white",fontWeight:900,cursor:"pointer",marginTop:10};

function safeNext(){
 if(typeof window==="undefined")return "/";
 const value=new URLSearchParams(window.location.search).get("next")||"/";
 return value.startsWith("/")&&!value.startsWith("//")?value:"/";
}

export default function MfaChallengePage(){
 const[ready,setReady]=useState(false),[factorId,setFactorId]=useState(""),[code,setCode]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const next=safeNext();

 useEffect(()=>{let live=true;(async()=>{
  const{data:sessionData}=await supabase.auth.getSession();
  if(!sessionData.session){location.replace("/");return}
  const aal=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if(!live)return;
  if(!aal.error&&aal.data.currentLevel==="aal2"){location.replace(next);return}
  const factors=await supabase.auth.mfa.listFactors();
  if(!live)return;
  if(factors.error){setError("2-trinsbekræftelsen kunne ikke hentes.");setReady(true);return}
  const factor=(factors.data.totp||[]).find((item:any)=>item.status==="verified");
  if(!factor){location.replace(`/account/security?required=1&next=${encodeURIComponent(next)}`);return}
  setFactorId(factor.id);setReady(true);
 })();return()=>{live=false}},[next]);

 async function verify(){
  if(!factorId||code.length<6)return;
  setBusy(true);setError("");
  const challenge=await supabase.auth.mfa.challenge({factorId});
  if(challenge.error){setError("Bekræftelsen kunne ikke startes. Prøv igen.");setBusy(false);return}
  const result=await supabase.auth.mfa.verify({factorId,challengeId:challenge.data.id,code});
  if(result.error){setError("Koden blev ikke godkendt. Vent på en ny kode i appen og prøv igen.");setBusy(false);return}
  const aal=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if(aal.error||aal.data.currentLevel!=="aal2"){setError("Sessionen kunne ikke opgraderes til MFA-bekræftet adgang. Prøv igen.");setBusy(false);return}
  location.replace(next);
 }

 if(!ready)return <main style={shell}>Kontrollerer 2-trinsbekræftelse…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}><section style={shell}>
  <div style={card}><p style={{fontSize:10,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0}}>SIKKER LOGIN</p><h1 style={{fontFamily:"Georgia,serif",fontSize:34,margin:"7px 0 8px"}}>Bekræft med authenticator</h1><p style={{color:"#687068",lineHeight:1.55}}>Admin og Ledelse kræver et ekstra bevis på, at det er dig. Skriv den aktuelle kode fra din authenticator-app.</p><input autoFocus inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,8))} onKeyDown={e=>{if(e.key==="Enter")verify()}} placeholder="123456" style={field}/>{error&&<p style={{color:"#8a3f35",fontWeight:800}}>{error}</p>}<button onClick={verify} disabled={busy||code.length<6} style={{...button,opacity:busy||code.length<6?0.55:1}}>{busy?"Bekræfter…":"Bekræft og fortsæt →"}</button><button onClick={async()=>{await supabase.auth.signOut();location.replace("/")}} style={{...button,background:"white",color:"#52675c",border:"1px solid #d4d0c7"}}>Log ud</button></div>
 </section></main>;
}
