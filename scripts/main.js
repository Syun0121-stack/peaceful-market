// Mindustry 160.7 JavaScript mod. No external dependencies.
var coin = new Item('credit');
coin.localizedName = '시장 크레딧';
coin.description = '판매소에서 얻는 지역 개방용 화폐. 코어에 보관된다.';
coin.color = Color.valueOf('e5bc61');
coin.alwaysUnlocked = true;
var prices = [[Items.copper,1],[Items.lead,1],[Items.coal,2],[Items.sand,1],[Items.scrap,1],[Items.graphite,5],[Items.metaglass,5],[Items.silicon,7],[Items.titanium,6],[Items.thorium,10],[Items.plastanium,18],[Items.phaseFabric,28],[Items.surgeAlloy,35],[Items.pyratite,6],[Items.blastCompound,10]];
var key='peaceful-market-clock-v2', clock=parseFloat(Core.settings.getString(key,'0'))||0, saved=0;
function period(){return Math.floor(clock/10800);}
function price(item){
 for(var i=0;i<prices.length;i++) if(prices[i][0]===item){
  var seed=((period()+1)*7919+(i+1)*104729)%997;
  return Math.max(1,Math.round(prices[i][1]*(0.65+seed/996*0.70)));
 }
 return 0;
}
function active(){return Vars.state.isCampaign() && Vars.state.getPlanet()===Planets.serpulo;}
function showPrices(){
 if(Vars.headless)return;
 var d=new BaseDialog('판매소 · 현재 시세');
 d.cont.add('다음 갱신까지 '+Math.ceil((10800-clock%10800)/60)+'초').row();
 for(var i=0;i<prices.length;i++)d.cont.add(prices[i][0].localizedName+' : '+price(prices[i][0])+' 크레딧 / 개').left().row();
 d.cont.add('반입 즉시 현 시세로 판매 · 코어가 가득 차면 반입 중단').wrap().width(420).row();
 d.addCloseButton();d.show();
}
var market=extend(Block,'market',{
 load:function(){this.super$load();this.region=Core.atlas.find('vault');}
});
market.localizedName='판매소';
market.description='컨베이어로 반입한 자원을 현재 시세로 판매하고 크레딧을 코어에 넣는다. 시세는 플레이 시간 3분마다 품목별로 변한다.';
market.size=2;market.health=500;market.hasItems=true;market.itemCapacity=0;
market.solid=true;market.configurable=true;market.alwaysUnlocked=true;
market.category=Category.effect;
market.requirements=ItemStack.with(Items.copper,35,Items.lead,20);
market.shownPlanets.add(Planets.serpulo);
market.buildVisibility=BuildVisibility.shown;
market.buildType=prov(function(){return extend(Building,{
 acceptItem:function(source,item){var c=this.team.core(),p=price(item);return active()&&p>0&&c!==null&&c.items.get(coin)+p<=c.storageCapacity;},
 handleItem:function(source,item){var c=this.team.core(),p=price(item);if(c!==null&&p>0)c.items.add(coin,p);},
 acceptStack:function(item,amount,source){var c=this.team.core(),p=price(item);return active()&&c!==null&&p>0?Math.max(0,Math.min(amount,Math.floor((c.storageCapacity-c.items.get(coin))/p))):0;},
 handleStack:function(item,amount,source){var c=this.team.core();if(c!==null)c.items.add(coin,amount*price(item));},
 buildConfiguration:function(table){table.button('시세표',run(showPrices)).size(160,50);}
});});
// Change named Serpulo region research costs to credits; preserve prior unlocks.
Events.on(ContentInitEvent,cons(function(){
 Planets.serpulo.allowSectorInvasion=false;Planets.serpulo.allowWaves=false;Planets.serpulo.allowLaunchToNumbered=false;
 var order=[SectorPresets.frozenForest,SectorPresets.biomassFacility,SectorPresets.ruinousShores,SectorPresets.stainedMountains,SectorPresets.windsweptIslands,SectorPresets.tarFields,SectorPresets.overgrowth,SectorPresets.impact0078,SectorPresets.desolateRift,SectorPresets.planetaryTerminal];
 for(var i=0;i<order.length;i++){
  var sector=order[i];if(sector==null)continue;var node=sector.techNode;
  if(node!==null){node.requirements=ItemStack.with(coin,Math.min(2000,150+i*175));node.finishedRequirements=ItemStack.with(coin,0);node.objectives.clear();}
 }
}));
function peaceful(){
 if(!active())return;
 var r=Vars.state.rules;r.waves=false;r.waveTimer=false;r.attackMode=false;r.winWave=0;r.canGameOver=false;
 Groups.unit.each(cons(function(u){if(u.team===r.waveTeam)u.remove();}));
 // Existing enemy map buildings are removed so production can expand safely.
 var doomed=[];Groups.build.each(cons(function(b){if(b.team===r.waveTeam)doomed.push(b.tile);}));
 for(var i=0;i<doomed.length;i++)doomed[i].setAir();
}
Events.on(WorldLoadEvent,cons(function(){Core.app.post(run(peaceful));}));
Events.run(Trigger.update,run(function(){
 if(!active()||Vars.state.isPaused()||Vars.net.client())return;
 var old=period();clock+=Time.delta;saved+=Time.delta;
 Vars.state.rules.waves=false;Vars.state.rules.waveTimer=false;
 if(saved>=300){saved=0;Core.settings.put(key,String(clock));}
 if(period()!==old&&!Vars.headless)Vars.ui.hudfrag.showToast('시장 시세가 갱신됐어. 판매소에서 가격을 확인해.');
}));
