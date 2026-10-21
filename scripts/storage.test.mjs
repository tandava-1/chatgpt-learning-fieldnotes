import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalApi, STORAGE_KEY} from '../hub/storage.js';
import {weeks,seedResources,taskFor,starterIdeas} from '../hub/curriculum.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
test('progress and submissions persist across reload, without leaking to a separate browser',async()=>{
 const store=memory();const api=createLocalApi(store);
 await api('/api/state',{kind:'task',key:'w1-d0',value:{done:true}});
 await api('/api/state',{kind:'note',key:'week-1',value:{text:'A local note'}});
 await api('/api/submissions',{week:1,answer:'I would compare a simple baseline with the proposed AI approach.'});
 const reloaded=await createLocalApi(store)('/api/state');assert.equal(reloaded.records.length,3);assert.equal(reloaded.submissions.length,1);
 assert.equal((await createLocalApi(memory())('/api/state')).records.filter(r=>r.kind!=='settings').length,0);
 await api('/api/state',{kind:'task',key:'w1-d0',value:{done:false}});
 assert.equal((await api('/api/state')).records.length,3);
 assert.equal((await api('/api/state')).records.find(r=>r.kind==='task').value.done,false);
});
test('corrupt data and quota failure are reported rather than silently replacing data',async()=>{
 const store=memory();store.setItem(STORAGE_KEY,'bad json');
 await assert.rejects(createLocalApi(store)('/api/state'));assert.equal(store.getItem(STORAGE_KEY),'bad json');
 const full={getItem:()=>null,setItem:()=>{throw Error('quota');}};
 await assert.rejects(createLocalApi(full)('/api/state',{kind:'note',key:'x',value:{text:'test'}}),/not saved/);
});
test('no API evaluation, credentials, or network transport exists in static persistence',async()=>{
 await assert.rejects(createLocalApi(memory())('/api/evaluate',{id:'x'}),/no server/);
});
test('course structure and every task/resource reference are valid',()=>{
 assert.equal(starterIdeas.length,3);
 weeks.forEach((w,i)=>{assert.equal(w.id,i+1);for(const r of w.resourceIds)assert.ok(seedResources.some(s=>s.id===r));for(let d=0;d<7;d++)assert.ok(taskFor(w,d).title);});
});

test('initial start date is persisted and does not move when the calendar advances',async()=>{
 const store=memory();
 const first=await createLocalApi(store,()=>new Date('2026-01-01T12:00:00Z'))('/api/state');
 const later=await createLocalApi(store,()=>new Date('2026-02-01T12:00:00Z'))('/api/state');
 assert.equal(first.records[0].value.startDate,later.records[0].value.startDate);
});
