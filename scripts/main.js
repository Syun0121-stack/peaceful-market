// Mindustry 160.7 — peaceful, single-player corporate campaign.
var catalog=require('catalog'), econ=require('economy');
var prefix='peaceful-market-', companyKey=prefix+'company-v2';
var data={}, items={}, blocks={}, ores={}, stagePresets=[], company;
try{company=econ.hydrate(JSON.parse(Core.settings.getString(companyKey,'null')));}catch(e){company=econ.fresh();}
var coin=new Item('credit');coin.localizedName='시장 크레딧';coin.color=Color.valueOf('e5bc61');coin.alwaysUnlocked=true;
coin.description='연구용으로 코어에 인출하는 크레딧. 판매 수익은 기업 계좌에 적립됩니다.';
Object.keys(catalog.vanillaPrices).forEach(function(id){items[id]=Vars.content.item(id);});
catalog.items.forEach(function(d){
 var it=new Item(d.id);it.localizedName=d.label;it.description=d.kind==='final'?'판매용 완제품. 전투 유닛으로 배치되지 않습니다.':'산업 공급망에서 사용하는 원료 또는 중간재입니다.';
 it.color=Color.valueOf(d.color);it.hardness=d.tier<=2?1:2;it.cost=1;items[d.id]=it;data[d.id]=d;
 if(d.kind==='raw'){
  var ore=new OreBlock('ore-'+d.id,it);ore.variants=3;ore.oreDefault=false;ores[d.id]=ore;
 }
});
var bases={};Object.keys(catalog.vanillaPrices).forEach(function(k){bases[k]=Math.round(catalog.vanillaPrices[k]*100);});
catalog.items.forEach(function(d){bases[d.id]=Math.round(d.base*100);});
Object.keys(bases).forEach(function(k){if(!isFinite(company.prices[k]))company.prices[k]=bases[k];company.prices[k]=Math.max(Math.ceil(bases[k]*.6),Math.min(Math.floor(bases[k]*1.5),company.prices[k]));});
function active(){return Vars.state.isCampaign() && Vars.state.getPlanet()===Planets.serpulo;}
function authority(){return active() && !Vars.net.client() && !company.fired;}
function tag(k){return Math.max(0,Number(Vars.state.rules.tags.get(prefix+k,'0'))||0);}
function addTag(k,n){Vars.state.rules.tags.put(prefix+k,String(tag(k)+n));}
function money(cents){return (cents/100).toFixed(2);}
function persist(){Core.settings.put(companyKey,JSON.stringify(company));}
function flush(){persist();Core.settings.forceSave();}
function toast(text){if(!Vars.headless)Vars.ui.hudfrag.showToast(text);}
function core(){return Vars.state.rules.defaultTeam.core();}
function regionIndex(){var s=Vars.state.getSector();for(var i=0;i<stagePresets.length;i++)if(s===stagePresets[i].sector)return i;return -1;}
function tier(){return company.tier;}
function unlocked(id){return !data[id] || data[id].tier<=tier();}
function idOf(item){var n=String(item.name);return n.indexOf(prefix)===0?n.substring(prefix.length):n;}
function salePrice(id){return company.prices[id]||0;}
function friendly(build,source){return authority() && build.team===Vars.state.rules.defaultTeam && (source===null || source.team===build.team);}
function recordSale(build,item,amount,source){
 if(!friendly(build,source) || core()===null)return 0;
 var id=idOf(item),p=salePrice(id);amount=Math.max(0,Math.floor(amount));if(p<=0 || amount<=0)return 0;
 var value=p*amount;if(!econ.sale(company,value,!!data[id] && data[id].kind==='final'))return 0;
 addTag('earned-cents-v2',value);addTag('sold-'+item.name,amount);coin.unlock();return amount;
}
function makeBlock(id,label,size,category){
 var b=extend(Block,id,{});b.localizedName=label;b.size=size;b.health=500;b.solid=true;b.update=true;b.destructible=true;
 b.category=category;b.buildVisibility=BuildVisibility.shown;b.shownPlanets.add(Planets.serpulo);
 b.requirements=ItemStack.with(Items.copper,40,Items.lead,25);blocks[id]=b;return b;
}
function message(text){if(!Vars.headless)Vars.ui.showInfo(text);}
function action(fn){if(!authority())return false;var ok=fn();if(ok)flush();else toast('조건 또는 크레딧 부족');return ok;}
function dialog(title,fill){if(Vars.headless)return;var d=new BaseDialog(title);d.cont.pane(cons(fill)).grow().maxHeight(520);d.addCloseButton();d.show();}
function pricesDialog(){dialog('시장 시세',function(t){
 t.add('3분마다 직전 가격 ±10% · 기준가 60~150%').wrap().width(420).row();
 Object.keys(bases).forEach(function(id){if(!unlocked(id))return;t.add(items[id].localizedName+' : '+money(salePrice(id))+' / 개').left().row();});
});}
function withdraw(amount){var c=core();if(c===null)return false;var n=Math.min(amount,c.storageCapacity-c.items.get(coin),Math.floor(company.cash/100));if(n<=0 || !econ.spend(company,n*100,false))return false;c.items.add(coin,n);return true;}
function deposit(){var c=core();if(c===null)return false;var n=c.items.get(coin);if(n<=0)return false;c.items.remove(coin,n);company.cash+=n*100;return true;}
function sectorBuy(index){
 if(index<1 || index>=stagePresets.length)return false;
 var previous=stagePresets[index-1];if(!previous.sector.info.wasCaptured)return false;
 var s=stagePresets[index];if(s.unlocked())return false;
 if(!econ.spend(company,sectorCost(index)*100,false))return false;s.unlock();company.tier=Math.max(company.tier,catalog.stages[index].tier);return true;
}
function sectorCost(index){return Math.round(150*Math.pow(1.6,index-1));}
function boardDialog(){dialog('기업 본부',function(t){
 t.label(prov(function(){return '기업 계좌: '+money(company.cash)+' 크레딧\n자사 주가: '+money(company.ownPrice)+' / 최근 영업 현금수지: '+money(company.lastProfit)+'\n해임 위험 판정: '+company.lowPeriods+'/3 · 연구 단계: '+tier();})).wrap().width(440).row();
 t.add('첫 완제품 판매 후 활동 시간 30분은 해임 유예.\n그 이후 주가 20 미만이 3회 연속이면 CEO 해임.\n공장 가공료와 수입은 영업 지출, 투자·인수·연구는 별도.').wrap().width(440).row();
 t.button('연구용 크레딧 500 인출',run(function(){action(function(){return withdraw(500);});})).width(420).height(48).row();
 t.button('코어 크레딧 전액 입금',run(function(){action(deposit);})).width(420).height(48).row();
 t.button('투자 및 인수',run(stocksDialog)).width(420).height(48).row();
 t.button('지역 개방',run(regionsDialog)).width(420).height(48).row();
 t.button('산업 안내서',run(guideDialog)).width(420).height(48).row();
 if(company.ownPrice<4000)t.add('[scarlet]주가 경고: 수입·가공 지출을 줄이고 완제품 매출을 확보하십시오.[]').wrap().width(420).row();
});}
function regionsDialog(){dialog('지역 개방',function(t){catalog.stages.forEach(function(s,i){
 t.add(s.label+' · 단계 '+s.tier+'\n점령: '+s.credits+' 크레딧 + '+items[s.product].localizedName+' '+s.count+'개 생산·판매').wrap().width(430).row();
 if(i>0)(function(n){t.button('개방 '+sectorCost(n)+' 크레딧',run(function(){action(function(){return sectorBuy(n);});})).width(420).height(48).row();})(i);
 });});}
function stocksDialog(){dialog('투자 및 인수',function(t){
 t.add('타사 주식은 단계 2부터 거래. 매수·매도 수수료 각각 1%.\n100주 중 51주 이상 보유하면 잔여 지분과 인수 비용을 지불해 인수.\n인수 시 해당 업종 생산속도 +15%, 가공료 -15%. 원료 수량은 동일.').wrap().width(440).row();
 econ.companies.forEach(function(c,i){
 t.label(prov(function(){return c.name+' ('+c.sector+')\n주가 '+money(company.quotes[i])+' · 보유 '+company.shares[i]+'주'+(company.acquired[i]?' · 인수 완료':'');})).wrap().width(440).row();
 t.button('10주 매수',run(function(){action(function(){return tier()>=2&&econ.buyShares(company,i,10);});})).width(210).height(48);
 t.button('10주 매도',run(function(){action(function(){return tier()>=2&&econ.sellShares(company,i,10);});})).width(210).height(48).row();
 t.button('인수: 잔여 주식값 × 1.2 + 5,000',run(function(){action(function(){return tier()>=2&&econ.acquire(company,i);});})).width(420).height(48).row();
 });
});}
function guideDialog(){dialog('생산·경영 안내',function(t){
 t.add('신규 광맥은 지역 진입 시 코어 인근에 생성됩니다. 드릴로 채굴하십시오.\n공장 연구는 기술 트리에서 원료·중간재로 진행합니다.\n공장 클릭 → 생산품 선택 → 원료 투입 → 출력 컨베이어 → 판매소.\n희토류 분리기는 다섯 산화물을 함께 생산합니다. 모두 배출해야 정체되지 않습니다.\n원유 용기는 지하 자원 채굴을 단순화한 게임 자원입니다.\n수량·시간·비용은 게임 값이며 실제 공정 조건이나 질량수지가 아닙니다.').wrap().width(440).row();
 catalog.recipes.forEach(function(r){if(r.tier>tier())return;t.add(recipeText(r)).wrap().width(440).left().row();});
});}
var market=makeBlock('market','판매소',2,Category.effect);market.alwaysUnlocked=true;market.hasItems=true;market.acceptsItems=true;market.itemCapacity=0;market.unloadable=false;market.configurable=true;
market.description='반입 즉시 판매하고 기업 계좌에 적립합니다. 코어 저장 용량의 영향을 받지 않습니다.';
market.buildType=prov(function(){return extend(Building,{
 acceptItem:function(source,item){return friendly(this,source)&&core()!==null&&salePrice(idOf(item))>0;},
 acceptStack:function(item,amount,source){return this.acceptItem(source,item)?Math.max(0,Math.floor(amount)):0;},
 handleItem:function(source,item){recordSale(this,item,1,source);},handleStack:function(item,amount,source){recordSale(this,item,amount,source);},
 buildConfiguration:function(t){t.label(prov(function(){return '기업 계좌 '+money(company.cash);})).row();t.button('시세표',run(pricesDialog)).size(150,50);t.button('기업 본부',run(boardDialog)).size(150,50);},
 enterpriseApi:function(){return api;}
});});
var hq=makeBlock('headquarters','기업 본부',2,Category.effect);hq.alwaysUnlocked=true;hq.configurable=true;hq.description='기업 계좌, 주식 투자, 인수, 지역 개방 및 산업 안내를 관리합니다.';
hq.buildType=prov(function(){return extend(Building,{buildConfiguration:function(t){t.button('기업 경영',run(boardDialog)).size(220,55);}});});
var importIds=catalog.items.filter(function(d){return d.kind==='raw'||d.kind==='import'||['copper-wire','steel','aluminum','plastic','rubber','circuit','battery','motor','chip','display','refrigerator','smartphone','neodymium-oxide','yttrium-oxide'].indexOf(d.id)>=0;}).map(function(d){return d.id;});
function importCost(id){return Math.ceil(salePrice(id)*1.35+300);}
function importItems(b,id,count){
 count=Math.floor(count);if(!friendly(b,null)||tier()<1||importIds.indexOf(id)<0||!unlocked(id)||count<=0||count>50)return false;
 var item=items[id];if(b.items.get(item)+count>b.block.itemCapacity)return false;
 if(!econ.spend(company,importCost(id)*count,true))return false;b.items.add(item,count);item.unlock();return true;
}
var importer=makeBlock('import-terminal','자원 수입처',2,Category.effect);importer.hasItems=true;importer.itemCapacity=100;importer.configurable=true;
importer.description='해금한 원료·중간재·일부 완제품을 기업 계좌로 수입합니다. 시세보다 비싸므로 단순 재판매로 수익을 낼 수 없습니다.';
importer.buildType=prov(function(){return extend(Building,{
 acceptItem:function(){return false;},acceptStack:function(){return 0;},
 updateTile:function(){if(!authority())return;for(var i=0;i<importIds.length;i++)this.dump(items[importIds[i]]);},
 buildConfiguration:function(t){var self=this;t.button('수입 품목 선택',run(function(){dialog('자원 수입처',function(list){
 list.label(prov(function(){return '기업 계좌 '+money(company.cash);})).row();
 importIds.forEach(function(id){if(!unlocked(id))return;list.add(items[id].localizedName+' · '+money(importCost(id))+'/개').left().row();
 [1,10,50].forEach(function(n){list.button(n+'개 수입',run(function(){action(function(){return importItems(self,id,n);});})).width(135).height(48);});list.row();});
 });})).size(260,55);}
});});
function recipeText(r){function list(o){return Object.keys(o).map(function(k){return items[k].localizedName+' '+o[k];}).join(' + ');}return list(r.inputs)+' → '+list(r.outputs)+'\n'+r.seconds+'초 · 가공료 '+r.fee+' 크레딧 · 단계 '+r.tier;}
function industry(f){if(['smelter','aluminium-refinery','parts-factory'].indexOf(f)>=0)return 0;if(['chemical-plant','packaging-plant','glass-factory'].indexOf(f)>=0)return 1;if(['electronics-plant','rare-concentrator','rare-separator','advanced-materials','consumer-assembly','data-center-assembly'].indexOf(f)>=0)return 2;return 3;}
function outputRoom(build,r){return Object.keys(r.outputs).every(function(k){return build.items.get(items[k])+r.outputs[k]<=build.block.itemCapacity;});}
function ready(build,r){return Object.keys(r.inputs).every(function(k){return build.items.get(items[k])>=r.inputs[k];});}
function factory(def){
 var options=catalog.recipes.filter(function(r){return r.factory===def.id;}), b=makeBlock(def.id,def.label,2,Category.crafting);
 b.hasItems=true;b.acceptsItems=true;b.itemCapacity=120;b.configurable=true;b.saveConfig=true;b.hasPower=def.power>0;if(b.hasPower)b.consumePower(def.power);
 b.description='클릭하여 생산품을 선택합니다. 원료와 가공료를 소비하며 완제품은 컨베이어로 배출합니다.\n인수 보너스: '+econ.companies[industry(def.id)].name;
 b.config(Item,new Packages.arc.func.Cons2({get:function(build,value){for(var i=0;i<options.length;i++)if(items[Object.keys(options[i].outputs)[0]]===value)build.selectRecipe(i);}}));
 b.buildType=prov(function(){return extend(Building,{
  selected:0,work:0,
  selectedIndex:function(){return this.selected;},progressWork:function(){return this.work;},recipe:function(){return options[this.selected];},
  selectRecipe:function(n){if(n<0||n>=options.length||n!==Math.floor(n)||options[n].tier>tier()||company.fired)return;if(n!==this.selected){this.selected=n;this.work=0;}},
  config:function(){return items[Object.keys(this.recipe().outputs)[0]];},
  acceptItem:function(source,item){return friendly(this,source)&&this.recipe().inputs[idOf(item)]!==undefined&&this.items.get(item)<b.itemCapacity;},
  acceptStack:function(item,amount,source){return this.acceptItem(source,item)?Math.max(0,Math.min(Math.floor(amount),b.itemCapacity-this.items.get(item))):0;},
  updateTile:function(){
   if(!friendly(this,null))return;var self=this,r=this.recipe();
   // Never send out an intermediate that the current recipe needs.
   options.forEach(function(o){Object.keys(o.outputs).forEach(function(k){if(r.inputs[k]===undefined)self.dump(items[k]);});});
   if(!this.enabled||r.tier>tier()||this.efficiency<=0||!ready(this,r)||!outputRoom(this,r))return;
   var bonus=company.acquired[industry(def.id)], fee=Math.ceil(r.fee*100*(bonus?.85:1));
   if(company.cash<fee)return;
   this.work+=this.delta()*this.efficiency*(bonus?1.15:1);
   if(this.work>=r.seconds*60 && econ.spend(company,fee,true)){
    Object.keys(r.inputs).forEach(function(k){self.items.remove(items[k],r.inputs[k]);});
    Object.keys(r.outputs).forEach(function(k){self.items.add(items[k],r.outputs[k]);items[k].unlock();addTag('made-'+items[k].name,r.outputs[k]);});
    this.work=0;
   }
  },
  buildConfiguration:function(t){var self=this;t.label(prov(function(){return '선택: '+items[Object.keys(self.recipe().outputs)[0]].localizedName+'\n진행 '+Math.floor(self.work/(self.recipe().seconds*60)*100)+'% · 계좌 '+money(company.cash);})).wrap().width(350).row();
   t.button('생산품 선택',run(function(){dialog(def.label,function(list){options.forEach(function(r,i){
    list.add(recipeText(r)+(r.tier>tier()?'\n[scarlet]지역 단계 미달[]':'')).wrap().width(430).left().row();
    list.button('선택',run(function(){if(r.tier<=tier())self.configure(items[Object.keys(r.outputs)[0]]);})).width(420).height(48).row();
   });});})).size(260,50);},
  version:function(){return 2;},
  write:function(w){this.super$write(w);w.i(this.selected);w.f(this.work);},
  read:function(rd,revision){this.super$read(rd,revision);var n=rd.i(),p=rd.f();this.selected=revision<2?0:(n>=0&&n<options.length?n:0);this.work=revision<2?0:Math.max(0,Math.min(this.recipe().seconds*60,p));}
 });});return b;
}
catalog.factories.forEach(factory);
function stacks(map){var list=[];Object.keys(map).forEach(function(k){list.push(new ItemStack(items[k],map[k]));});var array=java.lang.reflect.Array.newInstance(ItemStack,list.length);for(var i=0;i<list.length;i++)array[i]=list[i];return array;}
function tech(parent,content,requirements,previous){var n=new TechTree.TechNode(parent,content,stacks(requirements));if(previous!==null)n.objectives.add(new Objectives.SectorComplete(previous));return n;}
function tierPrevious(t){if(t===0)return null;for(var i=0;i<catalog.stages.length;i++)if(catalog.stages[i].tier===t)return stagePresets[i-1];return stagePresets[0];}
var disabledBlocks=[];
function utilityType(u){return ['alpha','beta','gamma','evoke','incite','emanate','mono','poly','mega'].indexOf(String(u.name))>=0;}
function combatProducer(b){return disabledBlocks.indexOf(b)>=0;}
function restrictUnits(){
 Vars.content.blocks().each(cons(function(b){
  var disable=false;
  if(b instanceof UnitFactory){b.plans.removeAll(boolf(function(p){return !utilityType(p.unit);}));disable=b.plans.isEmpty();}
  else if(b instanceof Reconstructor){b.upgrades.removeAll(boolf(function(pair){return !utilityType(pair[1]);}));disable=b.upgrades.isEmpty();}
  else if(b instanceof UnitAssembler){b.plans.removeAll(boolf(function(p){return !utilityType(p.unit);}));disable=b.plans.isEmpty();}
  else if(b instanceof UnitAssemblerModule)disable=true;
  if(disable){disabledBlocks.push(b);b.buildVisibility=BuildVisibility.hidden;}
 }));
 Vars.content.units().each(cons(function(u){if(!utilityType(u)&&u.techNode!==null&&u.techNode.parent!==null)u.techNode.parent.children.remove(u.techNode);}));
}
Events.on(ContentInitEvent,cons(function(){
 catalog.stages.forEach(function(s){stagePresets.push(SectorPresets[s.sector]);});
 var root=Blocks.coreShard.techNode, nodes={};
 var parents={'smelter':'parts-factory','glass-factory':'parts-factory','aluminium-refinery':'smelter','chemical-plant':'aluminium-refinery','flexible-factory':'smelter','electronics-plant':'flexible-factory','rare-concentrator':'electronics-plant','rare-separator':'rare-concentrator','advanced-materials':'rare-separator','consumer-assembly':'chemical-plant','vehicle-assembly':'flexible-factory','heavy-assembly':'vehicle-assembly','aerospace-assembly':'heavy-assembly','packaging-plant':'chemical-plant','data-center-assembly':'electronics-plant','licensed-assembly':'heavy-assembly'};
 catalog.factories.forEach(function(f){var parent=nodes[parents[f.id]]||root;nodes[f.id]=tech(parent,blocks[f.id],f.research,tierPrevious(f.tier));blocks[f.id].requirements=stacks(f.research);});
 tech(root,hq,{'copper':30,'lead':20},null);tech(nodes['parts-factory'],importer,{'copper':80,'lead':60},stagePresets[0]);
 // Item discovery is automatic on production; factory research consumes the materials.
 // Replace only campaign access objectives. Built-in industry remains available.
 for(var i=1;i<stagePresets.length;i++){var n=stagePresets[i].techNode;if(n!==null){n.requirements=ItemStack.with(coin,sectorCost(i));n.finishedRequirements=ItemStack.with(coin,0);n.objectives.clear();n.objectives.add(new Objectives.SectorComplete(stagePresets[i-1]));}}
 Planets.serpulo.allowWaves=false;Planets.serpulo.allowSectorInvasion=false;Planets.serpulo.allowLaunchToNumbered=false;
 restrictUnits();
}));
function seedOres(){
 if(tag('deposits-v2')>0)return;var c=core();if(c===null)return;var index=regionIndex(),max=index<0?tier():catalog.stages[index].tier;
 // Each frontier provides the ores introduced at its stage; iron/limestone remain common.
 var available=catalog.items.filter(function(d){return d.kind==='raw'&&(d.tier===max || (d.tier===1&&max>=1));});
 var placed=0;
 available.forEach(function(d,n){
  var count=0, radius=8+n*3;
  // Deterministic nearby deposits on existing empty ground; never overwrite structures or native ore.
  for(var dist=radius;dist<Math.max(Vars.world.width(),Vars.world.height())&&count<12;dist++){
   for(var step=0;step<96&&count<12;step++){
    var angle=(step*137.5+n*29)*Math.PI/180,x=c.tileX()+Math.round(Math.cos(angle)*dist),y=c.tileY()+Math.round(Math.sin(angle)*dist);
    var tile=Vars.world.tile(x,y);if(tile===null||tile.block()!==Blocks.air||tile.overlay()!==Blocks.air||tile.floor().isLiquid||tile.floor().itemDrop!==null)continue;
    // Place 2x2 patches so an ordinary mechanical/pneumatic drill can cover them.
    var valid=true;for(var dx=0;dx<2;dx++)for(var dy=0;dy<2;dy++){var q=Vars.world.tile(x+dx,y+dy);if(q===null||q.block()!==Blocks.air||q.overlay()!==Blocks.air||q.floor().isLiquid||q.floor().itemDrop!==null)valid=false;}
    if(!valid)continue;for(var dx=0;dx<2;dx++)for(var dy=0;dy<2;dy++)Vars.world.tile(x+dx,y+dy).setOverlay(ores[d.id]);count+=4;
   }
  }
  if(count>0)placed++;else Log.warn('No safe deposit positions for '+d.id+'; imports remain available.');
 });
 Vars.state.rules.tags.put(prefix+'deposits-v2','1');
}
function updateMission(){
 if(!active()||Vars.net.client())return;
 var index=regionIndex(), s=index>=0?catalog.stages[index]:{credits:5000,product:'copper-wire',count:100},item=items[s.product];
 var earned=tag('earned-cents-v2')/100, produced=tag('made-'+item.name),sold=tag('sold-'+item.name),qualified=Math.min(produced,sold);
 var captured=Vars.state.getSector().info.wasCaptured;
 if(!captured && earned>=s.credits && qualified>=s.count){Call.sectorCapture();toast('지역 목표 달성');captured=true;}
 var r=Vars.state.rules;r.mission='[accent]기업 계좌 '+money(company.cash)+' · 자사 주가 '+money(company.ownPrice)+'[]\n매출 '+Math.floor(earned)+' / '+s.credits+' 크레딧\n'+item.localizedName+' 생산·판매 '+qualified+' / '+s.count;
 if(captured)r.mission+='\n[accent]점령 완료 · 기업 본부에서 다음 지역 개방[]';
 else if(index===0)r.mission+='\n구리·납 확보 → 판매소 → 기초 금속 가공소 연구\n구리 전선 선택 → 구리 투입 → 생산품을 판매소로 운반';
 if(company.ownPrice<4000)r.mission+='\n[scarlet]주가 경고 · 20 미만 연속 '+company.lowPeriods+'/3[]';
}
function isBuilder(u){return u.spawnedByCore || utilityType(u.type);}
function peaceful(){
 if(!active()||Vars.net.client())return;var r=Vars.state.rules;
 r.waves=false;r.waveTimer=false;r.attackMode=false;r.winWave=0;r.canGameOver=false;r.disableWorldProcessors=true;r.objectives.clear();Vars.state.markers.clear();
 disabledBlocks.forEach(function(b){r.bannedBlocks.add(b);});
 Groups.unit.each(cons(function(u){if(u.team===r.waveTeam || (u.team===r.defaultTeam&&!isBuilder(u)))u.remove();}));
 var remove=[];Groups.build.each(cons(function(b){if(b.team===r.waveTeam)remove.push(b.tile);else if(combatProducer(b.block))b.enabled=false;}));remove.forEach(function(t){t.setAir();});
 var index=regionIndex();if(index>=0)company.tier=Math.max(company.tier,catalog.stages[index].tier);
 for(var i=0;i<stagePresets.length;i++)if(stagePresets[i].unlocked()||stagePresets[i].sector.info.wasCaptured)company.tier=Math.max(company.tier,catalog.stages[i].tier);
 if(tag('migration-v2')===0){addTag('earned-cents-v2',tag('earned-v1')*100);Vars.state.rules.tags.put(prefix+'migration-v2','1');}
 seedOres();updateMission();persist();
 if(company.fired)Core.app.post(run(dismissal));
}
function dismissal(){
 if(!active()||Vars.net.client()||Vars.state.gameOver)return;company.fired=true;flush();Vars.state.rules.canGameOver=true;
 if(Vars.headless){Vars.state.gameOver=true;Events.fire(new GameOverEvent(Team.derelict));}
 else Call.gameOver(Team.derelict);
 if(!Vars.headless)Vars.ui.showInfo('주가 장기 하락으로 CEO에서 해임되었습니다.\n모드를 재시작하면 새 경영 시작을 선택할 수 있습니다. 기존 연구는 유지됩니다.');
}
Events.on(WorldLoadEvent,cons(function(){Core.app.post(run(peaceful));}));
Events.on(SaveWriteEvent,cons(function(){persist();}));
Events.on(ClientLoadEvent,cons(function(){if(company.fired)Core.app.post(run(function(){Vars.ui.showConfirm('새 경영 시작','CEO 해임 상태입니다. 기업 계좌·투자·주가를 초기화하고 새로 시작하시겠습니까? 연구는 유지됩니다.',run(function(){company=econ.fresh();Object.keys(bases).forEach(function(k){company.prices[k]=bases[k];});flush();}));}));}));
var persistClock=0,missionClock=0;
Events.run(Trigger.update,run(function(){
 if(!active()||Vars.net.client()||Vars.state.isPaused()||Vars.state.gameOver||company.fired)return;
 var dt=Math.max(0,Math.min(Time.delta,60));company.clock+=dt;persistClock+=dt;missionClock+=dt;if(company.started)company.age+=dt;
 Vars.state.rules.waves=false;Vars.state.rules.waveTimer=false;
 if(missionClock>=60){missionClock=0;updateMission();}
 if(persistClock>=300){persistClock=0;persist();}
 if(company.clock>=econ.PERIOD){company.clock%=econ.PERIOD;Object.keys(bases).forEach(function(k){company.prices[k]=econ.priceStep(salePrice(k),bases[k],Math.random());});econ.settle(company,Math.random);flush();toast('시세 변경됨');if(company.fired)dismissal();}
}));
var api={catalog:catalog,economy:econ,items:items,blocks:blocks,ores:ores,company:function(){return company;},active:active,peaceful:peaceful,updateMission:updateMission,recordSale:recordSale,importItems:importItems,importCost:importCost,sectorBuy:sectorBuy,withdraw:withdraw,deposit:deposit,seedOres:seedOres,persist:flush,recipeText:recipeText};
// Engine entry point; diagnostics are available through the market building.
