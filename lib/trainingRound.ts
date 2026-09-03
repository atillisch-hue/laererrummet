import type {TrainingQuestion} from "./freeTrainingQuestions";

export function trainingQuestionKey(question:TrainingQuestion){
 return `${question.q}\u241f${question.answer}`;
}

function hash(text:string){
 let value=2166136261;
 for(let i=0;i<text.length;i++){
  value^=text.charCodeAt(i);
  value=Math.imul(value,16777619);
 }
 return value>>>0;
}

function ordered(pool:TrainingQuestion[],seed:string){
 return [...pool].sort((a,b)=>hash(`${seed}|${trainingQuestionKey(a)}`)-hash(`${seed}|${trainingQuestionKey(b)}`));
}

/**
 * Select a round that prioritises questions the pupil has not seen in the current run.
 * When the whole bank has been seen, the previous round is still avoided when possible.
 */
export function freshTrainingRound(
 pool:TrainingQuestion[],
 seenKeys:ReadonlySet<string>,
 seed:string,
 size=5,
 currentKeys:ReadonlySet<string>=new Set()
){
 const unique=[...new Map(pool.map(question=>[trainingQuestionKey(question),question])).values()];
 if(unique.length<=size)return unique;
 const unseen=ordered(unique.filter(question=>!seenKeys.has(trainingQuestionKey(question))),seed);
 if(unseen.length>=size)return unseen.slice(0,size);
 const notCurrent=ordered(unique.filter(question=>!currentKeys.has(trainingQuestionKey(question))&&!unseen.some(item=>trainingQuestionKey(item)===trainingQuestionKey(question))),`${seed}|reuse`);
 const selected=[...unseen,...notCurrent].slice(0,size);
 if(selected.length>=size)return selected;
 const remaining=ordered(unique.filter(question=>!selected.some(item=>trainingQuestionKey(item)===trainingQuestionKey(question))),`${seed}|fill`);
 return [...selected,...remaining].slice(0,size);
}
