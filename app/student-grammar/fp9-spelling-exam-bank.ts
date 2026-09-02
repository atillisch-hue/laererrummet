import type { GradedGrammarLibrary, GradedGrammarQuestion } from "./grade-progression";
import { minimumGradeForTopic } from "./grade-progression";
import { retskrivningExtraLibrary } from "./retskrivning-extra";
import { spellingTrapsLibrary } from "./spelling-traps-extra";
import { advancedExtraLibrary } from "./advanced-extra";
import { inflectionSyntaxLibrary } from "./inflection-syntax-extra";
import { morphologyTextLibrary } from "./morphology-text-extra";

export type SpellingExamQuestion = GradedGrammarQuestion & {
  examSection: string;
  sourceTopic: string;
};

export const FP9_EXAM_SECTIONS = [
  "Stavning i kontekst",
  "Ord og bøjning",
  "Sprogfælder",
  "Sprog og sprogbrug",
  "Korrektur",
  "Tegnsætning",
] as const;

export const SPELLING_EXAM_LEVELS = {
  6: { title: "6. klasse · Strategitræning", description: "Velkendte retskrivningsregler og tydelig kontekst. Fokus på at lære at undersøge ord og sætninger systematisk." },
  7: { title: "7. klasse · Begyndende prøveformat", description: "Flere regelkombinationer, korrektur og sprogfælder, men stadig uden de sværeste udskolingskrav." },
  8: { title: "8. klasse · Prøveforberedelse", description: "Bred retskrivning med mere kompleks korrektur, tegnsætning og sprogbrug." },
  9: { title: "9. klasse · FP9-lignende niveau", description: "Den fulde bank med de mest krævende retskrivnings-, korrektur- og tegnsætningsopgaver." },
} as const;

const sources: GradedGrammarLibrary[] = [
  retskrivningExtraLibrary,
  spellingTrapsLibrary,
  inflectionSyntaxLibrary,
  morphologyTextLibrary,
  advancedExtraLibrary as GradedGrammarLibrary,
];

const sectionTopics: Record<(typeof FP9_EXAM_SECTIONS)[number], string[]> = {
  "Stavning i kontekst": [
    "Store og små bogstaver",
    "Sammensatte ord",
    "Enkelt og dobbelt konsonant",
    "Stumme bogstaver",
    "Endelser",
    "Fremmedord",
    "Forkortelser",
  ],
  "Ord og bøjning": [
    "Nutids-r",
    "Navneords bøjning",
    "Tillægsords bøjning",
    "Udsagnsords tider",
  ],
  "Sprogfælder": [
    "Sin, sit, sine eller hans/hendes",
    "Nogen eller nogle",
    "Ligge eller lægge",
    "Og eller at",
    "Ad eller af",
    "Hvis eller vis",
    "Synes eller syntes",
    "Hver eller vær",
  ],
  "Sprog og sprogbrug": [
    "Aktiv og passiv",
    "Modalverber",
    "Ordfamilier",
    "Reference og henvisninger",
    "Sammenhæng og forbindelsesord",
    "Forstavelser og endelser",
  ],
  "Korrektur": [],
  "Tegnsætning": [
    "Punktum og spørgsmålstegn",
    "Komma mellem helsætninger",
    "Komma ved ledsætninger",
    "Kommaøvelser",
    "Direkte tale",
    "Kolon, semikolon og tankestreg",
    "Parentes og citationstegn",
    "Apostrof",
  ],
};

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function questionKey(question: GradedGrammarQuestion) {
  return `${question.q}::${question.answer}`;
}

function allTopicQuestions(topic: string) {
  const result: GradedGrammarQuestion[] = [];
  for (const source of sources) {
    const levels = source[topic];
    if (!levels) continue;
    for (const questions of Object.values(levels)) result.push(...questions);
  }
  const unique = new Map<string, GradedGrammarQuestion>();
  for (const question of result) unique.set(questionKey(question), question);
  return [...unique.values()];
}

function questionFitsGrade(question: GradedGrammarQuestion, topic: string, targetGrade: number) {
  const minimum = question.minGrade ?? minimumGradeForTopic(topic);
  const maximum = question.maxGrade ?? 10;
  return minimum <= targetGrade && maximum >= targetGrade;
}

function poolForSection(section: (typeof FP9_EXAM_SECTIONS)[number], targetGrade: number) {
  if (section === "Korrektur") {
    const result: Array<{ question: GradedGrammarQuestion; topic: string }> = [];
    const relevantTopics = [
      ...sectionTopics["Stavning i kontekst"],
      ...sectionTopics["Ord og bøjning"],
      ...sectionTopics["Sprogfælder"],
      ...sectionTopics["Sprog og sprogbrug"],
      ...sectionTopics["Tegnsætning"],
      "Korrektur i egne tekster",
    ];
    for (const topic of relevantTopics) {
      for (const question of allTopicQuestions(topic)) {
        if (question.kind === "rewrite" && questionFitsGrade(question, topic, targetGrade)) result.push({ question, topic });
      }
    }
    return result;
  }

  return sectionTopics[section].flatMap((topic) =>
    allTopicQuestions(topic)
      .filter((question) => questionFitsGrade(question, topic, targetGrade))
      .map((question) => ({ question, topic }))
  );
}

function prepareQuestion(
  question: GradedGrammarQuestion,
  section: string,
  topic: string,
  random: () => number
): SpellingExamQuestion {
  const options = question.kind === "text" || question.kind === "rewrite"
    ? []
    : shuffled(Array.from(new Set(question.options)), random);
  return { ...question, options, examSection: section, sourceTopic: topic };
}

export function buildSpellingExamSet(seed: number, questionCount = 30, targetGrade = 9): SpellingExamQuestion[] {
  const grade = Math.max(6, Math.min(9, Math.round(targetGrade)));
  const random = mulberry32(Number.isFinite(seed) ? seed : 1);
  const sections = [...FP9_EXAM_SECTIONS];
  const basePerSection = Math.floor(questionCount / sections.length);
  let remainder = questionCount % sections.length;
  const selected: SpellingExamQuestion[] = [];
  const used = new Set<string>();

  for (const section of sections) {
    const wanted = basePerSection + (remainder-- > 0 ? 1 : 0);
    const pool = shuffled(poolForSection(section, grade), random);
    let added = 0;
    for (const entry of pool) {
      const key = questionKey(entry.question);
      if (used.has(key)) continue;
      used.add(key);
      selected.push(prepareQuestion(entry.question, section, entry.topic, random));
      added += 1;
      if (added >= wanted) break;
    }
    if (added < wanted) throw new Error(`Retskrivningsbanken mangler opgaver i ${section} på ${grade}.-klasseniveau (${added}/${wanted})`);
  }

  return shuffled(selected, random);
}

export function spellingExamSectionCounts(questions: SpellingExamQuestion[]) {
  return Object.fromEntries(FP9_EXAM_SECTIONS.map((section) => [
    section,
    questions.filter((question) => question.examSection === section).length,
  ]));
}
