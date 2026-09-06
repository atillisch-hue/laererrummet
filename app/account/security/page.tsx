"use client";

import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

const shell:React.CSSProperties={maxWidth:720,margin:"0 auto",padding:"42px 24px 80px"};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:20};
const field:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"11px 12px",border:"1px solid #d4d0c7",borderRadius:8,font:"inherit",fontSize:18,letterSpacing:2};
const button:React.CSSProperties={border:0,borderRadius:8,padding:"10px 14px",background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={...button,background:"white",color:"#365044",border:"1px solid #cfcac0"};

function safeNext(){
 if(typeof window==="undefined")return "/";
 const value=new URLSearchParams(window.location.search).get("next")||"/";
 return value.startsWith("/")&&!value.startsWith("//")?value:"/";
}

export default function AccountSecurityPage(){
 const[ready,setReady]=useState(false),[email,setEmail]=useState(""),[privileged,setPrivileged]=useState(false),[verifiedFactorId,setVerifiedFactorId]=useState<string|null>(null),[aal,setAal]=useState<string>("aal1"),[enrollId,setEnrollId]=useState(""),[qr,setQr]=useState(""),[secret,setSecret]=useState(""),[code,setCode]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const next=safeNext();

 async function load(){
  setError("");
  const{data:sessionData}=await supabase.auth.getSession();const user=sessionData.session?.user;
  if(!user){location.replace("/");return}
  setEmail(user.email||"");
  setPrivileged(hasRole(user,"admin")||hasRole(user,"leader"));
  const[factorsRes,aalRes]=await Promise.all([supabase.auth.mfa.listFactors(),supabase.auth.mfa.getAuthenticatorAssuranceLevel()]);
  if(factorsRes.error||aalRes.error){setError("Kontosikkerheden kunne ikke hentes.");setReady(true);return}
  const factor=(factorsRes.data.totp||[]).find((item:any)=>item.status==="verified")||null;
  setVerifiedFactorId(factor?.id||null);setAal(aalRes.data.currentLevel||"aal1");setReady(true);
 }

 useEffect(()=>{load()},[]);

 async function startEnrollment(){
  setBusy(true);setError("");setMessage("");
  const{data,error}=await supabase.auth.mfa.enroll({factorType:"totp",friendlyName:"Klasseværelset"});
  if(error){setError("2-trinsbekræftelse kunne ikke startes. Prøv igen.");setBusy(false);return}
  setEnrollId(data.id);setQr(data.totp.qr_code);setSecret(data.totp.secret||"");setBusy(false);
 }

 async function verifyEnrollment(){
  if(!enrollId||code.trim().length<6)return;
  setBusy(true);setError("");setMessage("");
  const challenge=await supabase.auth.mfa.challenge({factorId:enrollId});
  if(challenge.error){setError("Bekræftelsen kunne ikke startes. Prøv igen.");setBusy(false);return}
  const verify=await supabase.auth.mfa.verify({factorId:enrollId,challengeId:challenge.data.id,code:code.trim()});
  if(verify.error){setError("Koden blev ikke godkendt. Kontroller koden i din authenticator-app og prøv igen.");setBusy(false);return}
  setEnrollId("");setQr("");setSecret("");setCode("");setMessage("2-trinsbekræftelse er slået til på din konto.");await load();setBusy(false);
 }

 if(!ready)return <main style={shell}>Henter kontosikkerhed…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}><section style={shell}>
  <p style={{fontSize:10,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0}}>KONTOSIKKERHED</p>
  <h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:"7px 0 8px"}}>2-trinsbekræftelse</h1>
  <p style={{color:"#657068",lineHeight:1.55,margin:"0 0 20px"}}>Beskyt din konto med en authenticator-app som Microsoft Authenticator, Google Authenticator, 1Password eller Apple Adgangskoder. TOTP-koder genereres på din egen enhed og kræver ikke SMS.</p>
  {privileged&&<section style={{...card,background:verifiedFactorId?"#e9eee9":"#fff3df",marginBottom:14}}><strong>{verifiedFactorId?"✓ Din privilegerede konto har MFA":"MFA er påkrævet for Admin og Ledelse"}</strong><p style={{margin:"6px 0 0",color:"#59655e",lineHeight:1.5}}>{verifiedFactorId?"Admin- og ledelsesområder kræver både din adgangskode og en gyldig kode fra din authenticator-app.":"Du kan fortsat være logget ind, men Admin og Ledelse åbnes først, når du har tilmeldt en authenticator-app."}</p></section>}
  <section style={card}><small style={{display:"block",fontWeight:900,color:"#718077"}}>KONTO</small><strong style={{display:"block",fontSize:18,marginTop:4}}>{email}</strong><p style={{color:"#687068",margin:"7px 0 0"}}>Aktuel session: <b>{aal==="aal2"?"MFA-bekræftet":"almindeligt login"}</b></p></section>
  {error&&<div style={{...card,marginTop:14,background:"#fff0ed",color:"#7b3b32",fontWeight:800}}>{error}</div>}
  {message&&<div style={{...card,marginTop:14,background:"#e9eee9",color:"#365044",fontWeight:800}}>{message}</div>}

  {!verifiedFactorId&&!enrollId&&<section style={{...card,marginTop:14}}><h2 style={{fontFamily:"Georgia,serif",fontSize:24,margin:"0 0 7px"}}>Opsæt authenticator-app</h2><p style={{color:"#687068",lineHeight:1.5}}>Du scanner en QR-kode og bekræfter opsætningen med den 6-cifrede kode fra appen.</p><button onClick={startEnrollment} disabled={busy} style={{...button,opacity:busy?.6:1}}>{busy?"Starter…":"Opsæt 2-trinsbekræftelse →"}</button></section>}

  {enrollId&&<section style={{...card,marginTop:14}}><h2 style={{fontFamily:"Georgia,serif",fontSize:24,margin:"0 0 9px"}}>1. Scan QR-koden</h2>{qr&&<div style={{display:"inline-block",padding:12,background:"white",border:"1px solid #d8d5cd",borderRadius:10}}><img src={qr} alt="QR-kode til authenticator-app" width={220} height={220}/></div>}<p style={{color:"#687068",lineHeight:1.5}}>Kan du ikke scanne QR-koden, kan du indtaste denne nøgle manuelt i authenticator-appen:</p>{secret&&<code style={{display:"block",padding:10,background:"#f4f1e9",borderRadius:8,overflowWrap:"anywhere",userSelect:"all"}}>{secret}</code>}<h2 style={{fontFamily:"Georgia,serif",fontSize:24,margin:"22px 0 9px"}}>2. Bekræft koden</h2><input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,8))} placeholder="123456" style={field}/><div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}><button onClick={verifyEnrollment} disabled={busy||code.length<6} style={{...button,opacity:busy||code.length<6?.55:1}}>{busy?"Bekræfter…":"Bekræft og slå MFA til"}</button><button onClick={()=>{setEnrollId("");setQr("");setSecret("");setCode("")}} style={secondary}>Annullér</button></div></section>}

  {verifiedFactorId&&<section style={{...card,marginTop:14}}><h2 style={{fontFamily:"Georgia,serif",fontSize:24,margin:"0 0 7px"}}>Authenticator-app er tilmeldt</h2><p style={{color:"#687068",lineHeight:1.5}}>Af sikkerhedsgrunde kan MFA ikke fjernes fra privilegerede konti i denne pilotflade. Hvis din nuværende session ikke er MFA-bekræftet, skal du gennemføre en ny challenge.</p>{aal!=="aal2"?<button onClick={()=>location.href=`/mfa?next=${encodeURIComponent(next)}`} style={button}>Bekræft med authenticator →</button>:next!=="/"?<button onClick={()=>location.href=next} style={button}>Fortsæt →</button>:null}</section>}
 </section></main>;
}
