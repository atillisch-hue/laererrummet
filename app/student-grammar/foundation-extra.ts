import type { GradedGrammarLibrary, GradedGrammarQuestion } from "./grade-progression";

const choice = (q: string, options: string[], answer: string, why: string, minGrade: number): GradedGrammarQuestion => ({
  q,
  options,
  answer,
  why,
  kind: "choice",
  minGrade,
  maxGrade: 4,
});

const text = (q: string, answer: string, why: string, minGrade: number, acceptedAnswers: string[] = [answer]): GradedGrammarQuestion => ({
  q,
  options: [],
  answer,
  why,
  kind: "text",
  acceptedAnswers,
  minGrade,
  maxGrade: 4,
  placeholder: "Skriv dit svar…",
});

export const foundationExtraGrammarLibrary: GradedGrammarLibrary = {
  "Udsagnsord": {
    basis: [
      choice("Hvilket ord fortæller en handling?", ["sover", "seng", "træt", "meget"], "sover", "Sover fortæller, hvad nogen gør, og er derfor et udsagnsord.", 1),
      text("Skriv udsagnsordet i sætningen: 'Fuglen flyver.'", "flyver", "Flyver fortæller, hvad fuglen gør.", 1),
    ],
  },

  "Tillægsord": {
    basis: [
      choice("Hvilket ord beskriver æblet i 'det grønne æble'?", ["grønne", "æble", "det", "spiser"], "grønne", "Grønne fortæller, hvordan æblet ser ud.", 2),
    ],
    traening: [
      choice("Hvilket tillægsord passer bedst: 'en ___ bamse'?", ["blød", "sover", "bamse", "meget"], "blød", "Blød beskriver, hvordan bamsen føles.", 2),
      choice("Find tillægsordet: 'Den lille båd sejler.'", ["lille", "båd", "sejler", "den"], "lille", "Lille beskriver båden.", 2),
      text("Skriv tillægsordet: 'En varm suppe står på bordet.'", "varm", "Varm beskriver suppen.", 2),
    ],
  },

  "Stedord": {
    traening: [
      choice("Hvilket stedord kan erstatte 'Sofia og Malik'?", ["de", "hun", "han", "jeg"], "de", "De bruges, når vi henviser til flere personer.", 3),
      text("Skriv stedordet, der kan erstatte 'min ven og jeg'.", "vi", "Vi bruges om den, der taler, sammen med en eller flere andre.", 3),
    ],
  },

  "Grundled og udsagnsled": {
    traening: [
      choice("Hvad er grundleddet i 'Drengen sparker bolden'?", ["Drengen", "sparker", "bolden", "sparker bolden"], "Drengen", "Drengen er den, der udfører handlingen.", 3),
      choice("Hvad er udsagnsleddet i 'Pigen tegner en kat'?", ["tegner", "Pigen", "en kat", "Pigen tegner"], "tegner", "Tegner fortæller, hvad pigen gør.", 3),
      text("Skriv udsagnsleddet i sætningen: 'Børnene griner højt.'", "griner", "Griner fortæller, hvad børnene gør.", 3),
    ],
  },
};
