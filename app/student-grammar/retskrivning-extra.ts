import type { GradedGrammarLibrary, GradedGrammarQuestion } from "./grade-progression";

const choice = (q: string, options: string[], answer: string, why: string, minGrade: number): GradedGrammarQuestion => ({
  q, options, answer, why, kind: "choice", minGrade,
});
const text = (q: string, answer: string, why: string, minGrade: number, acceptedAnswers: string[] = [answer]): GradedGrammarQuestion => ({
  q, options: [], answer, why, kind: "text", acceptedAnswers, minGrade, placeholder: "Skriv dit svar…",
});
const rewrite = (q: string, answer: string, why: string, minGrade: number, acceptedAnswers: string[] = [answer]): GradedGrammarQuestion => ({
  q, options: [], answer, why, kind: "rewrite", acceptedAnswers, minGrade, placeholder: "Skriv den rettede sætning…",
});

export const retskrivningExtraLibrary: GradedGrammarLibrary = {
  "Nutids-r": {
    basis: [
      choice("Vælg den rigtige form: 'Jeg ___ en bog hver aften.'", ["læser", "læse", "læste", "læst"], "læser", "I nutid får mange udsagnsord -r: jeg læser.", 5),
      choice("Hvilken sætning er korrekt?", ["Hun cykler hjem.", "Hun cykle hjem.", "Hun cyklerr hjem.", "Hun cyklerer hjem."], "Hun cykler hjem.", "Nutidsformen af cykle er cykler.", 5),
      choice("Prøv med 'spiser/spise': Hvilken form passer i 'Han ___ hurtigt'?", ["spiser", "spise", "spiste", "spist"], "spiser", "Hvis 'spiser' passer, skal det oprindelige udsagnsord også stå i nutid med -r.", 5),
      text("Skriv nutidsformen af 'køre'.", "kører", "Køre bliver til kører i nutid.", 5),
      text("Skriv den rigtige form: 'Maja ___ på bussen.' (vente)", "venter", "I nutid hedder det venter.", 5),
    ],
    traening: [
      choice("Hvorfor hedder det 'jeg lærer' men 'jeg vil lære'?", ["Efter 'vil' står udsagnsordet i navnemåde.", "Nutids-r bruges kun om personer.", "Lære kan aldrig få r.", "Efter 'vil' står udsagnsordet i datid."], "Efter 'vil' står udsagnsordet i navnemåde.", "Modalverbet 'vil' efterfølges af navnemåde uden nutids-r.", 5),
      choice("Vælg korrekt: 'Hun prøver at ___ tidligere.'", ["komme", "kommer", "kom", "kommet"], "komme", "Efter 'at' står udsagnsordet i navnemåde: at komme.", 5),
      choice("Hvilken sætning har en nutids-r-fejl?", ["Jeg håber, du kommer.", "Vi forsøger at nå det.", "Han lærer at svømme.", "Hun begynde at grine."], "Hun begynde at grine.", "Det skal være 'begynder', fordi begynde står som nutidsudsagnsord.", 5),
      rewrite("Ret sætningen: 'Jeg syntes det lyder godt og håbe det virker.'", "Jeg synes det lyder godt og håber det virker.", "Synes og håber står i nutid og skal have de korrekte nutidsformer.", 5, ["Jeg synes, det lyder godt og håber, det virker.", "Jeg synes det lyder godt og håber det virker."]),
      text("Skriv korrekt form af 'diskutere': 'Klassen ___ teksten.'", "diskuterer", "Diskutere får -r i nutid: diskuterer.", 5),
    ],
    udfordring: [
      choice("Hvilken metode er mest sikker, hvis du er i tvivl om nutids-r?", ["Erstat med et udsagnsord, hvor nutid og navnemåde lyder forskelligt, fx spiser/spise.", "Sæt altid r på lange ord.", "Fjern r, hvis ordet står sidst.", "Se om sætningen har komma."], "Erstat med et udsagnsord, hvor nutid og navnemåde lyder forskelligt, fx spiser/spise.", "Prøven med fx spiser/spise afslører, om formen er nutid eller navnemåde.", 5),
      choice("Vælg korrekt: 'Det kan være svært at ___, om hun faktisk ___ problemet.'", ["vurdere / vurderer", "vurderer / vurdere", "vurderer / vurderer", "vurdere / vurdere"], "vurdere / vurderer", "Efter 'at' bruges navnemåde, mens det andet udsagnsord står i nutid.", 5),
      rewrite("Ret kun nutids-r-fejlene: 'Hun forklare, at hun gerne vil lære at argumenterer bedre.'", "Hun forklarer, at hun gerne vil lære at argumentere bedre.", "Forklarer står i nutid; efter 'at lære at' står argumentere i navnemåde.", 5),
      choice("Hvilken sætning er grammatisk korrekt?", ["Når han analyserer, prøver han at forklare effekten.", "Når han analysere, prøver han at forklare effekten.", "Når han analyserer, prøve han at forklare effekten.", "Når han analysere, prøver han at forklarer effekten."], "Når han analyserer, prøver han at forklare effekten.", "Analyserer og prøver står i nutid; forklare står efter 'at'.", 5),
      text("Skriv begge former korrekt: 'Hun ___ teksten og forsøger at ___ sit valg.' (fortolke / begrunde)", "fortolker / begrunde", "Fortolker står i nutid; efter 'at' bruges begrunde uden r.", 5, ["fortolker/ begrunde", "fortolker/begrunde", "fortolker / begrunde"]),
    ],
  },

  "Store og små bogstaver": {
    basis: [
      choice("Hvilket ord skal begynde med stort bogstav?", ["danmark", "skole", "sommer", "hund"], "danmark", "Landenavne er egennavne og skrives med stort: Danmark.", 2),
      choice("Hvilken sætning er skrevet korrekt?", ["Maja bor i Odense.", "maja bor i Odense.", "Maja bor i odense.", "maja bor i odense."], "Maja bor i Odense.", "Personnavne og stednavne begynder med stort bogstav.", 2),
      text("Skriv navnet korrekt: 'freja'.", "Freja", "Personnavne begynder med stort bogstav.", 2),
      choice("Hvilket ord skal normalt skrives med lille begyndelsesbogstav?", ["mandag", "Maja", "Danmark", "Aarhus"], "mandag", "Ugedage skrives normalt med lille begyndelsesbogstav på dansk.", 2),
      rewrite("Ret store og små bogstaver: 'ali bor i kolding.'", "Ali bor i Kolding.", "Ali og Kolding er egennavne og skal begynde med stort.", 2),
    ],
    traening: [
      choice("Hvilken skrivemåde er korrekt?", ["dansk", "Dansk", "DANSK", "danSk"], "dansk", "Navne på sprog skrives normalt med lille begyndelsesbogstav.", 2),
      choice("Vælg korrekt: 'Vi rejser til ___ i sommerferien.'", ["Sverige", "sverige", "SVErige", "sVerige"], "Sverige", "Landenavne er egennavne.", 2),
      rewrite("Ret sætningen: 'På tirsdag skal sara besøge legoland.'", "På tirsdag skal Sara besøge Legoland.", "Sara og Legoland er egennavne; tirsdag skrives med lille.", 2),
      choice("Hvilken sætning er korrekt?", ["Min lærer hedder Peter.", "Min Lærer hedder Peter.", "Min lærer hedder peter.", "min lærer hedder Peter."], "Min lærer hedder Peter.", "Almindelige navneord som lærer skrives med lille, mens personnavne skrives med stort.", 2),
      text("Skriv korrekt: 'jeg bor på fyn.'", "Jeg bor på Fyn.", "En sætning begynder med stort, og Fyn er et egennavn.", 2),
    ],
    udfordring: [
      choice("Hvilken version følger dansk retskrivning?", ["Hun taler engelsk og tysk.", "Hun taler Engelsk og Tysk.", "Hun taler engelsk og Tysk.", "Hun taler Engelsk og tysk."], "Hun taler engelsk og tysk.", "Sprogbetegnelser skrives med lille begyndelsesbogstav.", 2),
      rewrite("Ret: 'I december rejser familien jensen til spanien.'", "I december rejser familien Jensen til Spanien.", "Månedsnavnet december skrives med lille, mens Jensen og Spanien er egennavne.", 2),
      choice("Hvad er forskellen på 'regeringen' og 'Regeringen' i almindelig løbende tekst?", ["Normalt skrives betegnelsen med lille: regeringen.", "Begge skal altid skrives med stort.", "Kun flertal skrives med stort.", "Ord med mere end tre stavelser skrives med stort."], "Normalt skrives betegnelsen med lille: regeringen.", "Almindelige institutions- og funktionsbetegnelser skrives ikke automatisk med stort.", 2),
      text("Skriv sætningen korrekt: 'vi læser dansk i danmark.'", "Vi læser dansk i Danmark.", "Dansk er et sprog og skrives med lille; Danmark er et landenavn og skrives med stort.", 2),
      rewrite("Ret kun begyndelsesbogstaverne: 'Min Ven emil kommer fra Norge og taler Norsk.'", "Min ven Emil kommer fra Norge og taler norsk.", "Ven og norsk skrives med lille; Emil og Norge er egennavne.", 2),
    ],
  },

  "Sammensatte ord": {
    basis: [
      choice("Hvilket ord er skrevet korrekt?", ["fodboldkamp", "fodbold kamp", "fod boldkamp", "fodbold-kamp"], "fodboldkamp", "På dansk skrives sammensatte ord som hovedregel i ét ord.", 3),
      choice("Sæt ordene sammen: 'skole' + 'taske'.", ["skoletaske", "skole taske", "skole-taske", "skolet aske"], "skoletaske", "To ord, der tilsammen danner ét begreb, skrives normalt sammen.", 3),
      text("Skriv som ét ord: 'sommer ferie'.", "sommerferie", "Sommerferie er et sammensat navneord.", 3),
      choice("Hvilket er et sammensat ord?", ["madpakke", "mad", "pakke", "spiser"], "madpakke", "Madpakke består af mad + pakke.", 3),
      rewrite("Ret fejlen: 'Jeg har glemt min gymnastik taske.'", "Jeg har glemt min gymnastiktaske.", "Gymnastiktaske er ét samlet begreb og skrives i ét ord.", 3),
    ],
    traening: [
      choice("Hvilken skrivemåde er korrekt?", ["mobiltelefon", "mobil telefon", "mobil-telefon", "mo biltelefon"], "mobiltelefon", "Sammensatte navneord skrives som hovedregel sammen.", 3),
      choice("Hvad betyder forskellen bedst?", ["'En storvildtjæger' og 'en stor vildtjæger' kan betyde noget forskelligt.", "Mellemrum ændrer aldrig betydning.", "Sammensatte ord må altid deles frit.", "Kun udsagnsord kan skrives sammen."], "'En storvildtjæger' og 'en stor vildtjæger' kan betyde noget forskelligt.", "Sær- og sammenskrivning kan ændre, hvordan ordene hænger sammen betydningsmæssigt.", 3),
      rewrite("Ret: 'Hun købte en regn jakke og et bus kort.'", "Hun købte en regnjakke og et buskort.", "Regnjakke og buskort er sammensatte ord.", 3),
      text("Sæt sammen: 'elev' + 'råd' + 'valg'.", "elevrådsvalg", "Når flere led danner ét begreb, skrives de sammen; her bruges forbindelses-s.", 3),
      choice("Hvilket ord bruger et forbindelses-s?", ["fødselsdag", "skolebog", "madpakke", "sommerhus"], "fødselsdag", "Fødsel + s + dag danner fødselsdag.", 3),
    ],
    udfordring: [
      choice("Hvorfor er 'online undervisning' ofte problematisk i dansk retskrivning?", ["Hvis det fungerer som ét sammensat begreb, bør det som udgangspunkt skrives sammen eller med bindestreg efter gældende mønster.", "Fordi ord aldrig må komme fra engelsk.", "Fordi undervisning skal skrives med stort.", "Fordi alle fremmedord skal stå i citationstegn."], "Hvis det fungerer som ét sammensat begreb, bør det som udgangspunkt skrives sammen eller med bindestreg efter gældende mønster.", "Dansk danner mange sammensætninger, og betydningsenheden afgør ofte, om ordene skal hænge sammen.", 3),
      rewrite("Ret sammenskrivningen: 'Skole bestyrelses mødet blev flyttet til lærerværelset.'", "Skolebestyrelsesmødet blev flyttet til lærerværelset.", "Skolebestyrelsesmødet er én samlet sammensætning.", 3),
      choice("Hvilken version har tydeligst den tilsigtede betydning: en lærer, der underviser i dansk?", ["dansklærer", "dansk lærer", "dansk-lærer", "Dansk lærer"], "dansklærer", "Dansklærer er betegnelsen for en lærer i faget dansk; 'dansk lærer' kan også betyde en lærer fra Danmark.", 3),
      text("Skriv korrekt som ét ord: 'klasse værelses dør'.", "klasseværelsesdør", "Klasseværelse + s + dør bliver klasseværelsesdør.", 3),
      rewrite("Ret: 'Det var et elev råds forslag om skole gårdens cykel stativ.'", "Det var et elevrådsforslag om skolegårdens cykelstativ.", "Elevrådsforslag, skolegården og cykelstativ er sammensatte ord.", 3),
    ],
  },

  "Punktum og spørgsmålstegn": {
    basis: [
      choice("Hvilket tegn skal stå til sidst: 'Hvor bor du__'", ["?", ".", "!", ","], "?", "Et direkte spørgsmål afsluttes med spørgsmålstegn.", 2),
      choice("Hvilket tegn passer: 'Hunden sover__'", [".", "?", ",", ":"], ".", "En almindelig fortællende sætning afsluttes med punktum.", 2),
      rewrite("Sæt tegn: 'Maja cykler hjem'", "Maja cykler hjem.", "En hel fortællende sætning afsluttes med punktum.", 2),
      rewrite("Sæt tegn: 'Hvornår kommer bussen'", "Hvornår kommer bussen?", "Sætningen er et direkte spørgsmål.", 2),
      choice("Hvilken sætning er korrekt?", ["Kan du hjælpe mig?", "Kan du hjælpe mig.", "Kan du hjælpe mig,", "Kan du hjælpe mig:"], "Kan du hjælpe mig?", "Direkte spørgsmål får spørgsmålstegn.", 2),
    ],
    traening: [
      choice("Hvilken version er bedst tegnsat?", ["Jeg gik hjem. Det regnede.", "Jeg gik hjem? Det regnede?", "Jeg gik hjem, Det regnede", "Jeg gik hjem: det regnede?"], "Jeg gik hjem. Det regnede.", "To selvstændige konstateringer kan stå som to punktumsafsluttede sætninger.", 2),
      rewrite("Sæt punktum og stort bogstav: 'vi spiste aftensmad bagefter så vi film'", "Vi spiste aftensmad. Bagefter så vi film.", "Punktum deler teksten i meningsfulde helheder, og ny sætning begynder med stort.", 2),
      choice("Hvornår bruger man spørgsmålstegn?", ["Efter et direkte spørgsmål.", "Efter alle sætninger med ordet 'hvorfor'.", "Efter alle lange sætninger.", "Før et navneord."], "Efter et direkte spørgsmål.", "Spørgsmålstegn markerer, at ytringen er et direkte spørgsmål.", 2),
      choice("Hvilken sætning er ikke et direkte spørgsmål og behøver derfor ikke spørgsmålstegn?", ["Jeg ved ikke, hvor hun bor.", "Hvor bor hun?", "Kommer du i morgen?", "Hvad hedder du?"], "Jeg ved ikke, hvor hun bor.", "Her er spørgsmålet indlejret i en konstaterende sætning.", 2),
      rewrite("Ret tegnsætningen: 'Jeg tænkte på om han kom?'", "Jeg tænkte på, om han kom.", "Hele sætningen er en konstatering, ikke et direkte spørgsmål.", 2, ["Jeg tænkte på om han kom.", "Jeg tænkte på, om han kom."]),
    ],
    udfordring: [
      choice("Hvilken version undgår en såkaldt punktumskæde bedst?", ["Jeg kom hjem, spiste og gik derefter i seng.", "Jeg kom hjem. Jeg spiste. Jeg gik i seng.", "Jeg kom hjem? Jeg spiste? Jeg gik i seng?", "Jeg kom hjem... jeg spiste..."], "Jeg kom hjem, spiste og gik derefter i seng.", "Variation i sætningsbygningen kan skabe bedre sammenhæng end mange meget korte punktummer.", 2),
      rewrite("Omskriv med hensigtsmæssigt punktum: 'Hun åbnede døren hun så ingen hun gik ind'", "Hun åbnede døren. Hun så ingen. Hun gik ind.", "Punktummer markerer de tre selvstændige sætninger tydeligt.", 2),
      choice("Hvorfor kan punktum ændre tempoet i en tekst?", ["Korte punktumsafsnit kan skabe et hakkende eller hurtigt tempo.", "Punktum gør altid teksten langsommere.", "Punktum ændrer ordenes betydning til navneord.", "Punktum bruges kun i fagtekster."], "Korte punktumsafsnit kan skabe et hakkende eller hurtigt tempo.", "Tegnsætning påvirker både rytme og læsning.", 2),
      rewrite("Ret: 'Hun spurgte mig hvor jeg skulle hen?'", "Hun spurgte mig, hvor jeg skulle hen.", "Det er en indirekte spørgende ledsætning inde i en konstaterende helsætning.", 2, ["Hun spurgte mig hvor jeg skulle hen.", "Hun spurgte mig, hvor jeg skulle hen."]),
      text("Hvilket sluttegn passer til sætningen 'Mon hun kommer i morgen__'? Skriv kun tegnet.", "?", "Når 'mon' bruges som et reelt spørgsmål til læseren, kan spørgsmålstegn markere den spørgende ytring.", 2),
    ],
  },

  "Direkte tale": {
    basis: [
      choice("Hvilken sætning viser direkte tale tydeligt?", ["Maja sagde: 'Jeg kommer nu.'", "Maja sagde jeg kommer nu.", "Maja: sagde jeg kommer nu.", "Maja sagde, jeg kommer nu:"], "Maja sagde: 'Jeg kommer nu.'", "Kolon og citationstegn kan markere, at de præcise ord gengives direkte.", 5),
      choice("Hvad er direkte tale?", ["Når man gengiver præcis, hvad nogen siger.", "Når man forklarer et ord.", "Når man skriver en overskrift.", "Når man bruger datid."], "Når man gengiver præcis, hvad nogen siger.", "Direkte tale gengiver personens egne ord.", 5),
      rewrite("Tegnsæt: 'Ali sagde jeg er klar'", "Ali sagde: 'Jeg er klar.'", "Replikken markeres som direkte tale.", 5, ["Ali sagde: \"Jeg er klar.\"", "Ali sagde: 'Jeg er klar.'"]),
      choice("Hvilket tegn kan introducere en replik efter 'hun sagde'?", [":", "?", ";", ")"], ":", "Kolon kan bruges før direkte tale, når den introduceres af fx 'hun sagde'.", 5),
      text("Skriv kun replikken med sluttegn: Maja spørger: Hvad laver du", "Hvad laver du?", "Selve replikken er et direkte spørgsmål.", 5),
    ],
    traening: [
      choice("Hvilken version er bedst tegnsat?", ["'Kommer du?' spurgte han.", "'Kommer du.' spurgte han?", "'Kommer du', spurgte han.", "Kommer du? spurgte han"], "'Kommer du?' spurgte han.", "Spørgsmålstegnet hører til replikken.", 5),
      rewrite("Ret: 'Jeg ved det ikke sagde Nora.'", "'Jeg ved det ikke,' sagde Nora.", "Replik og anførende sætning skal skilles tydeligt.", 5, ["\"Jeg ved det ikke,\" sagde Nora.", "'Jeg ved det ikke,' sagde Nora."]),
      choice("Hvad er forskellen på direkte og indirekte tale?", ["Direkte tale gengiver ordene; indirekte tale refererer indholdet.", "Direkte tale er altid sand; indirekte tale er falsk.", "Indirekte tale må ikke have udsagnsord.", "Der er ingen forskel."], "Direkte tale gengiver ordene; indirekte tale refererer indholdet.", "Fx 'Hun sagde: Jeg går' over for 'Hun sagde, at hun gik'.", 5),
      rewrite("Gør til indirekte tale: 'Maja sagde: Jeg er træt.'", "Maja sagde, at hun var træt.", "I indirekte tale tilpasses blandt andet stedord og ofte tid.", 5),
      choice("Hvilken version har tydeligst talerskifte?", ["'Stop!' råbte Lea. 'Hvorfor?' spurgte Omar.", "Stop råbte Lea hvorfor spurgte Omar", "'Stop hvorfor' råbte Lea spurgte Omar", "Stop! Hvorfor!"], "'Stop!' råbte Lea. 'Hvorfor?' spurgte Omar.", "Hver replik er tydeligt markeret med taler og passende tegn.", 5),
    ],
    udfordring: [
      rewrite("Tegnsæt: 'Nej sagde han jeg tror ikke det virker'", "'Nej,' sagde han, 'jeg tror ikke, det virker.'", "Den anførende sætning bryder replikken og markeres derfor inde i den direkte tale.", 5, ["\"Nej,\" sagde han, \"jeg tror ikke, det virker.\"", "'Nej,' sagde han, 'jeg tror ikke, det virker.'"]),
      choice("Hvorfor kan direkte tale virke stærkere end et referat?", ["Læseren møder personens ord og stemme mere direkte.", "Direkte tale er altid kortere.", "Direkte tale fjerner alle tegn.", "Direkte tale gør teksten objektiv."], "Læseren møder personens ord og stemme mere direkte.", "Ordvalg og tone kan træde tydeligere frem i en direkte replik.", 5),
      rewrite("Gør den indirekte tale direkte: 'Hun spurgte, om jeg kom i morgen.'", "Hun spurgte: 'Kommer du i morgen?'", "Direkte tale gengiver spørgsmålet som en replik.", 5, ["Hun spurgte: \"Kommer du i morgen?\"", "Hun spurgte: 'Kommer du i morgen?'"]),
      choice("Hvilken effekt kan en meget kort replik have i en fortælling?", ["Den kan skabe tempo, spænding eller markere en skarp reaktion.", "Den gør automatisk fortælleren upålidelig.", "Den fjerner karakterernes stemmer.", "Den betyder altid, at tiden går langsomt."], "Den kan skabe tempo, spænding eller markere en skarp reaktion.", "Replikkens længde og placering påvirker rytmen.", 5),
      rewrite("Ret både replik og anførende sætning: 'Hvor er hun. spurgte Malik?'", "'Hvor er hun?' spurgte Malik.", "Spørgsmålstegnet hører til den direkte replik; anførende sætning afsluttes med punktum.", 5, ["\"Hvor er hun?\" spurgte Malik.", "'Hvor er hun?' spurgte Malik."]),
    ],
  },

  "Kolon, semikolon og tankestreg": {
    basis: [
      choice("Hvilket tegn passer før en forklarende opremsning? 'Jeg skal købe tre ting__ mælk, brød og æbler.'", [":", ";", "?", "."], ":", "Kolon kan stå før en opremsning, der forklarer det foregående.", 7),
      choice("Hvad kan semikolon bruges til?", ["At forbinde to nært beslægtede helsætninger.", "At afslutte alle spørgsmål.", "At markere flertal.", "At erstatte alle kommaer."], "At forbinde to nært beslægtede helsætninger.", "Semikolon ligger betydningsmæssigt mellem komma og punktum.", 7),
      choice("Hvilket tegn kan markere et indskud eller et markant brud?", ["tankestreg", "apostrof", "spørgsmålstegn", "skråstreg"], "tankestreg", "Tankestreg kan fremhæve et indskud eller en efterfølgende pointe.", 7),
      rewrite("Indsæt kolon: 'Der var ét problem ingen havde en nøgle.'", "Der var ét problem: ingen havde en nøgle.", "Det efterfølgende forklarer, hvad problemet var.", 7),
      choice("Hvilken sætning bruger kolon naturligt?", ["Hun havde én plan: at gå hjem.", "Hun: havde én plan at gå hjem.", "Hun havde: én plan at gå hjem.", "Hun havde én: plan at gå hjem."], "Hun havde én plan: at gå hjem.", "Kolon introducerer forklaringen på planen.", 7),
    ],
    traening: [
      choice("Hvilken version bruger semikolon hensigtsmæssigt?", ["Jeg ville gå; det begyndte dog at regne.", "Jeg; ville gå det begyndte dog at regne.", "Jeg ville; gå det begyndte.", "Jeg ville gå?; det regnede."], "Jeg ville gå; det begyndte dog at regne.", "Begge dele kan stå som helsætninger og hænger tæt sammen.", 7),
      rewrite("Forbedr tegnsætningen med kolon: 'Konklusionen var tydelig vi måtte begynde forfra.'", "Konklusionen var tydelig: vi måtte begynde forfra.", "Anden del udfolder den tydelige konklusion.", 7),
      choice("Hvilken version bruger tankestreg som indskud?", ["Eleven – som ellers var stille – rakte hånden op.", "Eleven; som ellers var stille; rakte hånden op.", "Eleven: som ellers var stille: rakte hånden op.", "Eleven? som ellers var stille? rakte hånden op."], "Eleven – som ellers var stille – rakte hånden op.", "Tankestregerne markerer et tydeligt indskud.", 7),
      choice("Hvornår er punktum ofte bedre end semikolon?", ["Når sammenhængen mellem helsætningerne ikke er tæt nok til semikolon.", "Når sætningen indeholder et navneord.", "Når der står et stedord.", "Når teksten er skrevet i nutid."], "Når sammenhængen mellem helsætningerne ikke er tæt nok til semikolon.", "Semikolon bør bruges, når de to helsætninger hænger nært sammen.", 7),
      rewrite("Ret: 'Jeg havde forberedt mig godt; Derfor var jeg rolig.'", "Jeg havde forberedt mig godt; derfor var jeg rolig.", "Efter semikolon fortsætter man normalt med lille begyndelsesbogstav, hvis næste ord ikke er et egennavn.", 7),
    ],
    udfordring: [
      choice("Hvilken forskel skaber tankestregen i 'Han åbnede døren – og frøs'?", ["Den fremhæver et brud eller en dramatisk efterfølgende reaktion.", "Den gør 'døren' til et udsagnsord.", "Den markerer et direkte spørgsmål.", "Den viser flertal."], "Den fremhæver et brud eller en dramatisk efterfølgende reaktion.", "Tankestregen kan styre rytme og fokus.", 7),
      choice("Hvilken version er mest præcis?", ["Resultatet var overraskende: ingen havde stemt imod.", "Resultatet: var overraskende ingen havde stemt imod.", "Resultatet var; overraskende: ingen havde stemt imod.", "Resultatet var overraskende;: ingen havde stemt imod."], "Resultatet var overraskende: ingen havde stemt imod.", "Kolonet introducerer forklaringen på, hvorfor resultatet var overraskende.", 7),
      rewrite("Brug semikolon til at samle: 'Argumentet er stærkt. Dokumentationen er svag.'", "Argumentet er stærkt; dokumentationen er svag.", "Semikolon kan forbinde de to kontrasterende, men nært beslægtede helsætninger.", 7),
      choice("Hvilket udsagn om kolon er korrekt?", ["Det, der står før kolon, skal normalt kunne fungere som en afsluttet helhed.", "Kolon skal stå efter hvert udsagnsord.", "Kolon og semikolon er altid udskiftelige.", "Kolon må kun bruges i overskrifter."], "Det, der står før kolon, skal normalt kunne fungere som en afsluttet helhed.", "Kolon peger frem mod en forklaring, uddybning eller opremsning.", 7),
      rewrite("Vælg tegn, så effekten bliver dramatisk: 'Hun kiggede ned ___ brevet var væk.'", "Hun kiggede ned – brevet var væk.", "Tankestregen skaber et markant brud før opdagelsen.", 7, ["Hun kiggede ned – brevet var væk.", "Hun kiggede ned—brevet var væk."]),
    ],
  },

  "Sin, sit, sine eller hans/hendes": {
    basis: [
      choice("Vælg korrekt: 'Maja tog ___ jakke på.'", ["sin", "hendes", "hans", "deres"], "sin", "Når Maja selv ejer jakken, bruges det tilbagevisende stedord sin.", 4),
      choice("Vælg korrekt: 'Emil vaskede ___ hænder.'", ["sine", "hans", "sin", "hendes"], "sine", "Hænder er flertal, og de tilhører grundleddet Emil: sine hænder.", 4),
      choice("Vælg korrekt: 'Sara tog ___ cykel.' Cyklen tilhører en anden pige, Lea.", ["hendes", "sin", "sit", "sine"], "hendes", "Når ejeren ikke er grundleddet Sara, bruges hendes.", 4),
      text("Skriv ordet: 'Jonas fandt ___ penalhus.' Penalhuset er Jonas' eget.", "sit", "Penalhus er intetkøn, så der bruges sit.", 4),
      choice("Hvad afgør først og fremmest valget mellem sin og hans/hendes?", ["Om det ejede tilhører sætningens grundled.", "Om sætningen er lang.", "Om ordet står i datid.", "Om der er komma."], "Om det ejede tilhører sætningens grundled.", "Sin/sit/sine viser tilbage til grundleddet.", 4),
    ],
    traening: [
      choice("Vælg korrekt: 'Nora sagde til Maja, at hun havde glemt ___ bog.' Bogen tilhører Nora, og 'hun' henviser til Nora.", ["sin", "hendes", "sit", "sine"], "sin", "I ledsætningen er hun grundled og ejer bogen, derfor sin.", 4),
      choice("Vælg korrekt: 'Peter fortalte Omar om ___ nye lærer.' Læreren er Peters.", ["sin", "hans", "sine", "sit"], "sin", "Peter er grundled og ejer relationen: sin nye lærer.", 4),
      rewrite("Ret: 'Maja vaskede hendes hænder.' Hænderne er Majas egne.", "Maja vaskede sine hænder.", "Når ejeren er grundleddet Maja, bruges sine.", 4),
      choice("Hvilken sætning betyder, at jakken tilhører en anden kvinde end Anna?", ["Anna tog hendes jakke.", "Anna tog sin jakke.", "Anna tog sit jakke.", "Anna tog sine jakke."], "Anna tog hendes jakke.", "Hendes peger på en anden kvindelig ejer end grundleddet Anna.", 4),
      text("Skriv korrekt: 'Ali pakkede ___ bøger.' Bøgerne er Alis egne.", "sine", "Bøger står i flertal, og de tilhører grundleddet Ali.", 4),
    ],
    udfordring: [
      choice("Hvorfor er 'Sofie så Anna tage hendes taske' tvetydig?", ["'Hendes' kan kræve kontekst for at afgøre, hvem ejeren er.", "Fordi tasker ikke kan ejes.", "Fordi 'så' altid er et biord.", "Fordi sætningen mangler udsagnsord."], "'Hendes' kan kræve kontekst for at afgøre, hvem ejeren er.", "Stedordsreference skal være tydelig, ellers kan læseren blive i tvivl om ejeren.", 4),
      choice("Vælg korrekt: 'Da Lea talte med Emma, fortalte Emma om ___ projekt.' Projektet er Emmas eget.", ["sit", "hendes", "sin", "sine"], "sit", "I ledsætningen er Emma grundled, og projekt er intetkøn: sit projekt.", 4),
      rewrite("Gør ejeren entydig: 'Maja sagde til Sara, at hendes opgave var god.' Opgaven er Saras.", "Maja sagde til Sara, at Saras opgave var god.", "Et navn kan være tydeligere end et tvetydigt stedord.", 4),
      choice("Vælg korrekt: 'Læreren bad eleverne tage ___ bøger frem.' Bøgerne tilhører eleverne selv.", ["deres", "sine", "sin", "sit"], "deres", "Her er 'eleverne' ikke grammatisk grundled i helsætningen; derfor bruges deres i denne konstruktion.", 4),
      rewrite("Ret og gør betydningen klar: 'Jonas fortalte Emil, at han havde glemt hans computer.' Computeren er Emils.", "Jonas fortalte Emil, at Emil havde glemt sin computer.", "Gentagelsen af Emil fjerner uklarheden, og sin viser tilbage til grundleddet Emil i ledsætningen.", 4),
    ],
  },

  "Nogen eller nogle": {
    basis: [
      choice("Vælg korrekt: 'Jeg har ___ æbler med.'", ["nogle", "nogen", "noget", "noglet"], "nogle", "Nogle betyder flere, men ikke alle.", 5),
      choice("Vælg korrekt i spørgsmålet: 'Har du ___ spørgsmål?'", ["nogen", "nogle", "noget", "nogenlunde"], "nogen", "I spørgsmål bruges nogen ofte i betydningen 'overhovedet nogen'.", 5),
      choice("Vælg korrekt: 'Jeg har ikke ___ penge.'", ["nogen", "nogle", "noget", "nogens"], "nogen", "Efter nægtelse bruges nogen ofte i betydningen 'ingen overhovedet'.", 5),
      text("Skriv korrekt ord: 'Der står ___ elever udenfor.'", "nogle", "Der menes et ubestemt antal elever, altså nogle.", 5),
      choice("Hvad betyder 'nogle' typisk?", ["flere, men ikke nødvendigvis alle", "ingen overhovedet", "én bestemt person", "altid præcis to"], "flere, men ikke nødvendigvis alle", "Nogle angiver en ubestemt del af en mængde.", 5),
    ],
    traening: [
      choice("Vælg korrekt: 'Hvis ___ ringer, så tag en besked.'", ["nogen", "nogle", "noget", "nogle få"], "nogen", "I betingelser bruges nogen ofte om en ubestemt person overhovedet.", 5),
      choice("Vælg korrekt: 'Jeg købte ___ bøger på udsalg.'", ["nogle", "nogen", "noget", "nogens"], "nogle", "Her ved vi, at der faktisk blev købt flere bøger.", 5),
      rewrite("Ret: 'Jeg har ikke nogle ideer.' Brug den neutrale standardform.", "Jeg har ikke nogen ideer.", "Ved almindelig nægtelse bruges nogen typisk.", 5),
      choice("Hvilken sætning er korrekt?", ["Er der nogen hjemme?", "Er der nogle hjemme?", "Er der nogene hjemme?", "Er der nogens hjemme?"], "Er der nogen hjemme?", "Spørgsmålet handler om, hvorvidt der overhovedet er en person hjemme.", 5),
      text("Skriv ordet: 'Hun inviterede ___ venner fra klassen.'", "nogle", "Der er tale om flere bestemte, men ikke alle venner.", 5),
    ],
    udfordring: [
      choice("Hvilken betydningsforskel er vigtigst?", ["'Nogen' bruges ofte om eksistens/overhovedet; 'nogle' om en ubestemt delmængde.", "Nogen er ental og nogle er altid præcis tre.", "Nogle bruges kun i spørgsmål.", "Der er ingen betydningsforskel."], "'Nogen' bruges ofte om eksistens/overhovedet; 'nogle' om en ubestemt delmængde.", "Valget afhænger af, om fokus er på eksistens eller på en del af en mængde.", 5),
      choice("Vælg korrekt: 'Der må være ___, der kender svaret.'", ["nogen", "nogle", "noget", "nogens"], "nogen", "Betydningen er, at der må eksistere mindst én person, som kender svaret.", 5),
      choice("Vælg korrekt: '___ af eleverne valgte at blive.'", ["Nogle", "Nogen", "Noget", "Nogens"], "Nogle", "Her udpeges en del af en kendt gruppe elever.", 5),
      rewrite("Ret kun nogen/nogle: 'Har nogle set de nogen papirer, jeg lagde her?'", "Har nogen set de nogle papirer, jeg lagde her?", "I spørgsmålet bruges nogen; 'de nogle papirer' angiver en bestemt delmængde, selv om formuleringen kan være stilistisk tung.", 5),
      text("Skriv korrekt: 'Jeg tvivler på, at ___ kan løse alle opgaver uden fejl.'", "nogen", "Efter tvivl bruges nogen naturligt i betydningen 'overhovedet nogen'.", 5),
    ],
  },

  "Ligge eller lægge": {
    basis: [
      choice("Vælg korrekt: 'Bogen ___ på bordet.'", ["ligger", "lægger", "lagde", "lagt"], "ligger", "Ligge beskriver en tilstand eller placering uden genstandsled.", 5),
      choice("Vælg korrekt: 'Jeg ___ bogen på bordet.'", ["lægger", "ligger", "lå", "ligget"], "lægger", "Lægge betyder at placere noget og har her genstandsleddet bogen.", 5),
      choice("Hvilken form er datid af 'ligge'?", ["lå", "lagde", "lagt", "ligger"], "lå", "Ligge bøjes: ligger – lå – har ligget.", 5),
      choice("Hvilken form er datid af 'lægge'?", ["lagde", "lå", "ligget", "ligger"], "lagde", "Lægge bøjes: lægger – lagde – har lagt.", 5),
      text("Skriv korrekt ord: 'Hun ___ telefonen i tasken.'", "lægger", "Hun placerer telefonen; derfor lægger.", 5),
    ],
    traening: [
      choice("Vælg korrekt: 'Nøglerne har ___ på bordet hele dagen.'", ["ligget", "lagt", "lå", "lagde"], "ligget", "Noget befinder sig et sted: har ligget.", 5),
      choice("Vælg korrekt: 'Jeg har ___ nøglerne i skuffen.'", ["lagt", "ligget", "lå", "lægger"], "lagt", "Jeg har placeret noget: har lagt.", 5),
      rewrite("Ret: 'Jeg ligger tasken på stolen.'", "Jeg lægger tasken på stolen.", "Der er et genstandsled, tasken, som bliver placeret.", 5),
      rewrite("Ret: 'Tasken lagde på stolen hele dagen.'", "Tasken lå på stolen hele dagen.", "Tasken befandt sig på stolen og blev ikke placeret af et udtrykt grundled.", 5),
      choice("Hvilken huskeregel er nyttig?", ["Lægge tager ofte noget med sig: man lægger noget; ligge beskriver ofte, hvor noget befinder sig.", "Ligge bruges altid om mennesker.", "Lægge bruges kun i datid.", "De to ord betyder præcis det samme."], "Lægge tager ofte noget med sig: man lægger noget; ligge beskriver ofte, hvor noget befinder sig.", "Forskellen mellem handling og tilstand er central.", 5),
    ],
    udfordring: [
      choice("Vælg korrekt: 'Efter at have ___ papirerne på bordet lod hun dem ___ der.'", ["lagt / ligge", "ligget / lægge", "lagt / lægge", "ligget / ligge"], "lagt / ligge", "Først placerer hun papirerne (lagt); derefter befinder de sig der (ligge).", 5),
      rewrite("Ret alle former: 'I går lå jeg bogen på bordet, og der har den lagt siden.'", "I går lagde jeg bogen på bordet, og der har den ligget siden.", "Jeg placerede bogen: lagde. Bogen befinder sig der: har ligget.", 5),
      choice("Hvilken sætning er korrekt?", ["Hun lagde sig på sofaen.", "Hun lå sig på sofaen.", "Hun liggede sig på sofaen.", "Hun lagt sig på sofaen."], "Hun lagde sig på sofaen.", "Når man aktivt placerer sig selv, bruges det tilbagevisende 'lagde sig'.", 5),
      choice("Vælg korrekt: 'Problemet ___ i måden, opgaven er formuleret på.'", ["ligger", "lægger", "lagde", "lagt"], "ligger", "Også i overført betydning bruges ligge om, hvor noget findes eller består.", 5),
      rewrite("Ret: 'Hun har lagt vågen hele natten og tænkt.'", "Hun har ligget vågen hele natten og tænkt.", "Hun har befundet sig vågen; derfor har ligget.", 5),
    ],
  },
};
