import { READING_STRATEGIES, type ReadingStrategy } from "../../student-reading-exam/reading-exam-bank";
import { readingStrategyScoresFromSnapshot, type ReadingStrategyScore } from "../../student-reading-exam/strategy-feedback";

export type ClassReadingResult = {
  student_id: number;
  student_name: string;
  submitted: boolean;
  answers?: Record<string, any> | null;
};

export type ClassStrategyRow = ReadingStrategyScore & {
  strategy: ReadingStrategy;
  accuracy: number;
  measuredStudents: number;
  supportStudents: Array<{ id: number; name: string; correct: number; total: number; accuracy: number }>;
  status: "focus" | "watch" | "secure";
};

function statusForAccuracy(accuracy: number): ClassStrategyRow["status"] {
  if (accuracy < 0.6) return "focus";
  if (accuracy < 0.8) return "watch";
  return "secure";
}

export function classReadingStrategyAnalysis(results: ClassReadingResult[]): ClassStrategyRow[] {
  const submitted = results.filter((result) => result.submitted && result.answers);

  return READING_STRATEGIES.map((strategy) => {
    let correct = 0;
    let total = 0;
    let measuredStudents = 0;
    const supportStudents: ClassStrategyRow["supportStudents"] = [];

    for (const result of submitted) {
      const score = readingStrategyScoresFromSnapshot(result.answers)[strategy];
      if (!score || score.total <= 0) continue;
      measuredStudents += 1;
      correct += score.correct;
      total += score.total;
      const accuracy = score.correct / score.total;

      // Vær konservativ med elevflag: et enkelt spørgsmål må ikke alene blive til en faglig konklusion.
      if (score.total >= 2 && accuracy < 0.7) {
        supportStudents.push({
          id: result.student_id,
          name: result.student_name,
          correct: score.correct,
          total: score.total,
          accuracy,
        });
      }
    }

    const accuracy = total ? correct / total : 1;
    return {
      strategy,
      correct,
      total,
      accuracy,
      measuredStudents,
      supportStudents: supportStudents.sort((a, b) => a.accuracy - b.accuracy || a.name.localeCompare(b.name, "da")),
      status: total ? statusForAccuracy(accuracy) : "secure",
    };
  });
}

export function classReadingFocus(rows: ClassStrategyRow[]) {
  const measured = rows.filter((row) => row.total > 0);
  if (!measured.length || measured.every((row) => row.accuracy >= 0.8)) return null;

  return [...measured].sort(
    (a, b) =>
      a.accuracy - b.accuracy ||
      b.supportStudents.length - a.supportStudents.length ||
      b.total - a.total ||
      READING_STRATEGIES.indexOf(a.strategy) - READING_STRATEGIES.indexOf(b.strategy),
  )[0];
}
