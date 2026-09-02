import { READING_STRATEGIES, type ReadingStrategy } from "./reading-exam-bank";

export type ReadingStrategyScore = { correct: number; total: number };

export const READING_STRATEGY_COACHING: Record<ReadingStrategy, { title: string; explanation: string; move: string }> = {
  "Skimning og overblik": {
    title: "Skab overblik før du går i detaljer",
    explanation: "Du skal hurtigt kunne se teksttype, emne, opbygning og hvor den vigtigste information sandsynligvis står.",
    move: "Læs titel, mellemoverskrifter og første sætning i afsnittene, før du læser tæt.",
  },
  "Scanning og informationssøgning": {
    title: "Find præcis den information, du leder efter",
    explanation: "Du skal kunne hoppe målrettet i teksten efter navne, tal, tidspunkter, krav og andre nøgleord.",
    move: "Find nøgleordet i spørgsmålet først, og scan derefter teksten efter samme ord eller et synonym.",
  },
  "Hovedindhold": {
    title: "Hold fast i tekstens vigtigste pointe",
    explanation: "Du skal skelne hovedsagen fra eksempler, detaljer og sideoplysninger.",
    move: "Spørg efter hvert afsnit: Hvad er den ene vigtigste ting, dette afsnit fortæller mig?",
  },
  "Inferens": {
    title: "Læs mellem linjerne",
    explanation: "Du skal forbinde flere tekstspor og drage en sandsynlig konklusion, selv når svaret ikke står direkte.",
    move: "Find mindst to konkrete spor i teksten, før du vælger den forklaring, der passer bedst.",
  },
  "Ord i kontekst": {
    title: "Brug teksten til at forstå ukendte ord",
    explanation: "Du skal kunne udlede betydningen af ord og formuleringer ud fra sætningen og afsnittet omkring dem.",
    move: "Erstat ordet med hver svarmulighed og læs sætningen igen. Hvilken betydning passer til sammenhængen?",
  },
  "Tekststruktur": {
    title: "Se hvordan teksten er bygget",
    explanation: "Du skal opdage, hvordan afsnit, eksempler, kontraster og forbindelsesord styrer læseren gennem teksten.",
    move: "Spørg: Hvad gør dette afsnit her — forklarer, eksemplificerer, modsiger eller konkluderer det?",
  },
  "Afsender og formål": {
    title: "Find ud af hvem der vil hvad med teksten",
    explanation: "Du skal vurdere afsender, målgruppe, synsvinkel og hvad teksten prøver at få læseren til at vide, mene eller gøre.",
    move: "Se efter ordvalg, teksttype og hvilke oplysninger afsenderen fremhæver eller nedtoner.",
  },
  "Sammenhæng og cloze": {
    title: "Få sætningerne til at hænge sammen",
    explanation: "Du skal bruge både betydning og grammatik til at vælge det ord eller den forbindelse, der passer præcist i teksten.",
    move: "Læs altid sætningen før og efter hullet. Tjek både mening, tid, henvisning og forbindelsesord.",
  },
};

export function weakestReadingStrategy(scores: Partial<Record<ReadingStrategy, ReadingStrategyScore>>) {
  const candidates = READING_STRATEGIES
    .map((strategy) => {
      const row = scores[strategy] || { correct: 0, total: 0 };
      const accuracy = row.total ? row.correct / row.total : 1;
      return { strategy, ...row, accuracy, errors: Math.max(0, row.total - row.correct) };
    })
    .filter((row) => row.total > 0);

  if (!candidates.length || candidates.every((row) => row.errors === 0)) return null;
  const stable = candidates.filter((row) => row.total >= 2);
  const pool = stable.length ? stable : candidates;
  return [...pool].sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors || b.total - a.total || READING_STRATEGIES.indexOf(a.strategy) - READING_STRATEGIES.indexOf(b.strategy))[0];
}

export function readingStrategyScoresFromSnapshot(answers: Record<string, any> | null | undefined) {
  const result: Partial<Record<ReadingStrategy, ReadingStrategyScore>> = {};
  for (const value of Object.values(answers || {})) {
    const strategy = String(value?.strategy || "") as ReadingStrategy;
    if (!READING_STRATEGIES.includes(strategy)) continue;
    const row = result[strategy] || { correct: 0, total: 0 };
    row.total += 1;
    if (value?.correct) row.correct += 1;
    result[strategy] = row;
  }
  return result;
}
