// Run after headless.js in the same isolated test world.
(function(){
 var checks=0;function check(v,m){if(!v)throw new Error(m);checks++;print('PASS '+m);}
 var c=Vars.state.rules.defaultTeam.core(),x=c.tileX()+8,y=c.tileY()+5;
 var f=Vars.world.tile(x,y).build, plate=Vars.content.item('peaceful-market-metal-parts');
 var coin=Vars.content.item('peaceful-market-credit');
 Vars.world.tile(x+2,y).setBlock(Blocks.conveyor,Team.sharded,0);
 Vars.world.tile(x+3,y).setBlock(Blocks.conveyor,Team.sharded,0);
 Vars.world.tile(x+4,y).setBlock(Vars.content.block('peaceful-market-market'),Team.sharded,0);
 var a=Vars.world.tile(x+2,y).build,b=Vars.world.tile(x+3,y).build;
 c.items.set(coin,0);f.items.clear();f.items.add(Items.copper,3);f.items.add(Items.lead,2);Time.delta=1;
 for(var i=0;i<400;i++){f.update();a.update();b.update();}
 check(c.items.get(coin)>0 && f.items.get(plate)===0, 'factory conveyor market pipeline sells manufactured goods');
 var flex=Vars.world.tile(x,y+4).build;flex.configured(null,plate);
 flex.items.clear();flex.items.add(Items.copper,3);flex.items.add(Items.lead,2);
 flex.power.status=0;for(var i=0;i<150;i++)flex.update();
 check(flex.items.get(plate)===0,'engine update stops unpowered factory');
 // PowerSource in the same graph supplies actual power consumption updates.
 Vars.world.tile(x+2,y+4).setBlock(Blocks.powerSource,Team.sharded,0);
 var supply=Vars.world.tile(x+2,y+4).build;supply.power.graph.add(flex);
 for(var i=0;i<180;i++){supply.power.graph.update();flex.update();}
 check(flex.items.get(plate)===1,'engine power graph drives powered recipe');
 var glass=Vars.content.block('peaceful-market-glass-factory');
 Vars.world.tile(x,y+13).setBlock(glass,Team.sharded,0);var gf=Vars.world.tile(x,y+13).build;
 gf.items.add(Items.metaglass,2);gf.items.add(Items.lead,1);gf.efficiency=1;
 for(var i=0;i<150;i++)gf.updateTile();
 check(gf.items.get(Vars.content.item('peaceful-market-glassware'))===1,'glass factory recipe produces goods');
 var market=Vars.world.tile(x+4,y).build;
 var r=Vars.state.rules;r.tags.put('peaceful-market-fraction-v1','0.75');c.items.set(coin,0);
 market.handleStack(Items.copper,1,null);
 check(c.items.get(coin)===1 && Number(r.tags.get('peaceful-market-fraction-v1'))===0.75,'fractional remainder is retained');
 // A connected output belt must not steal metal parts needed by the machine recipe.
 flex.configured(null,Vars.content.item('peaceful-market-machine-parts'));
 flex.items.clear();flex.items.add(plate,2);flex.items.add(Items.graphite,2);flex.items.add(Items.silicon,2);
 Vars.world.tile(x+2,y+4).setBlock(Blocks.conveyor,Team.sharded,0);
 var out=Vars.world.tile(x+2,y+4).build;flex.efficiency=1;
 for(var i=0;i<240;i++)flex.updateTile();
 check(out.items.get(plate)===0 && flex.items.get(Vars.content.item('peaceful-market-machine-parts'))===1,'output conveyor does not drain intermediate recipe inputs');
 var file=Core.files.local('production-regression.msav');Packages.mindustry.io.SaveIO.write(file);Packages.mindustry.io.SaveIO.load(file);
 check(Number(Vars.state.rules.tags.get('peaceful-market-fraction-v1'))===0.75,'fractional remainder survives save/load');
 print('ALL '+checks+' PRODUCTION CHECKS PASSED');
})();
