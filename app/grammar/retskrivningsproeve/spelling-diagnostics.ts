import { FP9_EXAM_SECTIONS } from "../../student-grammar/fp9-spelling-exam-bank";
import { grammarTopicMeta } from "../grammar-catalog";

export type SpellingDiagnosticResult = {
  student_id: number;
  student_name: string;
  submitted: boolean;
  answers?: Record<string, any> | null;
};

export type SpellingSectionRow = {
  section: string;
  correct: number;
  total: number;
  accuracy: number;
  measuredStudents: number;
  supportStudents: Array<{ id: number; name: string; correct: number; total: number }>;
  status: "focus" | "watch" | "secure";
};

export type SpellingTopicRow = {
  topic: string;
  section: string;
  area: string | null;
  live: boolean;
  correct: number;
  total: number;
  accuracy: number;
  measuredStudents: number;
  errorStudents: Array<{ id: number; name: string }>;
};

function submitted(results: SpellingDiagnosticResult[]) {
  return results.filter((result) => result.submitted && result.answers);
}

export function classSpellingSectionAnalysis(results: SpellingDiagnosticResult[]): SpellingSectionRow[] {
  const completed = submitted(results);
  return FP9_EXAM_SECTIONS.map((section) => {
    let correct = 0, total = 0;
    const supportStudents: SpellingSectionRow["supportStudents"] = [];
    let measuredStudents = 0;

    for (const result of completed) {
      const values = Object.values(result.answers || {}).filter((answer: any) => String(answer?.section || "") === section);
      if (!values.length) continue;
      measuredStudents += 1;
      const studentCorrect = values.filter((answer: any) => Boolean(answer?.correct)).length;
      correct += studentCorrect;
      total += values.length;
      if (values.length >= 2 && studentCorrect / values.length < 0.7) {
        supportStudents.push({ id: result.student_id, name: result.student_name, correct: studentCorrect, total: values.length });
      }
    }

    const accuracy = total ? correct / total : 1;
    return {
      section,
      correct,
      total,
      accuracy,
      measuredStudents,
      supportStudents,
      status: accuracy < 0.6 ? "focus" : accuracy < 0.8 ? "watch" : "secure",
    };
  });
}

export function classSpellingTopicAnalysis(results: SpellingDiagnosticResult[]): SpellingTopicRow[] {
  const completed = submitted(results);
  const rows = new Map<string, SpellingTopicRow>();
  const measuredByTopic = new Map<string, Set<number>>();
  const errorsByTopic = new Map<string, Map<number, string>>();

  for (const result of completed) {
    for (const answer of Object.values(result.answers || {}) as any[]) {
      const topic = String(answer?.sourceTopic || "").trim();
      if (!topic) continue;
      const section = String(answer?.section || "Andet");
      const meta = grammarTopicMeta(topic);
      const row = rows.get(topic) || {
        topic,
        section,
        area: meta?.area || null,
        live: Boolean(meta?.live),
        correct: 0,
        total: 0,
        accuracy: 0,
        measuredStudents: 0,
        errorStudents: [],
      };
      row.total += 1;
      if (answer?.correct) row.correct += 1;
      rows.set(topic, row);
      if (!measuredByTopic.has(topic)) measuredByTopic.set(topic, new Set());
      measuredByTopic.get(topic)!.add(result.student_id);
      if (!answer?.correct) {
        if (!errorsByTopic.has(topic)) errorsByTopic.set(topic, new Map());
        errorsByTopic.get(topic)!.set(result.student_id, result.student_name);
      }
    }
  }

  return [...rows.values()].map((row) => ({
    ...row,
    accuracy: row.total ? row.correct / row.total : 1,
    measuredStudents: measuredByTopic.get(row.topic)?.size || 0,
    errorStudents: [...(errorsByTopic.get(row.topic)?.entries() || [])].map(([id, name]) => ({ id, name })),
  })).sort((a, b) => {
    const aErrors = a.total - a.correct, bErrors = b.total - b.correct;
    return bErrors - aErrors || a.accuracy - b.accuracy || b.total - a.total || a.topic.localeCompare(b.topic, "da");
  });
}

export function classSpellingFocus(rows: SpellingSectionRow[]) {
  return rows.filter((row) => row.total > 0 && row.accuracy < 0.8).sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0] || null;
}

export function spellingFollowupTopics(rows: SpellingTopicRow[], limit = 6) {
  return rows.filter((row) => row.live && row.area && row.total >= 3 && row.accuracy < 0.8 && row.errorStudents.length > 0).slice(0, limit);
}
