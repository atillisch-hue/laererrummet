"use client";

import { useEffect, useMemo, useState } from "react";
import { trainingCatalog } from "../../lib/trainingCatalog";
import {
  freeTrainingQuestions,
  type TrainingQuestion,
} from "../../lib/freeTrainingQuestions";

export default function StudentTraining() {
  const [ready, setReady] = useState(false);
  const [subjectId, setSubjectId] = useState("dansk-grammatik");
  const [areaId, setAreaId] = useState<string | null>(null);
  const [skill, setSkill] = useState<string | null>(null);
  const [levelId, setLevelId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const code = sessionStorage.getItem("klassevaerelset-student-code");
    if (!code) {
      window.location.href = "/?student=1";
      return;
    }

    const requestedSubject = new URLSearchParams(window.location.search).get("subject");
    if (requestedSubject && trainingCatalog.some((item) => item.id === requestedSubject)) {
      setSubjectId(requestedSubject);
    }
    setReady(true);
  }, []);

  const subject = useMemo(
    () => trainingCatalog.find((item) => item.id === subjectId) ?? trainingCatalog[0],
    [subjectId]
  );

  const area = subject?.areas.find((item) => item.id === areaId);
  const skillBank =
    skill && areaId ? freeTrainingQuestions[subjectId]?.[areaId]?.[skill] ?? {} : {};
  const questions: TrainingQuestion[] = levelId ? skillBank[levelId] ?? [] : [];
  const score = questions.filter((question, index) => answers[index] === question.answer).length;
  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  function resetRun() {
    setAnswers({});
    setSubmitted(false);
  }

  function goBack() {
    if (levelId) {
      setLevelId(null);
      resetRun();
      return;
    }
    if (skill) {
      setSkill(null);
      resetRun();
      return;
    }
    if (areaId) {
      setAreaId(null);
      return;
    }
    window.location.href = "/?student=1";
  }

  function chooseSubject(nextSubjectId: string) {
    setSubjectId(nextSubjectId);
    setAreaId(null);
    setSkill(null);
    setLevelId(null);
    resetRun();
    window.history.replaceState(null, "", `/student-training?subject=${nextSubjectId}`);
  }

  function chooseSkill(nextSkill: string) {
    if (!areaId) return;
    const levels = freeTrainingQuestions[subjectId]?.[areaId]?.[nextSkill] ?? {};
    if (Object.keys(levels).length === 0) return;
    setSkill(nextSkill);
    setLevelId(null);
    resetRun();
  }

  if (!ready || !subject) {
    return <main style={{ padding: 50 }}>Åbner træning…</main>;
  }

  const title = levelId
    ? `${skill} · ${subject.levels.find((item) => item.id === levelId)?.title ?? levelId}`
    : skill ?? area?.title ?? subject.title;

  const backLabel = levelId
    ? skill
    : skill
      ? area?.title
      : areaId
        ? subject.title
        : "Mit Klasseværelse";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f3ee",
        padding: "36px 24px 80px",
        color: "#26342e",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section style={{ maxWidth: 1000, margin: "0 auto" }}>
        <button
          onClick={goBack}
          style={{
            border: 0,
            background: "transparent",
            color: "#526b60",
            fontWeight: 800,
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← {backLabel}
        </button>

        <p style={{ marginTop: 34, fontSize: 11, fontWeight: 800, letterSpacing: 1.7, color: "#718077" }}>
          TRÆN SELV · {subject.title.toUpperCase()}
        </p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 42, margin: "7px 0" }}>{title}</h1>
        <p style={{ fontSize: 17, color: "#707670", lineHeight: 1.55, maxWidth: 720 }}>
          {levelId
            ? "Tag fem opgaver i dit eget tempo. Når du retter, får du forklaringen med."
            : skill
              ? "Vælg det niveau, der passer til det, du vil øve. Du kan altid vælge et andet bagefter."
              : area?.description ?? subject.description}
        </p>

        {levelId ? (
          <>
            <div style={{ display: "grid", gap: 14, marginTop: 25 }}>
              {questions.map((item, index) => (
                <article
                  key={`${levelId}-${index}`}
                  style={{ background: "#fff", border: "1px solid #d8d5cd", borderRadius: 14, padding: 22 }}
                >
                  <small style={{ fontWeight: 800, color: "#718077", letterSpacing: 1 }}>
                    OPGAVE {index + 1} AF {questions.length}
                  </small>
                  <h2 style={{ fontFamily: "Georgia, serif", fontSize: 21, margin: "9px 0 14px" }}>
                    {item.q}
                  </h2>
                  <div style={{ display: "grid", gap: 7 }}>
                    {item.options.map((option) => {
                      const chosen = answers[index] === option;
                      const correct = submitted && option === item.answer;
                      const wrong = submitted && chosen && option !== item.answer;

                      return (
                        <button
                          key={option}
                          disabled={submitted}
                          onClick={() => setAnswers((current) => ({ ...current, [index]: option }))}
                          style={{
                            padding: "11px 13px",
                            textAlign: "left",
                            borderRadius: 9,
                            border: `2px solid ${
                              correct ? "#5f8068" : wrong ? "#b86b62" : chosen ? "#526b60" : "#e1ddd5"
                            }`,
                            background: correct ? "#edf5ef" : wrong ? "#fff0ed" : chosen ? "#edf1ec" : "#fff",
                            fontWeight: chosen || correct ? 800 : 600,
                            cursor: submitted ? "default" : "pointer",
                          }}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "11px 13px",
                        borderRadius: 9,
                        background: answers[index] === item.answer ? "#edf5ef" : "#fff7e8",
                        lineHeight: 1.45,
                      }}
                    >
                      <strong>{answers[index] === item.answer ? "Rigtigt ✓" : "Ikke helt"}</strong>
                      <br />
                      {item.why}
                    </div>
                  )}
                </article>
              ))}
            </div>

            {!submitted ? (
              <button
                disabled={!allAnswered}
                onClick={() => setSubmitted(true)}
                style={{
                  marginTop: 18,
                  width: "100%",
                  padding: 14,
                  border: 0,
                  borderRadius: 10,
                  background: "#365044",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 16,
                  opacity: allAnswered ? 1 : 0.45,
                  cursor: allAnswered ? "pointer" : "not-allowed",
                }}
              >
                Ret mine svar
              </button>
            ) : (
              <div
                style={{
                  marginTop: 18,
                  background: "#273f35",
                  color: "#fff",
                  borderRadius: 14,
                  padding: 22,
                  textAlign: "center",
                }}
              >
                <strong style={{ fontFamily: "Georgia, serif", fontSize: 28 }}>
                  {score} / {questions.length}
                </strong>
                <p style={{ margin: "7px 0 14px" }}>
                  {score === questions.length
                    ? "Flot – alle rigtige."
                    : score >= 3
                      ? "Godt arbejde. Kig på forklaringerne til dem, der drillede."
                      : "Kig på forklaringerne og prøv igen – det er sådan træning virker."}
                </p>
                <button
                  onClick={resetRun}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 9,
                    border: "1px solid rgba(255,255,255,.35)",
                    background: "transparent",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Prøv igen
                </button>
              </div>
            )}
          </>
        ) : skill ? (
          <div style={{ display: "grid", gap: 10, marginTop: 24 }}>
            {subject.levels.map((level) => {
              const available = (skillBank[level.id] ?? []).length > 0;
              return (
                <button
                  key={level.id}
                  disabled={!available}
                  onClick={() => {
                    setLevelId(level.id);
                    resetRun();
                  }}
                  style={{
                    textAlign: "left",
                    background: available ? "#fff" : "#f8f6f1",
                    border: "1px solid #d8d5cd",
                    borderRadius: 13,
                    padding: "17px 19px",
                    cursor: available ? "pointer" : "default",
                    opacity: available ? 1 : 0.55,
                    color: "#26342e",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 15, alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: 18 }}>{level.title}</strong>
                      <small style={{ display: "block", marginTop: 4, color: "#777" }}>
                        {level.stage} · {level.description}
                      </small>
                    </div>
                    <b style={{ color: "#526b60", fontSize: 13 }}>{available ? "5 opgaver →" : "På vej"}</b>
                  </div>
                </button>
              );
            })}
          </div>
        ) : !area ? (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "22px 0" }}>
              {trainingCatalog.map((catalogSubject) => (
                <button
                  key={catalogSubject.id}
                  onClick={() => chooseSubject(catalogSubject.id)}
                  style={{
                    border: catalogSubject.id === subjectId ? "2px solid #526b60" : "1px solid #d8d5cd",
                    background: catalogSubject.id === subjectId ? "#edf1ec" : "#fff",
                    borderRadius: 999,
                    padding: "9px 13px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {catalogSubject.title}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
              {subject.areas.map((subjectArea) => (
                <button
                  key={subjectArea.id}
                  onClick={() => setAreaId(subjectArea.id)}
                  style={{
                    textAlign: "left",
                    background: "#fff",
                    border: "1px solid #d8d5cd",
                    borderRadius: 14,
                    padding: 20,
                    cursor: "pointer",
                    color: "#26342e",
                  }}
                >
                  <strong style={{ display: "block", fontFamily: "Georgia, serif", fontSize: 23 }}>
                    {subjectArea.title}
                  </strong>
                  <span style={{ display: "block", margin: "7px 0 14px", color: "#707670", lineHeight: 1.45 }}>
                    {subjectArea.description}
                  </span>
                  <small style={{ fontWeight: 800, color: "#526b60" }}>
                    {subjectArea.skills.length} områder · Åbn →
                  </small>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "grid", gap: 10, marginTop: 24 }}>
              {area.skills.map((areaSkill) => {
                const levels = freeTrainingQuestions[subjectId]?.[area.id]?.[areaSkill] ?? {};
                const availableLevels = Object.keys(levels).length;

                return (
                  <button
                    key={areaSkill}
                    disabled={availableLevels === 0}
                    onClick={() => chooseSkill(areaSkill)}
                    style={{
                      textAlign: "left",
                      background: availableLevels > 0 ? "#fff" : "#f8f6f1",
                      border: "1px solid #d8d5cd",
                      borderRadius: 13,
                      padding: "17px 19px",
                      cursor: availableLevels > 0 ? "pointer" : "default",
                      opacity: availableLevels > 0 ? 1 : 0.65,
                      color: "#26342e",
                    }}
                  >
                    <strong style={{ fontSize: 17 }}>{areaSkill}</strong>
                    <small
                      style={{
                        display: "block",
                        marginTop: 7,
                        color: availableLevels > 0 ? "#526b60" : "#8a8d88",
                        fontWeight: 700,
                      }}
                    >
                      {availableLevels > 0
                        ? `${availableLevels} niveau${availableLevels === 1 ? "" : "er"} · Vælg →`
                        : "Flere opgaver på vej"}
                    </small>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 24, background: "#edf1ec", borderRadius: 13, padding: 18, lineHeight: 1.5 }}>
              <strong>Ingen klassetrin her.</strong>
              <br />
              <span style={{ color: "#657068" }}>
                Du træner det, du har brug for. Niveauet beskriver opgaven – ikke dig.
              </span>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
