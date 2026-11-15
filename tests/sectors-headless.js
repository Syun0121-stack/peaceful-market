// Destructive test-world sector loading. Run after enterprise-headless.js.
(function(){
 var api=Groups.build.find(boolf(function(b){return b.block.name==='peaceful-market-market';})).enterpriseApi(),checks=0;
 function check(v,m){if(!v)throw new Error(m);checks++;}
 api.catalog.stages.forEach(function(s){
  Vars.world.loadSector(SectorPresets[s.sector].sector);api.peaceful();
  check(api.company().tier>=s.tier,'tier unlock '+s.sector);
  var required=api.catalog.items.filter(function(d){return d.kind==='raw'&&(d.tier===s.tier||(d.tier===1&&s.tier>=1));});
  required.forEach(function(d){
   var found=null;Vars.world.tiles.eachTile(cons(function(t){if(t.overlay()===api.ores[d.id])found=t;}));
   check(found!==null,'deposit exists '+s.sector+' '+d.id);
  });
 });
 // Force prolonged poor financial results through the actual update event.
 var state=api.company();state.fired=false;state.started=true;state.age=api.economy.GRACE;state.ownPrice=1900;state.lowPeriods=2;state.expenses=1000000;state.revenue=0;state.clock=api.economy.PERIOD-1;
 Vars.state.set(Packages.mindustry.core.GameState.State.playing);Vars.state.gameOver=false;Time.delta=1;Events.fire(Trigger.update);
 check(state.fired&&Vars.state.gameOver,'CEO dismissal triggers engine game over');
 print('ALL '+checks+' SECTOR/GAME-OVER CHECKS PASSED');
})();
