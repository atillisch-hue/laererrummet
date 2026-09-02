"use client";

import { useEffect, useMemo, useState } from "react";
import { studentSupabase } from "../../lib/studentSupabase";
import { clearStudentSession, getStudentSessionToken } from "../../lib/studentSession";
import { extraLibrary, type GrammarQuestion as Q } from "./grammar-library";
import { coreGrammarLibrary } from "./core-library";

const library: Record<string, Record<string, Q[]>> = { ...coreGrammarLibrary, ...extraLibrary };

export default function StudentGrammar() {
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState("");
  const [assignment, setAssignment] = useState<any>(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState("");

  useEffect(() => {
    (async () => {
      const token = getStudentSessionToken();
      const id = new URLSearchParams(window.location.search).get("assignment");
      if (!token || !id) {
        setError("Åbn opgaven fra din elevside.");
        setLoading(false);
        return;
      }

      const { data, error: loadError } = await studentSupabase.rpc("student_session_grammar_assignments", { p_session_token: token });
      if (loadError || !data?.ok) {
        clearStudentSession();
        setError("Din elevsession er udløbet. Log ind igen fra elevsiden.");
        setLoading(false);
        return;
      }

      const found = (data.assignments || []).find((item: any) => String(item.id) === id);
      if (!found) {
        setError("Denne opgave er ikke tildelt dig.");
        setLoading(false);
        return;
      }

      setSessionToken(token);
      setAssignment(found);
      setLoading(false);
    })();
  }, []);

  const questions = useMemo(() => assignment ? library[assignment.topic]?.[assignment.level] || [] : [], [assignment]);
  const score = questions.filter((question, index) => answers[index] === question.answer).length;

  async function submit() {
    if (!assignment || !sessionToken || Object.keys(answers).length !== questions.length) return;
    setSubmitted(true);
    setSaving(true);
    setSaveState("Gemmer resultat…");

    const answerSnapshot = Object.fromEntries(questions.map((question, index) => [index, {
      question: question.q,
      studentAnswer: answers[index],
      correctAnswer: question.answer,
      correct: answers[index] === question.answer,
      explanation: question.why
    }]));

    const { data, error: saveError } = await studentSupabase.rpc("save_student_grammar_attempt_session", {
      p_session_token: sessionToken,
      p_assignment_id: assignment.id,
      p_answers: answerSnapshot,
      p_score: score,
      p_max_score: questions.length
    });

    if (saveError || !data?.ok) {
      if (data?.error === "invalid_session") clearStudentSession();
      setSaveState("Resultatet kunne ikke gemmes");
    } else {
      setSaveState("Resultatet er gemt ✓");
    }
    setSaving(false);
  }

  if (loading) return <main style={{padding:50}}>Åbner grammatikopgaven…</main>;

  return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"42px 24px 80px"}}>
    <section style={{maxWidth:900,margin:"0 auto"}}>
      <a href="/?student=1" style={{color:"#526b60",fontWeight:800,textDecoration:"none"}}>← Til mine opgaver</a>
      {error ? <div style={{marginTop:30,background:"white",padding:28,borderRadius:14,border:"1px solid #ddd9d0"}}>
        <h1>Hov</h1><p>{error}</p><a href="/?student=1">Til elevlogin →</a>
      </div> : <>
        <p style={{marginTop:38,fontSize:11,fontWeight:800,letterSpacing:1.7,color:"#718077"}}>GRAMMATIK · {assignment.area.toUpperCase()}</p>
        <h1 style={{fontFamily:"Georgia,serif",fontSize:42,margin:"8px 0"}}>{assignment.title}</h1>
        <p style={{fontSize:18,color:"#707670",lineHeight:1.55}}>Arbejd dig gennem opgaverne. Når du retter, får du både svar og forklaring, så grammatik handler om mere end rigtigt og forkert.</p>

        {questions.length === 0 ? <div style={{marginTop:30,background:"white",padding:28,borderRadius:14,border:"1px solid #ddd9d0"}}><h2>{assignment.topic}</h2><p>Opgaver til dette emne er på vej.</p></div> : <>
          <div style={{display:"grid",gap:16,marginTop:28}}>
            {questions.map((question, index) => <article key={index} style={{background:"white",padding:24,borderRadius:14,border:"1px solid #ddd9d0"}}>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:1.4,color:"#718077"}}>OPGAVE {index + 1} AF {questions.length}</div>
              <h2 style={{fontFamily:"Georgia,serif",fontSize:22,lineHeight:1.35,margin:"10px 0 16px"}}>{question.q}</h2>
              <div style={{display:"grid",gap:8}}>
                {question.options.map((option) => {
                  const chosen = answers[index] === option;
                  const correct = submitted && option === question.answer;
                  const wrong = submitted && chosen && option !== question.answer;
                  return <button key={option} disabled={submitted} onClick={() => setAnswers((current) => ({...current,[index]:option}))} style={{padding:"12px 14px",textAlign:"left",borderRadius:9,border:`2px solid ${correct ? "#5f8068" : wrong ? "#b86b62" : chosen ? "#526b60" : "#e1ddd5"}`,background:correct ? "#edf5ef" : wrong ? "#fff0ed" : chosen ? "#edf1ec" : "#fff",fontWeight:chosen || correct ? 800 : 600,cursor:submitted ? "default" : "pointer"}}>{option}</button>;
                })}
              </div>
              {submitted && <div style={{marginTop:14,padding:"12px 14px",borderRadius:9,background:answers[index] === question.answer ? "#edf5ef" : "#fff7e8",lineHeight:1.5}}><strong>{answers[index] === question.answer ? "Rigtigt ✓" : "Ikke helt endnu"}</strong><br />{question.why}</div>}
            </article>)}
          </div>

          {!submitted ? <button disabled={Object.keys(answers).length !== questions.length || saving} onClick={submit} style={{marginTop:22,width:"100%",padding:"14px 18px",border:0,borderRadius:10,background:"#365044",color:"white",fontWeight:800,fontSize:16,opacity:Object.keys(answers).length !== questions.length ? .45 : 1,cursor:Object.keys(answers).length !== questions.length ? "not-allowed" : "pointer"}}>Ret mine svar</button> :
            <div style={{marginTop:22,padding:24,borderRadius:14,background:"#273f35",color:"white",textAlign:"center"}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:32,fontWeight:800}}>{score} / {questions.length}</div>
              <p>{score === questions.length ? "Flot, alle rigtige." : score >= Math.ceil(questions.length * .6) ? "Godt arbejde. Kig på forklaringerne til dem, der drillede." : "Kig på forklaringerne og prøv igen. Det er sådan træning virker."}</p>
              <small>{saveState}</small>
              <div style={{marginTop:14,display:"flex",gap:9,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={() => {setAnswers({});setSubmitted(false);setSaveState("");}} style={{padding:"9px 13px",borderRadius:9,border:"1px solid rgba(255,255,255,.35)",background:"transparent",color:"white",fontWeight:800}}>Prøv igen</button>
                <button onClick={() => window.location.href = "/?student=1"} style={{padding:"9px 13px",borderRadius:9,border:0,background:"white",color:"#273f35",fontWeight:800}}>Til mine opgaver</button>
              </div>
            </div>}
        </>}
      </>}
    </section>
  </main>;
}