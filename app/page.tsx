"use client";

import { useEffect, useMemo, useState } from "react";

type Student = { id: number; name: string };
type SchoolClass = { id: number; name: string; students: Student[] };
type Assignment = { id: number; title: string; type: keyof typeof templates; classId: number };
type Drafts = Record<string, string[]>;
type Role = "teacher" | "student";

const templates = {
  "Debatindlæg": ["Overskrift", "Indledning: Hvad debatterer du?", "Din tydelige holdning", "Argument 1 + eksempel", "Argument 2 + eksempel", "Modargument og svar", "Afrunding: Hvad bør der ske?"],
  "Artikel": ["Rubrik", "Manchet", "Indledning: Hvem, hvad, hvor?", "Brødtekst med mellemoverskrifter", "Citater eller kilder", "Afrunding"],
  "Essay": ["En åbning, der vækker nysgerrighed", "En konkret oplevelse eller situation", "Undren og refleksion", "Flere perspektiver", "En åben eller eftertænksom afslutning"],
  "Fortælling": ["Anslag", "Personer og miljø", "Konflikt", "Vendepunkt", "Afslutning"],
};

const initialClasses: SchoolClass[] = [{ id: 1, name: "7.–9. klasse", students: [{ id: 1, name: "Eksempel-elev" }] }];
const initialAssignments: Assignment[] = [{ id: 1, title: "Er du ægte?", type: "Debatindlæg", classId: 1 }];

export default function Home() {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>(initialClasses);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [selectedClass, setSelectedClass] = useState(1);
  const [openAssignment, setOpenAssignment] = useState<number | null>(null);
  const [newClass, setNewClass] = useState("");
  const [newStudent, setNewStudent] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<keyof typeof templates>("Debatindlæg");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("klassevaerelset-v2");
      if (saved) {
        const data = JSON.parse(saved);
        setClasses(data.classes || initialClasses); setAssignments(data.assignments || initialAssignments); setDrafts(data.drafts || {});
      }
    } finally { setReady(true); }
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("klassevaerelset-v2", JSON.stringify({ classes, assignments, drafts })); }, [classes, assignments, drafts, ready]);

  const activeClass = classes.find(c => c.id === selectedClass) ?? classes[0];
  const classAssignments = useMemo(() => assignments.filter(a => a.classId === selectedClass), [assignments, selectedClass]);
  const allStudents = classes.flatMap(c => c.students.map(s => ({ ...s, classId: c.id, className: c.name })));
  const currentStudent = allStudents.find(s => s.id === studentId);

  function addClass(){ if(!newClass.trim())return; const id=Date.now(); setClasses(o=>[...o,{id,name:newClass.trim(),students:[]}]); setSelectedClass(id); setNewClass(""); }
  function addStudent(){ if(!newStudent.trim())return; setClasses(o=>o.map(c=>c.id===selectedClass?{...c,students:[...c.students,{id:Date.now(),name:newStudent.trim()}]}:c)); setNewStudent(""); }
  function addAssignment(){ if(!title.trim())return; setAssignments(o=>[...o,{id:Date.now(),title:title.trim(),type,classId:selectedClass}]); setTitle(""); }
  function updateDraft(a: Assignment, index:number, value:string){ if(!studentId)return; const key=`${studentId}-${a.id}`; const base=drafts[key] || templates[a.type].map(()=>""); const next=[...base]; next[index]=value; setDrafts(d=>({...d,[key]:next})); }

  if (!ready) return null;
  if (!role) return <main className="login"><div className="loginCard"><div className="brand loginBrand"><span>✦</span><div><strong>Klasseværelset</strong><small>Et roligt sted til læring og skrivning</small></div></div><p className="eyebrow">VÆLG INDGANG</p><h1>Velkommen</h1><p>Vælg hvordan du vil åbne Klasseværelset.</p><div className="roleGrid"><button onClick={()=>setRole("teacher")}><b>✎</b><strong>Jeg er lærer</strong><small>Opret klasser, elever og opgaver</small></button><button onClick={()=>setRole("student")}><b>◎</b><strong>Jeg er elev</strong><small>Se opgaver og skriv direkte her</small></button></div></div></main>;

  if (role === "student" && !currentStudent) return <main className="login"><div className="loginCard"><button className="back" onClick={()=>setRole(null)}>← Tilbage</button><p className="eyebrow">ELEVLOGIN</p><h1>Hvem er du?</h1><p>Vælg dit navn for at komme ind i dit klasseværelse.</p><div className="studentChooser">{allStudents.map(s=><button key={s.id} onClick={()=>{setStudentId(s.id);setSelectedClass(s.classId)}}><span>{s.name[0]}</span><div><strong>{s.name}</strong><small>{s.className}</small></div><b>→</b></button>)}</div></div></main>;

  if (role === "student" && currentStudent) {
    const studentAssignments=assignments.filter(a=>a.classId===currentStudent.classId); const active=studentAssignments.find(a=>a.id===openAssignment);
    return <main className="studentShell"><header className="studentTop"><div className="brand"><span>✦</span><div><strong>Klasseværelset</strong><small>{currentStudent.className}</small></div></div><button onClick={()=>{setStudentId(null);setOpenAssignment(null)}}>{currentStudent.name} · Log ud</button></header><section className="studentContent">{!active ? <><p className="eyebrow">HEJ {currentStudent.name.toUpperCase()}</p><h1>Dine opgaver</h1><p>Her finder du de opgaver, din lærer har lagt klar.</p><div className="studentAssignments">{studentAssignments.map(a=><button key={a.id} onClick={()=>setOpenAssignment(a.id)}><span>▤</span><div><strong>{a.title}</strong><small>{a.type} · Skrivehjælp følger med</small></div><b>Åbn →</b></button>)}</div></> : <><button className="back" onClick={()=>setOpenAssignment(null)}>← Alle opgaver</button><p className="eyebrow">{active.type.toUpperCase()}</p><h1>{active.title}</h1><p>Skriv direkte i felterne. Dit arbejde gemmes automatisk på denne enhed.</p><div className="writing"><aside><strong>Din skriveplan</strong>{templates[active.type].map((x,i)=><a key={x} href={`#felt-${i}`}><span>{i+1}</span>{x}</a>)}</aside><section>{templates[active.type].map((x,i)=>{const key=`${studentId}-${active.id}`;return <label id={`felt-${i}`} key={x}><strong>{i+1}. {x}</strong><textarea value={(drafts[key]||[])[i]||""} onChange={e=>updateDraft(active,i,e.target.value)} placeholder="Skriv her…" /></label>})}<div className="saved">✓ Gemmes automatisk</div></section></div></>}</section></main>;
  }

  return <main className="shell"><aside className="sidebar"><div className="brand"><span>✦</span><div><strong>Klasseværelset</strong><small>Lærerens overblik</small></div></div><p className="label">MINE KLASSER</p><nav>{classes.map(c=><button key={c.id} className={selectedClass===c.id?"classButton active":"classButton"} onClick={()=>setSelectedClass(c.id)}><span>◫</span>{c.name}<b>{c.students.length}</b></button>)}</nav><div className="addRow"><input value={newClass} onChange={e=>setNewClass(e.target.value)} placeholder="Ny klasse"/><button onClick={addClass}>+</button></div><button className="logout" onClick={()=>setRole(null)}>← Skift bruger</button></aside><section className="content"><header><div><p className="eyebrow">LÆREROVERBLIK</p><h1>{activeClass?.name}</h1><p>Elever, opgaver og skrivehjælp samlet ét sted.</p></div><div className="avatar">AT</div></header><div className="stats"><article><span className="statIcon">◎</span><div><b>{activeClass?.students.length||0}</b><small>elever</small></div></article><article><span className="statIcon">✓</span><div><b>{classAssignments.length}</b><small>aktive opgaver</small></div></article><article><span className="statIcon">✎</span><div><b>{Object.keys(templates).length}</b><small>skriveskabeloner</small></div></article></div><div className="grid"><section className="card"><div className="cardHead"><div><p className="eyebrow">KLASSEN</p><h2>Elever</h2></div><span>{activeClass?.students.length||0} i alt</span></div><div className="studentList">{activeClass?.students.map(s=><div className="student" key={s.id}><span>{s.name[0].toUpperCase()}</span><strong>{s.name}</strong><i>›</i></div>)}</div><div className="formRow"><input value={newStudent} onChange={e=>setNewStudent(e.target.value)} placeholder="Elevens navn"/><button onClick={addStudent}>Tilføj elev</button></div></section><section className="card assignmentCard"><div className="cardHead"><div><p className="eyebrow">NY OPGAVE</p><h2>Opret opgave</h2></div><span>✦</span></div><label>Opgavens titel</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Fx Er du ægte?"/><label>Produkttype</label><select value={type} onChange={e=>setType(e.target.value as keyof typeof templates)}>{Object.keys(templates).map(t=><option key={t}>{t}</option>)}</select><div className="templatePreview"><b>Automatisk skrivehjælp</b><p>Eleven får denne struktur:</p>{templates[type].slice(0,4).map((x,i)=><span key={x}><em>{i+1}</em>{x}</span>)}</div><button className="primary" onClick={addAssignment}>Opret opgave →</button></section></div><section className="card assignments"><div className="cardHead"><div><p className="eyebrow">OPGAVER</p><h2>Klassens opgaver</h2></div></div>{classAssignments.map(a=><div className="assignment" key={a.id}><span className="doc">▤</span><div><strong>{a.title}</strong><p>{a.type} · Skriveskabelon følger automatisk med</p></div><span className="liveBadge">Klar til elever</span></div>)}</section></section></main>;
}
