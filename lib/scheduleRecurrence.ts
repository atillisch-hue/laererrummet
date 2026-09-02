export type RecurrencePattern="weekly"|"odd"|"even";

export function isoWeek(value:string|Date){
 const d=typeof value==="string"?new Date(`${value}T12:00:00`):value;
 const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
 const day=x.getUTCDay()||7;
 x.setUTCDate(x.getUTCDate()+4-day);
 const yearStart=new Date(Date.UTC(x.getUTCFullYear(),0,1));
 return Math.ceil((((x.getTime()-yearStart.getTime())/86400000)+1)/7);
}

export function scheduleOccursOn(pattern:RecurrencePattern|null|undefined,value:string|Date){
 if(!pattern||pattern==="weekly")return true;
 const week=isoWeek(value);
 return pattern==="odd"?week%2===1:week%2===0;
}

export function recurrenceLabel(pattern:RecurrencePattern|null|undefined){
 if(pattern==="odd")return "Ulige uger";
 if(pattern==="even")return "Lige uger";
 return "Hver uge";
}
