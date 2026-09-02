import type { InteractiveGrammarQuestion } from "./interactive-library";

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

const topicMinimumGrades: Record<string, number> = {
  "Navneord": 1,
  "Udsagnsord": 1,
  "Tillægsord": 2,
  "Stedord": 3,
  "Biord": 5,
  "Grundled og udsagnsled": 3,
  "Genstandsled": 5,
  "Omsagnsled": 7,
  "Hel- og ledsætninger": 5,
  "Komma mellem helsætninger": 5,
  "Komma ved ledsætninger": 6,
  "Kommaøvelser": 5,
  "Form → funktion → effekt": 7,
  "Præcise verber": 5,
  "Variation i sætninger": 5,
  "Sproglig effekt": 7,
};

const prerequisiteTopics: Record<string, string> = {
  "Tillægsord": "Navneord",
  "Stedord": "Navneord",
  "Biord": "Tillægsord",
  "Genstandsled": "Grundled og udsagnsled",
  "Omsagnsled": "Grundled og udsagnsled",
  "Hel- og ledsætninger": "Grundled og udsagnsled",
  "Komma mellem helsætninger": "Grundled og udsagnsled",
  "Komma ved ledsætninger": "Grundled og udsagnsled",
  "Kommaøvelser": "Grundled og udsagnsled",
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
  return topicMinimumGrades[topic] ?? 5;
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
          ...question,
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
  if (min <= 3) return "fra 3. klasse";
  if (min <= 5) return "fra 5. klasse";
  if (min === 6) return "fra 6. klasse";
  return "primært udskoling";
}
