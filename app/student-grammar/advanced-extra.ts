import type { GrammarQuestion } from "./grammar-library";

type Levels = Record<string, GrammarQuestion[]>;

const q = (text: string, options: string[], answer: string, why: string): GrammarQuestion => ({ q: text, options, answer, why });
const set = (rows: Array<[string, string[], string, string]>): GrammarQuestion[] => rows.map(([text, options, answer, why]) => q(text, options, answer, why));

export const advancedExtraLibrary: Record<string, Levels> = {
  "Komma mellem helsætninger": {
    basis: set([
      ["Hvor skal kommaet stå? 'Solen skinnede og vi gik ud.'", ["Solen skinnede, og vi gik ud.", "Solen, skinnede og vi gik ud.", "Solen skinnede og, vi gik ud.", "Der skal ikke komma."], "Solen skinnede, og vi gik ud.", "Der er to helsætninger med hvert sit grundled og udsagnsled: solen skinnede / vi gik."],
      ["Hvor skal kommaet stå? 'Jeg læser men min bror spiller.'", ["Jeg læser, men min bror spiller.", "Jeg, læser men min bror spiller.", "Jeg læser men, min bror spiller.", "Der skal ikke komma."], "Jeg læser, men min bror spiller.", "Men forbinder to helsætninger, og der sættes komma mellem dem."],
      ["Hvilken sætning har korrekt komma?", ["Hun løb, og han cyklede.", "Hun, løb og han cyklede.", "Hun løb og, han cyklede.", "Hun løb og han, cyklede."], "Hun løb, og han cyklede.", "Begge dele kan stå som selvstændige sætninger, så der sættes komma mellem helsætningerne."],
      ["Skal der komma i 'Maja synger og danser'?", ["Nej", "Ja, før og", "Ja, efter Maja", "Ja, efter synger"], "Nej", "Der er ét grundled, Maja, til begge udsagnsord. Derfor er der ikke to helsætninger."],
      ["Skal der komma i 'Maja synger og Ali danser'?", ["Ja, før og", "Nej", "Ja, efter Maja", "Ja, efter Ali"], "Ja, før og", "Maja synger og Ali danser er to helsætninger med hvert sit grundled."],
    ]),
    traening: set([
      ["Hvor sættes kommaet? 'Bussen kom ikke så vi gik hjem.'", ["Bussen kom ikke, så vi gik hjem.", "Bussen, kom ikke så vi gik hjem.", "Bussen kom, ikke så vi gik hjem.", "Bussen kom ikke så, vi gik hjem."], "Bussen kom ikke, så vi gik hjem.", "Så forbinder her to helsætninger: bussen kom ikke / vi gik hjem."],
      ["Hvilken version er korrekt?", ["Jeg ville ringe, men mobilen var død.", "Jeg ville, ringe men mobilen var død.", "Jeg ville ringe men mobilen, var død.", "Jeg ville ringe men, mobilen var død."], "Jeg ville ringe, men mobilen var død.", "Der står to helsætninger på hver sin side af men."],
      ["Hvorfor er der ikke komma i 'Hun åbnede døren og gik ind'?", ["Samme grundled hører til begge udsagnsled", "Der må aldrig stå komma før og", "Gik er ikke et udsagnsord", "Døren er et bindeord"], "Samme grundled hører til begge udsagnsled", "Hun er fælles grundled for både åbnede og gik; der er derfor kun én helsætning."],
      ["Hvilken sætning består af to helsætninger?", ["Vinden tog til, og træerne bøjede sig.", "Vinden tog til og peb.", "De løb og råbte.", "Hun sad stille og læste."], "Vinden tog til, og træerne bøjede sig.", "Vinden/træerne er to forskellige grundled med hvert sit udsagnsled."],
      ["Vælg korrekt tegnsætning: 'Vi kan tage toget eller vi kan cykle.'", ["Vi kan tage toget, eller vi kan cykle.", "Vi, kan tage toget eller vi kan cykle.", "Vi kan tage toget eller, vi kan cykle.", "Vi kan tage, toget eller vi kan cykle."], "Vi kan tage toget, eller vi kan cykle.", "Eller forbinder to helsætninger, som begge har grundled og udsagnsled."],
    ]),
    udfordring: set([
      ["Hvilken begrundelse er bedst for kommaet i 'Hun protesterede, men ingen lyttede'?", ["To sideordnede helsætninger forbindes med men", "Der står altid komma foran men", "Ingen er et stedord", "Protesterede står i datid"], "To sideordnede helsætninger forbindes med men", "Reglen handler om sætningsstrukturen, ikke bare om ordet men."],
      ["Hvilken sætning skal have komma før 'og'?", ["Hun rettede teksten, og læreren læste den.", "Hun rettede teksten og afleverede den.", "Hun læste og skrev.", "Læreren smilede og nikkede."], "Hun rettede teksten, og læreren læste den.", "Kun denne har to selvstændige helsætninger med forskellige grundled."],
      ["Hvorfor er kommaet forkert i 'Eleven læste, og skrev et svar'?", ["Der er ét fælles grundled til læste og skrev", "Der må aldrig stå komma foran og", "Et svar er en ledsætning", "Læste er ikke et verballed"], "Der er ét fælles grundled til læste og skrev", "Eleven er grundled til begge udsagnsled; der er ikke to helsætninger."],
      ["Vælg den korrekt analyserede sætning.", ["'Jeg blev, men hun gik' har to helsætninger og komma før men.", "'Jeg blev og ventede' har to helsætninger.", "'Hun løb, og sprang' har korrekt komma.", "'Vi læste men skrev' kræver altid komma."], "'Jeg blev, men hun gik' har to helsætninger og komma før men.", "Jeg blev / hun gik kan stå selvstændigt og har hver sit grundled og udsagnsled."],
      ["Hvilken omskrivning ændrer én helsætning til to?", ["Maja læste og skrev → Maja læste, og Ali skrev.", "Maja læste og skrev → Maja læste hurtigt og skrev.", "Maja læste → Maja læste bogen.", "Maja skrev → Maja skrev langsomt."], "Maja læste og skrev → Maja læste, og Ali skrev.", "Omskrivningen tilføjer et nyt grundled og skaber dermed en ny helsætning."],
    ]),
  },

  "Komma ved ledsætninger": {
    basis: set([
      ["Hvilket ord indleder ledsætningen i 'Jeg ved, at hun kommer'?", ["at", "jeg", "ved", "kommer"], "at", "At fungerer her som ledsætningsindleder."],
      ["Find ledsætningen: 'Vi går hjem, når filmen slutter.'", ["når filmen slutter", "Vi går hjem", "filmen", "går hjem"], "når filmen slutter", "Når filmen slutter kan ikke stå alene som helsætning og indledes af når."],
      ["Hvor skal kommaet stå ved slutkomma? 'Jeg bliver hjemme fordi jeg er syg.'", ["Jeg bliver hjemme, fordi jeg er syg.", "Jeg, bliver hjemme fordi jeg er syg.", "Jeg bliver, hjemme fordi jeg er syg.", "Jeg bliver hjemme fordi, jeg er syg."], "Jeg bliver hjemme, fordi jeg er syg.", "Ledsætningen 'fordi jeg er syg' står efter helsætningen og afgrænses med komma."],
      ["Hvilken del er ledsætning? 'Hun smiler, selvom hun er nervøs.'", ["selvom hun er nervøs", "Hun smiler", "hun", "smiler"], "selvom hun er nervøs", "Selvom indleder en ledsætning."],
      ["Hvad kendetegner ofte en ledsætning?", ["Den kan ikke normalt stå alene som en fuld ytring", "Den har aldrig et udsagnsord", "Den begynder altid med og", "Den indeholder aldrig et grundled"], "Den kan ikke normalt stå alene som en fuld ytring", "En ledsætning er grammatisk underordnet en anden sætning."],
    ]),
    traening: set([
      ["Brug ikke-prøven: Hvilken er en ledsætning?", ["fordi hun ikke kom", "hun kom ikke", "de spiller ikke", "vi læser ikke"], "fordi hun ikke kom", "I ledsætningen står ikke før det finitte udsagnsord: hun ikke kom."],
      ["Hvor står 'ikke' typisk i en ledsætning?", ["Før det finitte udsagnsord", "Altid sidst", "Før grundleddet", "Efter punktum"], "Før det finitte udsagnsord", "Ikke-prøven kan hjælpe med at skelne ledsætninger fra helsætninger."],
      ["Hvilken tegnsætning er korrekt med slutkomma?", ["Hun gik, da mødet sluttede.", "Hun, gik da mødet sluttede.", "Hun gik da, mødet sluttede.", "Hun gik da mødet, sluttede."], "Hun gik, da mødet sluttede.", "Ledsætningen 'da mødet sluttede' står efter helsætningen."],
      ["Find ledsætningen: 'Hvis det regner, bliver kampen aflyst.'", ["Hvis det regner", "bliver kampen aflyst", "kampen", "aflyst"], "Hvis det regner", "Hvis indleder en betingelsesledsætning."],
      ["Hvilken sætning indeholder en ledsætning?", ["Jeg tror, at hun har ret.", "Hun har ret.", "Vi læser bogen.", "De cykler hjem."], "Jeg tror, at hun har ret.", "'at hun har ret' er underordnet 'Jeg tror'."],
    ]),
    udfordring: set([
      ["Hvilken analyse er korrekt? 'Når solen går ned, tænder vi lys.'", ["'Når solen går ned' er ledsætning; 'tænder vi lys' er helsætning", "Begge er helsætninger", "Begge er ledsætninger", "Kun 'solen går' er ledsætning"], "'Når solen går ned' er ledsætning; 'tænder vi lys' er helsætning", "Når-leddet er underordnet, mens hovedsætningen kan stå selv."],
      ["Hvilken sætning viser tydeligst ikke-prøven?", ["Jeg går, fordi jeg ikke fryser.", "Jeg går ikke hjem.", "Hun læser ikke.", "De kommer ikke."], "Jeg går, fordi jeg ikke fryser.", "I 'fordi jeg ikke fryser' står ikke foran det finitte verbum fryser."],
      ["Hvad er funktionen af 'som vandt løbet' i 'Pigen, som vandt løbet, smilede'?", ["Relativ ledsætning, der beskriver pigen", "Ny helsætning", "Direkte tale", "Et genstandsled uden verballed"], "Relativ ledsætning, der beskriver pigen", "Som-ledsætningen giver ekstra information om navneordet pigen."],
      ["Hvorfor er 'at' ikke altid nok til at afgøre, om noget er en ledsætning?", ["At kan også være infinitivmærke, fx 'at løbe'", "At er altid et navneord", "At bruges kun i spørgsmål", "At kan aldrig indlede en ledsætning"], "At kan også være infinitivmærke, fx 'at løbe'", "Man skal analysere funktionen: 'at hun løber' er ledsætning, mens 'at løbe' er infinitiv."],
      ["Hvilken version afgrænser en indskudt relativ ledsætning korrekt?", ["Min bror, som bor i Aarhus, kommer i morgen.", "Min bror som, bor i Aarhus kommer i morgen.", "Min, bror som bor i Aarhus kommer i morgen.", "Min bror som bor, i Aarhus kommer i morgen."], "Min bror, som bor i Aarhus, kommer i morgen.", "Den indskudte ledsætning afgrænses på begge sider."],
    ]),
  },

  "Kommaøvelser": {
    basis: set([
      ["Vælg korrekt sætning.", ["Jeg var træt, men jeg læste videre.", "Jeg var, træt men jeg læste videre.", "Jeg var træt men, jeg læste videre.", "Jeg var træt men jeg, læste videre."], "Jeg var træt, men jeg læste videre.", "Der er to helsætninger forbundet med men."],
      ["Vælg korrekt sætning med slutkomma.", ["Vi spiser, når maden er klar.", "Vi, spiser når maden er klar.", "Vi spiser når, maden er klar.", "Vi spiser når maden, er klar."], "Vi spiser, når maden er klar.", "Når-ledsætningen står efter helsætningen."],
      ["Hvilken sætning behøver ikke komma?", ["Hun læser og skriver.", "Hun læser, og han skriver.", "Jeg går, fordi jeg er træt.", "Det regner, men vi går."], "Hun læser og skriver.", "Ét grundled har to sideordnede udsagnsled."],
      ["Hvor skal kommaet stå? 'Han smilede fordi planen virkede.'", ["Han smilede, fordi planen virkede.", "Han, smilede fordi planen virkede.", "Han smilede fordi, planen virkede.", "Han smilede fordi planen, virkede."], "Han smilede, fordi planen virkede.", "Fordi indleder en efterstillet ledsætning."],
      ["Hvor skal kommaet stå? 'Hun kom ind og døren smækkede.'", ["Hun kom ind, og døren smækkede.", "Hun, kom ind og døren smækkede.", "Hun kom, ind og døren smækkede.", "Der skal ikke komma."], "Hun kom ind, og døren smækkede.", "To helsætninger med grundleddene hun og døren forbindes med og."],
    ]),
    traening: set([
      ["Hvilken version har alle nødvendige slutkommaer? 'Da timen sluttede gik vi ud men læreren blev.'", ["Da timen sluttede, gik vi ud, men læreren blev.", "Da timen, sluttede gik vi ud men læreren blev.", "Da timen sluttede gik vi, ud men læreren blev.", "Da timen sluttede, gik vi ud men læreren, blev."], "Da timen sluttede, gik vi ud, men læreren blev.", "Først afsluttes den foranstillede ledsætning; derefter adskilles to helsætninger ved men."],
      ["Vælg korrekt tegnsætning: 'Hvis du vil kan vi gå nu.'", ["Hvis du vil, kan vi gå nu.", "Hvis, du vil kan vi gå nu.", "Hvis du, vil kan vi gå nu.", "Hvis du vil kan, vi gå nu."], "Hvis du vil, kan vi gå nu.", "Den foranstillede hvis-ledsætning afsluttes med komma."],
      ["Hvilken sætning er korrekt?", ["Jeg tror, at filmen er god, men jeg har ikke set den.", "Jeg tror at, filmen er god men jeg har ikke set den.", "Jeg, tror at filmen er god men jeg har ikke set den.", "Jeg tror at filmen, er god men jeg har ikke set den."], "Jeg tror, at filmen er god, men jeg har ikke set den.", "Der afgrænses en ledsætning og derefter to sideordnede helsætninger."],
      ["Hvorfor skal der komma i 'Når hun kommer, starter vi'?", ["En foranstillet ledsætning afsluttes", "Der står altid komma efter kommer", "Når er et navneord", "Vi er genstandsled"], "En foranstillet ledsætning afsluttes", "Kommaet markerer grænsen mellem ledsætningen og helsætningen."],
      ["Vælg den sætning, hvor kommaet er overflødigt.", ["Hun løb, og sprang over hegnet.", "Hun løb, og han fulgte efter.", "Hun gik, fordi det regnede.", "Da klokken ringede, gik de."], "Hun løb, og sprang over hegnet.", "Hun er fælles grundled for løb og sprang, så der er ikke to helsætninger."],
    ]),
    udfordring: set([
      ["Vælg korrekt tegnsætning: 'Selvom hun var træt fortsatte hun og hun afleverede til tiden.'", ["Selvom hun var træt, fortsatte hun, og hun afleverede til tiden.", "Selvom, hun var træt fortsatte hun og hun afleverede til tiden.", "Selvom hun var træt fortsatte, hun og hun afleverede til tiden.", "Selvom hun var træt, fortsatte hun og hun, afleverede til tiden."], "Selvom hun var træt, fortsatte hun, og hun afleverede til tiden.", "Den foranstillede ledsætning afsluttes, og de to efterfølgende helsætninger adskilles."],
      ["Hvilken forklaring passer bedst til 'Bogen, som jeg lånte, var spændende'?", ["En indskudt relativ ledsætning afgrænses med to kommaer", "Der er to helsætninger med og", "Kommaerne står omkring genstandsleddet", "Alle navneord skal omgives af komma"], "En indskudt relativ ledsætning afgrænses med to kommaer", "'som jeg lånte' er indskudt og beskriver bogen."],
      ["Hvor er fejlen? 'Vi blev hjemme, fordi det regnede, og så film.'", ["Kommaet før 'og' er forkert, fordi vi er fælles grundled", "Kommaet før fordi er forkert", "Der mangler komma efter vi", "Sætningen er korrekt"], "Kommaet før 'og' er forkert, fordi vi er fælles grundled", "'Vi' er grundled både til blev og så; sidste del er ikke en ny helsætning."],
      ["Vælg korrekt version: 'Jeg ved at når han kommer går vi.'", ["Jeg ved, at når han kommer, går vi.", "Jeg, ved at når han kommer går vi.", "Jeg ved at, når han kommer går vi.", "Jeg ved at når, han kommer går vi."], "Jeg ved, at når han kommer, går vi.", "Der er en at-ledsætning, som indeholder en foranstillet når-ledsætning."],
      ["Hvilken strategi er mest sikker ved svære kommaer?", ["Find først grundled og udsagnsled og afgræns sætningerne", "Sæt komma, hver gang du holder pause", "Sæt altid komma foran og", "Sæt komma efter hvert langt ord"], "Find først grundled og udsagnsled og afgræns sætningerne", "Komma følger grammatisk sætningsstruktur, ikke pauser eller ordlængde."],
    ]),
  },

  "Form → funktion → effekt": {
    basis: set([
      ["I 'Døren smækkede' er 'smækkede' hvilken form?", ["Udsagnsord", "Navneord", "Tillægsord", "Stedord"], "Udsagnsord", "Smækkede udtrykker en handling og er et udsagnsord."],
      ["Hvilken funktion har 'mørke' i 'den mørke skov'?", ["Beskriver skoven", "Er grundled", "Binder to sætninger sammen", "Viser tid"], "Beskriver skoven", "Tillægsordet giver en egenskab til navneordet skov."],
      ["Hvilken effekt kan korte sætninger have?", ["Skabe tempo eller eftertryk", "Gøre alle ord til navneord", "Fjerne tekstens betydning", "Skabe automatisk rim"], "Skabe tempo eller eftertryk", "Korte sætninger kan få læseren til at stoppe op eller mærke et hurtigere tempo."],
      ["Form → funktion → effekt: 'Vi' i en tale?", ["Stedord → samler afsender og modtagere → kan skabe fællesskab", "Navneord → navngiver ting → skaber afstand", "Biord → viser sted → skaber tempo", "Udsagnsord → viser handling → skaber rim"], "Stedord → samler afsender og modtagere → kan skabe fællesskab", "Stedordet vi kan inkludere flere i samme gruppe."],
      ["Hvilket ordvalg gør sætningen mest dramatisk?", ["Bilen bragede ind i muren.", "Bilen kom ind i muren.", "Bilen var ved muren.", "Bilen stod nær muren."], "Bilen bragede ind i muren.", "Det præcise, lydlige udsagnsord 'bragede' forstærker handlingen."],
    ]),
    traening: set([
      ["Hvilken analyse følger bedst form → funktion → effekt? 'Hun hviskede svaret.'", ["Hviskede = præcist udsagnsord → viser måden hun taler på → skaber en dæmpet/spændt stemning", "Hviskede = navneord → viser sted → skaber humor", "Hun = tillægsord → beskriver svaret → skaber fart", "Svaret = biord → viser tid → skaber afstand"], "Hviskede = præcist udsagnsord → viser måden hun taler på → skaber en dæmpet/spændt stemning", "Analysen kobler den grammatiske form til dens konkrete funktion og læservirkning."],
      ["Hvad gør gentagelsen af 'aldrig' typisk i 'Aldrig igen. Aldrig mere.'?", ["Forstærker budskabet og skaber eftertryk", "Gør teksten neutral", "Fjerner rytmen", "Gør ordene til navneord"], "Forstærker budskabet og skaber eftertryk", "Gentagelsen fremhæver ordet og skaber rytmisk tryk."],
      ["Hvilken sproglig ændring skaber mest nærhed?", ["Man kan blive bange → Du kan blive bange", "Jeg løb → Personen bevægede sig", "Vi så huset → Huset blev observeret", "Hun råbte → Der forekom råb"], "Man kan blive bange → Du kan blive bange", "Direkte tiltale med du bringer læseren tættere ind i teksten."],
      ["Hvilken effekt har passiv i 'Fejlen blev begået'?", ["Den kan skjule, hvem der handlede", "Den gør altid teksten morsom", "Den gør 'fejlen' til udsagnsord", "Den viser fremtid"], "Den kan skjule, hvem der handlede", "Passiv kan flytte fokus fra aktøren til handlingen eller resultatet."],
      ["Hvorfor er 'iskold' stærkere end 'kold' i en beskrivelse?", ["Det intensiverer egenskaben", "Det ændrer ordet til et udsagnsord", "Det viser hvem der handler", "Det fjerner værdiladning"], "Det intensiverer egenskaben", "Det mere præcise tillægsord forstærker læserens forestilling."],
    ]),
    udfordring: set([
      ["Hvilken analyse er mest præcis? 'Politikerne påstår, at planen virker.'", ["'påstår' er et værdiladet udsagnsord, der kan signalere afsenderens skepsis", "'påstår' er neutralt og uden effekt", "'planen' er et biord, der viser tid", "'virker' er et navneord, der skaber afstand"], "'påstår' er et værdiladet udsagnsord, der kan signalere afsenderens skepsis", "Valget mellem fx siger og påstår påvirker, hvordan læseren vurderer udsagnet."],
      ["Hvilken omskrivning ændrer tydeligst magtforholdet?", ["'Du skal gøre det' → 'Kunne vi prøve at gøre det?'", "'Hun løb' → 'Hun løb hurtigt'", "'Bogen er blå' → 'Den blå bog'", "'I går regnede det' → 'Det regnede i går'"], "'Du skal gøre det' → 'Kunne vi prøve at gøre det?'", "Modalitet og pronomenvalg ændrer graden af krav, fællesskab og høflighed."],
      ["Hvad er effekten af nominalisering i 'gennemførelsen af evalueringen'?", ["Processen bliver mere abstrakt og aktøren kan træde i baggrunden", "Sætningen bliver nødvendigvis kortere", "Teksten bliver automatisk mere personlig", "Alle handlinger bliver tydeligere"], "Processen bliver mere abstrakt og aktøren kan træde i baggrunden", "Nominalisering pakker handlinger ind som navneord og kan gøre sproget tættere eller mere bureaukratisk."],
      ["Hvorfor kan syntaktisk variation være en effektmarkør?", ["Skift mellem korte og lange sætninger kan styre rytme og fokus", "Fordi lange sætninger altid er bedre", "Fordi komma automatisk skaber spænding", "Fordi alle tekster kræver samme sætningslængde"], "Skift mellem korte og lange sætninger kan styre rytme og fokus", "Sætningsbygning påvirker, hvordan information opleves og vægtes."],
      ["Hvilken formulering kombinerer form, funktion og effekt korrekt?", ["'Måske' = modalbiord → graderer sikkerhed → gør udsagnet mindre kategorisk", "'Måske' = navneord → navngiver en ting → skaber tempo", "'Måske' = udsagnsord → viser handling → skaber fællesskab", "'Måske' = stedord → erstatter person → skaber autoritet"], "'Måske' = modalbiord → graderer sikkerhed → gør udsagnet mindre kategorisk", "Modalbiord kan vise afsenderens sikkerhed eller usikkerhed."],
    ]),
  },

  "Præcise verber": {
    basis: set([
      ["Hvilket verbum er mest præcist for en person, der går lydløst?", ["listede", "gik", "var", "gjorde"], "listede", "Listede fortæller både bevægelsen og måden den udføres på."],
      ["Hvilket verbum giver tydeligst lyd?", ["bragede", "kom", "var", "skete"], "bragede", "Bragede indeholder en tydelig forestilling om kraft og lyd."],
      ["Vælg det mest præcise: 'Hun ___ glasset på bordet.'", ["stillede", "gjorde", "havde", "var"], "stillede", "Stillede fortæller konkret, hvad hun gjorde med glasset."],
      ["Hvilket verbum passer bedst til en vred replik?", ["snerrede", "sagde", "talte", "var"], "snerrede", "Snerrede viser både talehandlingen og følelsen/måden."],
      ["Hvad er fordelen ved et præcist verbum?", ["Det kan vise handling og måde på én gang", "Det gør altid sætningen længere", "Det fjerner alle tillægsord", "Det skaber automatisk komma"], "Det kan vise handling og måde på én gang", "Et præcist verbum giver læseren mere konkret information."],
    ]),
    traening: set([
      ["Hvilken omskrivning er skarpest? 'Han gik hurtigt over vejen.'", ["Han styrtede over vejen.", "Han bevægede sig hurtigt over vejen.", "Han var hurtig over vejen.", "Han gjorde noget hurtigt over vejen."], "Han styrtede over vejen.", "Styrtede samler bevægelse og høj fart i ét præcist verbum."],
      ["Hvilket verbum skaber mest tøven?", ["vaklede", "gik", "løb", "ankom"], "vaklede", "Vaklede kan signalere usikker eller ustabil bevægelse."],
      ["Hvilken version undgår et svagt støtteverbum?", ["Vi undersøgte sagen.", "Vi foretog en undersøgelse af sagen.", "Der blev lavet en undersøgelse.", "Vi gjorde en undersøgelse."], "Vi undersøgte sagen.", "Det direkte verbum 'undersøgte' er kortere og mere handlingsbåret."],
      ["Hvilket verbum skaber den mest rolige bevægelse?", ["slentrede", "styrtede", "sprang", "fløj"], "slentrede", "Slentrede signalerer langsom og afslappet bevægelse."],
      ["Vælg mest præcise verbum: 'Vinden ___ gennem træerne.'", ["susede", "var", "gjorde", "kom"], "susede", "Susede giver både bevægelse og lyd."],
    ]),
    udfordring: set([
      ["Hvilken ændring skifter tekstens attitude mest?", ["'Han sagde' → 'Han vrissede'", "'Han sagde' → 'Han fortalte'", "'Han sagde' → 'Han udtalte'", "'Han sagde' → 'Han nævnte'"], "'Han sagde' → 'Han vrissede'", "Vrissede lægger en tydelig negativ tone og følelsesmæssig vurdering ind i verbet."],
      ["Hvorfor kan 'hævder' være mindre neutralt end 'siger'?", ["Det kan antyde afstand eller tvivl om udsagnet", "Det står altid i datid", "Det er et navneord", "Det kan ikke have et grundled"], "Det kan antyde afstand eller tvivl om udsagnet", "Et præcist verbalvalg kan også signalere afsenderens holdning."],
      ["Hvilken version har størst agentivitet?", ["Eleverne ændrede planen.", "Planen blev ændret.", "Der skete en ændring af planen.", "En ændring fandt sted."], "Eleverne ændrede planen.", "Aktivt verbum og tydelig aktør gør det klart, hvem der handler."],
      ["Hvilken omskrivning er mest sanselig? 'Regnen faldt.'", ["Regnen trommede mod taget.", "Regnen var der.", "Der forekom regn.", "Nedbør fandt sted."], "Regnen trommede mod taget.", "Trommede giver lyd, bevægelse og intensitet."],
      ["Hvad bør afgøre valget mellem 'gik', 'listede' og 'marcherede'?", ["Den betydning og effekt teksten skal skabe", "At det længste ord altid er bedst", "At man aldrig må bruge 'gik'", "Antallet af kommaer"], "Den betydning og effekt teksten skal skabe", "Præcision handler om at vælge det verbum, der passer til situation og ønsket effekt."],
    ]),
  },

  "Variation i sætninger": {
    basis: set([
      ["Hvilken tekst varierer sætningsstart mest?", ["Jeg løb hjem. Senere ringede jeg. Da mørket faldt på, sov jeg.", "Jeg løb hjem. Jeg ringede. Jeg sov.", "Så løb jeg. Så ringede jeg. Så sov jeg.", "Hun løb. Hun ringede. Hun sov."], "Jeg løb hjem. Senere ringede jeg. Da mørket faldt på, sov jeg.", "Sætningerne begynder på tre forskellige måder."],
      ["Hvad kan man variere for at skabe bedre rytme?", ["Sætningslængde og sætningsstart", "Kun skrifttype", "Kun antal punktummer", "Kun navne på personer"], "Sætningslængde og sætningsstart", "Variation i struktur påvirker tekstens rytme."],
      ["Hvilken sætning begynder med et tidsled?", ["I går cyklede vi til byen.", "Vi cyklede til byen.", "Cyklen var rød.", "De så os."], "I går cyklede vi til byen.", "'I går' placeres først og angiver tid."],
      ["Hvilken kombination skaber mest kontrast i rytmen?", ["En lang sætning efterfulgt af en meget kort.", "Tre helt ens sætninger.", "Kun sætninger på fire ord.", "Ingen punktummer."], "En lang sætning efterfulgt af en meget kort.", "Forskellen i længde kan give den korte sætning ekstra vægt."],
      ["Hvilken omskrivning varierer starten? 'Jeg så bilen. Jeg så manden.'", ["Jeg så bilen. Ved siden af den stod manden.", "Jeg så bilen. Jeg så også manden.", "Jeg så bilen. Jeg så manden igen.", "Jeg så bilen. Jeg så manden hurtigt."], "Jeg så bilen. Ved siden af den stod manden.", "Anden sætning får en anden sætningsstart og struktur."],
    ]),
    traening: set([
      ["Hvad gør forfeltet i en dansk helsætning muligt?", ["At forskellige led kan placeres først og få fokus", "At udsagnsleddet altid kan fjernes", "At alle sætninger bliver spørgsmål", "At komma ikke længere bruges"], "At forskellige led kan placeres først og få fokus", "Man kan fx begynde med tid, sted, objekt eller grundled og dermed variere fokus."],
      ["Hvilken version varierer bedst uden at ændre betydningen væsentligt?", ["Vi mødtes på stationen om morgenen. → Om morgenen mødtes vi på stationen.", "Vi mødtes. → Vi sov.", "Vi mødtes. → De mødtes ikke.", "Vi mødtes. → Mødet blev aflyst."], "Vi mødtes på stationen om morgenen. → Om morgenen mødtes vi på stationen.", "Tidsleddet flyttes til forfeltet, mens hovedbetydningen bevares."],
      ["Hvorfor kan tre meget korte sætninger i træk være virkningsfulde?", ["De kan skabe tempo, fast rytme eller eftertryk", "De gør automatisk teksten objektiv", "De fjerner alle udsagnsord", "De gør teksten grammatisk forkert"], "De kan skabe tempo, fast rytme eller eftertryk", "Ens korte strukturer kan bruges bevidst som stilistisk greb."],
      ["Hvilken sætningsstart fremhæver stedet?", ["På taget sad katten.", "Katten sad på taget.", "Katten sad stille.", "Katten var sort."], "På taget sad katten.", "Stedsleddet står i forfeltet og får ekstra fokus."],
      ["Hvilken tekst har mindst syntaktisk variation?", ["Jeg vågnede. Jeg spiste. Jeg gik. Jeg arbejdede.", "Da jeg vågnede, spiste jeg. Senere gik jeg på arbejde.", "Først spiste jeg. Så gik jeg, fordi bussen var kørt.", "Om morgenen vågnede jeg tidligt. Kort efter spiste jeg."], "Jeg vågnede. Jeg spiste. Jeg gik. Jeg arbejdede.", "Alle sætninger har næsten samme længde og samme startmønster."],
    ]),
    udfordring: set([
      ["Hvad sker der med informationsfokus i 'Fejlen opdagede læreren først i går' sammenlignet med 'Læreren opdagede fejlen først i går'?", ["Fejlen fremhæves ved at stå i forfeltet", "Læreren fjernes som grundled", "Sætningen bliver passiv", "Betydningen bliver modsat"], "Fejlen fremhæves ved at stå i forfeltet", "Flytning til forfeltet kan styre, hvad læseren møder og vægter først."],
      ["Hvilken variation skaber bedst et pludseligt stop efter en lang beskrivelse?", ["En ultrakort sætning: 'Så stoppede alt.'", "Endnu en lang ledsætningsrig sætning", "En liste med fem kommaer", "Et længere navneord"], "En ultrakort sætning: 'Så stoppede alt.'", "Kontrasten i længde kan give den korte sætning markant eftertryk."],
      ["Hvorfor er variation ikke et mål i sig selv?", ["Strukturen skal understøtte tekstens mening, genre og effekt", "Fordi alle sætninger bør være ens", "Fordi variation altid gør teksten svær", "Fordi grammatik kun handler om korrekthed"], "Strukturen skal understøtte tekstens mening, genre og effekt", "God variation er funktionel: den hjælper læseren og støtter formålet."],
      ["Hvilken omskrivning ændrer både syntaks og fokus uden at ændre kernesagen?", ["Kommunen præsenterede planen mandag. → Mandag præsenterede kommunen planen.", "Kommunen præsenterede planen. → Kommunen droppede planen.", "Planen var dyr. → Planen var billig.", "De kom. → De kom ikke."], "Kommunen præsenterede planen mandag. → Mandag præsenterede kommunen planen.", "Tidsleddet flyttes frem og får fokus, mens handling og deltagere bevares."],
      ["Hvilket mønster kan bruges bevidst til retorisk optrapning?", ["Tre parallelle sætninger med stigende styrke", "Tilfældig ordstilling uden sammenhæng", "Kun passive sætninger", "Ingen finitte verber"], "Tre parallelle sætninger med stigende styrke", "Parallel syntaks kombineret med progression kan skabe rytme og intensitet."],
    ]),
  },

  "Sproglig effekt": {
    basis: set([
      ["Hvilket ord er mest positivt værdiladet?", ["fantastisk", "almindelig", "kendt", "tilstede"], "fantastisk", "Fantastisk udtrykker en tydelig positiv vurdering."],
      ["Hvilket ord er mest negativt værdiladet?", ["fiasko", "resultat", "hændelse", "forsøg"], "fiasko", "Fiasko vurderer resultatet negativt."],
      ["Hvad kan direkte tiltale med 'du' gøre?", ["Skabe nærhed og involvere læseren", "Gøre teksten passiv", "Fjerne afsenderen", "Gøre alle sætninger korte"], "Skabe nærhed og involvere læseren", "Du henvender sig direkte til modtageren."],
      ["Hvilken sætning virker mest dramatisk?", ["Pludselig eksploderede vinduet i tusind stykker.", "Vinduet gik i stykker.", "Der skete noget med vinduet.", "Vinduet var ikke helt."], "Pludselig eksploderede vinduet i tusind stykker.", "Ordvalg og præcist verbum øger intensiteten."],
      ["Hvad kan gentagelse bruges til?", ["At fremhæve et ord eller budskab", "At skjule alle udsagnsord", "At gøre teksten grammatisk passiv", "At undgå betydning"], "At fremhæve et ord eller budskab", "Bevidst gentagelse kan skabe rytme og eftertryk."],
    ]),
    traening: set([
      ["Hvilken formulering virker mest sikker/kategorisk?", ["Det er sådan.", "Det er måske sådan.", "Det kunne muligvis være sådan.", "Jeg tror, det kan være sådan."], "Det er sådan.", "Fraværet af modalmarkører gør udsagnet mere kategorisk."],
      ["Hvilken formulering skaber mest fællesskab?", ["Vi kan løse det sammen.", "Du må løse det.", "De må løse det.", "Nogen bør løse det."], "Vi kan løse det sammen.", "Vi og sammen inkluderer afsender og modtagere i samme fællesskab."],
      ["Hvad gør metaforen 'en mur af tavshed'?", ["Gør en abstrakt oplevelse mere konkret og billedlig", "Gør tavshed til et udsagnsord", "Fjerner al følelse", "Viser præcis fysisk højde"], "Gør en abstrakt oplevelse mere konkret og billedlig", "Metaforen låner egenskaber fra en fysisk mur til tavsheden."],
      ["Hvilket ordvalg skaber mest skepsis over for kilden?", ["Han påstår, at ...", "Han siger, at ...", "Han oplyser, at ...", "Han fortæller, at ..."], "Han påstår, at ...", "Påstår kan antyde, at afsenderen ikke uden videre accepterer udsagnet."],
      ["Hvilken effekt kan en retorisk spørgsmål have?", ["Aktivere læseren og styre opmærksomheden mod et svar", "Gøre alle sætninger til ledsætninger", "Fjerne tekstens afsender", "Gøre teksten helt neutral"], "Aktivere læseren og styre opmærksomheden mod et svar", "Spørgsmålet stilles ofte for at påvirke refleksion snarere end for at få et faktisk svar."],
    ]),
    udfordring: set([
      ["Hvilken formulering bruger eufemisme?", ["Han gik bort" , "Han døde", "Han stoppede med at leve", "Han var død"], "Han gik bort", "Eufemismen mildner en direkte eller ubehagelig formulering."],
      ["Hvilken effekt har kontrasten i 'De lovede frihed. Vi fik kontrol.'?", ["Den skærper modsætningen og kan styrke kritikken", "Den gør udsagnet neutralt", "Den fjerner subjektet", "Den gør teksten længere"], "Den skærper modsætningen og kan styrke kritikken", "Parallelle korte sætninger fremhæver forskellen mellem løfte og resultat."],
      ["Hvordan kan modalverbet 'skal' påvirke tonen i 'Vi skal handle nu'?", ["Det kan skabe nødvendighed og pres", "Det gør sætningen til fortid", "Det gør udsagnet usikkert", "Det fjerner handlingskraft"], "Det kan skabe nødvendighed og pres", "Skal markerer stærk nødvendighed eller forpligtelse."],
      ["Hvilken version positionerer afsenderen mest autoritativt?", ["Forskningen viser, at ...", "Jeg føler lidt, at ...", "Måske kunne man tænke, at ...", "Det er vist sådan, at ..."], "Forskningen viser, at ...", "Henvisning til evidens og fravær af tøvemarkører kan styrke autoritetsindtrykket."],
      ["Hvilken analyse af 'kun' er bedst i 'Det koster kun 999 kr.'?", ["Fokuspartikel → nedtoner beløbets størrelse → kan få prisen til at virke lavere", "Navneord → navngiver beløbet → gør prisen præcis", "Udsagnsord → viser køb → skaber tempo", "Stedord → erstatter pris → skaber afstand"], "Fokuspartikel → nedtoner beløbets størrelse → kan få prisen til at virke lavere", "Små ord kan rammesætte information og påvirke læserens vurdering."],
    ]),
  },
};