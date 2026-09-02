"use client";

import { useEffect, useMemo, useState } from "react";
import { freeTrainingQuestions } from "../../lib/freeTrainingQuestions";
import { studentSupabase } from "../../lib/studentSupabase";
import { clearStudentSession, getStudentSessionToken } from "../../lib/studentSession";
import { extraLibrary as grammarLibraryExtra, type GrammarQuestion as Q } from "./grammar-library";
import { coreGrammarLibrary } from "./core-library";
import { extraLibrary as expandedGrammarLibrary } from "./extraLibrary";
import { advancedLibrary } from "./grammar-advanced";
import { advancedExtraLibrary } from "./advanced-extra";

type GrammarLibrary = Record<string, Record<string, Q[]>>;

const ROUND_SIZE = 5;

function questionKey(question: Q) {
  return `${question.q}::${question.answer}`;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeQuestion(question: Q): Q {
  const options = Array.from(new Set(question.options));
  if (!options.includes(question.answer)) {
    if (options.length >= 4) options[options.length - 1] = question.answer;
    else options.push(question.answer);
  }
  return { ...question, options };
}

function uniqueQuestions(questions: Q[]) {
  const byKey = new Map<string, Q>();
  for (const question of questions) byKey.set(questionKey(question), question);
  return Array.from(byKey.values());
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

function freeTrainingAsAssignedGrammar(): GrammarLibrary {
  const result: GrammarLibrary = {};
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
  coreGrammarLibrary,
  grammarLibraryExtra,
  expandedGrammarLibrary,
  advancedLibrary,
  advancedExtraLibrary,
  freeTrainingAsAssignedGrammar()
);

function prepareRound(pool: Q[], excludedKeys: Set<string>) {
  const fresh = shuffle(pool.filter((question) => !excludedKeys.has(questionKey(question))));
  const needed = Math.min(ROUND_SIZE, pool.length);
  let selected = fresh.slice(0, needed);

  if (selected.length < needed) {
    const selectedKeys = new Set(selected.map(questionKey));
    const fallback = shuffle(pool.filter((question) => !selectedKeys.has(questionKey(question))));
    selected = [...selected, ...fallback.slice(0, needed - selected.length)];
  }

  return selected.map((question) => ({ ...question, options: shuffle(question.options) }));
}

function prepareAdaptiveRetry(primaryPool: Q[], topicLevels: Record<string, Q[]>, assignedLevel: string, score: number, excludedKeys: Set<string>) {
  const needed = Math.min(ROUND_SIZE, uniqueQuestions(Object.values(topicLevels).flat()).length);
  const selected: Q[] = [];

  const addFreshFrom = (pool: Q[]) => {
    const alreadySelected = new Set(selected.map(questionKey));
    const candidates = shuffle(pool.filter((question) => !excludedKeys.has(questionKey(question)) && !alreadySelected.has(questionKey(question))));
    selected.push(...candidates.slice(0, Math.max(0, needed - selected.length)));
  };

  addFreshFrom(primaryPool);

  const supportOrder = assignedLevel === "basis"
    ? ["traening", "udfordring"]
    : assignedLevel === "udfordring"
      ? ["traening", "basis"]
      : score < Math.ceil(ROUND_SIZE * 0.6)
        ? ["basis", "udfordring"]
        : ["udfordring", "basis"];

  for (const level of supportOrder) {
    if (selected.length >= needed) break;
    addFreshFrom(topicLevels[level] || []);
  }

  if (selected.length < needed) {
    const allTopicQuestions = uniqueQuestions(Object.values(topicLevels).flat());
    const selectedKeys = new Set(selected.map(questionKey));
    const repeatFallback = shuffle(allTopicQuestions.filter((question) => !selectedKeys.has(questionKey(question))));
    selected.push(...repeatFallback.slice(0, needed - selected.length));
  }

  return selected.map((question) => ({ ...question, options: shuffle(question.options) }));
}

export default function StudentGrammar() {
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState("");
  const [assignment, setAssignment] = useState<any>(null);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Q[]>([]);
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

  const topicLevels = useMemo<Record<string, Q[]>>(() => assignment ? library[assignment.topic] || {} : {}, [assignment]);
  const questionPool = useMemo(() => assignment ? topicLevels[assignment.level] || [] : [], [assignment, topicLevels]);
  const topicPool = useMemo(() => uniqueQuestions(Object.values(topicLevels).flat()), [topicLevels]);

  useEffect(() => {
    if (!assignment || questionPool.length === 0) return;
    const initial = prepareRound(questionPool, new Set());
    setQuestions(initial);
    setSeenQuestionKeys(initial.map(questionKey));
    setRoundNumber(1);
    setAnswers({});
    setSubmitted(false);
    setSaveState("");
  }, [assignment, questionPool]);

  const score = questions.filter((question, index) => answers[index] === question.answer).length;
  const allCorrect = questions.length > 0 && score === questions.length;
  const unseenCount = topicPool.filter((question) => !seenQuestionKeys.includes(questionKey(question))).length;

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
      explanation: question.why,
      round: roundNumber
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
      setSaveState(`Resultatet er gemt ✓${data.attempts ? ` · Forsøg ${data.attempts}` : ""}`);
    }
    setSaving(false);
  }

  function retryWithFreshQuestions() {
    const seen = new Set(seenQuestionKeys);
    const next = prepareAdaptiveRetry(questionPool, topicLevels, assignment.level, score, seen);
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
        <p style={{fontSize:18,color:"#707670",lineHeight:1.55}}>Arbejd dig gennem opgaverne. Når du retter, får du både svar og forklaring. Hvis noget driller, får du et nyt sæt spørgsmål fra samme emne at træne videre med.</p>
        {topicPool.length > questions.length && <p style={{fontSize:14,color:"#718077",fontWeight:700}}>Runde {roundNumber} · {questions.length} spørgsmål · {questionPool.length} på dit niveau · {topicPool.length} i emnebanken</p>}

        {questions.length === 0 ? <div style={{marginTop:30,background:"white",padding:28,borderRadius:14,border:"1px solid #ddd9d0"}}><h2>{assignment.topic}</h2><p>Opgaver til dette emne er på vej.</p></div> : <>
          <div style={{display:"grid",gap:16,marginTop:28}}>
            {questions.map((question, index) => <article key={`${roundNumber}-${questionKey(question)}`} style={{background:"white",padding:24,borderRadius:14,border:"1px solid #ddd9d0"}}>
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
              <p>{allCorrect ? "Flot, alle rigtige. Du har styr på denne runde." : score >= Math.ceil(questions.length * .6) ? "Godt arbejde. Kig på forklaringerne, og prøv et nyt sæt, så du får trænet det, der drillede." : "Kig på forklaringerne og prøv et nyt sæt. Det er sådan træning virker."}</p>
              <small>{saveState}</small>
              {!allCorrect && unseenCount > 0 && <p style={{fontSize:13,opacity:.8,marginBottom:0}}>{unseenCount} usete spørgsmål er klar i emnet.</p>}
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