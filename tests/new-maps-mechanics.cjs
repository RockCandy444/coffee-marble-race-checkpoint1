const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',harness+`
const extra=sandbox.window.ExtraCourses,battle=sandbox.window.MarbleBattle;
for(const map of ['factory','rapids','ruins']){
  simulation.reset(map,2,0);const {game,world,maps}=simulation.state();assert.equal(maps[map].sections.length,6);assert.ok(world.sideProfile.every(b=>b.right-b.left>400));
  for(let count=2;count<=100;count++){const ball={r:Math.max(5.2,Math.min(11.2,12.5-.72*Math.sqrt(count)))};assert.ok(golden.shortcutStart(ball,world,maps[map].sections,{pins:game.static.pins.concat(simulation.dynamics().pins),segments:game.static.segments.concat(simulation.dynamics().segments)}));}
}
elements.get('#raceMode').value='battle';
for(const map of ['factory','rapids','ruins']){simulation.reset(map,100,0);const {game}=simulation.state();game.balls.forEach(b=>{Object.assign(b,{x:500,y:55});battle.assign(game,b,'shortcut');});const env=simulation.dynamics();battle.placeShortcuts(game,env);assert.ok(game.balls.every(b=>!b.battle.startPending&&battle.clearAt(b,b.x,b.y,game,env)),'100 distinct shortcut starts on '+map);}

elements.get('#raceMode').value='normal';simulation.reset('factory',2,0);let {game,world}=simulation.state(),ball=game.balls[0];
const belts=game.static.segments.filter(s=>s.conveyor);assert.equal(belts.length,18);assert.equal(belts.filter(s=>s.reverse).length,8);assert.ok(belts.filter(s=>s.reverse).every(s=>s.section===2));
for(const s of belts){Object.assign(ball,{x:s.x1,y:s.y1,vx:0,vy:0});extra.belt(s,ball,game);assert.equal(Math.sign(ball.vx),s.direction);if(s.reverse)assert.ok(Math.abs(ball.vx)>=95&&ball.vy>=60);}
assert.equal(game.static.features.filter(f=>f.kind==='press').length,5);
const press=extra.dynamic(game,world,0).segments.find(s=>s.press),press1=extra.dynamic(game,world,1).segments.find(s=>s.machineKey===press.machineKey);assert.notEqual(press.x2,press1.x2);assert.equal(press.radius,11);
elements.get('#raceMode').value='battle';simulation.reset('factory',2,0);({game,world}=simulation.state());const env=extra.dynamic(game,world,0),target=env.segments.find(s=>s.press);ball=game.balls[0];Object.assign(ball,{x:(target.x1+target.x2)/2,y:target.y1-50});battle.assign(game,ball,'freeze');assert.equal(battle.fire(game,ball,'freeze',env),true);assert.equal(battle.frozen(game,target.machineKey),true);const held0=extra.dynamic(game,world,0).segments.find(s=>s.machineKey===target.machineKey),held1=extra.dynamic(game,world,.5).segments.find(s=>s.machineKey===target.machineKey);assert.equal(held0.x2,held1.x2);

elements.get('#raceMode').value='normal';simulation.reset('rapids',2,0);({game,world}=simulation.state());
const current=game.static.features.find(f=>f.kind==='current'),lane=extra.channelAt(current,current.lanes[0],current.y,world),a={x:lane.x+lane.halfWidth*.25,y:current.y,r:11.2,vx:0,vy:0},b={...a,immuneFields:true};extra.apply(a,game,world,.1);extra.apply(b,game,world,.1);assert.equal(a.vx,b.vx);assert.equal(a.vy,b.vy);assert.ok(Math.hypot(a.vx,a.vy)>5);
assert.equal(game.static.features.filter(f=>f.kind==='current').length,13);assert.equal(game.static.features.filter(f=>f.kind==='whirlpool').length,5);assert.ok(game.static.features.filter(f=>f.kind==='whirlpool').every(f=>f.section===2));
assert.ok(!game.static.features.some(f=>f.section===5&&['current','whirlpool'].includes(f.kind)),'last canyon stays free of water forces');

simulation.reset('ruins',2,0);({game,world}=simulation.state());ball=game.balls[0];const walls=game.static.segments.filter(s=>s.breakable);assert.equal(walls.length,14);assert.ok(new Set(walls.map(s=>s.maxHp)).size>=5);const wall=walls[0],hp=wall.hp;assert.equal(extra.onContact(wall,ball,game,-10),false);assert.equal(wall.hp,hp);for(let i=0;i<hp;i++){game.time+=.4;extra.onContact(wall,ball,game,-100);}assert.equal(wall.broken,true);
const plate=game.static.pins.find(p=>p.switchFor),gate=game.static.features.find(f=>f.key===plate.switchFor),closed=extra.dynamic(game,world,0).segments.find(s=>s.machineKey===gate.key);extra.onPinContact(plate,ball,game);const opened=extra.dynamic(game,world,0).segments.find(s=>s.machineKey===gate.key);assert.ok(opened.x2<closed.x2-40);game.time+=3.1;assert.ok(extra.dynamic(game,world,0).segments.find(s=>s.machineKey===gate.key).x2>opened.x2);
const bridge0=extra.dynamic(game,world,0).segments.find(s=>s.bridge),bridge1=extra.dynamic(game,world,1).segments.find(s=>s.machineKey===bridge0.machineKey);assert.notEqual(bridge0.y1,bridge1.y1);
const rock0=extra.dynamic(game,world,0).pins.find(p=>p.boulder),rock1=extra.dynamic(game,world,.2).pins.find(p=>p.machineKey===rock0.machineKey);assert.ok(rock1.y>rock0.y&&rock1.vy>0);
simulation.reset('ruins',2,0);assert.ok(simulation.state().game.static.segments.filter(s=>s.breakable).every(s=>!s.broken&&s.hp===s.maxHp));assert.ok(simulation.state().game.static.features.filter(f=>f.kind==='stoneGate').every(f=>f.openUntil===0));
console.log('Distinct-section mechanics: reverse belts, moving press/freeze, separate river roles, wall break/reset, switch gates, bridges, falling stones and 297 safe shortcut sizes passed');
`)(require,__dirname);