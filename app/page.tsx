"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { hasRole } from "../lib/roles";
import { trainingCatalog } from "../lib/trainingCatalog";
import { clearStudentSession, getStudentSessionToken, storeStudentSession } from "../lib/studentSession";

type Assignment = { id: number; title: string; type: keyof typeof templates; classId: number; instructions?: string };
type GrammarAssignment = { id: number; title: string; area: string; topic: string; level: string };
type Drafts = Record<string, string[]>;
type StaffRole = "teacher" | "admin" | "parent" | "board";
type StudentData = {
  ok?: boolean;
  student: { id: number; name: string; class_id: number };
  class: { id: number; name: string };
  assignments: { id: number; title: string; type: keyof typeof templates; instructions?: string }[];
  drafts: { assignment_id: number; content: string[] }[];
};

const templates = {
  "Debatindlæg": ["Overskrift", "Indledning: Hvad debatterer du?", "Din tydelige holdning", "Argument 1 + eksempel", "Argument 2 + eksempel", "Modargument og svar", "Afrunding: Hvad bør der ske?"],
  "Artikel": ["Rubrik", "Manchet", "Indledning: Hvem, hvad, hvor?", "Brødtekst med mellemoverskrifter", "Citater eller kilder", "Afrunding"],
  "Essay": ["En åbning, der vækker nysgerrighed", "En konkret oplevelse eller situation", "Undren og refleksion", "Flere perspektiver", "En åben eller eftertænksom afslutning"],
  "Fortælling": ["Anslag", "Personer og miljø", "Konflikt", "Vendepunkt", "Afslutning"]
};

export default function Home() {
  const [ready, setReady] = useState(false);
  const [studentMode, setStudentMode] = useState(false);
  const [teacher, setTeacher] = useState<string | null>(null);
  const [staffLogin, setStaffLogin] = useState<StaffRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [studentId, setStudentId] = useState<number | null>(null);
  const [studentCode, setStudentCode] = useState("");
  const [studentSessionToken, setStudentSessionToken] = useState("");
  const [studentError, setStudentError] = useState("");
  const [studentClassName, setStudentClassName] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [grammarAssignments, setGrammarAssignments] = useState<GrammarAssignment[]>([]);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [openAssignment, setOpenAssignment] = useState<number | null>(null);
  const [studentName, setStudentName] = useState("");

  async function hydrateStudent(token: string) {
    const { data, error } = await supabase.rpc("student_session_data", { p_session_token: token });
    const sd = data as StudentData | null;
    if (error || !sd?.ok || !sd.student || !sd.class) return false;

    setStudentMode(true);
    setStudentSessionToken(token);
    setStudentId(sd.student.id);
    setStudentName(sd.student.name);
    setStudentClassName(sd.class.name);

    const validAssignments = (sd.assignments || [])
      .filter((a) => Object.prototype.hasOwnProperty.call(templates, a.type))
      .map((a) => ({ id: a.id, title: a.title, type: a.type, classId: sd.class.id, instructions: a.instructions || "" }));
    setAssignments(validAssignments);

    const nextDrafts: Drafts = {};
    (sd.drafts || []).forEach((d) => {
      nextDrafts[`${sd.student.id}-${d.assignment_id}`] = Array.isArray(d.content) ? d.content : [];
    });
    setDrafts(nextDrafts);

    const { data: grammarData } = await supabase.rpc("student_session_grammar_assignments", { p_session_token: token });
    setGrammarAssignments(grammarData?.ok ? (grammarData.assignments || []) : []);
    return true;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (cancelled) return;
      setTeacher(session?.user.email || null);

      if (session && new URLSearchParams(window.location.search).get("teacher") === "1") {
        window.location.replace("/noticeboard");
        return;
      }

      const wantsStudent = new URLSearchParams(window.location.search).get("student") === "1";
      const token = getStudentSessionToken();
      if (wantsStudent || token) setStudentMode(true);
      if (token) {
        const ok = await hydrateStudent(token);
        if (!ok) {
          clearStudentSession();
          setStudentSessionToken("");
          setStudentId(null);
        }
      }
      if (!cancelled) setReady(true);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setTeacher(session?.user.email || null));
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function staffSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoginError("Mail eller adgangskode er forkert.");
      return;
    }
    const user = data.user;
    if (staffLogin === "admin") {
      if (!hasRole(user, "admin")) {
        await supabase.auth.signOut();
        setLoginError("Denne konto har ikke administratoradgang.");
        return;
      }
      window.location.href = "/admin";
      return;
    }
    if (staffLogin === "parent") {
      if (!hasRole(user, "parent")) {
        await supabase.auth.signOut();
        setLoginError("Denne konto har ikke forældreadgang.");
        return;
      }
      window.location.href = "/parent";
      return;
    }
    if (staffLogin === "board") {
      if (!hasRole(user, "board")) {
        await supabase.auth.signOut();
        setLoginError("Denne konto har ikke bestyrelsesadgang.");
        return;
      }
      window.location.href = "/board";
      return;
    }
    if (!hasRole(user, "teacher") && !hasRole(user, "admin")) {
      await supabase.auth.signOut();
      setLoginError("Denne konto har ikke læreradgang.");
      return;
    }
    window.location.href = "/noticeboard";
  }

  async function studentLogin(e: React.FormEvent) {
    e.preventDefault();
    setStudentError("");
    const code = studentCode.trim().toUpperCase();
    if (!code) return;

    const { data, error } = await supabase.rpc("student_start_session", { p_access_code: code });
    if (error || !data?.ok || !data.session_token || !data.student_id) {
      setStudentError("Koden blev ikke genkendt. Prøv igen.");
      return;
    }

    const token = String(data.session_token);
    storeStudentSession(token, Number(data.student_id));
    const ok = await hydrateStudent(token);
    if (!ok) {
      clearStudentSession();
      setStudentError("Klasseværelset kunne ikke åbnes. Prøv igen.");
      return;
    }
    setStudentCode("");
  }

  async function updateDraft(a: Assignment, index: number, value: string) {
    if (!studentId || !studentSessionToken) return;
    const key = `${studentId}-${a.id}`;
    const base = drafts[key] || templates[a.type].map(() => "");
    const next = [...base];
    next[index] = value;
    setDrafts((current) => ({ ...current, [key]: next }));

    const { data, error } = await supabase.rpc("save_student_draft_session", {
      p_session_token: studentSessionToken,
      p_assignment_id: a.id,
      p_content: next
    });
    if (error || !data?.ok) console.error("Draft save failed");
  }

  async function studentLogout() {
    const token = studentSessionToken || getStudentSessionToken();
    if (token) {
      try {
        await supabase.rpc("student_end_session", { p_session_token: token });
      } catch {
        // Local logout still proceeds if the network request fails.
      }
    }
    clearStudentSession();
    setStudentId(null);
    setStudentSessionToken("");
    setOpenAssignment(null);
    setAssignments([]);
    setGrammarAssignments([]);
    setDrafts({});
    setStudentName("");
    setStudentClassName("");
    setStudentMode(false);
  }

  if (!ready) return <main className="login"><div className="loginCard"><h1>Klasseværelset</h1><p>Henter Klasseværelset…</p></div></main>;

  if (staffLogin && !teacher) {
    const isAdmin = staffLogin === "admin";
    const isParent = staffLogin === "parent";
    const isBoard = staffLogin === "board";
    return <main className="login"><div className="loginCard">
      <button className="back" onClick={() => { setStaffLogin(null); setLoginError(""); }}>← Tilbage</button>
      <div className="brand loginBrand"><span>✦</span><div><strong>Klasseværelset</strong><small>{isAdmin ? "Sikker administratoradgang" : isParent ? "Sikker forældreadgang" : isBoard ? "Sikker bestyrelsesadgang" : "Sikker læreradgang"}</small></div></div>
      <p className="eyebrow">{isAdmin ? "ADMINISTRATORLOGIN" : isParent ? "FORÆLDRELOGIN" : isBoard ? "BESTYRELSESLOGIN" : "LÆRERLOGIN"}</p>
      <h1>Log ind</h1>
      <p>{isAdmin ? "Brug din administratorkonto til at åbne skolens administration." : isParent ? "Brug din forældrekonto til at følge dit barns skolehverdag." : isBoard ? "Brug din bestyrelseskonto til at åbne bestyrelsesområdet." : "Brug din lærerkonto til at åbne lærerens område."}</p>
      <form onSubmit={staffSignIn}>
        <label style={{display:"block",fontWeight:700,marginTop:24}}>E-mail</label>
        <input style={{width:"100%",margin:"8px 0 14px",padding:13,border:"1px solid #d8d5cd",borderRadius:8}} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="din@email.dk" />
        <label style={{display:"block",fontWeight:700}}>Adgangskode</label>
        <input style={{width:"100%",margin:"8px 0 14px",padding:13,border:"1px solid #d8d5cd",borderRadius:8}} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        {loginError && <p style={{color:"#9b3b32",fontWeight:700}}>{loginError}</p>}
        <button className="primary" type="submit">Log ind som {isAdmin ? "administrator" : isParent ? "forælder" : isBoard ? "bestyrelsesmedlem" : "lærer"} →</button>
      </form>
    </div></main>;
  }

  if (!studentMode) return <main className="login"><div className="loginCard">
    <div className="brand loginBrand"><span>✦</span><div><strong>Klasseværelset</strong><small>Et roligt sted til læring og skrivning</small></div></div>
    <p className="eyebrow">VÆLG INDGANG</p><h1>Velkommen</h1><p>Vælg hvordan du vil åbne Klasseværelset.</p>
    <div className="roleGrid">
      <button onClick={() => teacher ? window.location.href = "/noticeboard" : setStaffLogin("teacher")}><b>✎</b><strong>Jeg er lærer</strong><small>{teacher ? "Fortsæt til Opslagstavlen" : "Sikker adgang med e-mail og kode"}</small></button>
      <button onClick={() => setStudentMode(true)}><b>◎</b><strong>Jeg er elev</strong><small>Log ind med din personlige kode</small></button>
      <button onClick={() => setStaffLogin("parent")}><b>⌂</b><strong>Jeg er forælder</strong><small>Følg dit barns skolehverdag</small></button>
      <button onClick={() => teacher ? window.location.href = "/admin" : setStaffLogin("admin")}><b>⚙</b><strong>Jeg er administrator</strong><small>Skemaer, fravær og skolens opsætning</small></button>
      <button onClick={() => setStaffLogin("board")}><b>§</b><strong>Jeg er bestyrelsesmedlem</strong><small>Møder, dokumenter og beslutninger</small></button>
    </div>
  </div></main>;

  if (!studentId) return <main className="login"><div className="loginCard">
    <button className="back" onClick={() => { setStudentMode(false); setStudentError(""); }}>← Tilbage</button>
    <div className="brand loginBrand"><span>✦</span><div><strong>Klasseværelset</strong><small>Elevadgang</small></div></div>
    <p className="eyebrow">ELEVLOGIN</p><h1>Din personlige kode</h1>
    <p>Skriv den kode, du har fået af din lærer. Koden bruges kun til at åbne din elevsession.</p>
    <form onSubmit={studentLogin}>
      <label style={{display:"block",fontWeight:700,marginTop:24}}>Elevkode</label>
      <input style={{width:"100%",margin:"8px 0 14px",padding:15,border:"1px solid #d8d5cd",borderRadius:8,fontSize:18,letterSpacing:2,textTransform:"uppercase"}} autoFocus required value={studentCode} onChange={(e) => setStudentCode(e.target.value)} placeholder="Skriv din kode" autoComplete="off" />
      {studentError && <p style={{color:"#9b3b32",fontWeight:700}}>{studentError}</p>}
      <button className="primary" type="submit">Åbn mit Klasseværelse →</button>
    </form>
  </div></main>;

  const active = assignments.find((a) => a.id === openAssignment);
  const grammar = trainingCatalog.find((s) => s.id === "dansk-grammatik");
  const math = trainingCatalog.find((s) => s.id === "matematik");

  return <main className="studentShell">
    <header className="studentTop">
      <div className="brand"><span>✦</span><div><strong>Klasseværelset</strong><small>{studentClassName}</small></div></div>
      <button onClick={studentLogout}>{studentName} · Log ud</button>
    </header>
    <section className="studentContent">
      {!active ? <>
        <p className="eyebrow">HEJ {studentName.toUpperCase()}</p><h1>Dit Klasseværelse</h1>
        <p>Her finder du både det, din lærer har sendt til dig, og træning du selv kan vælge.</p>
        <section style={{margin:"28px 0 34px"}}>
          <p className="eyebrow">FRA DIN LÆRER</p>
          {grammarAssignments.length === 0 && assignments.length === 0 ? <div style={{background:"#fff",border:"1px solid #ddd9d0",borderRadius:14,padding:20}}><strong>Du har ikke fået nye opgaver.</strong><p style={{margin:"6px 0 0",color:"#707670"}}>Du kan stadig træne selv nedenfor.</p></div> :
            <div className="studentAssignments">
              {grammarAssignments.map((g) => <button key={`g-${g.id}`} onClick={() => window.location.href = `/student-grammar?assignment=${g.id}`}><span>✓</span><div><strong>{g.title}</strong><small>Grammatik · {g.area} · {g.topic}</small></div><b>Start →</b></button>)}
              {assignments.map((a) => <button key={a.id} onClick={() => setOpenAssignment(a.id)}><span>▤</span><div><strong>{a.title}</strong><small>{a.type} · Skrivehjælp følger med</small></div><b>Åbn →</b></button>)}
            </div>}
        </section>
        <section>
          <p className="eyebrow">TRÆN SELV</p><h2 style={{fontFamily:"Georgia,serif",fontSize:28,margin:"7px 0"}}>Hvad vil du øve?</h2>
          <p style={{color:"#707670",marginTop:0}}>Du må altid træne videre, også når læreren ikke har sendt en opgave.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginTop:18}}>
            {grammar && <button onClick={() => window.location.href = "/student-training?subject=dansk-grammatik"} style={{textAlign:"left",background:"#fff",border:"1px solid #d8d5cd",borderRadius:14,padding:20,cursor:"pointer",color:"#26342e"}}><span style={{fontSize:26}}>Aa</span><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:24,margin:"9px 0 5px"}}>Grammatik</strong><small style={{display:"block",fontSize:14,lineHeight:1.45,color:"#707670"}}>{grammar.description}</small><b style={{display:"block",marginTop:15,color:"#526b60"}}>Vælg træning →</b></button>}
            {math && <button onClick={() => window.location.href = "/student-training?subject=matematik"} style={{textAlign:"left",background:"#fff",border:"1px solid #d8d5cd",borderRadius:14,padding:20,cursor:"pointer",color:"#26342e"}}><span style={{fontSize:26}}>∑</span><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:24,margin:"9px 0 5px"}}>Matematik</strong><small style={{display:"block",fontSize:14,lineHeight:1.45,color:"#707670"}}>{math.description}</small><b style={{display:"block",marginTop:15,color:"#526b60"}}>Vælg træning →</b></button>}
          </div>
        </section>
      </> : <>
        <button className="back" onClick={() => setOpenAssignment(null)}>← Mit Klasseværelse</button>
        <p className="eyebrow">{active.type.toUpperCase()}</p><h1>{active.title}</h1>
        {active.instructions ? <div style={{background:"#fff",border:"1px solid #dedbd3",borderRadius:12,padding:"16px 18px",margin:"14px 0 20px",lineHeight:1.6,whiteSpace:"pre-wrap"}}><strong style={{display:"block",marginBottom:5}}>Din opgave</strong>{active.instructions}</div> : null}
        <p>Skriv direkte i felterne. Dit arbejde gemmes i skyen.</p>
        <div className="writing">
          <aside><strong>Din skriveplan</strong>{templates[active.type].map((label, i) => <a key={label} href={`#felt-${i}`}><span>{i + 1}</span>{label}</a>)}</aside>
          <section>{templates[active.type].map((label, i) => {
            const key = `${studentId}-${active.id}`;
            const values = drafts[key] || templates[active.type].map(() => "");
            return <label id={`felt-${i}`} key={label} style={{display:"block",marginBottom:18}}><strong style={{display:"block",marginBottom:7}}>{i + 1}. {label}</strong><textarea value={values[i] || ""} onChange={(e) => updateDraft(active, i, e.target.value)} rows={i === 0 ? 2 : 5} style={{width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #d8d5cd",borderRadius:9,resize:"vertical",font:"inherit"}} /></label>;
          })}</section>
        </div>
      </>}
    </section>
  </main>;
}
