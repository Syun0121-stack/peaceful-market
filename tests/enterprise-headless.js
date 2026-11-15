// Run in an isolated v160.7 server AFTER loading Ground Zero. Never use real saves.
(function(){
 var checks=0;function check(v,m){if(!v)throw new Error(m);checks++;}
 var c=Vars.state.rules.defaultTeam.core(),team=c.team,x=c.tileX()+8,y=c.tileY();
 var market=Vars.content.block('peaceful-market-market');Vars.world.tile(x,y).setBlock(market,team,0);
 var b=Vars.world.tile(x,y).build,api=b.enterpriseApi(),state=api.company(),cat=api.catalog;
 Vars.state.set(Packages.mindustry.core.GameState.State.playing);Time.delta=1;
 state.tier=9;state.cash=100000000;state.fired=false;state.acquired=[false,false,false,false];
 check(cat.items.filter(function(i){return i.kind==='final';}).length===28,'28 finished products loaded');
 check(!Vars.state.rules.waves && Vars.state.rules.disableWorldProcessors,'peaceful campaign rules active');
 check(Vars.state.rules.bannedBlocks.contains(Blocks.groundFactory),'combat unit factory disabled');
 check(Blocks.airFactory.plans.size>0,'utility unit factory preserved');
 check(Blocks.airFactory.plans.allMatch(boolf(function(p){return p.unit.buildSpeed>0 || (p.unit.mineTier>=0&&p.unit.mineSpeed>0);})), 'air factory offers only utility units');
 var old=state.cash;b.handleStack(Items.copper,100,c);check(state.cash===old+10000,'sales credit corporate account');
 var enemy=UnitTypes.dagger.create(Team.crux);old=state.cash;b.handleStack(Items.copper,100,enemy);check(state.cash===old,'enemy sale rejected');
 check(!b.acceptItem(c,Vars.content.item('peaceful-market-credit')),'currency cannot be resold');
 // Every recipe is executed by a real Building on the world grid.
 cat.factories.forEach(function(def){
  var block=api.blocks[def.id];check(block.techNode!==null,'research node '+def.id);
  Vars.world.tile(x,y+6).setBlock(block,team,0);var f=Vars.world.tile(x,y+6).build;
  var options=cat.recipes.filter(function(r){return r.factory===def.id;});
  options.forEach(function(r,index){
   f.items.clear();f.configured(null,api.items[Object.keys(r.outputs)[0]]);check(f.selectedIndex()===index,'select '+r.id);
   Object.keys(r.inputs).forEach(function(k){f.items.add(api.items[k],r.inputs[k]);});
   f.efficiency=1;f.enabled=true;old=state.cash;
   for(var tick=0;tick<r.seconds*60;tick++)f.updateTile();
   check(Object.keys(r.outputs).every(function(k){return f.items.get(api.items[k])===r.outputs[k];}),'produce '+r.id);
   check(Object.keys(r.inputs).every(function(k){return f.items.get(api.items[k])===0;}),'consume '+r.id);
   check(state.cash===old-r.fee*100,'charge '+r.id);
  });
 });
 // Tier gating, missing inputs, inventory backpressure and finance blockers.
 var flex=api.blocks['flexible-factory'];Vars.world.tile(x,y+6).setBlock(flex,team,0);var f=Vars.world.tile(x,y+6).build;
 state.tier=0;f.configured(null,api.items['engine']);check(f.selectedIndex()===0,'future recipe locked');state.tier=9;
 f.items.clear();f.efficiency=1;for(var i=0;i<600;i++)f.updateTile();check(f.items.total()===0,'no production without ingredients');
 f.items.add(api.items.steel,2);f.items.add(Items.graphite,1);state.cash=0;for(var i=0;i<600;i++)f.updateTile();check(f.items.get(api.items.steel)===2,'no free production without processing cash');state.cash=100000000;
 // Import costs and gates, local production objectives cannot be met by imports alone.
 Vars.world.tile(x,y+10).setBlock(api.blocks['import-terminal'],team,0);var port=Vars.world.tile(x,y+10).build;
 state.tier=1;check(!api.importItems(port,'smartphone',1),'future import locked');state.tier=9;
 old=state.cash;check(api.importItems(port,'smartphone',1),'import available product');var paid=old-state.cash;
 check(paid>state.prices.smartphone,'import spread prevents arbitrage');
 check(!api.importItems(port,'smartphone',500),'oversized import rejected');
 var r=Vars.state.rules,wire=api.items['copper-wire'];r.tags.put('peaceful-market-earned-cents-v2','100000');r.tags.put('peaceful-market-made-'+wire.name,'0');r.tags.put('peaceful-market-sold-'+wire.name,'100');Vars.state.getSector().info.wasCaptured=false;
 api.updateMission();check(!Vars.state.getSector().info.wasCaptured,'sales without production cannot capture');
 r.tags.put('peaceful-market-made-'+wire.name,'40');api.updateMission();check(Vars.state.getSector().info.wasCaptured,'production and sales capture region');
 // Save selected recipe, intermediate progress, money, stock ownership, regional tags.
 f.configured(null,api.items.engine);f.items.clear();f.items.add(api.items.steel,3);f.items.add(api.items.aluminum,2);f.items.add(api.items['machine-parts'],2);f.efficiency=1;f.updateTile();var progress=f.progressWork();
 state.shares[1]=60;state.acquired[2]=true;api.persist();var cash=state.cash;
 var save=Core.files.local('enterprise-regression.msav');Packages.mindustry.io.SaveIO.write(save);Packages.mindustry.io.SaveIO.load(save);
 f=Vars.world.tile(x,y+6).build;check(f.config()===api.items.engine&&f.progressWork()===progress,'recipe and progress survive world save');
 check(api.company().cash===cash&&api.company().shares[1]===60&&api.company().acquired[2],'company state survives world save');
 check(Number(Vars.state.rules.tags.get('peaceful-market-made-'+wire.name))===40,'local production count survives save');
 var builder=UnitTypes.poly.create(team);builder.add();var combat=UnitTypes.dagger.create(team);combat.add();api.peaceful();check(builder.isAdded()&&!combat.isAdded(),'existing combat units removed and builder preserved');
 print('ALL '+checks+' ENTERPRISE ENGINE CHECKS PASSED');
})();
