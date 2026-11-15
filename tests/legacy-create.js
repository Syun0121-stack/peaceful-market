// Run ONLY with v0.1.3 after loading Ground Zero to produce a compatibility fixture.
(function(){
 var c=Vars.state.rules.defaultTeam.core(),x=c.tileX()+8,y=c.tileY();
 Vars.state.set(Packages.mindustry.core.GameState.State.paused);
 Vars.world.tile(x,y).setBlock(Vars.content.block('peaceful-market-market'),c.team,0);
 Vars.world.tile(x,y+5).setBlock(Vars.content.block('peaceful-market-flexible-factory'),c.team,0);
 var f=Vars.world.tile(x,y+5).build;f.configured(null,Vars.content.item('peaceful-market-machine-parts'));
 f.items.add(Items.copper,13);f.items.add(Items.graphite,2);f.items.add(Items.silicon,2);f.items.add(Vars.content.item('peaceful-market-metal-parts'),2);
 f.efficiency=1;Time.delta=1;for(var i=0;i<20;i++)f.updateTile();
 c.items.set(Vars.content.item('peaceful-market-credit'),777);
 Vars.state.rules.tags.put('peaceful-market-earned-v1','1234');
 Vars.state.getSector().info.prepare(Vars.state.getSector()); Vars.state.getSector().saveInfo(); Core.settings.forceSave();
 Packages.mindustry.io.SaveIO.write(Core.files.absolute('/tmp/enterprise-v013.msav'));
 print('LEGACY FIXTURE WRITTEN');
})();
