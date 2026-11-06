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
var priceKey = 'peaceful-market-prices-v3';
var marketPrices = [];
function loadPrices(){
    var data;
    try { data = JSON.parse(Core.settings.getString(priceKey, '[]')); } catch(e){ data = []; }
    for(var i=0;i<prices.length;i++){
        var base = prices[i][1]*100;
        marketPrices[i] = typeof data[i] === 'number' && isFinite(data[i]) ? Math.max(base*0.6,Math.min(base*1.5,Math.round(data[i]))) : base;
    }
}
function changePrices(){
    for(var i=0;i<prices.length;i++){
        var previous=marketPrices[i], base=prices[i][1]*100;
        var low=Math.max(Math.ceil(previous*0.9),Math.ceil(base*0.6));
        var high=Math.min(Math.floor(previous*1.1),Math.floor(base*1.5));
        marketPrices[i]=Math.max(low,Math.min(high,Math.round(previous*(0.9+Math.random()*0.2))));
    }
    Core.settings.put(priceKey,JSON.stringify(marketPrices));
}
function price(item){
    for(var i=0;i<prices.length;i++) if(prices[i][0] === item) return marketPrices[i]/100;
    return 0;
}
var fractionKey = 'peaceful-market-fraction-v1';
function fraction(){ return Math.max(0,Math.min(0.99,Number(Vars.state.rules.tags.get(fractionKey,'0')) || 0)); }
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
function recordSale(amount, team, item, count){
    if(team === Vars.state.rules.defaultTeam){
        Vars.state.rules.tags.put(earnedKey, String(earned() + amount));
        var soldKey = 'peaceful-market-sold-' + item.name;
        Vars.state.rules.tags.put(soldKey, String(tagNumber(soldKey) + count));
    }
    coin.unlock();
}
function allowed(build, source){
    return active() && !Vars.net.client() && (source === null || source.team === build.team);
}
function accepted(build, item, amount, source){
    var core = build.team.core(), p = price(item);
    if(!allowed(build, source) || core === null || p <= 0) return 0;
    return Math.max(0, Math.min(Math.floor(amount), Math.floor((core.storageCapacity-core.items.get(coin)-fraction()+0.000001)/p)));
}
function sell(build, item, amount, source){
    var count = accepted(build, item, amount, source);
    if(count <= 0) return;
    var exact = Math.round((count * price(item) + fraction())*100)/100;
    var value = Math.floor(exact+0.000001);
    Vars.state.rules.tags.put(fractionKey,String(Math.round((exact-value)*100)/100));
    build.team.core().items.add(coin, value);
    recordSale(value, build.team, item, count);
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
    d.cont.pane(cons(function(list){
    for(var i = 0; i < prices.length; i++){
        list.add(prices[i][0].localizedName + ' : ' + price(prices[i][0]).toFixed(2) + ' 크레딧 / 개').left().row();
    }
    })).maxHeight(420).row();
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

// Trade goods are physical items: manufacture, transport and sell them.
function product(name, label, color, base){
    var item = new Item(name); item.localizedName=label; item.color=Color.valueOf(color);
    item.description='공장에서 생산하여 판매소에 판매하는 상품입니다.';
    prices.push([item,base]); return item;
}
var plate=product('metal-parts','금속 부품','cda079',8);
var glassware=product('glassware','유리 제품','b8e0ea',20);
var circuit=product('circuit','전자 부품','93d99e',35);
var machine=product('machine-parts','정밀 기계','c6a5ee',65);
loadPrices();
var recipes=[
    {item:plate, inputs:[Items.copper,3,Items.lead,2], time:120},
    {item:glassware, inputs:[Items.metaglass,2,Items.lead,1], time:150},
    {item:circuit, inputs:[Items.silicon,2,Items.copper,3], time:180},
    {item:machine, inputs:[plate,2,Items.graphite,2,Items.silicon,2], time:240}
];
function factory(name,label,options,cost,power,region){
    var block=extend(Block,name,{
        load:function(){this.super$load();this.region=Core.atlas.find(region);}
    });
    block.localizedName=label;
    block.description='원료를 가공하여 판매용 상품을 생산합니다. '+(options.length>1?'건물을 눌러 생산품을 선택하십시오. 변경 시 진행률은 초기화되며 원료는 보존됩니다.':'');
    for(var ri=0;ri<options.length;ri++){
        var recipe=recipes[options[ri]];
        block.description+='\n'+recipe.item.localizedName+' 1개 / '+(recipe.time/60)+'초:';
        for(var rk=0;rk<recipe.inputs.length;rk+=2) block.description+=' '+recipe.inputs[rk].localizedName+' '+recipe.inputs[rk+1]+'개';
    }
    block.size=2; block.health=500; block.update=true; block.destructible=true;
    block.solid=true; block.hasItems=true; block.acceptsItems=true; block.itemCapacity=40;
    block.hasPower=power>0; if(power>0) block.consumePower(power);
    block.configurable=options.length>1; block.saveConfig=true;
    block.category=Category.crafting; block.requirements=cost;
    block.buildVisibility=BuildVisibility.shown; block.shownPlanets.add(Planets.serpulo);
    block.config(Item,new Packages.arc.func.Cons2({get:function(build,value){
        for(var i=0;i<options.length;i++) if(recipes[options[i]].item===value) build.selectRecipe(i);
    }}));
    block.buildType=prov(function(){return extend(Building,{
        selected:0, work:0,
        selectedIndex:function(){return this.selected;},
        progressWork:function(){return this.work;},
        selectRecipe:function(n){if(n>=0 && n<options.length && n===Math.floor(n) && n!==this.selected){this.selected=n;this.work=0;}},
        recipe:function(){return recipes[options[this.selected]];},
        config:function(){return this.recipe().item;},
        acceptItem:function(source,item){
            if(source!==null && source.team!==this.team) return false;
            var inputs=this.recipe().inputs;
            for(var i=0;i<inputs.length;i+=2) if(inputs[i]===item) return this.items.get(item)<block.itemCapacity;
            return false;
        },
        acceptStack:function(item,amount,source){
            if(source!==null && source.team!==this.team) return 0;
            return this.acceptItem(null,item)?Math.max(0,Math.min(amount,block.itemCapacity-this.items.get(item))):0;
        },
        updateTile:function(){
            if(Vars.net.client()) return;
            // Keep intermediate goods when they are inputs of the selected recipe.
            var current=this.recipe();
            for(var j=0;j<options.length;j++){
                var output=recipes[options[j]].item, input=false;
                for(var k=0;k<current.inputs.length;k+=2) if(current.inputs[k]===output) input=true;
                if(!input) this.dump(output);
            }
            if(!this.enabled || (power>0 && this.efficiency<=0)) return;
            var r=this.recipe(); if(this.items.get(r.item)>=block.itemCapacity) return;
            for(var i=0;i<r.inputs.length;i+=2) if(this.items.get(r.inputs[i])<r.inputs[i+1]) return;
            this.work+=this.delta()*(power>0?this.efficiency:1);
            if(this.work>=r.time){
                for(var k=0;k<r.inputs.length;k+=2) this.items.remove(r.inputs[k],r.inputs[k+1]);
                this.items.add(r.item,1); r.item.unlock(); this.work=0;
            }
        },
        buildConfiguration:function(table){
            var self=this;
            table.label(prov(function(){return '생산품: '+self.recipe().item.localizedName;})).row();
            for(var i=0;i<options.length;i++) (function(n){
                var r=recipes[options[n]], text=r.item.localizedName+' ('+(r.time/60)+'초)';
                for(var k=0;k<r.inputs.length;k+=2) text+=' · '+r.inputs[k].localizedName+' '+r.inputs[k+1];
                table.button(text,run(function(){self.configure(recipes[options[n]].item);})).width(340).height(60).row();
            })(i);
        },
        write:function(write){this.super$write(write);write.i(this.selected);write.f(this.work);},
        read:function(read,revision){this.super$read(read,revision);var n=read.i();this.selected=n>=0&&n<options.length?n:0;this.work=Math.max(0,Math.min(this.recipe().time,read.f()));},
        version:function(){return 1;}
    });});
    return block;
}
var partsFactory=factory('parts-factory','금속 부품 공장',[0],ItemStack.with(Items.copper,45,Items.lead,30),0,'graphite-press');
var glassFactory=factory('glass-factory','유리 제품 공장',[1],ItemStack.with(Items.copper,70,Items.lead,50,Items.graphite,20),0.6,'kiln');
var flexibleFactory=factory('flexible-factory','다품목 조립 공장',[0,2,3],ItemStack.with(Items.copper,100,Items.lead,80,Items.silicon,40),1.2,'silicon-smelter');
function goodsGoal(){
    var sector=Vars.state.getSector(), id=sector.preset;
    if(id===SectorPresets.groundZero) return [plate,20];
    if(id===SectorPresets.frozenForest || id===SectorPresets.craters) return [plate,50];
    if(id===SectorPresets.biomassFacility || id===SectorPresets.ruinousShores || id===SectorPresets.stainedMountains) return [glassware,40];
    if(id===SectorPresets.windsweptIslands || id===SectorPresets.tarFields) return [circuit,50];
    return [machine,40];
}

Events.on(ContentInitEvent, cons(function(){
    var parent=Blocks.coreShard.techNode;
    var partsNode=new TechTree.TechNode(parent,partsFactory,ItemStack.with(coin,50));
    new TechTree.TechNode(partsNode,glassFactory,ItemStack.with(coin,150));
    new TechTree.TechNode(partsNode,flexibleFactory,ItemStack.with(coin,300));

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
    var goods=goodsGoal(), sold=tagNumber('peaceful-market-sold-'+goods[0].name);
    if(total >= target && sold >= goods[1] && r.tags.get(goalKey, 'false') !== 'true'){
        r.tags.put(goalKey, 'true');
        if(!Vars.state.getSector().info.wasCaptured) Call.sectorCapture();
        if(!Vars.headless) Vars.ui.hudfrag.showToast('지역 목표 달성');
    }
    var done = r.tags.get(goalKey, 'false') === 'true';
    var text = '[accent]크레딧 획득: ' + total + ' / ' + target + '[]';
    text += '\n[accent]' + goods[0].localizedName + ' 판매: ' + sold + ' / ' + goods[1] + '개[]';
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
            '4/4 생산 및 판매\n크레딧 50개로 금속 부품 공장을 연구하십시오.\n구리와 납을 투입하고 금속 부품을 판매소로 운반하십시오.\n500크레딧 획득과 금속 부품 20개 판매를 모두 달성하십시오.\n연구에 사용한 크레딧도 누적 획득량에 포함됩니다.',
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
    if(period() !== old){
        changePrices(); Core.settings.put(key,String(clock));
        if(!Vars.headless) Vars.ui.hudfrag.showToast('시세 변경됨');
    }
}));
