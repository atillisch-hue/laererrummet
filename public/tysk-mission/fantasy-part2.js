const FIELD_TYPES=['task','choice','encounter','puzzle','fate','rest'];
const CHOICE_EVENTS=[
{icon:'🐺',title:'Der verletzte Wolf (den sårede ulv)',de:'Am Weg liegt ein verletzter Wolf. Er knurrt leise, kann aber kaum stehen.',da:'En såret ulv ligger ved vejen. Den knurrer svagt, men kan næsten ikke stå.',opts:[
 {de:'Dem Wolf helfen · 2 Münzen',da:'Hjælp ulven · 2 mønter',need:()=>state.gold>=2,run:()=>{state.gold-=2;state.flags.wolfHelp=true;state.xp+=2;log('🐺 Ihr helft dem verletzten Wolf. −2 Münzen, +2 XP. Der Wolf wird euch nicht vergessen.');return 'Der Wolf lässt sich helfen und verschwindet später zwischen den Bäumen. Er wird euch nicht vergessen …';}},
 {de:'Vorsichtig weitergehen',da:'Gå forsigtigt videre',run:()=>{state.flags.wolfIgnored=true;log('🐺 Ihr lasst den Wolf zurück und geht weiter.');return 'Ihr geht weiter. Hinter euch hört ihr noch lange ein leises Heulen.';}},
 {de:'Den Wolf vertreiben',da:'Skræm ulven væk',run:()=>{state.flags.wolfScared=true;state.gold+=1;log('🐺 Ihr vertreibt den Wolf und findet dabei 1 Münze.');return 'Der Wolf flieht. Im Gras findet ihr eine Münze – aber irgendwo im Wald antwortet ein zweites Heulen.';}}
]},
{icon:'🌉',title:'Die alte Brücke (den gamle bro)',de:'Eine morsche Brücke führt über eine tiefe Schlucht. Daneben gibt es einen langen Umweg.',da:'En gammel bro fører over en dyb kløft. Ved siden af er der en lang omvej.',opts:[
 {de:'Über die Brücke gehen',da:'Gå over broen',run:()=>{state.flags.bridgeRisk=true;log('🌉 Ihr nehmt die alte Brücke.');return 'Das Holz knarrt unter euren Füßen. Das Schicksal entscheidet, ob sie hält.';},fate:true},
 {de:'Den sicheren Umweg nehmen',da:'Tag den sikre omvej',run:()=>{state.xp+=1;log('🧭 Ihr nehmt den sicheren Umweg. +1 XP.');return 'Der Weg ist länger, aber sicher. Ihr besprecht unterwegs eure nächste Entscheidung. +1 XP.';}}
]},
{icon:'🧙',title:'Der fremde Wanderer (den fremmede vandrer)',de:'Ein alter Wanderer bietet euch eine Karte an. „Nur drei Münzen“, sagt er.',da:'En gammel vandrer tilbyder jer et kort. “Kun tre mønter,” siger han.',opts:[
 {de:'Die Karte kaufen · 3 Münzen',da:'Køb kortet · 3 mønter',need:()=>state.gold>=3,run:()=>{state.gold-=3;state.inventory.push('🗺️ Alte Karte');state.flags.map=true;log('🗺️ Ihr kauft eine alte Karte. −3 Münzen.');return 'Auf der Karte sind geheime Zeichen eingezeichnet. Vielleicht helfen sie euch später.';}},
 {de:'Nach Informationen fragen',da:'Spørg efter information',run:()=>{state.xp+=1;state.flags.wandererTalk=true;log('🧙 Ihr sprecht mit dem Wanderer. +1 XP.');return 'Er flüstert: „Nicht jeder Drache ist euer Feind.“ +1 XP.';}},
 {de:'Weitergehen',da:'Gå videre',run:()=>{log('🧙 Ihr ignoriert den Wanderer.');return 'Ihr geht weiter. Der Wanderer sieht euch lange nach.';}}
]},
{icon:'🕯️',title:'Die dunkle Kapelle (det mørke kapel)',de:'In einer verlassenen Kapelle brennt noch eine einzige Kerze. Auf dem Altar liegt ein silberner Schlüssel.',da:'I et forladt kapel brænder ét lys. På alteret ligger en sølvnøgle.',opts:[
 {de:'Den Schlüssel nehmen',da:'Tag nøglen',run:()=>{state.keys++;state.flags.chapelKey=true;log('🗝️ Ihr nehmt den Schlüssel aus der Kapelle. +1 Schlüssel.');return 'Als ihr den Schlüssel nehmt, erlischt die Kerze. +1 Schlüssel.';}},
 {de:'Erst die Inschrift lesen',da:'Læs inskriptionen først',run:()=>{state.flags.chapelRead=true;state.xp+=2;log('📜 Ihr lest die Inschrift in der Kapelle. +2 XP.');return 'Die Inschrift warnt: „Wer nimmt, muss später geben.“ +2 XP.';}},
 {de:'Nichts berühren',da:'Lad alt være',run:()=>{log('🕯️ Ihr lasst die Kapelle unberührt.');return 'Ihr verlasst die Kapelle. Hinter euch flackert die Kerze noch einmal.';}}
]},
{icon:'👧',title:'Das Mädchen im Nebel (pigen i tågen)',de:'Ein Mädchen steht allein im Nebel. „Meine Schwester ist im Wald verschwunden“, sagt sie.',da:'En pige står alene i tågen. “Min søster er forsvundet i skoven,” siger hun.',opts:[
 {de:'Versprechen zu helfen',da:'Lov at hjælpe',run:()=>{state.flags.helpGirl=true;state.xp+=2;log('👧 Ihr versprecht dem Mädchen zu helfen. +2 XP.');return 'Sie gibt euch ein rotes Band. „Zeigt es meiner Schwester.“ +2 XP.';}},
 {de:'Ihr 1 Münze geben',da:'Giv hende 1 mønt',need:()=>state.gold>=1,run:()=>{state.gold--;state.flags.girlCoin=true;log('👧 Ihr gebt dem Mädchen 1 Münze.');return 'Sie dankt euch und nennt euch einen sicheren Weg durch den Nebel.';}},
 {de:'Weitergehen',da:'Gå videre',run:()=>{log('👧 Ihr geht weiter, ohne zu helfen.');return 'Das Mädchen verschwindet langsam im Nebel.';}}
]}
];
const ENCOUNTERS=[
{icon:'🦉',title:'Die sprechende Eule',text:'Eine Eule sitzt auf einem Wegweiser und fragt: „Wohin wollt ihr?“',good:'Die Eule zeigt euch eine verborgene Münze. +1 🪙.',bad:'Die Eule lacht leise und fliegt davon.'},
{icon:'🧌',title:'Der Brückenwächter',text:'Ein kleiner Troll verlangt ein deutsches Passwort.',good:'Das Passwort stimmt. Der Troll lässt euch passieren. +2 XP.',bad:'Der Troll wirft einen Stein nach euch. −1 HP.'},
{icon:'🧝',title:'Die Waldhüterin',text:'Eine Waldhüterin prüft, ob ihr Freunde von Schattenfels seid.',good:'Sie glaubt euch und schenkt euch einen Heiltrank.',bad:'Sie bleibt misstrauisch. Ihr dürft weiter, aber ohne Hilfe.'},
{icon:'🦊',title:'Der Fuchs mit der Tasche',text:'Ein Fuchs trägt eine kleine Ledertasche im Maul. Er wartet auf eure Reaktion.',good:'Der Fuchs lässt die Tasche fallen: +2 Münzen.',bad:'Der Fuchs verschwindet zwischen den Bäumen.'}
];
const PUZZLES=[
{title:'🔤 Runenrätsel',text:'Ordnet die Wörter richtig. Nur die richtige Sprache öffnet den Weg.'},
{title:'🗝️ Sprachschloss',text:'Ein steinernes Schloss reagiert nur auf eine richtige deutsche Antwort.'},
{title:'🪧 Verblasste Wegweiser',text:'Die Schrift ist fast verschwunden. Könnt ihr sie noch verstehen?'},
{title:'📜 Alte Prophezeiung',text:'Ein Satz aus der Prophezeiung ist beschädigt. Ergänzt ihn richtig.'}
];
function fieldTypeFor(k){let [r,c]=k.split(',').map(Number);return FIELD_TYPES[(r*17+c*7+r*c)%FIELD_TYPES.length]}
function fieldIcon(k){let t=fieldTypeFor(k);return t==='task'?'🗣️':t==='choice'?'❓':t==='encounter'?'🤝':t==='puzzle'?'🧩':t==='fate'?'🎲':'🔥'}
function ordinaryFieldEvent(k){
 if(state.fieldEvents.has(k)){finishTurn();return}
 state.fieldEvents.add(k);
 let t=fieldTypeFor(k);
 if(t==='task'){difficulty('🗣️ Sprachfeld (sprogfelt): Eine Aufgabe versperrt den Weg.',(ok,d)=>{if(ok){let rw=reward(d);state.gold+=rw.gold;state.xp+=rw.xp;log(`🗣️ Sprachfeld geschafft: +${rw.xp} XP, +${rw.gold} Münzen.`);notify('🗣️','Sprachfeld geschafft! (sprogfelt klaret)',`+${rw.xp} XP und +${rw.gold} Münzen.`,()=>finishTurn())}else{state.hp--;log('🗣️ Sprachfeld nicht geschafft: −1 HP.');checkHP();notify('💥','Die Magie reagiert (magien reagerer)','Falsche Antwort: −1 HP.',()=>finishTurn())}render()});return}
 if(t==='choice'){let [r,c]=k.split(',').map(Number);showChoiceEvent(CHOICE_EVENTS[(r*5+c)%CHOICE_EVENTS.length],k);return}
 if(t==='encounter'){let [r,c]=k.split(',').map(Number),idx=(r+c*3)%ENCOUNTERS.length,e=ENCOUNTERS[idx];difficulty(`${e.icon} ${e.title}: ${e.text}`,(ok,d)=>{if(ok){let rw=reward(d);state.xp+=rw.xp;if(idx===0){state.gold++}else if(idx===1){state.xp+=1}else if(idx===2){state.inventory.push('🧪 Heiltrank')}else{state.gold+=2}log(`${e.icon} Begegnung gemeistert. ${e.good}`);notify(e.icon,e.title,e.good,()=>finishTurn())}else{if(idx===1){state.hp--;checkHP()}log(`${e.icon} Begegnung: ${e.bad}`);notify(e.icon,e.title,e.bad,()=>finishTurn())}render()});return}
 if(t==='puzzle'){let [r,c]=k.split(',').map(Number),e=PUZZLES[(r*3+c)%PUZZLES.length];difficulty(`${e.title}: ${e.text}`,(ok,d)=>{if(ok){let rw=reward(d);state.xp+=rw.xp+1;state.gold+=rw.gold;log(`🧩 Rätsel gelöst: +${rw.xp+1} XP.`);notify('🧩','Rätsel gelöst! (gåden løst)',`Ihr öffnet den Weg. +${rw.xp+1} XP.`,()=>finishTurn())}else{log('🧩 Das Rätsel bleibt ungelöst.');notify('🧩','Noch ungelöst (stadig uløst)','Der Weg bleibt offen, aber ihr bekommt keine Belohnung.',()=>finishTurn())}render()});return}
 if(t==='fate'){fateRoll('🎲 Schicksalsfeld (skæbnefelt)','Etwas Unvorhersehbares liegt auf eurem Weg. Der Würfel entscheidet.',()=>finishTurn());return}
 if(t==='rest'){show(`<h2>🔥 Rastplatz (hvilested)</h2><p>Ein geschützter Platz gibt euch Zeit zum Ausruhen.</p><div class="answers"><button class="answer" onclick="restChoice('heal')">❤️ Ausruhen<br><span class="tiny">+2 HP, kostet 1 Münze</span></button><button class="answer" onclick="restChoice('talk')">💬 Pläne besprechen<br><span class="tiny">+2 XP</span></button></div>`);window.restChoice=x=>{if(x==='heal'){if(state.gold<1){alert('Nicht genug Münzen.');return}state.gold--;state.hp+=2;log('🔥 Rastplatz: −1 Münze, +2 HP.')}else{state.xp+=2;log('🔥 Rastplatz: Die Gruppe plant gemeinsam. +2 XP.')}hideModal();render();finishTurn()};return}
}
function showChoiceEvent(e,k){let translated=false;function draw(){show(`<h2>${e.icon} ${e.title}</h2><p class="popupLead">${e.de}</p>${translated?`<div class="translation">🇩🇰 ${e.da}</div>`:`<button class="btn gold wide" onclick="translateChoice()">🇩🇰 Übersetzen · 1 🪙</button>`}<h3>Was macht ihr? (hvad gør I?)</h3><div class="answers">${e.opts.map((o,i)=>`<button class="answer" onclick="chooseField(${i})">${o.de}<br><span class="tiny">(${o.da})</span></button>`).join('')}</div>`)}draw();window.translateChoice=()=>{if(state.gold<1){alert('Nicht genug Münzen.');return}state.gold--;translated=true;log('🇩🇰 Entscheidungs-Übersetzung gekauft: −1 Münze.');render();draw()};window.chooseField=i=>{let o=e.opts[i];if(o.need&&!o.need()){alert('Dafür habt ihr nicht genug Münzen.');return}let result=o.run();state.choices[k]=i;hideModal();render();if(o.fate){fateRoll(e.icon+' '+e.title,result,()=>finishTurn())}else{notify(e.icon,'Entscheidung getroffen (valg truffet)',result,()=>finishTurn())}}}
