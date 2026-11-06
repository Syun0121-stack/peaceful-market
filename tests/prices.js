// node tests/prices.js — exercises the actual price functions, with seeded randomness.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(require('path').join(__dirname,'../scripts/main.js'),'utf8');
const settings={};let seed=123456789;const math=Object.create(Math);
math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const c={prices:[[{},1],[{},8],[{},65]],Core:{settings:{getString:(k,d)=>settings[k]??d,put:(k,v)=>settings[k]=v}},Math:math,JSON,isFinite,Number};
vm.createContext(c);vm.runInContext(src.slice(src.indexOf('var priceKey'),src.indexOf('var fractionKey')),c);c.loadPrices();
for(let t=0;t<10000;t++){
 const prev=[...c.marketPrices];c.changePrices();
 c.marketPrices.forEach((v,i)=>{
  assert(v>=prev[i]*.9-1e-9&&v<=prev[i]*1.1+1e-9);
  assert(v>=c.prices[i][1]*60&&v<=c.prices[i][1]*150);
 });
}
const prev=[...c.marketPrices];c.marketPrices=[];c.loadPrices();assert.deepEqual([...c.marketPrices],prev);
for(const fixed of [0,0.999999]){
 math.random=()=>fixed;
 for(let i=0;i<200;i++)c.changePrices();
 c.marketPrices.forEach((v,i)=>assert(v>=c.prices[i][1]*60&&v<=c.prices[i][1]*150));
}
console.log('PASS 10000 price steps, forced rising/falling markets and persistence');
