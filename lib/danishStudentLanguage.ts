type DanishQuestionLike={q:string;why:string};

function sentence(text:string){const value=text.trim();if(!value)return value;return /[.!?]$/.test(value)?value:`${value}.`}

function cleanQuestion(text:string){
 const q=text.trim();
 let match:RegExpMatchArray|null;
 if(q==="Hvad er infinitiv?")return "Hvilket svar står i navnemåde (infinitiv)?";
 if((match=q.match(/^Find (.+): ['“](.+)['”]$/)))return `Læs sætningen: “${match[2]}” Find ${match[1]}.`;
 if((match=q.match(/^Hvilken form er ['“](.+)['”]\?$/)))return `Hvilken grammatisk form står “${match[1]}” i?`;
 if((match=q.match(/^Form → funktion → effekt: (.+)$/)))return `Se på ${match[1]} Hvilken forklaring passer bedst til ordets form, funktion og virkning?`;
 if((match=q.match(/^Hvilket verbum (.+)$/)))return `Hvilket udsagnsord (verbum) ${match[1]}`;
 if((match=q.match(/^Hvilken sætning har sammensat verballed\?$/)))return "Hvilken sætning har et udsagnsled, der består af flere ord?";
 if((match=q.match(/^Hvilket navneord er abstrakt\?$/)))return "Hvilket navneord betegner noget, du ikke kan røre ved?";
 if((match=q.match(/^Hvilket ord er mest værdiladet\?$/)))return "Hvilket ord viser tydeligst en positiv eller negativ vurdering?";
 if((match=q.match(/^Hvilken formulering er mest konkret\?$/)))return "Hvilken formulering giver det tydeligste billede af det, der sker?";
 if((match=q.match(/^Hvilken version skjuler tydeligst, hvem der handler\?$/)))return "Hvilken sætning gør det sværest at se, hvem der udfører handlingen?";
 return q;
}

function cleanExplanation(text:string){
 let why=text.trim();
 why=why.replace(/^Fx\.?\s*/,"For eksempel: ");
 why=why.replace(/\bnominalisering\b/gi,"nominalisering (når en handling bliver gjort til et navneord)");
 why=why.replace(/\binfinitiv\b/gi,"navnemåde (infinitiv)");
 why=why.replace(/\bverbum\b/gi,"udsagnsord (verbum)");
 return sentence(why);
}

export function studentFriendlyDanishQuestion<T extends DanishQuestionLike>(question:T):T{
 return {...question,q:cleanQuestion(question.q),why:cleanExplanation(question.why)};
}

export function studentFriendlyDanishQuestions<T extends DanishQuestionLike>(questions:T[]):T[]{return questions.map(studentFriendlyDanishQuestion)}
