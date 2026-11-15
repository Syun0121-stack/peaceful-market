const assert=require('assert'),c=require('../scripts/catalog'),e=require('../scripts/economy');
let n=0;function check(v,m){assert(v,m);n++;}
const ids=new Set([...Object.keys(c.vanillaPrices),...c.items.map(x=>x.id)]);
check(c.items.filter(x=>x.kind==='final').length>=20,'minimum 20 finished products');
check(new Set(c.items.map(x=>x.id)).size===c.items.length,'unique item ids');
const materials=Object.fromEntries(c.items.map(x=>[x.id,x]));
for(const r of c.recipes){
 check(c.factories.some(f=>f.id===r.factory),'factory exists');
 for(const [k,v]of Object.entries({...r.inputs,...r.outputs})){check(ids.has(k)&&v>0&&Number.isInteger(v),'recipe references valid material quantity');}
 check(Object.keys(r.inputs).every(k=>!materials[k]||materials[k].tier<=r.tier),'all recipe inputs available at recipe tier');
}
// Check all supply chains can be reached without circular crafting or future-tier imports.
for(let tier=0;tier<=9;tier++){
 const available=new Set(Object.keys(c.vanillaPrices));c.items.filter(i=>i.tier<=tier&&['raw','import'].includes(i.kind)).forEach(i=>available.add(i.id));
 for(let pass=0;pass<30;pass++)for(const r of c.recipes)if(r.tier<=tier&&Object.keys(r.inputs).every(k=>available.has(k)))Object.keys(r.outputs).forEach(k=>available.add(k));
 for(const s of c.stages.filter(s=>s.tier===tier))check(available.has(s.product),'regional target can be produced at current tier');
 for(const f of c.factories.filter(f=>f.tier===tier))check(Object.keys(f.research).every(k=>available.has(k)),'factory research requirements are reachable');
}
let s=e.fresh();s.cash=10000000;const before=s.cash;
check(e.buyShares(s,0,60),'buy shares');check(e.sellShares(s,0,10),'sell shares');check(s.cash<before,'fees prevent instant arbitrage');
check(!e.acquire(s,0),'cannot acquire with 50 shares');check(e.buyShares(s,0,10)&&e.acquire(s,0),'majority buyout succeeds');
check(s.acquired[0]&&s.shares[0]===100,'acquisition owns all shares');check(!e.sellShares(s,0,10)&&!e.acquire(s,0),'acquired firm cannot be repeatedly sold or acquired');
check(s.expenses===0,'investment does not count as operating loss');
check(!e.spend(s,1e15,true)&&!e.spend(s,-1,true),'invalid spend rejected');
s=e.fresh();s.cash=10000000;s.started=true;for(let i=0;i<100;i++){s.expenses=10000;e.settle(s,()=>.5);}check(!s.fired&&s.ownPrice===10000,'grace prevents early dismissal');
s.age=e.GRACE;for(let i=0;i<30&&!s.fired;i++){s.expenses=10000;e.settle(s,()=>.5);}check(s.fired&&s.lowPeriods===3,'sustained losses trigger dismissal');check(!e.sale(s,10000,true)&&!e.buyShares(s,1,1),'fired company cannot trade');
s=e.fresh();s.started=true;s.age=e.GRACE;s.ownPrice=1900;s.lowPeriods=2;s.revenue=1000000;e.settle(s,()=>.5);check(!s.fired&&s.lowPeriods===0,'recovery above threshold resets warning streak');
s=e.fresh();s.started=true;s.cash=100000;s.revenue=500;s.expenses=300;check(e.hydrate(JSON.parse(JSON.stringify(s))).cash===s.cash,'persistence round trip');
let seed=123;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(const base of [100,800,1000000]){let prev=base;for(let i=0;i<10000;i++){let p=e.priceStep(prev,base,random());assert(p>=Math.ceil(prev*.9)&&p<=Math.floor(prev*1.1));assert(p>=base*.6&&p<=base*1.5);prev=p;}check(true,'price bounds 10000 steps');}
console.log('ALL '+n+' ECONOMY/CATALOG CHECKS PASSED');
