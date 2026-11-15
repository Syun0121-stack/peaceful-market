// Run after enterprise-headless.js, before sectors-headless.js.
(function(){
 var m=Groups.build.find(boolf(function(b){return b.block.name==='peaceful-market-market';})),api=m.enterpriseApi(),s=api.company(),c=Vars.state.rules.defaultTeam.core(),team=c.team,x=c.tileX()+8,y=c.tileY()+15,checks=0;
 function check(v,msg){if(!v)throw new Error(msg);checks++;}
 s.tier=9;s.cash=10000000;s.fired=false;s.acquired=[false,false,false,false];Time.delta=1;
 Vars.world.tile(x,y).setBlock(api.blocks['parts-factory'],team,0);var f=Vars.world.tile(x,y).build;
 Vars.world.tile(x+2,y).setBlock(Blocks.conveyor,team,0);var belt=Vars.world.tile(x+2,y).build;
 Vars.world.tile(x+3,y).setBlock(api.blocks.market,team,0);
 f.items.add(Items.copper,2);var cash=s.cash;
 for(var i=0;i<400;i++){f.update();belt.update();}
 check(s.cash===cash+3*s.prices['copper-wire'],'real conveyor sells factory output');
 // All coproducts must have room, otherwise no raw materials or money are spent.
 Vars.world.tile(x,y).setBlock(api.blocks['rare-separator'],team,0);f=Vars.world.tile(x,y).build;
 Vars.world.tile(x+2,y).setAir();f.items.add(api.items['mixed-rare-oxides'],5);f.items.add(api.items['industrial-chemicals'],3);f.items.set(api.items['cerium-oxide'],120);f.efficiency=1;cash=s.cash;
 for(var i=0;i<1000;i++)f.updateTile();check(s.cash===cash&&f.items.get(api.items['mixed-rare-oxides'])===5,'coproduct backpressure preserves ingredients and cash');
 f.items.set(api.items['cerium-oxide'],0);for(var i=0;i<900;i++)f.updateTile();check(f.items.get(api.items['neodymium-oxide'])===3&&f.items.get(api.items['dysprosium-oxide'])===1,'separator makes all five coproducts');
 // Inherited buffs affect real runtime processing speed and operating fee.
 Vars.world.tile(x,y).setBlock(api.blocks.smelter,team,0);f=Vars.world.tile(x,y).build;f.items.add(api.items['iron-ore'],3);f.items.add(Items.coal,1);f.efficiency=1;s.acquired[0]=true;cash=s.cash;
 for(var i=0;i<262;i++)f.updateTile();check(f.items.get(api.items.iron)===2&&s.cash===cash-85,'acquisition boosts speed and cuts cash processing cost');
 s.acquired[0]=false;
 // Actual power graph controls factory activity.
 Vars.world.tile(x,y).setBlock(api.blocks.smelter,team,0);f=Vars.world.tile(x,y).build;f.items.add(api.items['iron-ore'],3);f.items.add(Items.coal,1);
 for(var i=0;i<400;i++)f.update();check(f.items.get(api.items.iron)===0,'unpowered real factory stops');
 Vars.world.tile(x+2,y).setBlock(Blocks.powerSource,team,0);var supply=Vars.world.tile(x+2,y).build;supply.power.graph.add(f);
 for(var i=0;i<400;i++){supply.power.graph.update();f.update();}check(f.items.get(api.items.iron)===2,'power graph enables smelting');
 // Imports physically leave the terminal through a belt.
 Vars.world.tile(x,y).setBlock(api.blocks['import-terminal'],team,0);var port=Vars.world.tile(x,y).build;
 Vars.world.tile(x+2,y).setBlock(Blocks.conveyor,team,0);belt=Vars.world.tile(x+2,y).build;
 check(api.importItems(port,'copper-wire',1),'import order accepted');cash=s.cash;for(var i=0;i<200;i++){port.update();belt.update();}
 check(port.items.get(api.items['copper-wire'])===0&&s.cash>cash,'imported item transfers through conveyor');
 // No time-based penalty while paused.
 var age=s.age,clock=s.clock;Vars.state.set(Packages.mindustry.core.GameState.State.paused);Events.fire(Trigger.update);check(s.age===age&&s.clock===clock,'pause freezes corporate time');Vars.state.set(Packages.mindustry.core.GameState.State.playing);
 // Bidirectional transfer preserves total money and cannot overfill the core.
 var coin=Vars.content.item('peaceful-market-credit');c.items.set(coin,0);cash=s.cash;check(api.withdraw(500)&&s.cash===cash-50000&&c.items.get(coin)===500,'research withdrawal');check(api.deposit()&&s.cash===cash&&c.items.get(coin)===0,'deposit restores money without creating sales');
 // Native drill mines newly added ore.
 for(var dx=0;dx<2;dx++)for(var dy=0;dy<2;dy++){Vars.world.tile(x+dx,y+5+dy).setAir();Vars.world.tile(x+dx,y+5+dy).setOverlay(api.ores['iron-ore']);}
 Vars.world.tile(x,y+5).setBlock(Blocks.mechanicalDrill,team,0);var drill=Vars.world.tile(x,y+5).build;for(var i=0;i<1500;i++)drill.update();check(drill.items.get(api.items['iron-ore'])>0,'native mechanical drill mines custom ore');
 print('ALL '+checks+' INTEGRATION CHECKS PASSED');
})();
