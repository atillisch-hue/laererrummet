"use client";

import { useEffect, useMemo, useState } from "react";
import { freeTrainingQuestions } from "../../lib/freeTrainingQuestions";
import { studentSupabase } from "../../lib/studentSupabase";
import { clearStudentSession, getStudentSessionToken } from "../../lib/studentSession";
import { extraLibrary as grammarLibraryExtra } from "./grammar-library";
import { coreGrammarLibrary } from "./core-library";
import { extraLibrary as expandedGrammarLibrary } from "./extraLibrary";
import { advancedLibrary } from "./grammar-advanced";
import { advancedExtraLibrary } from "./advanced-extra";
import { interactiveGrammarLibrary, type InteractiveGrammarQuestion } from "./interactive-library";
import { foundationGrammarLibrary } from "./foundation-library";
import { foundationExtraGrammarLibrary } from "./foundation-extra";
import {
  filterLevelsForGrade,
  gradeBandLabel,
  prerequisiteTopicForGrade,
  tagLibraryForGrades,
  type GradedGrammarLibrary,
  type GradedGrammarQuestion,
} from "./grade-progression";
import {
  isWrittenQuestion,
  prepareAdaptiveRetry,
  prepareRound,
  questionKey,
  uniqueQuestions,
} from "./round-selection";

type IQ = GradedGrammarQuestion;
type GrammarLibrary = GradedGrammarLibrary;

function normalizeStudentText(value: string) {
  return value
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("da-DK")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1");
}

function answerIsCorrect(question: IQ, value = "") {
  const normalized = normalizeStudentText(value);
  const accepted = question.acceptedAnswers?.length ? question.acceptedAnswers : [question.answer];
  return accepted.some((answer) => normalizeStudentText(answer) === normalized);
}

function normalizeQuestion(question: IQ): IQ {
  if (isWrittenQuestion(question)) return { ...question, options: [] };
  const options = Array.from(new Set(question.options));
  if (!options.includes(question.answer)) {
    if (options.length >= 4) options[options.length - 1] = question.answer;
    else options.push(question.answer);
  }
  return { ...question, kind: question.kind || "choice", options };
}

function mergeLibraries(...sources: GrammarLibrary[]): GrammarLibrary {
  const merged: GrammarLibrary = {};
  for (const source of sources) {
    for (const [topic, levels] of Object.entries(source)) {
      merged[topic] ||= {};
      for (const [level, questions] of Object.entries(levels)) {
        const existing = merged[topic][level] || [];
        merged[topic][level] = uniqueQuestions([...existing, ...questions.map(normalizeQuestion)]);
      }
    }
  }
  return merged;
}

function freeTrainingAsAssignedGrammar(): Record<string, Record<string, InteractiveGrammarQuestion[]>> {
  const result: Record<string, Record<string, InteractiveGrammarQuestion[]>> = {};
  const subject = freeTrainingQuestions["dansk-grammatik"] || {};

  for (const area of Object.values(subject)) {
    for (const [topic, levels] of Object.entries(area)) {
      result[topic] ||= {};
      const basis = [...(levels.start || []), ...(levels.basis || [])];
      if (basis.length) result[topic].basis = basis;
      if (levels.traening?.length) result[topic].traening = levels.traening;
      if (levels.udfordring?.length) result[topic].udfordring = levels.udfordring;
    }
  }

  return result;
}

const library = mergeLibraries(
  foundationGrammarLibrary,
  foundationExtraGrammarLibrary,
  tagLibraryForGrades(coreGrammarLibrary, 5),
  tagLibraryForGrades(grammarLibraryExtra, 5),
  tagLibraryForGrades(expandedGrammarLibrary, 5),
  tagLibraryForGrades(advancedLibrary, 7),
  tagLibraryForGrades(advancedExtraLibrary, 5),
  tagLibraryForGrades(interactiveGrammarLibrary, 5),
  tagLibraryForGrades(freeTrainingAsAssignedGrammar(), 5)
);

function chooseLevelPool(levels: Record<string, IQ[]>, assignedLevel: string) {
  if (levels[assignedLevel]?.length) return levels[assignedLevel];
  const order = assignedLevel === "basis"
    ? ["traening", "udfordring"]
    : assignedLevel === "udfordring"
      ? ["traening", "basis"]
      : ["basis", "udfordring"];
  return order.map((level) => levels[level] || []).find((pool) => pool.length > 0) || [];
}

export default function StudentGrammar() {
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState("");
  const [assignment, setAssignment] = useState<any>(null);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<IQ[]>([]);
  const [seenQuestionKeys, setSeenQuestionKeys] = useState<string[]>([]);
  const [roundNumber, setRoundNumber] = useState(1);
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

  const prerequisiteTopic = useMemo(
    () => assignment ? prerequisiteTopicForGrade(assignment.topic, assignment.grade_level, assignment.level) : null,
    [assignment]
  );
  const activeTopic = prerequisiteTopic || assignment?.topic || "";
  const rawTopicLevels = useMemo<Record<string, IQ[]>>(() => activeTopic ? library[activeTopic] || {} : {}, [activeTopic]);
  const topicLevels = useMemo<Record<string, IQ[]>>(
    () => assignment ? filterLevelsForGrade(rawTopicLevels, assignment.grade_level, assignment.level) : {},
    [assignment, rawTopicLevels]
  );
  const questionPool = useMemo(() => assignment ? chooseLevelPool(topicLevels, assignment.level) : [], [assignment, topicLevels]);
  const topicPool = useMemo(() => uniqueQuestions(Object.values(topicLevels).flat()), [topicLevels]);

  useEffect(() => {
    if (!assignment || questionPool.length === 0) return;

    const persistedSeen = new Set<string>(Array.isArray(assignment.seen_question_keys) ? assignment.seen_question_keys : []);
    const persistedLastRound = new Set<string>(Array.isArray(assignment.last_question_keys) ? assignment.last_question_keys : []);
    const previousAttempts = Number(assignment.attempts || 0);
    const previousScore = Number(assignment.score || 0);
    const initial = persistedSeen.size > 0
      ? prepareAdaptiveRetry(questionPool, topicLevels, assignment.level, previousScore, persistedSeen, persistedLastRound)
      : prepareRound(questionPool, persistedSeen);

    setQuestions(initial);
    setSeenQuestionKeys(Array.from(new Set([...persistedSeen, ...initial.map(questionKey)])));
    setRoundNumber(Math.max(1, previousAttempts + 1));
    setAnswers({});
    setSubmitted(false);
    setSaveState("");
  }, [assignment, questionPool, topicLevels]);

  const score = questions.filter((question, index) => answerIsCorrect(question, answers[index])).length;
  const allCorrect = questions.length > 0 && score === questions.length;
  const unseenCount = topicPool.filter((question) => !seenQuestionKeys.includes(questionKey(question))).length;
  const answeredCount = questions.filter((_, index) => Boolean(answers[index]?.trim())).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  async function submit() {
    if (!assignment || !sessionToken || !allAnswered) return;
    setSubmitted(true);
    setSaving(true);
    setSaveState("Gemmer resultat…");

    const answerSnapshot = Object.fromEntries(questions.map((question, index) => [index, {
      question: question.q,
      studentAnswer: answers[index],
      correctAnswer: question.answer,
      correct: answerIsCorrect(question, answers[index]),
      explanation: question.why,
      round: roundNumber,
      kind: question.kind || "choice",
      trainedTopic: activeTopic,
      assignedTopic: assignment.topic
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
      if (Array.isArray(data.seen_question_keys)) {
        setSeenQuestionKeys((current) => Array.from(new Set([...current, ...data.seen_question_keys])));
      }
      setSaveState(`Resultatet er gemt ✓${data.attempts ? ` · Forsøg ${data.attempts}` : ""}`);
    }
    setSaving(false);
  }

  function retryWithFreshQuestions() {
    const seen = new Set(seenQuestionKeys);
    const currentRound = new Set(questions.map(questionKey));
    const next = prepareAdaptiveRetry(questionPool, topicLevels, assignment.level, score, seen, currentRound);
    const nextKeys = next.map(questionKey);
    setQuestions(next);
    setSeenQuestionKeys((current) => Array.from(new Set([...current, ...nextKeys])));
    setRoundNumber((current) => current + 1);
    setAnswers({});
    setSubmitted(false);
    setSaveState("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        <p style={{fontSize:18,color:"#707670",lineHeight:1.55}}>Arbejd dig gennem opgaverne. Nogle løses ved at vælge, andre ved at skrive eller rette selv. Opgaverne er valgt til dit klassetrin, og Udfordring kan løfte dig lidt videre.</p>
        {assignment.grade_level !== null && assignment.grade_level !== undefined && <span style={{display:"inline-block",marginTop:4,padding:"6px 10px",borderRadius:999,background:"#e7eee9",color:"#486b59",fontSize:12,fontWeight:900}}>TILPASSET · {Number(assignment.grade_level)}. klasse · {gradeBandLabel(Number(assignment.grade_level))}</span>}
        {prerequisiteTopic && <div style={{marginTop:14,padding:"12px 14px",borderRadius:10,background:"#fff7e8",border:"1px solid #ead8ad",color:"#665431",lineHeight:1.5}}><strong>Du bygger fundament først</strong><br />Emnet <strong>{assignment.topic}</strong> ligger normalt senere i progressionen. Derfor træner du først <strong>{prerequisiteTopic}</strong>, som gør dig klar til næste skridt.</div>}
        {topicPool.length > questions.length && <p style={{fontSize:14,color:"#718077",fontWeight:700}}>Runde {roundNumber} · {questions.length} spørgsmål · {topicPool.length} passende spørgsmål i emnebanken</p>}

        {questions.length === 0 ? <div style={{marginTop:30,background:"white",padding:28,borderRadius:14,border:"1px solid #ddd9d0"}}><h2>{assignment.topic}</h2><p>{assignment.grade_level === null || assignment.grade_level === undefined ? "Opgaver til dette emne er på vej." : "Der er endnu ikke et passende forberedende sæt til dette klassetrin. Din lærer kan vælge et tidligere emne."}</p></div> : <>
          <div style={{display:"grid",gap:16,marginTop:28}}>
            {questions.map((question, index) => {
              const correctNow = submitted && answerIsCorrect(question, answers[index]);
              return <article key={`${roundNumber}-${questionKey(question)}`} style={{background:"white",padding:24,borderRadius:14,border:"1px solid #ddd9d0"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{fontSize:11,fontWeight:800,letterSpacing:1.4,color:"#718077"}}>OPGAVE {index + 1} AF {questions.length}</div>
                  {isWrittenQuestion(question) && <span style={{fontSize:11,fontWeight:900,color:"#526b60",background:"#edf1ec",padding:"5px 8px",borderRadius:999}}>{question.kind === "rewrite" ? "RET SELV" : "SKRIV SELV"}</span>}
                </div>
                <h2 style={{fontFamily:"Georgia,serif",fontSize:22,lineHeight:1.35,margin:"10px 0 16px"}}>{question.q}</h2>

                {isWrittenQuestion(question) ?
                  question.kind === "rewrite" ? <textarea disabled={submitted} value={answers[index] || ""} onChange={(event) => setAnswers((current) => ({...current,[index]:event.target.value}))} placeholder={question.placeholder || "Skriv dit svar…"} rows={3} style={{width:"100%",boxSizing:"border-box",padding:"13px 14px",borderRadius:9,border:`2px solid ${submitted ? (correctNow ? "#5f8068" : "#b86b62") : "#d8d5cd"}`,background:submitted ? (correctNow ? "#edf5ef" : "#fff0ed") : "white",font:"inherit",fontSize:16,lineHeight:1.5,resize:"vertical"}} />
                  : <input disabled={submitted} value={answers[index] || ""} onChange={(event) => setAnswers((current) => ({...current,[index]:event.target.value}))} placeholder={question.placeholder || "Skriv dit svar…"} style={{width:"100%",boxSizing:"border-box",padding:"13px 14px",borderRadius:9,border:`2px solid ${submitted ? (correctNow ? "#5f8068" : "#b86b62") : "#d8d5cd"}`,background:submitted ? (correctNow ? "#edf5ef" : "#fff0ed") : "white",font:"inherit",fontSize:16}} />
                  : <div style={{display:"grid",gap:8}}>
                    {question.options.map((option) => {
                      const chosen = answers[index] === option;
                      const correct = submitted && option === question.answer;
                      const wrong = submitted && chosen && option !== question.answer;
                      return <button key={option} disabled={submitted} onClick={() => setAnswers((current) => ({...current,[index]:option}))} style={{padding:"12px 14px",textAlign:"left",borderRadius:9,border:`2px solid ${correct ? "#5f8068" : wrong ? "#b86b62" : chosen ? "#526b60" : "#e1ddd5"}`,background:correct ? "#edf5ef" : wrong ? "#fff0ed" : chosen ? "#edf1ec" : "#fff",fontWeight:chosen || correct ? 800 : 600,cursor:submitted ? "default" : "pointer"}}>{option}</button>;
                    })}
                  </div>}

                {submitted && <div style={{marginTop:14,padding:"12px 14px",borderRadius:9,background:correctNow ? "#edf5ef" : "#fff7e8",lineHeight:1.5}}>
                  <strong>{correctNow ? "Rigtigt ✓" : "Ikke helt endnu"}</strong>
                  {!correctNow && isWrittenQuestion(question) && <><br /><span style={{color:"#59615c"}}>Et korrekt svar er: <strong>{question.answer}</strong></span></>}
                  <br />{question.why}
                </div>}
              </article>;
            })}
          </div>

          {!submitted ? <button disabled={!allAnswered || saving} onClick={submit} style={{marginTop:22,width:"100%",padding:"14px 18px",border:0,borderRadius:10,background:"#365044",color:"white",fontWeight:800,fontSize:16,opacity:!allAnswered ? .45 : 1,cursor:!allAnswered ? "not-allowed" : "pointer"}}>Ret mine svar</button> :
            <div style={{marginTop:22,padding:24,borderRadius:14,background:"#273f35",color:"white",textAlign:"center"}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:32,fontWeight:800}}>{score} / {questions.length}</div>
              <p>{allCorrect ? "Flot, alle rigtige. Du har styr på denne runde." : score >= Math.ceil(questions.length * .6) ? "Godt arbejde. Kig på forklaringerne, og prøv et nyt sæt, så du får trænet det, der drillede." : "Kig på forklaringerne og prøv et nyt sæt. Det er sådan træning virker."}</p>
              <small>{saveState}</small>
              {!allCorrect && unseenCount > 0 && <p style={{fontSize:13,opacity:.8,marginBottom:0}}>{unseenCount} usete, passende spørgsmål er klar i emnet.</p>}
              <div style={{marginTop:14,display:"flex",gap:9,justifyContent:"center",flexWrap:"wrap"}}>
                {!allCorrect && <button onClick={retryWithFreshQuestions} style={{padding:"9px 13px",borderRadius:9,border:"1px solid rgba(255,255,255,.35)",background:"transparent",color:"white",fontWeight:800}}>{unseenCount > 0 ? "Prøv igen med nye spørgsmål" : "Træn en ny blanding"}</button>}
                <button onClick={() => window.location.href = "/?student=1"} style={{padding:"9px 13px",borderRadius:9,border:0,background:"white",color:"#273f35",fontWeight:800}}>Til mine opgaver</button>
              </div>
            </div>}
        </>}
      </>}
    </section>
  </main>;
}
