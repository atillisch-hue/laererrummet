import type { GradedGrammarQuestion } from "./grade-progression";

type IQ = GradedGrammarQuestion;

export const GRAMMAR_ROUND_SIZE = 5;

export function questionKey(question: IQ) {
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

export function isWrittenQuestion(question: IQ) {
  return question.kind === "text" || question.kind === "rewrite";
}

export function uniqueQuestions(questions: IQ[]) {
  const byKey = new Map<string, IQ>();
  for (const question of questions) byKey.set(questionKey(question), question);
  return Array.from(byKey.values());
}

function prepareQuestionForRound(question: IQ): IQ {
  return isWrittenQuestion(question) ? question : { ...question, options: shuffle(question.options) };
}

function balancedSelection(candidates: IQ[], needed: number) {
  if (needed <= 0 || candidates.length === 0) return [];
  const written = shuffle(candidates.filter(isWrittenQuestion));
  const choices = shuffle(candidates.filter((question) => !isWrittenQuestion(question)));
  const targetWritten = written.length > 0 ? Math.min(2, written.length, Math.max(1, needed - 1)) : 0;
  const selected = [...written.slice(0, targetWritten), ...choices.slice(0, Math.max(0, needed - targetWritten))];

  if (selected.length < needed) {
    const selectedKeys = new Set(selected.map(questionKey));
    const remaining = shuffle(candidates.filter((question) => !selectedKeys.has(questionKey(question))));
    selected.push(...remaining.slice(0, needed - selected.length));
  }

  return shuffle(selected.slice(0, needed));
}

export function prepareRound(pool: IQ[], excludedKeys: Set<string>) {
  const fresh = pool.filter((question) => !excludedKeys.has(questionKey(question)));
  const needed = Math.min(GRAMMAR_ROUND_SIZE, pool.length);
  let selected = balancedSelection(fresh, needed);

  if (selected.length < needed) {
    const selectedKeys = new Set(selected.map(questionKey));
    const fallback = pool.filter((question) => !selectedKeys.has(questionKey(question)));
    selected = [...selected, ...balancedSelection(fallback, needed - selected.length)];
  }

  return selected.map(prepareQuestionForRound);
}

export function prepareAdaptiveRetry(
  primaryPool: IQ[],
  topicLevels: Record<string, IQ[]>,
  assignedLevel: string,
  score: number,
  excludedKeys: Set<string>,
  avoidKeys: Set<string> = new Set()
) {
  const allTopicQuestions = uniqueQuestions(Object.values(topicLevels).flat());
  const needed = Math.min(GRAMMAR_ROUND_SIZE, allTopicQuestions.length);
  const selected: IQ[] = [];

  const addFreshFrom = (pool: IQ[]) => {
    const alreadySelected = new Set(selected.map(questionKey));
    const candidates = pool.filter((question) => {
      const key = questionKey(question);
      return !excludedKeys.has(key) && !avoidKeys.has(key) && !alreadySelected.has(key);
    });
    selected.push(...balancedSelection(candidates, Math.max(0, needed - selected.length)));
  };

  addFreshFrom(primaryPool);

  const supportOrder = assignedLevel === "basis"
    ? ["traening", "udfordring"]
    : assignedLevel === "udfordring"
      ? ["traening", "basis"]
      : score < Math.ceil(GRAMMAR_ROUND_SIZE * 0.6)
        ? ["basis", "udfordring"]
        : ["udfordring", "basis"];

  for (const level of supportOrder) {
    if (selected.length >= needed) break;
    addFreshFrom(topicLevels[level] || []);
  }

  if (selected.length < needed) {
    const selectedKeys = new Set(selected.map(questionKey));
    const safeRepeatFallback = allTopicQuestions.filter((question) => {
      const key = questionKey(question);
      return !avoidKeys.has(key) && !selectedKeys.has(key);
    });
    selected.push(...balancedSelection(safeRepeatFallback, needed - selected.length));
  }

  // Kun hvis banken er så lille, at en fuld runde ikke kan laves uden den
  // umiddelbart foregående runde, må enkelte spørgsmål genbruges derfra.
  if (selected.length < needed) {
    const selectedKeys = new Set(selected.map(questionKey));
    const lastResort = allTopicQuestions.filter((question) => !selectedKeys.has(questionKey(question)));
    selected.push(...balancedSelection(lastResort, needed - selected.length));
  }

  return selected.slice(0, needed).map(prepareQuestionForRound);
}
