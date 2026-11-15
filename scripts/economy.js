// Pure economic rules. Amounts use integer cents; time uses active-play ticks.
var PERIOD=10800, GRACE=108000;
var companies=[
 {id:'metal',name:'한빛 소재',base:10000,sector:'금속·정련'},
 {id:'chemical',name:'푸른 화학',base:8000,sector:'화학·생활용품'},
 {id:'electronics',name:'미래 전자',base:15000,sector:'전자·첨단 소재'},
 {id:'transport',name:'대륙 운송',base:12000,sector:'기계·운송장비'}
];
function fresh(){return {version:2,cash:0,age:0,clock:0,tier:0,ownPrice:10000,lowPeriods:0,started:false,fired:false,revenue:0,expenses:0,lastProfit:0,lossPeriods:0,quietPeriods:0,shares:[0,0,0,0],quotes:companies.map(function(c){return c.base;}),acquired:[false,false,false,false],prices:{},history:[],totalSales:0,totalCosts:0,dividends:0};}
function hydrate(raw){var s=fresh();if(!raw || raw.version!==2)return s;Object.keys(s).forEach(function(k){if(raw[k]!==undefined)s[k]=raw[k];});s.cash=Math.max(0,Math.floor(Number(s.cash)||0));return s;}
function priceStep(previous,base,random){var lo=Math.max(Math.ceil(previous*.9),Math.ceil(base*.6)),hi=Math.min(Math.floor(previous*1.1),Math.floor(base*1.5));return Math.max(lo,Math.min(hi,Math.round(previous*(.9+.2*random))));}
function spend(s,cents,operating){cents=Math.ceil(cents);if(cents<0 || !isFinite(cents) || s.cash<cents || s.fired)return false;s.cash-=cents;if(operating){s.expenses+=cents;s.totalCosts+=cents;}return true;}
function sale(s,cents,manufactured){cents=Math.max(0,Math.round(cents));if(s.fired)return false;s.cash+=cents;s.revenue+=cents;s.totalSales+=cents;if(manufactured)s.started=true;return true;}
function buyShares(s,n,count){count=Math.floor(count);if(n<0||n>=4||count<=0||s.acquired[n]||s.shares[n]+count>100)return false;var cost=Math.ceil(s.quotes[n]*count*1.01);if(!spend(s,cost,false))return false;s.shares[n]+=count;return true;}
function sellShares(s,n,count){count=Math.floor(count);if(n<0||n>=4||count<=0||s.acquired[n]||s.shares[n]<count||s.fired)return false;s.shares[n]-=count;s.cash+=Math.floor(s.quotes[n]*count*.99);return true;}
function acquire(s,n){if(n<0||n>=4||s.acquired[n]||s.shares[n]<51)return false;var cost=Math.ceil((100-s.shares[n])*s.quotes[n]*1.2+500000);if(!spend(s,cost,false))return false;s.shares[n]=100;s.acquired[n]=true;return true;}
function settle(s,random){
 var profit=s.revenue-s.expenses;s.lastProfit=profit;
 if(profit<0)s.lossPeriods++;else s.lossPeriods=0;
 if(s.revenue===0)s.quietPeriods++;else s.quietPeriods=0;
 var change=0;
 if(s.started && s.age>=GRACE){
  if(profit<0)change=-.08-Math.min(.07,s.lossPeriods*.01);
  else if(s.quietPeriods>=3)change=-.04;
  else if(profit>0)change=.02+Math.min(.06,profit/Math.max(100000,s.revenue)*.06);
  change+=(random()-.5)*.02;
  s.ownPrice=Math.max(500,Math.min(30000,Math.round(s.ownPrice*(1+change))));
  s.lowPeriods=s.ownPrice<2000?s.lowPeriods+1:0;
  if(s.lowPeriods>=3)s.fired=true;
 }
 var dividend=0;
 for(var i=0;i<4;i++){
  s.quotes[i]=Math.max(companies[i].base*.5,Math.min(companies[i].base*2,Math.round(s.quotes[i]*(.95+random()*.1))));
  dividend+=Math.floor(s.shares[i]*s.quotes[i]*.002);
 }
 if(!s.fired){s.cash+=dividend;s.dividends+=dividend;}
 s.history.push({profit:profit,revenue:s.revenue,expenses:s.expenses,price:s.ownPrice,dividend:dividend});if(s.history.length>12)s.history.shift();
 s.revenue=0;s.expenses=0;return s.fired;
}
module.exports={PERIOD:PERIOD,GRACE:GRACE,companies:companies,fresh:fresh,hydrate:hydrate,priceStep:priceStep,spend:spend,sale:sale,buyShares:buyShares,sellShares:sellShares,acquire:acquire,settle:settle};
