export type GrammarTopic = {
  title: string;
  minGrade: number;
  live: boolean;
};

export type GrammarArea = {
  icon: string;
  title: string;
  text: string;
  topics: GrammarTopic[];
};

export const grammarAreas: GrammarArea[] = [
  {
    icon: "Aa",
    title: "Ordklasser",
    text: "Ordtyper, deres kendetegn, bøjning og funktion i sætningen.",
    topics: [
      { title: "Navneord", minGrade: 1, live: true },
      { title: "Udsagnsord", minGrade: 1, live: true },
      { title: "Tillægsord", minGrade: 2, live: true },
      { title: "Stedord", minGrade: 3, live: true },
      { title: "Biord", minGrade: 5, live: true },
      { title: "Forholdsord", minGrade: 4, live: false },
      { title: "Bindeord", minGrade: 4, live: false },
      { title: "Kendeord", minGrade: 3, live: false },
      { title: "Talord", minGrade: 3, live: false },
      { title: "Udråbsord", minGrade: 3, live: false },
    ],
  },
  {
    icon: "↺",
    title: "Bøjning & verber",
    text: "Bøjningsformer, tider, verbalsystem og de fejl, der ofte følger med.",
    topics: [
      { title: "Nutids-r", minGrade: 5, live: true },
      { title: "Navneords bøjning", minGrade: 3, live: false },
      { title: "Tillægsords bøjning", minGrade: 4, live: false },
      { title: "Udsagnsords tider", minGrade: 5, live: false },
      { title: "Aktiv og passiv", minGrade: 7, live: false },
      { title: "Modalverber", minGrade: 7, live: false },
    ],
  },
  {
    icon: "S",
    title: "Sætninger & syntaks",
    text: "Sætningsled, hel- og ledsætninger, ordstilling og hvordan sætninger bygges.",
    topics: [
      { title: "Grundled og udsagnsled", minGrade: 3, live: true },
      { title: "Genstandsled", minGrade: 5, live: true },
      { title: "Omsagnsled", minGrade: 7, live: true },
      { title: "Hel- og ledsætninger", minGrade: 5, live: true },
      { title: "Hensynsled", minGrade: 6, live: false },
      { title: "Adverbialled", minGrade: 6, live: false },
      { title: "Ordstilling og inversion", minGrade: 6, live: false },
      { title: "Sætningsskema", minGrade: 7, live: false },
    ],
  },
  {
    icon: "✓",
    title: "Stavning & retskrivning",
    text: "Stavemønstre, sammensatte ord og de retskrivningsregler, eleverne bruger i egne tekster.",
    topics: [
      { title: "Store og små bogstaver", minGrade: 2, live: true },
      { title: "Sammensatte ord", minGrade: 3, live: true },
      { title: "Enkelt og dobbelt konsonant", minGrade: 3, live: false },
      { title: "Stumme bogstaver", minGrade: 3, live: false },
      { title: "Endelser", minGrade: 4, live: false },
      { title: "Fremmedord", minGrade: 7, live: false },
      { title: "Forkortelser", minGrade: 5, live: false },
    ],
  },
  {
    icon: ".,",
    title: "Tegnsætning",
    text: "Fra punktum og spørgsmålstegn til komma, direkte tale og avanceret tegnsætning.",
    topics: [
      { title: "Punktum og spørgsmålstegn", minGrade: 2, live: true },
      { title: "Komma mellem helsætninger", minGrade: 5, live: true },
      { title: "Komma ved ledsætninger", minGrade: 6, live: true },
      { title: "Kommaøvelser", minGrade: 5, live: true },
      { title: "Direkte tale", minGrade: 5, live: true },
      { title: "Kolon, semikolon og tankestreg", minGrade: 7, live: true },
      { title: "Parentes og citationstegn", minGrade: 6, live: false },
      { title: "Apostrof", minGrade: 7, live: false },
    ],
  },
  {
    icon: "!?",
    title: "Sprogfælder",
    text: "Hyppige danske fejltyper, hvor eleverne skal vælge, forklare og rette i kontekst.",
    topics: [
      { title: "Sin, sit, sine eller hans/hendes", minGrade: 4, live: true },
      { title: "Nogen eller nogle", minGrade: 5, live: true },
      { title: "Ligge eller lægge", minGrade: 5, live: true },
      { title: "Og eller at", minGrade: 5, live: false },
      { title: "Ad eller af", minGrade: 5, live: false },
      { title: "Hvis eller vis", minGrade: 4, live: false },
      { title: "Synes eller syntes", minGrade: 5, live: false },
      { title: "Hver eller vær", minGrade: 4, live: false },
    ],
  },
  {
    icon: "✎",
    title: "Tekstgrammatik",
    text: "Grammatik som redskab til sammenhæng, præcision, variation og korrektur i egne tekster.",
    topics: [
      { title: "Præcise verber", minGrade: 5, live: true },
      { title: "Variation i sætninger", minGrade: 5, live: true },
      { title: "Form → funktion → effekt", minGrade: 7, live: true },
      { title: "Sproglig effekt", minGrade: 7, live: true },
      { title: "Sammenhæng og forbindelsesord", minGrade: 5, live: false },
      { title: "Reference og henvisninger", minGrade: 5, live: false },
      { title: "Korrektur i egne tekster", minGrade: 5, live: false },
    ],
  },
  {
    icon: "M",
    title: "Orddannelse & morfologi",
    text: "Hvordan ord er bygget af betydningsbærende dele, og hvordan nye ord dannes.",
    topics: [
      { title: "Ordfamilier", minGrade: 4, live: false },
      { title: "Rodmorfemer", minGrade: 6, live: false },
      { title: "Bøjningsmorfemer", minGrade: 6, live: false },
      { title: "Afledningsmorfemer", minGrade: 7, live: false },
      { title: "Forstavelser og endelser", minGrade: 5, live: false },
      { title: "Nominalisering", minGrade: 7, live: false },
    ],
  },
];

export const liveGrammarAreas = grammarAreas
  .map((area) => ({ ...area, topics: area.topics.filter((topic) => topic.live) }))
  .filter((area) => area.topics.length > 0);

export function grammarTopicMeta(topicTitle: string) {
  for (const area of grammarAreas) {
    const topic = area.topics.find((item) => item.title === topicTitle);
    if (topic) return { ...topic, area: area.title };
  }
  return null;
}
