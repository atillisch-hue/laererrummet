import type { InteractiveGrammarQuestion } from "./interactive-library";
import { grammarTopicMeta } from "../grammar/grammar-catalog";
import { studentFriendlyDanishQuestion } from "../../lib/danishStudentLanguage";

export type GradedGrammarQuestion = InteractiveGrammarQuestion & {
  minGrade?: number;
  maxGrade?: number;
};

export type GradedGrammarLibrary = Record<string, Record<string, GradedGrammarQuestion[]>>;

export const gradeBands = [
  { min: 0, max: 0, label: "0. klasse" },
  { min: 1, max: 2, label: "1.–2. klasse" },
  { min: 3, max: 4, label: "3.–4. klasse" },
  { min: 5, max: 6, label: "5.–6. klasse" },
  { min: 7, max: 9, label: "7.–9. klasse" },
  { min: 10, max: 10, label: "10. klasse" },
] as const;

const prerequisiteTopics: Record<string, string> = {
  "Tillægsord": "Navneord",
  "Stedord": "Navneord",
  "Biord": "Tillægsord",
  "Forholdsord": "Navneord",
  "Bindeord": "Grundled og udsagnsled",
  "Kendeord": "Navneord",
  "Talord": "Navneord",
  "Udråbsord": "Tillægsord",
  "Nutids-r": "Udsagnsord",
  "Navneords bøjning": "Navneord",
  "Tillægsords bøjning": "Tillægsord",
  "Udsagnsords tider": "Udsagnsord",
  "Aktiv og passiv": "Udsagnsord",
  "Modalverber": "Udsagnsord",
  "Sammensatte ord": "Navneord",
  "Store og små bogstaver": "Navneord",
  "Genstandsled": "Grundled og udsagnsled",
  "Omsagnsled": "Grundled og udsagnsled",
  "Hensynsled": "Grundled og udsagnsled",
  "Adverbialled": "Grundled og udsagnsled",
  "Hel- og ledsætninger": "Grundled og udsagnsled",
  "Ordstilling og inversion": "Grundled og udsagnsled",
  "Sætningsskema": "Grundled og udsagnsled",
  "Punktum og spørgsmålstegn": "Grundled og udsagnsled",
  "Komma mellem helsætninger": "Grundled og udsagnsled",
  "Komma ved ledsætninger": "Grundled og udsagnsled",
  "Kommaøvelser": "Grundled og udsagnsled",
  "Direkte tale": "Punktum og spørgsmålstegn",
  "Kolon, semikolon og tankestreg": "Punktum og spørgsmålstegn",
  "Sin, sit, sine eller hans/hendes": "Stedord",
  "Nogen eller nogle": "Stedord",
  "Ligge eller lægge": "Udsagnsord",
  "Ordfamilier": "Navneord",
  "Rodmorfemer": "Ordfamilier",
  "Bøjningsmorfemer": "Navneords bøjning",
  "Afledningsmorfemer": "Ordfamilier",
  "Forstavelser og endelser": "Ordfamilier",
  "Nominalisering": "Udsagnsord",
  "Sammenhæng og forbindelsesord": "Bindeord",
  "Reference og henvisninger": "Stedord",
  "Korrektur i egne tekster": "Udsagnsord",
  "Form → funktion → effekt": "Tillægsord",
  "Præcise verber": "Udsagnsord",
  "Variation i sætninger": "Grundled og udsagnsled",
  "Sproglig effekt": "Tillægsord",
};

export function gradeBandLabel(grade: number | null | undefined) {
  if (grade === null || grade === undefined || Number.isNaN(Number(grade))) return "klassetrin ikke angivet";
  const value = Number(grade);
  return gradeBands.find((band) => value >= band.min && value <= band.max)?.label || `${value}. klasse`;
}

export function minimumGradeForTopic(topic: string) {
  return grammarTopicMeta(topic)?.minGrade ?? 5;
}

export function challengeAllowance(level: string) {
  return level === "udfordring" ? 1 : 0;
}

export function prerequisiteTopicForGrade(topic: string, grade: number | null | undefined, level: string) {
  if (grade === null || grade === undefined || Number.isNaN(Number(grade))) return null;
  const effectiveGrade = Math.min(10, Number(grade) + challengeAllowance(level));
  if (minimumGradeForTopic(topic) <= effectiveGrade) return null;
  return prerequisiteTopics[topic] || null;
}

export function tagLibraryForGrades(
  source: Record<string, Record<string, InteractiveGrammarQuestion[]>>,
  sourceMinimumGrade: number,
  sourceMaximumGrade?: number
): GradedGrammarLibrary {
  const tagged: GradedGrammarLibrary = {};

  for (const [topic, levels] of Object.entries(source)) {
    tagged[topic] ||= {};
    for (const [level, questions] of Object.entries(levels)) {
      tagged[topic][level] = questions.map((question) => {
        const graded = question as GradedGrammarQuestion;
        return {
          ...studentFriendlyDanishQuestion(question),
          minGrade: graded.minGrade ?? Math.max(sourceMinimumGrade, minimumGradeForTopic(topic)),
          maxGrade: graded.maxGrade ?? sourceMaximumGrade,
        };
      });
    }
  }

  return tagged;
}

export function filterLevelsForGrade(
  levels: Record<string, GradedGrammarQuestion[]>,
  grade: number | null | undefined,
  assignedLevel: string
) {
  if (grade === null || grade === undefined || Number.isNaN(Number(grade))) return levels;

  const actualGrade = Number(grade);
  const effectiveGrade = Math.min(10, actualGrade + challengeAllowance(assignedLevel));
  const filtered: Record<string, GradedGrammarQuestion[]> = {};

  for (const [level, questions] of Object.entries(levels)) {
    filtered[level] = questions.filter((question) => {
      const minimum = question.minGrade ?? 1;
      const maximum = question.maxGrade ?? 10;
      return minimum <= effectiveGrade && maximum >= actualGrade;
    });
  }

  return filtered;
}

export function topicGradeHint(topic: string) {
  const min = minimumGradeForTopic(topic);
  if (min <= 1) return "fra indskolingen";
  if (min <= 3) return `fra ${min}. klasse`;
  if (min <= 6) return `fra ${min}. klasse`;
  return "primært udskoling";
}
