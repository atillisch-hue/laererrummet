const FIELD_TYPES=['task','choice','encounter','puzzle','fate','rest'];
const CHOICE_EVENTS=[
{icon:'🐺',title:'Der verletzte Wolf (den sårede ulv)',de:'Am Weg liegt ein verletzter Wolf. Er knurrt leise, kann aber kaum stehen.',da:'En såret ulv ligger ved vejen. Den knurrer svagt, men kan næsten ikke stå.',opts:[
 {de:'Dem Wolf helfen · 2 Münzen',da:'Hjælp ulven · 2 mønter',need:()=>state.gold>=2,run:()=>{state.gold-=2;state.flags.wolfHelp=true;state.xp+=2;log('🐺 Ihr helft dem verletzten Wolf. −2 Münzen, +2 XP.');return 'Der Wolf lässt sich helfen und verschwindet zwischen den Bäumen. Er wird euch nicht vergessen …';}},
 {de:'Vorsichtig weitergehen',da:'Gå forsigtigt videre',run:()=>{state.flags.wolfIgnored=true;log('🐺 Ihr lasst den Wolf zurück.');return 'Ihr geht weiter. Hinter euch hört ihr noch lange ein leises Heulen.';}},
 {de:'Den Wolf vertreiben',da:'Skræm ulven væk',run:()=>{state.flags.wolfScared=true;state.gold+=1;log('🐺 Ihr vertreibt den Wolf. +1 Münze.');return 'Der Wolf flieht. Im Gras findet ihr eine Münze – aber irgendwo antwortet ein zweites Heulen.';}}
]},
{icon:'🌉',title:'Die alte Brücke (den gamle bro)',de:'Eine morsche Brücke führt über eine tiefe Schlucht. Daneben gibt es einen langen Umweg.',da:'En gammel bro fører over en dyb kløft. Ved siden af er der en lang omvej.',opts:[
 {de:'Über die Brücke gehen',da:'Gå over broen',run:()=>{state.flags.bridgeRisk=true;log('🌉 Ihr nehmt die alte Brücke.');return 'Das Holz knarrt. Das Schicksal entscheidet, ob die Brücke hält.';},fate:true},
 {de:'Den sicheren Umweg nehmen',da:'Tag den sikre omvej',run:()=>{state.xp+=1;log('🧭 Sicherer Umweg. +1 XP.');return 'Der Weg ist länger, aber sicher. +1 XP.';}}
]},
{icon:'🧙',title:'Der fremde Wanderer (den fremmede vandrer)',de:'Ein alter Wanderer bietet euch eine Karte an. „Nur drei Münzen“, sagt er.',da:'En gammel vandrer tilbyder jer et kort. “Kun tre mønter,” siger han.',opts:[
 {de:'Die Karte kaufen · 3 Münzen',da:'Køb kortet · 3 mønter',need:()=>state.gold>=3,run:()=>{state.gold-=3;state.inventory.push('🗺️ Alte Karte');state.flags.map=true;log('🗺️ Alte Karte gekauft.');return 'Auf der Karte sind geheime Zeichen. Vielleicht helfen sie später.';}},
 {de:'Nach Informationen fragen',da:'Spørg efter information',run:()=>{state.xp+=1;state.flags.wandererTalk=true;log('🧙 Ihr sprecht mit dem Wanderer. +1 XP.');return 'Er flüstert: „Nicht jeder Drache ist euer Feind.“ +1 XP.';}},
 {de:'Weitergehen',da:'Gå videre',run:()=>{log('🧙 Ihr ignoriert den Wanderer.');return 'Ihr geht weiter. Der Wanderer sieht euch lange nach.';}}
]},
{icon:'🕯️',title:'Die dunkle Kapelle (det mørke kapel)',de:'In einer verlassenen Kapelle brennt eine einzige Kerze. Auf dem Altar liegt ein silberner Schlüssel.',da:'I et forladt kapel brænder ét lys. På alteret ligger en sølvnøgle.',opts:[
 {de:'Den Schlüssel nehmen',da:'Tag nøglen',run:()=>{state.keys++;state.flags.chapelKey=true;log('🗝️ Schlüssel aus der Kapelle.');return 'Als ihr den Schlüssel nehmt, erlischt die Kerze. +1 Schlüssel.';}},
 {de:'Erst die Inschrift lesen',da:'Læs inskriptionen først',run:()=>{state.flags.chapelRead=true;state.xp+=2;log('📜 Kapelleninschrift gelesen. +2 XP.');return '„Wer nimmt, muss später geben.“ +2 XP.';}},
 {de:'Nichts berühren',da:'Lad alt være',run:()=>{log('🕯️ Kapelle unberührt.');return 'Ihr verlasst die Kapelle. Hinter euch flackert die Kerze noch einmal.';}}
]},
{icon:'👧',title:'Das Mädchen im Nebel (pigen i tågen)',de:'Ein Mädchen steht allein im Nebel. „Meine Schwester ist im Wald verschwunden“, sagt sie.',da:'En pige står alene i tågen. “Min søster er forsvundet i skoven,” siger hun.',opts:[
 {de:'Versprechen zu helfen',da:'Lov at hjælpe',run:()=>{state.flags.helpGirl=true;state.xp+=2;log('👧 Ihr versprecht zu helfen. +2 XP.');return 'Sie gibt euch ein rotes Band. „Zeigt es meiner Schwester.“ +2 XP.';}},
 {de:'Ihr 1 Münze geben',da:'Giv hende 1 mønt',need:()=>state.gold>=1,run:()=>{state.gold--;state.flags.girlCoin=true;log('👧 1 Münze gegeben.');return 'Sie nennt euch einen sicheren Weg durch den Nebel.';}},
 {de:'Weitergehen',da:'Gå videre',run:()=>{log('👧 Ihr geht weiter.');return 'Das Mädchen verschwindet langsam im Nebel.';}}
]},
{icon:'🧱',title:'Die eingestürzte Mauer (den sammenstyrtede mur)',de:'Eine alte Mauer blockiert den Weg. Zwischen den Steinen glitzert etwas.',da:'En gammel mur spærrer vejen. Noget glimter mellem stenene.',opts:[
 {de:'Die Steine durchsuchen',da:'Undersøg stenene',run:()=>{state.gold+=2;log('🧱 Ihr durchsucht die Mauer. +2 Münzen.');return 'Ihr findet zwei alte Münzen zwischen den Steinen. +2 Münzen.';}},
 {de:'Über die Mauer klettern',da:'Klatr over muren',run:()=>{log('🧱 Ihr klettert über die Mauer.');return 'Der Aufstieg ist riskant. Das Schicksal entscheidet.';},fate:true},
 {de:'Einen anderen Weg suchen',da:'Find en anden vej',run:()=>{state.xp+=1;log('🧭 Alternativer Weg. +1 XP.');return 'Ihr findet einen ruhigen Seitenpfad. +1 XP.';}}
]},
{icon:'🧪',title:'Der verlassene Alchemistentisch (det forladte alkymistbord)',de:'Auf einem Tisch stehen drei staubige Flaschen. Eine davon leuchtet schwach.',da:'På et bord står tre støvede flasker. En af dem lyser svagt.',opts:[
 {de:'Die leuchtende Flasche nehmen',da:'Tag den lysende flaske',run:()=>{state.inventory.push('🧪 Seltsamer Trank');state.flags.strangePotion=true;log('🧪 Seltsamer Trank gefunden.');return 'Ihr nehmt den Trank mit. Niemand weiß, was er bewirkt.';}},
 {de:'Die Notizen lesen',da:'Læs noterne',run:()=>{state.xp+=2;log('📚 Alchemienotizen gelesen. +2 XP.');return 'Die Notizen erklären eine alte Schutzformel. +2 XP.';}},
 {de:'Nichts anfassen',da:'Rør ikke noget',run:()=>{log('🧪 Ihr lasst alles stehen.');return 'Ihr entscheidet euch gegen das Risiko und geht weiter.';}}
]},
{icon:'🦅',title:'Der Rabe mit dem Ring (ravnen med ringen)',de:'Ein schwarzer Rabe sitzt auf einem Ast. In seinem Schnabel hält er einen goldenen Ring.',da:'En sort ravn sidder på en gren. I næbbet holder den en guldring.',opts:[
 {de:'Den Raben füttern · 1 Münze',da:'Fodr ravnen · 1 mønt',need:()=>state.gold>=1,run:()=>{state.gold--;state.inventory.push('💍 Goldener Ring');state.flags.ring=true;log('🦅 Rabe gefüttert, Ring erhalten.');return 'Der Rabe lässt den Ring fallen. Vielleicht erkennt ihn jemand später.';}},
 {de:'Nach dem Ring greifen',da:'Grib efter ringen',run:()=>{log('🦅 Ihr greift nach dem Ring.');return 'Der Rabe flattert auf. Das Schicksal entscheidet, ob ihr den Ring bekommt.';},fate:true},
 {de:'Den Raben in Ruhe lassen',da:'Lad ravnen være',run:()=>{state.xp+=1;log('🦅 Ihr lasst den Raben in Ruhe. +1 XP.');return 'Der Rabe krächzt zufrieden. +1 XP.';}}
]},
{icon:'🌲',title:'Der flüsternde Wald (den hviskende skov)',de:'Die Bäume flüstern eure Namen. Ein schmaler Pfad führt tiefer in den Wald.',da:'Træerne hvisker jeres navne. En smal sti fører dybere ind i skoven.',opts:[
 {de:'Dem Flüstern folgen',da:'Følg hvisken',run:()=>{state.flags.followWhisper=true;log('🌲 Ihr folgt dem Flüstern.');return 'Der Wald wird dunkler. Das Schicksal entscheidet, was ihr findet.';},fate:true},
 {de:'Auf dem Hauptweg bleiben',da:'Bliv på hovedvejen',run:()=>{state.xp+=1;log('🌲 Hauptweg gewählt. +1 XP.');return 'Ihr bleibt zusammen und geht sicher weiter. +1 XP.';}},
 {de:'Laut nach Elara rufen',da:'Råb højt efter Elara',run:()=>{state.flags.calledElara=true;log('📣 Ihr ruft nach Elara.');return 'Keine Antwort – aber irgendwo knackt ein Ast.';}}
]},
{icon:'🏚️',title:'Die Hütte ohne Tür (hytten uden dør)',de:'Mitten im Moor steht eine Hütte ohne Tür. Durch ein Fenster seht ihr eine Truhe.',da:'Midt i mosen står en hytte uden dør. Gennem et vindue ser I en kiste.',opts:[
 {de:'Durch das Fenster klettern',da:'Klatr ind gennem vinduet',run:()=>{log('🏚️ Ihr klettert durch das Fenster.');return 'Das Fenster ist eng. Das Schicksal entscheidet, wie gut es geht.';},fate:true},
 {de:'Nach einem versteckten Eingang suchen',da:'Led efter en skjult indgang',run:()=>{state.xp+=2;state.flags.secretDoor=true;log('🚪 Geheime Tür gefunden. +2 XP.');return 'Unter Moos findet ihr eine kleine Tür. +2 XP.';}},
 {de:'Die Hütte meiden',da:'Undgå hytten',run:()=>{log('🏚️ Ihr meidet die Hütte.');return 'Ihr lasst die unheimliche Hütte hinter euch.';}}
]},
{icon:'🗿',title:'Die Statue des Königs (kongens statue)',de:'Eine verwitterte Königsstatue hält eine Schale in den Händen. Darin liegt kein Staub.',da:'En forvitret kongestatue holder en skål. Der ligger mærkeligt nok intet støv i den.',opts:[
 {de:'Eine Münze in die Schale legen',da:'Læg en mønt i skålen',need:()=>state.gold>=1,run:()=>{state.gold--;state.keys++;state.flags.kingOffering=true;log('🗿 Opfergabe: −1 Münze, +1 Schlüssel.');return 'Ein Fach öffnet sich im Sockel. Darin liegt ein Schlüssel. +1 Schlüssel.';}},
 {de:'Die Statue untersuchen',da:'Undersøg statuen',run:()=>{state.xp+=2;log('🗿 Statue untersucht. +2 XP.');return 'Auf der Rückseite steht der Name „Arvid“. +2 XP.';}},
 {de:'Weitergehen',da:'Gå videre',run:()=>{log('🗿 Ihr geht an der Statue vorbei.');return 'Die steinernen Augen scheinen euch zu folgen.';}}
]},
{icon:'🌊',title:'Der unterirdische Fluss (den underjordiske flod)',de:'Ein schwarzer Fluss versperrt den Weg. Ein kleines Boot ist mit einer Kette befestigt.',da:'En sort flod spærrer vejen. En lille båd er låst fast med en kæde.',opts:[
 {de:'Das Boot benutzen',da:'Brug båden',run:()=>{state.flags.boat=true;log('🌊 Ihr nehmt das Boot.');return 'Die Strömung ist stark. Das Schicksal entscheidet über die Überfahrt.';},fate:true},
 {de:'Am Ufer entlanggehen',da:'Gå langs bredden',run:()=>{state.xp+=1;log('🌊 Am Ufer entlang. +1 XP.');return 'Der Weg dauert länger, aber ihr bleibt trocken. +1 XP.';}},
 {de:'Die Kette untersuchen',da:'Undersøg kæden',run:()=>{state.gold+=1;log('⛓️ Kette untersucht. +1 Münze.');return 'Unter der Kette steckt eine alte Münze. +1 Münze.';}}
]}
];
const ENCOUNTERS=[
{icon:'🦉',title:'Die sprechende Eule',text:'Eine Eule sitzt auf einem Wegweiser und fragt: „Wohin wollt ihr?“',good:'Die Eule zeigt euch eine verborgene Münze. +1 🪙.',bad:'Die Eule lacht leise und fliegt davon.',effect:()=>state.gold++},
{icon:'🧌',title:'Der Brückenwächter',text:'Ein kleiner Troll verlangt ein deutsches Passwort.',good:'Das Passwort stimmt. Der Troll lässt euch passieren. +1 Bonus-XP.',bad:'Der Troll wirft einen Stein nach euch. −1 HP.',effect:()=>state.xp++,fail:()=>{state.hp--;checkHP()}},
{icon:'🧝',title:'Die Waldhüterin',text:'Eine Waldhüterin prüft, ob ihr Freunde von Schattenfels seid.',good:'Sie glaubt euch und schenkt euch einen Heiltrank.',bad:'Sie bleibt misstrauisch. Ihr dürft weiter, aber ohne Hilfe.',effect:()=>state.inventory.push('🧪 Heiltrank')},
{icon:'🦊',title:'Der Fuchs mit der Tasche',text:'Ein Fuchs trägt eine kleine Ledertasche im Maul.',good:'Der Fuchs lässt die Tasche fallen: +2 Münzen.',bad:'Der Fuchs verschwindet zwischen den Bäumen.',effect:()=>state.gold+=2},
{icon:'🧑‍🌾',title:'Der verirrte Händler',text:'Ein Händler hat den Weg verloren und fragt euch nach einer Richtung.',good:'Er bedankt sich mit 2 Münzen.',bad:'Er schüttelt verwirrt den Kopf und zieht weiter.',effect:()=>state.gold+=2},
{icon:'🦌',title:'Der weiße Hirsch',text:'Ein weißer Hirsch versperrt den Pfad und beobachtet euch aufmerksam.',good:'Der Hirsch führt euch zu einer heilenden Quelle: +2 HP.',bad:'Der Hirsch verschwindet lautlos.',effect:()=>state.hp+=2},
{icon:'👻',title:'Der Geist im Turm',text:'Ein blasser Geist fragt, ob ihr den Namen des alten Königs kennt.',good:'Der Geist lässt euch passieren und verrät ein Geheimnis: +2 XP.',bad:'Der Geist schweigt und verschwindet in der Wand.',effect:()=>state.xp+=2},
{icon:'🧚',title:'Die kleine Waldfee',text:'Eine Waldfee stellt euch eine Frage, bevor sie den Weg freigibt.',good:'Sie streut goldenen Staub über euch: +1 Münze und +1 XP.',bad:'Sie kichert und fliegt davon.',effect:()=>{state.gold++;state.xp++}}
];
const PUZZLES=[
{title:'🔤 Runenrätsel',text:'Ordnet die Wörter richtig. Nur die richtige Sprache öffnet den Weg.'},
{title:'🗝️ Sprachschloss',text:'Ein steinernes Schloss reagiert nur auf eine richtige deutsche Antwort.'},
{title:'🪧 Verblasste Wegweiser',text:'Die Schrift ist fast verschwunden. Könnt ihr sie noch verstehen?'},
{title:'📜 Alte Prophezeiung',text:'Ein Satz aus der Prophezeiung ist beschädigt. Ergänzt ihn richtig.'},
{title:'🪞 Der sprechende Spiegel',text:'Der Spiegel zeigt nur den Weg, wenn ihr seine deutsche Frage beantwortet.'},
{title:'🚪 Die drei Türen',text:'Nur eine Tür ist sicher. Die deutsche Inschrift verrät welche.'},
{title:'🧿 Das Auge aus Stein',text:'Ein steinernes Auge prüft eure Sprache, bevor es den Tunnel öffnet.'},
{title:'📖 Das zerrissene Tagebuch',text:'Eine Seite fehlt. Aus dem deutschen Text müsst ihr herausfinden, was passiert ist.'}
];
function shuffledIndexes(n){let a=Array.from({length:n},(_,i)=>i);for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function nextUniqueEvent(kind,pool){if(!state.eventPools[kind]||!state.eventPools[kind].length)state.eventPools[kind]=shuffledIndexes(pool.length);return pool[state.eventPools[kind].pop()]}
function fieldTypeFor(k){let [r,c]=k.split(',').map(Number);return FIELD_TYPES[(r*17+c*7+r*c)%FIELD_TYPES.length]}
function fieldIcon(k){let t=fieldTypeFor(k);return t==='task'?'🗣️':t==='choice'?'❓':t==='encounter'?'🤝':t==='puzzle'?'🧩':t==='fate'?'🎲':'🔥'}
function ordinaryFieldEvent(k){
 if(state.fieldEvents.has(k)){finishTurn();return}
 state.fieldEvents.add(k);
 let t=fieldTypeFor(k);
 if(t==='task'){difficulty('🗣️ Sprachfeld (sprogfelt): Eine Aufgabe versperrt den Weg.',(ok,d)=>{if(ok){let rw=reward(d);state.gold+=rw.gold;state.xp+=rw.xp;log(`🗣️ Sprachfeld geschafft: +${rw.xp} XP, +${rw.gold} Münzen.`);notify('🗣️','Sprachfeld geschafft! (sprogfelt klaret)',`+${rw.xp} XP und +${rw.gold} Münzen.`,()=>finishTurn())}else{state.hp--;log('🗣️ Sprachfeld nicht geschafft: −1 HP.');checkHP();notifyBad('💥','FALSCH – die Magie schlägt zurück!','Falsche Antwort: <b>−1 HP</b>.',()=>finishTurn())}render()});return}
 if(t==='choice'){showChoiceEvent(nextUniqueEvent('choice',CHOICE_EVENTS),k);return}
 if(t==='encounter'){let e=nextUniqueEvent('encounter',ENCOUNTERS);difficulty(`${e.icon} ${e.title}: ${e.text}`,(ok,d)=>{if(ok){let rw=reward(d);state.xp+=rw.xp;if(e.effect)e.effect();log(`${e.icon} Begegnung gemeistert. ${e.good}`);notify(e.icon,e.title,e.good,()=>finishTurn())}else{if(e.fail)e.fail();log(`${e.icon} Begegnung: ${e.bad}`);notifyBad('💥','Schlechte Folge (dårlig konsekvens)',e.bad,()=>finishTurn())}render()});return}
 if(t==='puzzle'){let e=nextUniqueEvent('puzzle',PUZZLES);difficulty(`${e.title}: ${e.text}`,(ok,d)=>{if(ok){let rw=reward(d);state.xp+=rw.xp+1;state.gold+=rw.gold;log(`🧩 Rätsel gelöst: +${rw.xp+1} XP.`);notify('🧩','Rätsel gelöst! (gåden løst)',`Ihr öffnet den Weg. +${rw.xp+1} XP.`,()=>finishTurn())}else{log('🧩 Das Rätsel bleibt ungelöst.');notifyBad('❌','Rätsel nicht gelöst (gåden ikke løst)','Keine Belohnung. Der Weg bleibt offen.',()=>finishTurn())}render()});return}
 if(t==='fate'){fateRoll('🎲 Schicksalsfeld (skæbnefelt)','Etwas Unvorhersehbares liegt auf eurem Weg. Der Würfel entscheidet.',()=>finishTurn());return}
 if(t==='rest'){show(`<h2>🔥 Rastplatz (hvilested)</h2><p>Ein geschützter Platz gibt euch Zeit zum Ausruhen.</p><div class="answers"><button class="answer" onclick="restChoice('heal')">❤️ Ausruhen<br><span class="tiny">+2 HP, kostet 1 Münze</span></button><button class="answer" onclick="restChoice('talk')">💬 Pläne besprechen<br><span class="tiny">+2 XP</span></button></div>`);window.restChoice=x=>{if(x==='heal'){if(state.gold<1){alert('Nicht genug Münzen.');return}state.gold--;state.hp+=2;log('🔥 Rastplatz: −1 Münze, +2 HP.')}else{state.xp+=2;log('🔥 Rastplatz: Die Gruppe plant gemeinsam. +2 XP.')}hideModal();render();finishTurn()};return}
}
function showChoiceEvent(e,k){let translated=false;function draw(){show(`<h2>${e.icon} ${e.title}</h2><p class="popupLead">${e.de}</p>${translated?`<div class="translation">🇩🇰 ${e.da}</div>`:`<button class="btn gold wide" onclick="translateChoice()">🇩🇰 Übersetzen · 1 🪙</button>`}<h3>Was macht ihr? (hvad gør I?)</h3><div class="answers">${e.opts.map((o,i)=>`<button class="answer" onclick="chooseField(${i})">${o.de}<br><span class="tiny">(${o.da})</span></button>`).join('')}</div>`)}draw();window.translateChoice=()=>{if(state.gold<1){alert('Nicht genug Münzen.');return}state.gold--;translated=true;log('🇩🇰 Entscheidungs-Übersetzung gekauft: −1 Münze.');render();draw()};window.chooseField=i=>{let o=e.opts[i];if(o.need&&!o.need()){alert('Dafür habt ihr nicht genug Münzen.');return}let result=o.run();state.choices[k]=i;hideModal();render();if(o.fate){fateRoll(e.icon+' '+e.title,result,()=>finishTurn())}else{notify(e.icon,'Entscheidung getroffen (valg truffet)',result,()=>finishTurn())}}}
