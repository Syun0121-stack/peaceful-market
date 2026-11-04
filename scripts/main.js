// Mindustry 160.7. Single-player Serpulo economy campaign.
var coin = new Item('credit');
coin.localizedName = '시장 크레딧';
coin.description = '판매소에서 얻는 지역 개방용 화폐. 코어에 보관됩니다.';
coin.color = Color.valueOf('e5bc61');
coin.alwaysUnlocked = true;
var prices = [[Items.copper,1],[Items.lead,1],[Items.coal,2],[Items.sand,1],[Items.scrap,1],[Items.graphite,5],[Items.metaglass,5],[Items.silicon,7],[Items.titanium,6],[Items.thorium,10],[Items.plastanium,18],[Items.phaseFabric,28],[Items.surgeAlloy,35],[Items.pyratite,6],[Items.blastCompound,10]];
var key = 'peaceful-market-clock-v2';
var clock = parseFloat(Core.settings.getString(key, '0')) || 0, saved = 0;
var earnedKey = 'peaceful-market-earned-v1';
var goalKey = 'peaceful-market-goal-v1';
var tutorialKey = 'peaceful-market-tutorial-v1';
function period(){ return Math.floor(clock / 10800); }
function price(item){
    for(var i = 0; i < prices.length; i++) if(prices[i][0] === item){
        var seed = ((period()+1)*7919+(i+1)*104729)%997;
        return Math.max(1, Math.round(prices[i][1]*(0.65+seed/996*0.70)));
    }
    return 0;
}
function active(){ return Vars.state.isCampaign() && Vars.state.getPlanet() === Planets.serpulo; }
function tagNumber(name){
    var value = Number(Vars.state.rules.tags.get(name, '0'));
    return isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
function earned(){ return tagNumber(earnedKey); }
function targetCredits(){
    var sector = Vars.state.getSector();
    var waves = sector.preset === null ? 20 : sector.preset.captureWave;
    return Math.max(150, (waves > 0 ? waves : 20) * 50);
}
function recordSale(amount, team){
    if(team === Vars.state.rules.defaultTeam){
        Vars.state.rules.tags.put(earnedKey, String(earned() + amount));
    }
    coin.unlock();
}
function allowed(build, source){
    return active() && !Vars.net.client() && (source === null || source.team === build.team);
}
function accepted(build, item, amount, source){
    var core = build.team.core(), p = price(item);
    if(!allowed(build, source) || core === null || p <= 0) return 0;
    return Math.max(0, Math.min(Math.floor(amount), Math.floor((core.storageCapacity-core.items.get(coin))/p)));
}
function sell(build, item, amount, source){
    var count = accepted(build, item, amount, source);
    if(count <= 0) return;
    var value = count * price(item);
    build.team.core().items.add(coin, value);
    recordSale(value, build.team);
}
function status(build){
    if(!active()) return '세르플로 캠페인에서 사용 가능';
    var core = build.team.core();
    if(core === null) return '판매 중단: 코어 없음';
    return '코어 크레딧: ' + core.items.get(coin) + ' / ' + core.storageCapacity;
}
function showPrices(){
    if(Vars.headless) return;
    var d = new BaseDialog('판매소 · 현재 시세');
    d.cont.add('다음 갱신까지 ' + Math.ceil((10800-clock%10800)/60) + '초').row();
    for(var i = 0; i < prices.length; i++){
        d.cont.add(prices[i][0].localizedName + ' : ' + price(prices[i][0]) + ' 크레딧 / 개').left().row();
    }
    d.cont.add('반입 즉시 판매 · 크레딧 저장 공간이 부족하면 반입 중단').wrap().width(360).row();
    d.addCloseButton();
    d.show();
}
var market = extend(Block, 'market', {
    load: function(){ this.super$load(); this.region = Core.atlas.find('vault'); },
    setBars: function(){ this.super$setBars(); this.removeBar('items'); }
});
market.localizedName = '판매소';
market.description = '컨베이어 또는 직접 반입한 자원을 판매합니다. 크레딧은 같은 팀의 코어에 저장됩니다. 시세는 플레이 시간 3분마다 변경됩니다.';
market.size = 2;
market.health = 500;
// Tile only creates a Building when update or destructible is true.
market.update = true;
market.destructible = true;
market.hasItems = true;
market.acceptsItems = true;
market.itemCapacity = 0; // Instant sale: no inventory to unload or duplicate.
market.unloadable = false;
market.solid = true;
market.configurable = true;
market.alwaysUnlocked = true;
market.category = Category.effect;
market.requirements = ItemStack.with(Items.copper,35,Items.lead,20);
market.shownPlanets.add(Planets.serpulo);
market.buildVisibility = BuildVisibility.shown;
market.buildType = prov(function(){ return extend(Building, {
    acceptItem: function(source, item){ return accepted(this, item, 1, source) === 1; },
    handleItem: function(source, item){ sell(this, item, 1, source); },
    acceptStack: function(item, amount, source){
        // Teamc sources expose their team field in Rhino.
        if(source !== null && source.team !== this.team) return 0;
        return accepted(this, item, amount, null);
    },
    handleStack: function(item, amount, source){ sell(this, item, amount, source); },
    buildConfiguration: function(table){
        var self = this;
        table.label(prov(function(){ return status(self); })).row();
        table.button('시세표', run(showPrices)).size(160,50);
    }
}); });
Events.on(ContentInitEvent, cons(function(){
    Planets.serpulo.allowSectorInvasion = false;
    Planets.serpulo.allowWaves = false;
    Planets.serpulo.allowLaunchToNumbered = false;
    var order = [SectorPresets.frozenForest,SectorPresets.biomassFacility,SectorPresets.ruinousShores,SectorPresets.stainedMountains,SectorPresets.windsweptIslands,SectorPresets.tarFields,SectorPresets.overgrowth,SectorPresets.impact0078,SectorPresets.desolateRift,SectorPresets.planetaryTerminal];
    for(var i = 0; i < order.length; i++){
        var sector = order[i];
        if(sector === null) continue;
        var node = sector.techNode;
        if(node !== null){
            node.requirements = ItemStack.with(coin,Math.min(2000,150+i*175));
            node.finishedRequirements = ItemStack.with(coin,0);
            node.objectives.clear();
        }
    }
}));
function updateMission(){
    if(!active() || Vars.net.client()) return;
    var r = Vars.state.rules, core = r.defaultTeam.core();
    var total = earned(), target = targetCredits();
    if(total >= target && r.tags.get(goalKey, 'false') !== 'true'){
        r.tags.put(goalKey, 'true');
        if(!Vars.state.getSector().info.wasCaptured) Call.sectorCapture();
        if(!Vars.headless) Vars.ui.hudfrag.showToast('크레딧 목표 달성');
    }
    var done = r.tags.get(goalKey, 'false') === 'true';
    var text = '[accent]크레딧 획득: ' + total + ' / ' + target + '[]';
    if(done) text += '\n[accent]지역 목표 달성[] · 생산 및 판매 계속 가능';
    if(Vars.state.getSector() === SectorPresets.groundZero.sector){
        var stage = Math.min(4, tagNumber(tutorialKey));
        var hasMarket = Groups.build.contains(boolf(function(b){ return b.block === market && b.team === r.defaultTeam; }));
        if(stage === 0 && (hasMarket || (core !== null && core.items.get(Items.copper) >= 35 && core.items.get(Items.lead) >= 20))) stage = 1;
        if(stage === 1 && hasMarket) stage = 2;
        if(stage === 2 && total > 0) stage = 3;
        if(done) stage = 4;
        r.tags.put(tutorialKey, String(stage));
        var hints = [
            '1/4 자원 확보\n구리 35개와 납 20개를 채굴하여 코어에 운반하십시오.',
            '2/4 판매소 건설\n효과 탭에서 판매소를 건설하십시오.\n비용: 구리 35개 · 납 20개',
            '3/4 첫 판매\n드릴 → 컨베이어 → 판매소 순서로 연결하십시오.\n컨베이어의 화살표가 판매소를 향해야 합니다.\n자원을 직접 반입해도 판매됩니다.',
            '4/4 크레딧 획득\n자원을 판매하여 지역 목표를 달성하십시오.\n연구에 사용한 크레딧도 누적 획득량에 포함됩니다.',
            '경제 튜토리얼 완료\n연구 트리에서 크레딧으로 다음 지역을 연구하십시오.'
        ];
        text += '\n\n' + hints[stage];
    }
    r.mission = text;
}
function peaceful(){
    if(!active() || Vars.net.client()) return;
    var r = Vars.state.rules;
    r.waves = false; r.waveTimer = false; r.attackMode = false; r.winWave = 0; r.canGameOver = false;
    // Replace original map tutorial/processors, which can restore combat objectives.
    r.disableWorldProcessors = true;
    r.objectives.clear();
    Vars.state.markers.clear();
    Groups.unit.each(cons(function(u){ if(u.team === r.waveTeam) u.remove(); }));
    var doomed = [];
    Groups.build.each(cons(function(b){ if(b.team === r.waveTeam) doomed.push(b.tile); }));
    for(var i = 0; i < doomed.length; i++) doomed[i].setAir();
    updateMission();
}
Events.on(WorldLoadEvent, cons(function(){ Core.app.post(run(peaceful)); }));
Events.run(Trigger.update, run(function(){
    if(!active() || Vars.net.client()) return;
    if(Vars.state.isPaused()) return;
    var old = period(); clock += Time.delta; saved += Time.delta;
    Vars.state.rules.waves = false;
    Vars.state.rules.waveTimer = false;
    updateMission();
    if(saved >= 300){ saved = 0; Core.settings.put(key,String(clock)); }
    if(period() !== old && !Vars.headless) Vars.ui.hudfrag.showToast('시세 변경됨');
}));
