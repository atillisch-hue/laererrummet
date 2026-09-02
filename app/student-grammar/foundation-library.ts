import type { GradedGrammarQuestion, GradedGrammarLibrary } from "./grade-progression";

const choice = (q: string, options: string[], answer: string, why: string, minGrade: number): GradedGrammarQuestion => ({
  q, options, answer, why, kind: "choice", minGrade, maxGrade: 4,
});

const text = (q: string, answer: string, why: string, minGrade: number, acceptedAnswers: string[] = [answer]): GradedGrammarQuestion => ({
  q, options: [], answer, why, kind: "text", acceptedAnswers, minGrade, maxGrade: 4, placeholder: "Skriv dit svar…",
});

export const foundationGrammarLibrary: GradedGrammarLibrary = {
  "Navneord": {
    basis: [
      choice("Hvilket ord er navnet på en ting?", ["bold", "løber", "glad", "hurtigt"], "bold", "En bold er en ting, og ordet er derfor et navneord.", 1),
      choice("Find navneordet: 'Katten sover.'", ["Katten", "sover", "hurtigt", "ikke"], "Katten", "Katten er navnet på et dyr.", 1),
      choice("Hvilket ord kan du sætte 'en' foran?", ["bog", "læse", "blå", "meget"], "bog", "Man kan sige 'en bog'.", 1),
      choice("Hvilket ord er et navn på et sted?", ["skole", "løbe", "venlig", "langsomt"], "skole", "Skole er navnet på et sted.", 1),
      text("Skriv navneordet i sætningen: 'Hunden leger.'", "Hunden", "Hunden er navnet på et dyr.", 1),
    ],
    traening: [
      choice("Hvilke ord er begge navneord?", ["hund og cykel", "løber og hopper", "rød og glad", "meget og ofte"], "hund og cykel", "Hund og cykel er navne på dyr og ting.", 1),
      choice("Hvad er navneordet i 'Min ven har en kanin'?", ["ven", "har", "en", "min"], "ven", "Ven betegner en person.", 1),
      choice("Hvilket ord er et egennavn?", ["Freja", "pige", "hund", "by"], "Freja", "Freja er navnet på en bestemt person.", 2),
      choice("Hvilket navneord står i flertal?", ["bøger", "bog", "læser", "grøn"], "bøger", "Bøger betyder mere end én bog.", 2),
      text("Skriv navneordet: 'Børnene finder en skat.'", "skat", "Skat er navnet på en ting.", 2),
    ],
    udfordring: [
      choice("Hvilket ord er et sammensat navneord?", ["skolegård", "skole", "går", "glad"], "skolegård", "Skolegård er sat sammen af skole + gård.", 3),
      choice("Hvilket ord er et navneord for en følelse?", ["glæde", "glad", "smiler", "meget"], "glæde", "Glæde er navnet på en følelse.", 3),
      choice("Hvilket navneord står i bestemt form?", ["hunden", "hund", "hunde", "løber"], "hunden", "Hunden betyder den bestemte hund.", 3),
      choice("Hvilket er et egennavn og skal have stort begyndelsesbogstav?", ["Odense", "byen", "gaden", "skolen"], "Odense", "Odense er navnet på et bestemt sted.", 3),
      text("Skriv det sammensatte navneord i 'Vi leger i skolegården.'", "skolegården", "Skolegården er bygget af to navneord: skole og gård.", 3),
    ],
  },

  "Udsagnsord": {
    basis: [
      choice("Hvilket ord fortæller, hvad nogen gør?", ["løber", "hund", "rød", "hurtigt"], "løber", "Løber er en handling og derfor et udsagnsord.", 1),
      choice("Find udsagnsordet: 'Maja hopper.'", ["Maja", "hopper", "ingen", "begge"], "hopper", "Hopper fortæller, hvad Maja gør.", 1),
      choice("Hvilket ord kan du sætte 'at' foran?", ["synge", "sang", "sød", "sangbog"], "synge", "Man kan sige 'at synge'.", 1),
      choice("Hvilket ord er IKKE et udsagnsord?", ["stol", "sover", "leger", "spiser"], "stol", "Stol er en ting og dermed et navneord.", 1),
      text("Skriv udsagnsordet: 'Hunden gøer.'", "gøer", "Gøer fortæller, hvad hunden gør.", 1),
    ],
    traening: [
      choice("Hvilket udsagnsord står i datid?", ["legede", "leger", "lege", "leg"], "legede", "Legede fortæller, at handlingen skete før nu.", 2),
      choice("Hvilket udsagnsord står i nutid?", ["cykler", "cyklede", "cykle", "cykel"], "cykler", "Cykler fortæller, at handlingen sker nu.", 2),
      choice("Find udsagnsordet: 'Børnene byggede en hule.'", ["Børnene", "byggede", "en", "hule"], "byggede", "Byggede fortæller, hvad børnene gjorde.", 2),
      choice("Hvad er navneformen af 'spiser'?", ["spise", "spiste", "spis", "mad"], "spise", "Man kan sige 'at spise'.", 2),
      text("Skriv udsagnsordet i datid: 'Hun danser.'", "dansede", "Dansede er datid af danser.", 2),
    ],
    udfordring: [
      choice("Hvilken sætning har to udsagnsord?", ["Hun løber og hopper.", "Hun er glad.", "Hunden sover.", "Bogen er blå."], "Hun løber og hopper.", "Løber og hopper er begge udsagnsord.", 3),
      choice("Hvilket udsagnsord er mest præcist? 'Hunden ___ mod døren.'", ["styrtede", "gik", "var", "gjorde"], "styrtede", "Styrtede fortæller tydeligt, hvordan hunden bevægede sig.", 3),
      choice("Hvilken sætning står i datid?", ["De fandt skatten.", "De finder skatten.", "De vil finde skatten.", "Find skatten!"], "De fandt skatten.", "Fandt er datid af finde.", 3),
      choice("Hvad er udsagnsleddet i 'Hun har læst bogen'?", ["har læst", "Hun", "bogen", "læst bogen"], "har læst", "Udsagnsleddet kan bestå af mere end ét udsagnsord.", 4),
      text("Skriv hele udsagnsleddet: 'Vi har spist.'", "har spist", "Har spist er de ord, der fortæller handlingen.", 4),
    ],
  },

  "Tillægsord": {
    basis: [
      choice("Hvilket ord beskriver hunden i 'den store hund'?", ["store", "den", "hund", "ingen"], "store", "Store fortæller, hvordan hunden er.", 2),
      choice("Hvilket ord er et tillægsord?", ["glad", "barn", "løber", "meget"], "glad", "Glad beskriver en egenskab.", 2),
      choice("Find tillægsordet: 'En rød bold.'", ["rød", "bold", "en", "ingen"], "rød", "Rød fortæller noget om bolden.", 2),
      choice("Hvilket ord kan beskrive et hus?", ["gammelt", "hus", "bygger", "der"], "gammelt", "Gammelt beskriver huset.", 2),
      text("Skriv tillægsordet: 'Den søde kat sover.'", "søde", "Søde beskriver katten.", 2),
    ],
    traening: [
      choice("Hvilket tillægsord passer bedst: 'en ___ citron'?", ["sur", "løber", "citron", "meget"], "sur", "Sur kan beskrive citronens smag.", 2),
      choice("Hvilket ord beskriver vejret? 'Det er koldt i dag.'", ["koldt", "det", "er", "dag"], "koldt", "Koldt beskriver vejret.", 2),
      choice("Hvad er grundformen af 'større'?", ["stor", "størst", "større", "størrelse"], "stor", "Stor er grundformen.", 3),
      choice("Hvilket står i højere grad?", ["hurtigere", "hurtig", "hurtigst", "hurtigt"], "hurtigere", "Hurtigere sammenligner to ting.", 3),
      text("Skriv højeste grad af 'lille'.", "mindst", "Lille bøjes uregelmæssigt: lille, mindre, mindst.", 4),
    ],
    udfordring: [
      choice("Hvilket tillægsord gør beskrivelsen mest præcis? 'En ___ lyd.'", ["skinger", "god", "fin", "lyd"], "skinger", "Skinger fortæller mere præcist, hvordan lyden er.", 3),
      choice("Hvilket ord er tillægsord i 'Den mørke skov lå stille'?", ["mørke", "skov", "lå", "stille"], "mørke", "Mørke beskriver skoven.", 3),
      choice("Hvilken række er rigtig?", ["god – bedre – bedst", "god – godere – godest", "god – bedst – bedre", "god – mere – mest"], "god – bedre – bedst", "God har en uregelmæssig gradbøjning.", 4),
      choice("Hvad gør tillægsord i en beskrivelse?", ["De kan gøre billedet tydeligere.", "De viser altid tid.", "De erstatter alle navneord.", "De sætter komma."], "De kan gøre billedet tydeligere.", "Gode tillægsord hjælper læseren med at forestille sig noget.", 4),
      text("Skriv tillægsordet i 'Den nervøse elev ventede.'", "nervøse", "Nervøse beskriver eleven.", 4),
    ],
  },

  "Stedord": {
    basis: [
      choice("Hvilket ord kan stå i stedet for 'Maja'?", ["hun", "pige", "løber", "glad"], "hun", "Hun kan bruges i stedet for navnet Maja.", 3),
      choice("Hvilket ord er et stedord?", ["jeg", "bord", "spiser", "grøn"], "jeg", "Jeg står i stedet for navnet på den, der taler.", 3),
      choice("Find stedordet: 'De spiller fodbold.'", ["De", "spiller", "fodbold", "ingen"], "De", "De henviser til flere personer eller ting.", 3),
      choice("Hvilket stedord kan erstatte 'Ali'?", ["han", "hun", "det", "vi"], "han", "Han kan stå i stedet for et drengenavn.", 3),
      text("Skriv stedordet: 'Hun læser.'", "Hun", "Hun står i stedet for et navn.", 3),
    ],
    traening: [
      choice("Hvilket stedord passer? 'Maja og jeg går hjem. ___ er trætte.'", ["Vi", "De", "Hun", "I"], "Vi", "Vi bruges om den, der taler, sammen med andre.", 3),
      choice("Hvad henviser 'den' til? 'Jeg tog bogen og lagde den væk.'", ["bogen", "jeg", "væk", "tog"], "bogen", "Den peger tilbage på bogen.", 3),
      choice("Vælg korrekt: 'Maja tog ___ jakke.'", ["sin", "hendes", "deres", "dens"], "sin", "Når Maja selv ejer jakken, bruges sin.", 4),
      choice("Hvilken sætning undgår gentagelse bedst?", ["Maja tog sin taske, fordi hun skulle gå.", "Maja tog Majas taske, fordi Maja skulle gå.", "Hun tog Maja taske.", "Maja tog taske Maja."], "Maja tog sin taske, fordi hun skulle gå.", "Stedord kan erstatte navne og gøre teksten mere flydende.", 4),
      text("Skriv stedordet, der passer: 'Emil og Nora leger. ___ griner.'", "De", "De henviser til Emil og Nora.", 3),
    ],
    udfordring: [
      choice("Hvad er problemet i 'Anna talte med Sofie, og hun var vred'?", ["Det er uklart, hvem 'hun' er.", "Der mangler udsagnsord.", "Der er intet navneord.", "Sætningen er i flertal."], "Det er uklart, hvem 'hun' er.", "Et stedord skal have en tydelig henvisning.", 4),
      choice("Vælg korrekt: 'Emil vaskede ___ hænder.'", ["sine", "hans", "deres", "dens"], "sine", "Emil er selv ejer af hænderne, så vi bruger sine.", 4),
      choice("Hvilket stedord skaber fællesskab?", ["vi", "de", "den", "det"], "vi", "Vi kan samle afsender og andre i samme gruppe.", 4),
      choice("Hvilket stedord er flertal?", ["de", "hun", "han", "den"], "de", "De henviser til flere.", 3),
      text("Skriv hvad 'hun' henviser til: 'Maja smilede, fordi hun var glad.'", "Maja", "Hun peger tilbage på Maja.", 3),
    ],
  },

  "Grundled og udsagnsled": {
    basis: [
      choice("Hvem gør noget i 'Katten sover'?", ["Katten", "sover", "ingen", "begge"], "Katten", "Katten er den, der gør noget, og er derfor grundled.", 3),
      choice("Hvad gør katten i 'Katten sover'?", ["sover", "Katten", "ingen", "begge"], "sover", "Sover er udsagnsleddet.", 3),
      choice("Find grundleddet: 'Børnene leger.'", ["Børnene", "leger", "begge", "ingen"], "Børnene", "Børnene er dem, der leger.", 3),
      choice("Find udsagnsleddet: 'Hunden gøer.'", ["gøer", "Hunden", "begge", "ingen"], "gøer", "Gøer fortæller, hvad hunden gør.", 3),
      text("Skriv grundleddet: 'Maja cykler.'", "Maja", "Maja er den, der cykler.", 3),
    ],
    traening: [
      choice("Hvad er grundleddet i 'Den lille hund løber'?", ["Den lille hund", "løber", "lille", "hund løber"], "Den lille hund", "Hele ledet 'Den lille hund' er grundled.", 3),
      choice("Hvad er udsagnsleddet i 'Maja og Ali spiller'?", ["spiller", "Maja og Ali", "Ali", "Maja"], "spiller", "Spiller fortæller, hvad de gør.", 3),
      choice("Hvad er grundleddet i 'På bordet ligger bogen'?", ["bogen", "På bordet", "ligger", "bordet"], "bogen", "Det er bogen, der ligger, selvom grundleddet kommer senere.", 4),
      choice("Hvad er udsagnsleddet i 'Hun har læst'?", ["har læst", "Hun", "læst", "har"], "har læst", "Udsagnsleddet kan bestå af to ord.", 4),
      text("Skriv grundleddet: 'Tre børn spiller bold.'", "Tre børn", "Tre børn er dem, der spiller.", 4),
    ],
    udfordring: [
      choice("Hvad er grundleddet i 'I haven leger børnene'?", ["børnene", "I haven", "leger", "haven"], "børnene", "Børnene udfører handlingen, selvom sætningen starter med sted.", 4),
      choice("Hvad er udsagnsleddet i 'De ville spille videre'?", ["ville spille", "De", "spille videre", "videre"], "ville spille", "Ville og spille hører sammen i udsagnsleddet.", 4),
      choice("Hvilken sætning har grundleddet efter udsagnsleddet?", ["På gulvet ligger tasken.", "Tasken ligger på gulvet.", "Maja læser bogen.", "Hunden sover."], "På gulvet ligger tasken.", "Når noget andet står først, kan grundleddet komme efter udsagnsleddet.", 4),
      choice("Hvad er grundled og udsagnsled i 'Min bedste ven vandt'?", ["Min bedste ven / vandt", "Min / bedste", "ven / bedste", "vandt / ven"], "Min bedste ven / vandt", "Hele 'Min bedste ven' er grundled, og 'vandt' er udsagnsled.", 4),
      text("Skriv hele udsagnsleddet: 'De har bygget en hule.'", "har bygget", "Har bygget er det samlede udsagnsled.", 4),
    ],
  },
};
