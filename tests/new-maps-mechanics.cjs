const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',harness+`
const extra=sandbox.window.ExtraCourses,battle=sandbox.window.MarbleBattle;
assert.equal(Object.keys(extra.definitions).length,3);
for(const map of ['factory','rapids','ruins']) {
  simulation.reset(map,2,0);const {game,world,maps}=simulation.state();
  assert.ok(world.sideProfile.every(b=>b.right-b.left>400));
  for(let count=2;count<=100;count++) {
    const ball={r:Math.max(5.2,Math.min(11.2,12.5-.72*Math.sqrt(count)))};
    assert.ok(golden.shortcutStart(ball,world,maps[map].sections,{pins:game.static.pins.concat(simulation.dynamics().pins),segments:game.static.segments.concat(simulation.dynamics().segments)}));
  }
}
elements.get('#raceMode').value='battle';
for(const map of ['factory','rapids','ruins']) {
  simulation.reset(map,100,0);const {game,world}=simulation.state();
  game.balls.forEach(b=>{Object.assign(b,{x:500,y:55});battle.assign(game,b,'shortcut');});
  const env=simulation.dynamics();battle.placeShortcuts(game,env);
  assert.ok(game.balls.every(b=>!b.battle.startPending&&battle.clearAt(b,b.x,b.y,game,env)),'100 distinct safe shortcuts on '+map);
}
elements.get('#raceMode').value='normal';
simulation.reset('factory',2,0);let {game,world}=simulation.state();let ball=game.balls[0];
const conveyor=game.static.segments.find(s=>s.conveyor);Object.assign(ball,{vx:0,vy:0});extra.belt(conveyor,ball,game);assert.equal(Math.sign(ball.vx),conveyor.direction);assert.ok(ball.vy>0);
const belts=game.static.segments.filter(s=>s.conveyor);assert.equal(belts.length,38);assert.equal(belts.filter(s=>s.reverse).length,11);
for(const s of belts.filter(s=>s.reverse)){assert.equal(s.direction,-s.downhill);Object.assign(ball,{x:s.x1,y:s.y1,vx:0,vy:0});extra.belt(s,ball,game);assert.ok(ball.vx*s.direction>=95&&ball.vy>=60,'reverse belt discharges into side chute');}
assert.deepEqual([...new Set(belts.map(s=>s.section))],[0,1,2,3,4,5]);
for(const f of game.static.features)for(const s of belts)assert.ok(Math.abs(f.y-(s.y1+s.y2)/2)>Math.abs(s.y2-s.y1)/2+(f.kind==='piston'?47:43),'machine sweeps clear belts');
for(const gate of extra.dynamic(game,world,0).segments.filter(s=>s.sluice)){const b=course.bounds(gate.y1,world);assert.ok(Math.min(Math.abs(gate.x1-b.left),Math.abs(gate.x1-b.right))<.01,'gate anchor meets actual funnel edge');}
const first=extra.dynamic(game,world,0),later=extra.dynamic(game,world,1);
assert.notEqual(first.pins[0].x,later.pins[0].x);assert.notEqual(first.segments[0].x2,later.segments[0].x2);
elements.get('#raceMode').value='battle';simulation.reset('factory',2,0);({game,world}=simulation.state());
const env=extra.dynamic(game,world,game.time);ball=game.balls[0];Object.assign(ball,{x:env.pins[0].x,y:env.pins[0].y-60});battle.assign(game,ball,'freeze');assert.equal(battle.fire(game,ball,'freeze',env),true);assert.equal(battle.frozen(game,env.pins[0].machineKey),true);
elements.get('#raceMode').value='normal';simulation.reset('rapids',2,0);({game,world}=simulation.state());
const current=game.static.features.find(f=>f.kind==='current'),bounds=course.bounds(current.y,world);
const a={x:(bounds.left+bounds.right)/2,y:current.y,vx:0,vy:0},b={...a,immuneFields:true};extra.apply(a,game,world,.1);extra.apply(b,game,world,.1);assert.notEqual(a.vx,0);assert.equal(a.vx,b.vx);assert.equal(a.vy,b.vy,'magnet/wind immunity does not cancel water');
assert.ok(Math.abs(a.vx)>=39,'water visibly changes lateral velocity');assert.equal(game.static.features.filter(f=>f.kind==='current').length,18);assert.equal(game.static.features.filter(f=>f.kind==='whirlpool').length,13);
const split=game.static.features.find(f=>f.kind==='current'&&f.section===4),sb=course.bounds(split.y,world),leftFlow={x:sb.left+(sb.right-sb.left)*split.fraction,y:split.y,vx:0,vy:0},otherBank={...leftFlow,x:sb.left+(sb.right-sb.left)*(1-split.fraction)};extra.apply(leftFlow,game,world,.1);extra.apply(otherBank,game,world,.1);assert.notEqual(leftFlow.vx,otherBank.vx,'split current is local to its channel');
const vortex=game.static.features.find(f=>f.kind==='whirlpool'),vb=course.bounds(vortex.y,world);const v={x:(vb.left+vb.right)/2+60,y:vortex.y,vx:0,vy:0};extra.apply(v,game,world,.1);assert.ok(v.vx!==0&&v.vy!==0);
simulation.reset('ruins',2,0);({game,world}=simulation.state());ball=game.balls[0];const wall=game.static.segments.find(s=>s.breakable),hp=wall.hp;
const walls=game.static.segments.filter(s=>s.breakable);assert.equal(walls.length,29);assert.ok(new Set(walls.map(s=>s.maxHp)).size>=5);
const plate=game.static.pins.find(p=>p.switchFor),gate=game.static.features.find(f=>f.key===plate.switchFor);const closed=extra.dynamic(game,world,0).segments.find(s=>s.machineKey===gate.key);extra.onPinContact(plate,ball,game);assert.equal(gate.openUntil,game.time+3);const opened=extra.dynamic(game,world,0).segments.find(s=>s.machineKey===gate.key);assert.ok(opened.x2<closed.x2,'switch retracts left stone gate');
game.time=4;assert.ok(extra.dynamic(game,world,0).segments.find(s=>s.machineKey===gate.key).x2>opened.x2,'switch expires');
const rock0=extra.dynamic(game,world,0).pins.find(p=>p.boulder),rock1=extra.dynamic(game,world,.2).pins.find(p=>p.machineKey===rock0.machineKey);assert.ok(rock1.y>rock0.y&&rock1.vy>0,'falling stone moves down');
assert.equal(extra.onContact(wall,ball,game,-10),false);assert.equal(wall.hp,hp);
for(let i=0;i<hp;i++){game.time+=.4;extra.onContact(wall,ball,game,-100);}assert.equal(wall.broken,true);assert.equal(wall.hp,0);
const bridge0=extra.dynamic(game,world,0).segments.find(s=>s.bridge),bridge1=extra.dynamic(game,world,1).segments.find(s=>s.bridge);assert.notEqual(bridge0.y1,bridge1.y1);
simulation.reset('ruins',2,0);assert.ok(simulation.state().game.static.segments.filter(s=>s.breakable).every(s=>!s.broken&&s.hp===s.maxHp),'rematch restores stone walls');
assert.ok(simulation.state().game.static.features.filter(f=>f.kind==='stoneGate').every(f=>f.openUntil===0),'rematch resets switches');
console.log('New maps: 38 belts / 11 reverse chutes, strong water and split channels, 29 varied stone walls, timed switches, falling stones, freeze, bridges, and 297 safe shortcut sizes passed');
`)(require,__dirname);
