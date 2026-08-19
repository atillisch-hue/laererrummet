"use client";

import { useMemo, useState } from "react";

type Student = { id: number; name: string };
type SchoolClass = { id: number; name: string; students: Student[] };
type Assignment = { id: number; title: string; type: keyof typeof templates; classId: number };

const templates = {
  "Debatindlæg": ["Overskrift", "Indledning: Hvad debatterer du?", "Din tydelige holdning", "Argument 1 + eksempel", "Argument 2 + eksempel", "Modargument og svar", "Afrunding: Hvad bør der ske?"],
  "Artikel": ["Rubrik", "Manchet", "Indledning: Hvem, hvad, hvor?", "Brødtekst med mellemoverskrifter", "Citater eller kilder", "Afrunding"],
  "Essay": ["En åbning, der vækker nysgerrighed", "En konkret oplevelse eller situation", "Undren og refleksion", "Flere perspektiver", "En åben eller eftertænksom afslutning"],
  "Fortælling": ["Anslag", "Personer og miljø", "Konflikt", "Vendepunkt", "Afslutning"],
};

export default function Home() {
  const [classes, setClasses] = useState<SchoolClass[]>([
    { id: 1, name: "7.–9. klasse", students: [{ id: 1, name: "Eksempel-elev" }] },
  ]);
  const [assignments, setAssignments] = useState<Assignment[]>([
    { id: 1, title: "Er du ægte?", type: "Debatindlæg", classId: 1 },
  ]);
  const [selectedClass, setSelectedClass] = useState(1);
  const [newClass, setNewClass] = useState("");
  const [newStudent, setNewStudent] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<keyof typeof templates>("Debatindlæg");

  const activeClass = classes.find((c) => c.id === selectedClass) ?? classes[0];
  const classAssignments = useMemo(() => assignments.filter((a) => a.classId === selectedClass), [assignments, selectedClass]);

  function addClass() {
    if (!newClass.trim()) return;
    const id = Date.now();
    setClasses((old) => [...old, { id, name: newClass.trim(), students: [] }]);
    setSelectedClass(id);
    setNewClass("");
  }

  function addStudent() {
    if (!newStudent.trim()) return;
    setClasses((old) => old.map((c) => c.id === selectedClass ? { ...c, students: [...c.students, { id: Date.now(), name: newStudent.trim() }] } : c));
    setNewStudent("");
  }

  function addAssignment() {
    if (!title.trim()) return;
    setAssignments((old) => [...old, { id: Date.now(), title: title.trim(), type, classId: selectedClass }]);
    setTitle("");
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span>✦</span><div><strong>Lærerrummet</strong><small>Dit digitale klasseværelse</small></div></div>
        <p className="label">MINE KLASSER</p>
        <nav>{classes.map((c) => <button key={c.id} className={selectedClass === c.id ? "classButton active" : "classButton"} onClick={() => setSelectedClass(c.id)}><span>◫</span>{c.name}<b>{c.students.length}</b></button>)}</nav>
        <div className="addRow"><input value={newClass} onChange={(e) => setNewClass(e.target.value)} placeholder="Ny klasse" onKeyDown={(e) => e.key === "Enter" && addClass()} /><button onClick={addClass}>+</button></div>
        <div className="sidebarBottom"><span>⚙</span> Indstillinger</div>
      </aside>

      <section className="content">
        <header><div><p className="eyebrow">OVERSIGT</p><h1>{activeClass?.name}</h1><p>Her har du elever, opgaver og skrivehjælp samlet ét sted.</p></div><div className="avatar">AT</div></header>

        <div className="stats">
          <article><span className="statIcon">◎</span><div><b>{activeClass?.students.length ?? 0}</b><small>elever i klassen</small></div></article>
          <article><span className="statIcon">✓</span><div><b>{classAssignments.length}</b><small>aktive opgaver</small></div></article>
          <article><span className="statIcon">✎</span><div><b>{Object.keys(templates).length}</b><small>skriveskabeloner</small></div></article>
        </div>

        <div className="grid">
          <section className="card">
            <div className="cardHead"><div><p className="eyebrow">KLASSEN</p><h2>Elever</h2></div><span>{activeClass?.students.length ?? 0} i alt</span></div>
            <div className="studentList">{activeClass?.students.map((s) => <div className="student" key={s.id}><span>{s.name.slice(0, 1).toUpperCase()}</span><strong>{s.name}</strong><i>›</i></div>)}</div>
            <div className="formRow"><input value={newStudent} onChange={(e) => setNewStudent(e.target.value)} placeholder="Elevens navn" onKeyDown={(e) => e.key === "Enter" && addStudent()} /><button onClick={addStudent}>Tilføj elev</button></div>
          </section>

          <section className="card assignmentCard">
            <div className="cardHead"><div><p className="eyebrow">NY OPGAVE</p><h2>Opret opgave</h2></div><span className="spark">✦</span></div>
            <label>Opgavens titel</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Fx Er du ægte?" />
            <label>Produkttype</label><select value={type} onChange={(e) => setType(e.target.value as keyof typeof templates)}>{Object.keys(templates).map((t) => <option key={t}>{t}</option>)}</select>
            <div className="templatePreview"><b>Automatisk skrivehjælp</b><p>Når eleven åbner opgaven, får de denne struktur:</p>{templates[type].slice(0, 4).map((x, i) => <span key={x}><em>{i + 1}</em>{x}</span>)}</div>
            <button className="primary" onClick={addAssignment}>Opret opgave →</button>
          </section>
        </div>

        <section className="card assignments">
          <div className="cardHead"><div><p className="eyebrow">OPGAVER</p><h2>Klassens opgaver</h2></div></div>
          {classAssignments.map((a) => <div className="assignment" key={a.id}><span className="doc">▤</span><div><strong>{a.title}</strong><p>{a.type} · Skriveskabelon følger automatisk med</p></div><button>Åbn <span>→</span></button></div>)}
          {!classAssignments.length && <p className="empty">Ingen opgaver endnu. Opret den første ovenfor.</p>}
        </section>
      </section>
    </main>
  );
}
