import { weeks, storageMessages, starterIdeas } from './curriculum.js';
export const STORAGE_KEY = 'fieldnotes.learning.v1';
const empty = () => ({records:[], submissions:[], aiReady:false, model:null});
export function createLocalApi(storage, clock=()=>new Date(), id=()=>crypto.randomUUID()) {
 const read=()=>{
  let raw; try { raw=storage.getItem(STORAGE_KEY); } catch {throw new Error(storageMessages.unavailable);}
  if(!raw){
   const d=empty(), now=clock();
   const startDate=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
   d.records.push({kind:'settings',key:'main',value:{startDate,project:starterIdeas[0],weeklyGoal:300},updatedAt:now.toISOString()});
   write(d);return d;
  }
  try {
   const d=JSON.parse(raw);
   if(!Array.isArray(d.records)||!Array.isArray(d.submissions)||!d.records.every(r=>r&&typeof r.kind==='string'&&typeof r.key==='string'&&r.value!==undefined&&typeof r.updatedAt==='string')||!d.submissions.every(s=>s&&typeof s.id==='string'&&typeof s.answer==='string'&&Number.isInteger(s.week)))throw 0;
   return {...d, aiReady:false,model:null};
  } catch {throw new Error(storageMessages.corrupt);}
 };
 const write=d=>{try {storage.setItem(STORAGE_KEY,JSON.stringify(d));}catch{throw new Error(storageMessages.unavailable);}};
 return async (url, body)=>{
  const data=read();
  if(url==='/api/state'&&body===undefined)return data;
  if(url==='/api/state'){
   const {kind,key,value,remove}=body;
   if(!['settings','task','note','resource','writing','journal','signal'].includes(kind)||typeof key!=='string'||!key||(!remove&&value==null)||kind==='settings'&&(key!=='main'||remove))throw new Error(storageMessages.invalid);
   const updatedAt=clock().toISOString();
   data.records=data.records.filter(r=>r.kind!==kind||r.key!==key);
   if(!remove)data.records.push({kind,key,value,updatedAt});
   write(data);return {ok:true,updatedAt};
  }
  if(url==='/api/submissions'){
   if(!weeks.some(w=>w.id===body.week)||typeof body.answer!=='string'||body.answer.trim().length<40||body.answer.length>20000)throw new Error(storageMessages.shortAnswer);
   const s={id:id(),week:body.week,answer:body.answer,status:'submitted',feedback:null,created_at:clock().toISOString()};
   data.submissions.unshift(s);write(data);return s;
  }
  throw new Error(storageMessages.unsupported);
 };
}
export async function api(url,body) {return createLocalApi(window.localStorage)(url,body);}
