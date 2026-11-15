// Run with 0.2.0 after loading the save produced by legacy-create.js.
(function(){
 var checks=0;function check(v,m){if(!v)throw new Error(m);checks++;}
 var c=Vars.state.rules.defaultTeam.core(),x=c.tileX()+8,y=c.tileY(),m=Vars.world.tile(x,y).build,api=m.enterpriseApi(),f=Vars.world.tile(x,y+5).build;
 api.peaceful();check(m.block===api.blocks.market,'legacy market survives');
 check(f.items.get(Items.copper)===13&&f.items.get(api.items['metal-parts'])===2,'legacy inventories survive');
 check(f.selectedIndex()===0&&f.progressWork()===0,'legacy recipe and progress safely reset');
 check(c.items.get(Vars.content.item('peaceful-market-credit'))===777,'legacy core currency preserved');
 check(Number(Vars.state.rules.tags.get('peaceful-market-earned-cents-v2'))===123400,'legacy earnings migrated');
 api.peaceful();check(Number(Vars.state.rules.tags.get('peaceful-market-earned-cents-v2'))===123400,'migration is idempotent');
 var cash=api.company().cash;check(api.deposit()&&api.company().cash===cash+77700,'legacy credits deposited without loss');
 api.company().shares[0]=60;api.company().acquired[1]=true;api.company().ownPrice=8765;api.persist();
 print('ALL '+checks+' LEGACY MIGRATION CHECKS PASSED');
})();
