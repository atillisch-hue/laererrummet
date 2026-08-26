export type TrainingQuestion = { q: string; options: string[]; answer: string; why: string };
export type LevelBank = Record<string, TrainingQuestion[]>;

const q = (text: string, options: string[], answer: string, why: string): TrainingQuestion => ({ q: text, options, answer, why });
const set = (rows: Array<[string, string[], string, string]>): TrainingQuestion[] => rows.map(([text, options, answer, why]) => q(text, options, answer, why));

export const freeTrainingQuestions: Record<string, Record<string, Record<string, LevelBank>>> = {
  "dansk-grammatik": {
    ordklasser: {
      Navneord: {
        start: set([
          ["Hvilket ord er en ting?", ["løbe", "bold", "glad", "hurtigt"], "bold", "En bold er en ting og derfor et navneord."],
          ["Hvad kan du sætte 'en' foran?", ["kat", "sove", "stor", "meget"], "kat", "Man kan sige en kat."],
          ["Find navneordet: 'Hunden løber.'", ["Hunden", "løber", "begge", "ingen"], "Hunden", "Hunden betegner et dyr."],
          ["Hvilket ord er navnet på et sted?", ["skole", "læser", "smuk", "langsomt"], "skole", "Skole er et navneord."],
          ["Hvilket ord er ikke et navneord?", ["bord", "sommer", "cykel", "hopper"], "hopper", "Hopper fortæller en handling."],
        ]),
        basis: set([
          ["Hvilket ord er et navneord?", ["løber", "cykel", "hurtigt", "glad"], "cykel", "Cykel er navnet på en ting."],
          ["Hvilket er et egennavn?", ["by", "pige", "Odense", "skole"], "Odense", "Odense er navnet på et bestemt sted."],
          ["Hvilket navneord er abstrakt?", ["stol", "venskab", "hund", "blyant"], "venskab", "Venskab kan forstås, men ikke røres."],
          ["Hvilken række består kun af navneord?", ["bog, skole, tanke", "løbe, bog, glad", "hurtig, tanke, der", "skrive, læse, skole"], "bog, skole, tanke", "Alle tre ord er navneord."],
          ["Find navneordene: 'Eleven åbner døren.'", ["Eleven og døren", "åbner", "kun Eleven", "ingen"], "Eleven og døren", "Begge ord navngiver personer eller ting."],
        ]),
        traening: set([
          ["Hvilket ord er mest værdiladet?", ["beslutning", "katastrofe", "møde", "forslag"], "katastrofe", "Katastrofe rummer en stærk negativ vurdering."],
          ["Hvilket er en nominalisering?", ["vurdering", "vurdere", "vurderer", "vurderede"], "vurdering", "En handling er gjort til et navneord."],
          ["Hvilken formulering er mest konkret?", ["Frygt fyldte rummet", "Der var frygt", "Frygt eksisterede", "Man havde noget frygt"], "Frygt fyldte rummet", "Det abstrakte begreb får en konkret billedlig handling."],
          ["Hvilket navneord fungerer som grundled i 'Planen virker'?", ["Planen", "virker", "begge", "ingen"], "Planen", "Planen er det, der virker."],
          ["Hvilket ord er et sammensat navneord?", ["skolegård", "hurtigere", "løbende", "fordi"], "skolegård", "Skolegård består af skole + gård."],
        ]),
        udfordring: set([
          ["Hvorfor kan nominalisering gøre en tekst tung?", ["Handlinger pakkes ind som navneord", "Navneord kan ikke bøjes", "Sætninger bliver altid korte", "Der kommer automatisk komma"], "Handlinger pakkes ind som navneord", "Fx 'gennemførelse af evaluering' er tungere end 'vi evaluerer'."],
          ["Hvilken omskrivning er mest handlingspræget?", ["Der skete en vurdering af sagen", "Vi vurderede sagen", "Sagens vurdering fandt sted", "En vurdering blev foretaget"], "Vi vurderede sagen", "Et aktivt udsagnsord gør handlingen tydelig."],
          ["Form → funktion → effekt: 'katastrofen' i en debattekst?", ["Navneord → navngiver hændelsen → rammesætter negativt", "Biord → viser tid → skaber tempo", "Stedord → henviser → skaber fællesskab", "Udsagnsord → handling → skaber fart"], "Navneord → navngiver hændelsen → rammesætter negativt", "Ordvalget påvirker læserens opfattelse."],
          ["Hvilken version skjuler tydeligst, hvem der handler?", ["Ledelsen besluttede ændringen", "Beslutningen om ændringen blev truffet", "Vi ændrede planen", "Eleverne foreslog ændringen"], "Beslutningen om ændringen blev truffet", "Nominalisering og passiv kan skjule aktøren."],
          ["Hvad gør 'helten' frem for 'personen' ved en tekst?", ["Tilfører vurdering", "Gør ordet til udsagnsord", "Fjerner betydning", "Viser kun tid"], "Tilfører vurdering", "Helten er mere værdiladet end personen."],
        ]),
      },
      Udsagnsord: {
        start: set([
          ["Hvilket ord fortæller, hvad nogen gør?", ["løber", "hund", "rød", "meget"], "løber", "Løber er en handling."],
          ["Hvad kan du sætte 'at' foran?", ["cykle", "cykel", "glad", "stor"], "cykle", "Man kan sige at cykle."],
          ["Find handlingen: 'Maja hopper.'", ["Maja", "hopper", "begge", "ingen"], "hopper", "Hopper fortæller, hvad Maja gør."],
          ["Hvilket ord er en handling?", ["spiser", "mad", "sulten", "hun"], "spiser", "Spiser er et udsagnsord."],
          ["Hvilket er ikke en handling?", ["løbe", "sove", "stol", "grine"], "stol", "Stol er en ting."],
        ]),
        basis: set([
          ["Hvilket udsagnsord står i datid?", ["spiser", "spiste", "spise", "spis"], "spiste", "Handlingen er allerede sket."],
          ["Hvilket står i nutid?", ["løb", "løber", "løbe", "løbet"], "løber", "Løber står i nutid."],
          ["Find udsagnsordet: 'Børnene griner højt.'", ["Børnene", "griner", "højt", "Børnene griner"], "griner", "Griner er handlingen."],
          ["Hvad er infinitiv?", ["at skrive", "skriver", "skrev", "skrevet"], "at skrive", "Infinitiv er navnemåden."],
          ["Hvilket er ikke et udsagnsord?", ["løbe", "tænker", "stol", "sov"], "stol", "Stol er et navneord."],
        ]),
        traening: set([
          ["Hvilken sætning står i førnutid?", ["Jeg har læst bogen", "Jeg læser bogen", "Jeg læste bogen", "Jeg vil læse bogen"], "Jeg har læst bogen", "Har + kort tillægsform danner førnutid."],
          ["Hvilket verbum er mest præcist?", ["gik", "bevægede sig", "listede", "var"], "listede", "Listede fortæller både bevægelse og måde."],
          ["Hvilken form er 'skrevet'?", ["kort tillægsform", "nutid", "navnemåde", "bydemåde"], "kort tillægsform", "Skrevet bruges bl.a. med har/havde."],
          ["Hvilken sætning har sammensat verballed?", ["Hun har sovet", "Hun sover", "Hun sov", "Sov!"], "Hun har sovet", "Har sovet består af hjælpeverbum og hovedverbum."],
          ["Hvilket verbum skaber mest tempo?", ["eksisterede", "var", "sprang", "befandt sig"], "sprang", "Sprang er konkret og handlingsmættet."],
        ]),
      },
      Tillægsord: {
        start: set([
          ["Hvilket ord beskriver en ting?", ["rød", "løber", "bord", "meget"], "rød", "Rød beskriver fx en bold."],
          ["Find tillægsordet: 'Den store hund.'", ["Den", "store", "hund", "ingen"], "store", "Store beskriver hunden."],
          ["Hvilket ord fortæller, hvordan noget er?", ["glad", "glæde", "smiler", "hun"], "glad", "Glad beskriver en egenskab."],
          ["Hvad passer foran 'bil'?", ["hurtig", "kører", "vej", "meget"], "hurtig", "En hurtig bil."],
          ["Hvilket er ikke et tillægsord?", ["smuk", "lille", "grøn", "cykel"], "cykel", "Cykel er et navneord."],
        ]),
        basis: set([
          ["Hvad er højere grad af 'stor'?", ["større", "størst", "mere stor", "store"], "større", "Stor bøjes stor, større, størst."],
          ["Hvad er højeste grad af 'god'?", ["bedre", "bedst", "godest", "mere god"], "bedst", "God bøjes uregelmæssigt."],
          ["Hvilket tillægsord er værdiladet?", ["firkantet", "fantastisk", "to", "der"], "fantastisk", "Fantastisk udtrykker en tydelig positiv vurdering."],
          ["Find tillægsordet: 'Filmen var spændende.'", ["Filmen", "var", "spændende", "ingen"], "spændende", "Spændende beskriver filmen."],
          ["Hvilken række er kun tillægsord?", ["glad, blå, vanskelig", "løbe, blå, hus", "meget, der, grøn", "bog, glad, skrive"], "glad, blå, vanskelig", "Alle tre beskriver egenskaber."],
        ]),
      },
    },
    saetninger: {
      "Grundled og udsagnsled": {
        start: set([
          ["Hvem gør noget i 'Maja løber'?", ["Maja", "løber", "begge", "ingen"], "Maja", "Maja er grundleddet."],
          ["Hvad gør Maja i 'Maja løber'?", ["Maja", "løber", "hurtig", "ingen"], "løber", "Løber er udsagnsleddet."],
          ["Find grundleddet: 'Hunden sover.'", ["Hunden", "sover", "begge", "ingen"], "Hunden", "Hunden udfører handlingen."],
          ["Find udsagnsleddet: 'Vi spiser.'", ["Vi", "spiser", "begge", "ingen"], "spiser", "Spiser fortæller handlingen."],
          ["Hvem cykler i 'Ali cykler'?", ["Ali", "cykler", "ingen", "ved ikke"], "Ali", "Ali er den, der cykler."],
        ]),
        basis: set([
          ["Find udsagnsleddet: 'Maja cykler.'", ["Maja", "cykler", "Maja cykler", "ingen"], "cykler", "Udsagnsleddet fortæller handlingen."],
          ["Find grundleddet: 'Hunden gøede.'", ["Hunden", "gøede", "begge", "ingen"], "Hunden", "Grundleddet udfører handlingen."],
          ["Hvad er udsagnsleddet i 'De har spist'?", ["De", "har spist", "spist", "har"], "har spist", "Et udsagnsled kan bestå af flere udsagnsord."],
          ["Grundleddet i 'Børnene leger ude' er…", ["Børnene", "leger", "ude", "leger ude"], "Børnene", "Det er børnene, der udfører handlingen."],
          ["Hvilket spørgsmål hjælper med at finde grundleddet?", ["Hvem/hvad + udsagnsled?", "Hvorfor?", "Hvornår?", "Hvor mange?"], "Hvem/hvad + udsagnsled?", "Spørg fx: Hvem cykler?"],
        ]),
      },
    },
  },

  matematik: {
    "tal-regning": {
      "Tal og mængder": {
        talstart: set([
          ["Hvilket tal kommer efter 7?", ["6", "8", "9", "17"], "8", "Når vi tæller videre fra 7, kommer 8."],
          ["Hvor mange prikker er der: ● ● ● ● ?", ["3", "4", "5", "6"], "4", "Der er fire prikker."],
          ["Hvilket tal er størst?", ["3", "8", "5", "2"], "8", "8 er større end de andre tal."],
          ["Hvad mangler? 2, 3, 4, __, 6", ["1", "5", "7", "8"], "5", "Tallene tæller én op ad gangen."],
          ["Hvilket tal er mindst?", ["10", "4", "7", "9"], "4", "4 er det mindste tal."],
        ]),
        grund: set([
          ["Hvad er værdien af 5 i tallet 352?", ["5", "50", "500", "3.052"], "50", "5 står på tierpladsen."],
          ["Hvilket tal er størst?", ["398", "389", "308", "383"], "398", "398 har flest tiere efter samme antal hundreder."],
          ["Afrund 347 til nærmeste hundrede.", ["300", "340", "350", "400"], "300", "347 er tættere på 300 end 400."],
          ["Hvilket tal er 100 større end 625?", ["525", "725", "635", "1.625"], "725", "625 + 100 = 725."],
          ["Hvad er halvdelen af 80?", ["20", "30", "40", "60"], "40", "80 delt i to lige store dele giver 40."],
        ]),
      },
      "Plus og minus": {
        talstart: set([
          ["Hvad er 4 + 3?", ["6", "7", "8", "9"], "7", "Fire plus tre er syv."],
          ["Hvad er 9 - 2?", ["5", "6", "7", "8"], "7", "Når to tages fra ni, er der syv tilbage."],
          ["Du har 5 æbler og får 2 mere. Hvor mange har du?", ["3", "6", "7", "8"], "7", "5 + 2 = 7."],
          ["Hvad er 10 - 4?", ["4", "5", "6", "7"], "6", "10 - 4 = 6."],
          ["Hvilket regnestykke giver 8?", ["4 + 4", "3 + 4", "10 - 3", "2 + 5"], "4 + 4", "4 + 4 = 8."],
        ]),
        grund: set([
          ["Hvad er 48 + 27?", ["65", "75", "85", "95"], "75", "48 + 20 + 7 = 75."],
          ["Hvad er 103 - 47?", ["46", "56", "66", "76"], "56", "103 - 47 = 56."],
          ["Hvad mangler? 35 + __ = 80", ["35", "45", "55", "65"], "45", "80 - 35 = 45."],
          ["Du har 250 kr. og bruger 87 kr. Hvor meget er tilbage?", ["153 kr.", "163 kr.", "173 kr.", "337 kr."], "163 kr.", "250 - 87 = 163."],
          ["Hvilket overslag passer bedst til 198 + 304?", ["ca. 300", "ca. 400", "ca. 500", "ca. 600"], "ca. 500", "200 + 300 er cirka 500."],
        ]),
      },
      "Gange og division": {
        talstart: set([
          ["Hvad er 2 + 2 + 2?", ["4", "5", "6", "8"], "6", "Tre grupper med 2 giver 6."],
          ["Hvad er 2 × 4?", ["6", "8", "10", "12"], "8", "To grupper med fire giver otte."],
          ["8 bolde deles mellem 2 børn. Hvor mange får hver?", ["2", "3", "4", "6"], "4", "8 delt med 2 er 4."],
          ["Hvad er 5 × 2?", ["5", "7", "10", "12"], "10", "Fem gange to er ti."],
          ["Hvad er 12 ÷ 3?", ["3", "4", "6", "9"], "4", "12 delt i tre lige store grupper giver fire."],
        ]),
        grund: set([
          ["Hvad er 7 × 8?", ["48", "54", "56", "64"], "56", "7 × 8 = 56."],
          ["Hvad er 72 ÷ 9?", ["6", "7", "8", "9"], "8", "9 × 8 = 72."],
          ["6 kasser har 24 flasker hver. Hvor mange flasker?", ["124", "134", "144", "154"], "144", "6 × 24 = 144."],
          ["96 elever fordeles i grupper på 8. Hvor mange grupper?", ["10", "11", "12", "14"], "12", "96 ÷ 8 = 12."],
          ["Hvilket regnestykke giver 45?", ["5 × 9", "6 × 8", "54 ÷ 9", "7 × 5"], "5 × 9", "5 × 9 = 45."],
        ]),
      },
    },
    "broeker-procent": {
      Brøker: {
        mellem: set([
          ["Hvad er 1/2 af 20?", ["5", "10", "15", "20"], "10", "Halvdelen af 20 er 10."],
          ["Hvilken brøk er størst?", ["1/4", "1/2", "1/8", "1/10"], "1/2", "Når tælleren er 1, er færre lige store dele større."],
          ["Hvad er 1/4 + 1/4?", ["1/4", "1/2", "2/8", "1"], "1/2", "To fjerdedele er det samme som en halv."],
          ["3 ud af 4 dele svarer til…", ["1/4", "2/4", "3/4", "4/3"], "3/4", "Tre af fire lige store dele skrives 3/4."],
          ["Hvad er 2/3 af 12?", ["4", "6", "8", "9"], "8", "En tredjedel er 4, så to tredjedele er 8."],
        ]),
      },
      Procent: {
        mellem: set([
          ["Hvad er 50 % af 100?", ["25", "50", "75", "100"], "50", "50 % betyder halvdelen."],
          ["En vare til 200 kr. sættes 25 % ned. Hvor stor er rabatten?", ["25 kr.", "50 kr.", "75 kr.", "100 kr."], "50 kr.", "25 % af 200 kr. er 50 kr."],
          ["Hvad svarer 0,5 til i procent?", ["5 %", "25 %", "50 %", "500 %"], "50 %", "0,5 er halvdelen, altså 50 %."],
          ["20 ud af 100 er…", ["2 %", "20 %", "50 %", "80 %"], "20 %", "Procent betyder pr. hundrede."],
          ["En pris stiger fra 100 til 110 kr. Stigningen er…", ["5 %", "10 %", "11 %", "110 %"], "10 %", "Stigningen er 10 ud af de oprindelige 100."],
        ]),
        udskoling: set([
          ["En pris stiger fra 400 til 460 kr. Hvor mange procent?", ["10 %", "15 %", "20 %", "60 %"], "15 %", "Stigningen er 60/400 = 0,15 = 15 %."],
          ["Efter 20 % rabat koster en vare 800 kr. Hvad kostede den før?", ["960 kr.", "1.000 kr.", "1.200 kr.", "640 kr."], "1.000 kr.", "800 kr. er 80 % af førprisen; 800/0,8 = 1.000."],
          ["Hvad er procentfaktoren ved en stigning på 7 %?", ["0,07", "0,93", "1,07", "1,7"], "1,07", "100 % + 7 % = 107 % = 1,07."],
          ["Et tal falder 10 % og derefter stiger 10 %. Er det tilbage ved start?", ["Ja", "Nej, det er lidt lavere", "Nej, det er højere", "Kun ved tallet 100"], "Nej, det er lidt lavere", "Procenterne beregnes af forskellige udgangstal."],
          ["250 er hvor mange procent af 1.000?", ["2,5 %", "20 %", "25 %", "40 %"], "25 %", "250/1.000 = 0,25 = 25 %."],
        ]),
      },
    },
    geometri: {
      "Længde og enheder": {
        grund: set([
          ["Hvor mange centimeter er 2 meter?", ["20 cm", "200 cm", "2.000 cm", "0,2 cm"], "200 cm", "1 meter er 100 centimeter."],
          ["Hvor mange meter er 3 km?", ["30 m", "300 m", "3.000 m", "30.000 m"], "3.000 m", "1 km er 1.000 meter."],
          ["Hvad er 150 cm i meter?", ["0,15 m", "1,5 m", "15 m", "150 m"], "1,5 m", "150 cm = 1 meter og 50 cm."],
          ["En snor er 4 m. Du klipper 75 cm af. Hvor meget er tilbage?", ["3,25 m", "3,75 m", "4,75 m", "325 m"], "3,25 m", "4,00 - 0,75 = 3,25 m."],
          ["Hvilken enhed passer bedst til længden af en blyant?", ["km", "m", "cm", "liter"], "cm", "En blyant måles praktisk i centimeter."],
        ]),
      },
      Areal: {
        mellem: set([
          ["Et rektangel er 5 cm langt og 3 cm bredt. Arealet er…", ["8 cm²", "15 cm²", "16 cm²", "30 cm²"], "15 cm²", "Areal = længde × bredde."],
          ["Et kvadrat har sidelængde 4 m. Arealet er…", ["8 m²", "12 m²", "16 m²", "20 m²"], "16 m²", "4 × 4 = 16."],
          ["Et rum er 6 m × 4 m. Hvor mange m² gulv?", ["10 m²", "20 m²", "24 m²", "48 m²"], "24 m²", "6 × 4 = 24 m²."],
          ["Hvilken enhed bruges til areal?", ["cm", "cm²", "cm³", "liter"], "cm²", "Areal måles i kvadratenheder."],
          ["Et rektangel har areal 30 cm² og bredde 5 cm. Længden er…", ["5 cm", "6 cm", "25 cm", "150 cm"], "6 cm", "30 ÷ 5 = 6 cm."],
        ]),
      },
    },
    algebra: {
      Ligninger: {
        udskoling: set([
          ["Løs: x + 7 = 19", ["10", "11", "12", "26"], "12", "Træk 7 fra på begge sider."],
          ["Løs: 3x = 24", ["6", "8", "21", "72"], "8", "Divider begge sider med 3."],
          ["Løs: 2x + 5 = 17", ["5", "6", "7", "11"], "6", "Træk 5 fra og divider derefter med 2."],
          ["Hvilken ligning passer til 'et tal plus 4 er 11'?", ["x + 4 = 11", "4x = 11", "x - 4 = 11", "11x = 4"], "x + 4 = 11", "x repræsenterer det ukendte tal."],
          ["Hvis 5x - 10 = 20, hvad er x?", ["2", "4", "6", "10"], "6", "Læg 10 til: 5x = 30. Divider med 5: x = 6."],
        ]),
      },
    },
    data: {
      Statistik: {
        udskoling: set([
          ["Tallene er 2, 4, 4, 6, 9. Hvad er typetallet?", ["2", "4", "5", "9"], "4", "4 forekommer flest gange."],
          ["Tallene er 3, 5, 7. Hvad er gennemsnittet?", ["4", "5", "6", "15"], "5", "(3 + 5 + 7) / 3 = 5."],
          ["Tallene er 1, 4, 8, 10, 12. Medianen er…", ["4", "7", "8", "10"], "8", "Det midterste tal i den sorterede række er 8."],
          ["Hvad fortæller variationsbredden?", ["Største minus mindste værdi", "Gennemsnittet", "Det mest almindelige tal", "Antallet af observationer"], "Største minus mindste værdi", "Variationsbredden beskriver spændet i data."],
          ["Hvilket mål påvirkes mest af en ekstrem værdi?", ["gennemsnit", "typetal", "median", "antal"], "gennemsnit", "En meget høj eller lav værdi trækker gennemsnittet."],
        ]),
      },
    },
    anvendt: {
      "Penge og budget": {
        anvendt: set([
          ["Du har 500 kr. Et køb koster 325 kr. Hvor meget har du tilbage?", ["125 kr.", "175 kr.", "225 kr.", "825 kr."], "175 kr.", "500 - 325 = 175."],
          ["Tre billetter koster 75 kr. stykket. Hvad koster de?", ["150 kr.", "200 kr.", "225 kr.", "250 kr."], "225 kr.", "3 × 75 = 225."],
          ["Et abonnement koster 129 kr. om måneden. Hvad koster 2 måneder?", ["129 kr.", "158 kr.", "258 kr.", "300 kr."], "258 kr.", "2 × 129 = 258."],
          ["Du har 1.000 kr. og bruger 650 kr. Hvor meget er tilbage?", ["250 kr.", "350 kr.", "450 kr.", "650 kr."], "350 kr.", "1.000 - 650 = 350."],
          ["Samme vare koster 240 kr. og 199 kr. Hvor meget sparer du?", ["31 kr.", "41 kr.", "51 kr.", "61 kr."], "41 kr.", "240 - 199 = 41."],
        ]),
      },
      "Tid og planlægning": {
        anvendt: set([
          ["Et tog kører 08.42 og turen varer 1 t 35 min. Hvornår ankommer det?", ["09.17", "10.07", "10.17", "10.27"], "10.17", "08.42 + 1 time = 09.42; + 35 min = 10.17."],
          ["Du har 90 minutter til tre lige lange opgaver. Hvor meget tid pr. opgave?", ["20 min", "25 min", "30 min", "45 min"], "30 min", "90 ÷ 3 = 30 minutter."],
          ["En aktivitet starter 13.15 og slutter 14.50. Hvor længe varer den?", ["1 t 25 min", "1 t 35 min", "1 t 45 min", "2 t 35 min"], "1 t 35 min", "Fra 13.15 til 14.15 er 1 time og derefter 35 minutter."],
          ["Du skal være fremme 09.00. Turen tager 45 min, og du vil have 10 min buffer. Seneste afgang?", ["07.55", "08.05", "08.15", "08.25"], "08.05", "09.00 minus 55 minutter er 08.05."],
          ["Fire møder varer 25 minutter hver. Samlet mødetid?", ["1 t", "1 t 20 min", "1 t 40 min", "2 t"], "1 t 40 min", "4 × 25 = 100 minutter = 1 time og 40 minutter."],
        ]),
      },
      "Problemløsning og modeller": {
        anvendt: set([
          ["En bil bruger 18 kWh pr. 100 km. Hvor meget til 250 km?", ["36 kWh", "45 kWh", "50 kWh", "68 kWh"], "45 kWh", "18 × 2,5 = 45 kWh."],
          ["Et rum på 24 m² skal have gulv. Du lægger 10 % til spild. Hvor meget køber du?", ["24,4 m²", "26,4 m²", "34 m²", "240 m²"], "26,4 m²", "10 % af 24 er 2,4; i alt 26,4 m²."],
          ["En opskrift til 4 personer bruger 300 g mel. Hvor meget til 10 personer?", ["600 g", "700 g", "750 g", "1.200 g"], "750 g", "300/4 = 75 g pr. person; 75 × 10 = 750 g."],
          ["Et kort har målestok 1:50.000. 2 cm på kortet svarer til…", ["100 m", "500 m", "1 km", "10 km"], "1 km", "2 × 50.000 cm = 100.000 cm = 1 km."],
          ["Du kan vælge 3 stk. for 75 kr. eller 5 stk. for 115 kr. Hvilket er billigst pr. stk.?", ["3 for 75", "5 for 115", "samme pris", "kan ikke afgøres"], "5 for 115", "75/3 = 25 kr.; 115/5 = 23 kr."],
        ]),
      },
    },
  },
};
