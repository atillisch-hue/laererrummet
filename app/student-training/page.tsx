"use client";

import { useEffect, useMemo, useState } from "react";
import { studentSupabase } from "../../lib/studentSupabase";
import { trainingCatalog } from "../../lib/trainingCatalog";
import { freeTrainingQuestions, type TrainingQuestion } from "../../lib/freeTrainingQuestions";
import { clearStudentSession, getStudentSessionToken } from "../../lib/studentSession";

type ProgressEntry = { attempts: number; best: number; total: number; lastScore: number; updatedAt: string };
type Progress = Record<string, ProgressEntry>;

export default function StudentTraining() {
  const [ready, setReady] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [studentId, setStudentId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState("dansk-grammatik");
  const [areaId, setAreaId] = useState<string | null>(null);
  const [skill, setSkill] = useState<string | null>(null);
  const [levelId, setLevelId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState<Progress>({});
  const [saveState, setSaveState] = useState("");

  useEffect(() => {
    (async () => {
      const token = getStudentSessionToken();
      if (!token) {
        window.location.href = "/?student=1";
        return;
      }

      const { data: studentData, error: studentError } = await studentSupabase.rpc("student_session_data", { p_session_token: token });
      if (studentError || !studentData?.ok || !studentData.student?.id) {
        clearStudentSession();
        window.location.href = "/?student=1";
        return;
      }

      const id = Number(studentData.student.id);
      setSessionToken(token);
      setStudentId(id);

      let local: Progress = {};
      try {
        local = JSON.parse(localStorage.getItem(`klassevaerelset-training-${id}`) || "{}");
      } catch {
        local = {};
      }

      const { data: cloudRows } = await studentSupabase.rpc("get_student_training_progress_session", { p_session_token: token });
      const cloud: Progress = {};
      ((cloudRows || []) as any[]).forEach((row) => {
        const key = [row.subject_id, row.area_id, row.skill_id, row.level_id].join("|");
        cloud[key] = {
          attempts: Number(row.attempts || 0),
          best: Number(row.best_score || 0),
          total: Number(row.max_score || 0),
          lastScore: Number(row.last_score || 0),
          updatedAt: row.last_attempt_at || new Date(0).toISOString()
        };
      });

      const merged: Progress = { ...local, ...cloud };
      setProgress(merged);
      localStorage.setItem(`klassevaerelset-training-${id}`, JSON.stringify(merged));

      const requestedSubject = new URLSearchParams(window.location.search).get("subject");
      if (requestedSubject && trainingCatalog.some((item) => item.id === requestedSubject)) setSubjectId(requestedSubject);
      setReady(true);
    })();
  }, []);

  const subject = useMemo(() => trainingCatalog.find((item) => item.id === subjectId) ?? trainingCatalog[0], [subjectId]);
  const area = subject?.areas.find((item) => item.id === areaId);
  const skillBank = skill && areaId ? freeTrainingQuestions[subjectId]?.[areaId]?.[skill] ?? {} : {};
  const questions: TrainingQuestion[] = levelId ? skillBank[levelId] ?? [] : [];
  const score = questions.filter((question, index) => answers[index] === question.answer).length;
  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;
  const runKey = subjectId && areaId && skill && levelId ? [subjectId, areaId, skill, levelId].join("|") : "";

  const subjectStats = useMemo(() => {
    let available = 0, tried = 0, safe = 0;
    subject.areas.forEach((a) => a.skills.forEach((s) => Object.keys(freeTrainingQuestions[subjectId]?.[a.id]?.[s] ?? {}).forEach((l) => {
      available++;
      const item = progress[[subjectId, a.id, s, l].join("|")];
      if (item) {
        tried++;
        if (item.total && item.best === item.total) safe++;
      }
    })));
    return { available, tried, safe };
  }, [subject, subjectId, progress]);

  const recommendation = useMemo(() => {
    const candidates: {areaId:string;areaTitle:string;skill:string;levelId:string;levelTitle:string;rank:number}[] = [];
    subject.areas.forEach((a) => a.skills.forEach((s) => subject.levels.forEach((level, index) => {
      if (!(freeTrainingQuestions[subjectId]?.[a.id]?.[s]?.[level.id] ?? []).length) return;
      const item = progress[[subjectId, a.id, s, level.id].join("|")];
      const pct = item?.total ? item.best / item.total : -1;
      const rank = !item ? 20 + index : pct < .6 ? index : pct < 1 ? 10 + index : 100 + index;
      candidates.push({areaId:a.id,areaTitle:a.title,skill:s,levelId:level.id,levelTitle:level.title,rank});
    })));
    return candidates.sort((a, b) => a.rank - b.rank)[0] ?? null;
  }, [subject, subjectId, progress]);

  function persist(next: Progress) {
    setProgress(next);
    if (studentId) localStorage.setItem(`klassevaerelset-training-${studentId}`, JSON.stringify(next));
  }

  function resetRun() {
    setAnswers({});
    setSubmitted(false);
    setSaveState("");
  }

  async function saveResult() {
    if (!runKey || !studentId || !sessionToken || questions.length === 0) return;
    const old = progress[runKey];
    let nextEntry: ProgressEntry = {
      attempts: (old?.attempts ?? 0) + 1,
      best: Math.max(old?.best ?? 0, score),
      total: questions.length,
      lastScore: score,
      updatedAt: new Date().toISOString()
    };
    persist({ ...progress, [runKey]: nextEntry });
    setSubmitted(true);
    setSaveState("Gemmer i skyen…");

    const answerSnapshot = Object.fromEntries(questions.map((question, index) => [index, {
      question: question.q,
      studentAnswer: answers[index],
      correctAnswer: question.answer,
      correct: answers[index] === question.answer,
      explanation: question.why
    }]));

    const { data, error } = await studentSupabase.rpc("save_student_training_attempt_session", {
      p_session_token: sessionToken,
      p_subject_id: subjectId,
      p_area_id: areaId,
      p_skill_id: skill,
      p_level_id: levelId,
      p_answers: answerSnapshot,
      p_score: score,
      p_max_score: questions.length
    });

    if (error || !data?.ok) {
      if (data?.error === "invalid_session") clearStudentSession();
      setSaveState("Gemt på denne enhed. Skyen kunne ikke opdateres.");
      return;
    }

    nextEntry = {
      attempts: Number(data.attempts || nextEntry.attempts),
      best: Number(data.best_score ?? nextEntry.best),
      total: Number(data.max_score ?? nextEntry.total),
      lastScore: Number(data.last_score ?? score),
      updatedAt: new Date().toISOString()
    };
    persist({ ...progress, [runKey]: nextEntry });
    setSaveState("Resultatet er gemt i skyen ✓");
  }

  function goBack() {
    if (levelId) { setLevelId(null); resetRun(); return; }
    if (skill) { setSkill(null); resetRun(); return; }
    if (areaId) { setAreaId(null); return; }
    window.location.href = "/?student=1";
  }

  function chooseSubject(nextSubjectId: string) {
    setSubjectId(nextSubjectId);
    setAreaId(null); setSkill(null); setLevelId(null); resetRun();
    window.history.replaceState(null, "", `/student-training?subject=${nextSubjectId}`);
  }

  function chooseSkill(nextSkill: string) {
    if (!areaId) return;
    const levels = freeTrainingQuestions[subjectId]?.[areaId]?.[nextSkill] ?? {};
    if (!Object.keys(levels).length) return;
    setSkill(nextSkill); setLevelId(null); resetRun();
  }

  function startRecommendation() {
    if (!recommendation) return;
    setAreaId(recommendation.areaId); setSkill(recommendation.skill); setLevelId(recommendation.levelId); resetRun();
  }

  function statusFor(key: string) {
    const item = progress[key];
    if (!item) return null;
    const pct = item.total ? item.best / item.total : 0;
    return pct === 1 ? "Sikker ✓" : pct >= .6 ? "Godt på vej" : "Øv igen";
  }

  if (!ready || !subject) return <main style={{padding:50}}>Åbner træning…</main>;

  const title = levelId ? `${skill} · ${subject.levels.find((item) => item.id === levelId)?.title ?? levelId}` : skill ?? area?.title ?? subject.title;
  const backLabel = levelId ? skill : skill ? area?.title : areaId ? subject.title : "Mit Klasseværelse";

  return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"36px 24px 80px",color:"#26342e",fontFamily:"Arial,sans-serif"}}>
    <section style={{maxWidth:1000,margin:"0 auto"}}>
      <button onClick={goBack} style={{border:0,background:"transparent",color:"#526b60",fontWeight:800,cursor:"pointer",padding:0}}>← {backLabel}</button>
      <p style={{marginTop:34,fontSize:11,fontWeight:800,letterSpacing:1.7,color:"#718077"}}>TRÆN SELV · {subject.title.toUpperCase()}</p>
      <h1 style={{fontFamily:"Georgia,serif",fontSize:42,margin:"7px 0"}}>{title}</h1>
      <p style={{fontSize:17,color:"#707670",lineHeight:1.55,maxWidth:720}}>{levelId ? "Tag fem opgaver i dit eget tempo. Når du retter, får du forklaringen med." : skill ? "Vælg det niveau, der passer til det, du vil øve. Dine resultater følger nu din elevsession." : area?.description ?? subject.description}</p>

      {levelId ? <>
        <div style={{display:"grid",gap:14,marginTop:25}}>
          {questions.map((item, index) => <article key={`${levelId}-${index}`} style={{background:"#fff",border:"1px solid #d8d5cd",borderRadius:14,padding:22}}>
            <small style={{fontWeight:800,color:"#718077",letterSpacing:1}}>OPGAVE {index + 1} AF {questions.length}</small>
            <h2 style={{fontFamily:"Georgia,serif",fontSize:21,margin:"9px 0 14px"}}>{item.q}</h2>
            <div style={{display:"grid",gap:7}}>
              {item.options.map((option) => {
                const chosen = answers[index] === option;
                const correct = submitted && option === item.answer;
                const wrong = submitted && chosen && option !== item.answer;
                return <button key={option} disabled={submitted} onClick={() => setAnswers((current) => ({...current,[index]:option}))} style={{padding:"11px 13px",textAlign:"left",borderRadius:9,border:`2px solid ${correct ? "#5f8068" : wrong ? "#b86b62" : chosen ? "#526b60" : "#e1ddd5"}`,background:correct ? "#edf5ef" : wrong ? "#fff0ed" : chosen ? "#edf1ec" : "#fff",fontWeight:chosen || correct ? 800 : 600,cursor:submitted ? "default" : "pointer"}}>{option}</button>;
              })}
            </div>
            {submitted && <div style={{marginTop:12,padding:"11px 13px",borderRadius:9,background:answers[index] === item.answer ? "#edf5ef" : "#fff7e8",lineHeight:1.45}}><strong>{answers[index] === item.answer ? "Rigtigt ✓" : "Ikke helt"}</strong><br />{item.why}</div>}
          </article>)}
        </div>
        {!submitted ? <button disabled={!allAnswered} onClick={saveResult} style={{marginTop:18,width:"100%",padding:14,border:0,borderRadius:10,background:"#365044",color:"#fff",fontWeight:800,fontSize:16,opacity:allAnswered ? 1 : .45,cursor:allAnswered ? "pointer" : "not-allowed"}}>Ret mine svar</button> :
          <div style={{marginTop:18,background:"#273f35",color:"#fff",borderRadius:14,padding:22,textAlign:"center"}}>
            <strong style={{fontFamily:"Georgia,serif",fontSize:28}}>{score} / {questions.length}</strong>
            <p style={{margin:"7px 0"}}>{score === questions.length ? "Flot, alle rigtige. Du er klar til at gå videre." : score >= 3 ? "Godt arbejde. Kig på forklaringerne til dem, der drillede." : "Kig på forklaringerne og prøv igen. Det er sådan træning virker."}</p>
            <small>{saveState}</small><br />
            <button onClick={resetRun} style={{marginTop:14,padding:"10px 14px",borderRadius:9,border:"1px solid rgba(255,255,255,.35)",background:"transparent",color:"#fff",fontWeight:800,cursor:"pointer"}}>Prøv igen</button>
          </div>}
      </> : skill ?
        <div style={{display:"grid",gap:10,marginTop:24}}>{subject.levels.map((level) => {
          const available = (skillBank[level.id] ?? []).length > 0;
          const key = [subjectId, areaId, skill, level.id].join("|");
          const stat = statusFor(key);
          return <button key={level.id} disabled={!available} onClick={() => {setLevelId(level.id);resetRun();}} style={{textAlign:"left",background:available ? "#fff" : "#f8f6f1",border:"1px solid #d8d5cd",borderRadius:13,padding:"17px 19px",cursor:available ? "pointer" : "default",opacity:available ? 1 : .55,color:"#26342e"}}><div style={{display:"flex",justifyContent:"space-between",gap:15,alignItems:"center"}}><div><strong style={{fontSize:18}}>{level.title}</strong><small style={{display:"block",marginTop:4,color:"#777"}}>{level.stage} · {level.description}</small>{stat && <small style={{display:"block",marginTop:6,color:"#526b60",fontWeight:800}}>{stat} · bedste {progress[key].best}/{progress[key].total}</small>}</div><b style={{color:"#526b60",fontSize:13}}>{available ? stat ? "Træn igen →" : "Start →" : "På vej"}</b></div></button>;
        })}</div> : !area ? <>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"22px 0"}}>{trainingCatalog.map((item) => <button key={item.id} onClick={() => chooseSubject(item.id)} style={{border:item.id === subjectId ? "2px solid #526b60" : "1px solid #d8d5cd",background:item.id === subjectId ? "#edf1ec" : "#fff",borderRadius:999,padding:"9px 13px",fontWeight:800,cursor:"pointer"}}>{item.title}</button>)}</div>
          {recommendation && <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:18,alignItems:"center",background:"#273f35",color:"white",borderRadius:15,padding:"19px 21px",marginBottom:14}}><div><small style={{fontWeight:900,letterSpacing:1,opacity:.75}}>MIT NÆSTE SKRIDT</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:21,marginTop:5}}>{recommendation.skill} · {recommendation.levelTitle}</strong><span style={{display:"block",marginTop:4,opacity:.82,fontSize:14}}>{recommendation.areaTitle} · valgt ud fra det, du allerede har trænet</span></div><button onClick={startRecommendation} style={{border:0,borderRadius:9,padding:"11px 14px",background:"white",color:"#273f35",fontWeight:900,cursor:"pointer"}}>Træn nu →</button></div>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}><span style={{background:"#fff",border:"1px solid #ddd9d0",borderRadius:999,padding:"7px 10px",fontSize:12,fontWeight:800}}>{subjectStats.tried} niveauer prøvet</span><span style={{background:"#edf1ec",borderRadius:999,padding:"7px 10px",fontSize:12,fontWeight:800}}>{subjectStats.safe} sikre</span><span style={{background:"#fff",border:"1px solid #ddd9d0",borderRadius:999,padding:"7px 10px",fontSize:12,fontWeight:800}}>{Math.max(0, subjectStats.available - subjectStats.safe)} at udforske</span></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>{subject.areas.map((item) => {
            const completed = item.skills.reduce((sum, currentSkill) => sum + Object.keys(freeTrainingQuestions[subjectId]?.[item.id]?.[currentSkill] ?? {}).filter((level) => statusFor([subjectId,item.id,currentSkill,level].join("|")) === "Sikker ✓").length, 0);
            return <button key={item.id} onClick={() => setAreaId(item.id)} style={{textAlign:"left",background:"#fff",border:"1px solid #d8d5cd",borderRadius:14,padding:20,cursor:"pointer",color:"#26342e"}}><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:23}}>{item.title}</strong><span style={{display:"block",margin:"7px 0 14px",color:"#707670",lineHeight:1.45}}>{item.description}</span><small style={{fontWeight:800,color:"#526b60"}}>{completed ? `${completed} niveau${completed === 1 ? "" : "er"} sikkert · ` : ""}Åbn →</small></button>;
          })}</div>
        </> : <>
          <div style={{display:"grid",gap:10,marginTop:24}}>{area.skills.map((areaSkill) => {
            const levels = freeTrainingQuestions[subjectId]?.[area.id]?.[areaSkill] ?? {};
            const availableLevels = Object.keys(levels);
            const safe = availableLevels.filter((level) => statusFor([subjectId,area.id,areaSkill,level].join("|")) === "Sikker ✓").length;
            return <button key={areaSkill} disabled={!availableLevels.length} onClick={() => chooseSkill(areaSkill)} style={{textAlign:"left",background:availableLevels.length ? "#fff" : "#f8f6f1",border:"1px solid #d8d5cd",borderRadius:13,padding:"17px 19px",cursor:availableLevels.length ? "pointer" : "default",opacity:availableLevels.length ? 1 : .65,color:"#26342e"}}><strong style={{fontSize:17}}>{areaSkill}</strong><small style={{display:"block",marginTop:7,color:availableLevels.length ? "#526b60" : "#8a8d88",fontWeight:700}}>{availableLevels.length ? `${availableLevels.length} niveau${availableLevels.length === 1 ? "" : "er"}${safe ? ` · ${safe} sikkert` : ""} · Vælg →` : "Flere opgaver på vej"}</small></button>;
          })}</div>
          <div style={{marginTop:24,background:"#edf1ec",borderRadius:13,padding:18,lineHeight:1.5}}><strong>Ingen klassetrin her.</strong><br /><span style={{color:"#667068"}}>Du vælger efter det, du vil træne, og kan altid gå et niveau op eller ned.</span></div>
        </>}
    </section>
  </main>;
}