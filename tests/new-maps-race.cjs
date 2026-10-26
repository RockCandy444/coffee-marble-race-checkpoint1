const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',harness+`
const battle=sandbox.window.MarbleBattle,extra=sandbox.window.ExtraCourses;
const modes=(process.env.MARBLE_MAP_MODES||'normal,battle,golden').split(',');let total=0;
const mapNames=(process.env.MARBLE_MAP_NAMES||'factory,rapids,ruins').split(',');
for(const mode of modes)for(const map of mapNames)for(const count of [2,100]) {
  const cases=mode==='normal'?[0,1,2,3]:mode==='golden'?['shortcut','reverse']:[0];
  for(const scenario of cases) {
    seed=31+total*17;elements.get('#raceMode').value=mode==='battle'?'battle':'normal';
    golden.choose=mode==='golden'?balls=>({ballId:balls[0].id,abilityId:scenario}):()=>null;
    simulation.reset(map,count,typeof scenario==='number'?scenario:total%4);
    const {game,world,maps}=simulation.state();
    for(const ball of game.balls){const b=course.bounds(ball.y,world);assert.ok(ball.x-ball.r>b.left&&ball.x+ball.r<b.right,'countdown starts inside walls');}
    assert.equal(maps[map].sections.length,6);assert.ok(game.static.pins.length>180);
    if(mode==='battle'&&count===100){game.balls.forEach((b,i)=>battle.assign(game,b,battle.abilities[i%31].id));battle.placeShortcuts(game,simulation.dynamics());}
    let steps=0,escapes=0;
    while(game.order.length<count&&!game.paused&&steps++<360*120) {
      simulation.step(1/120);
      for(const ball of game.balls)if(!ball.finished){assert.ok([ball.x,ball.y,ball.vx,ball.vy].every(Number.isFinite));const b=course.bounds(ball.y,world);if(ball.x-ball.r<b.left-.1||ball.x+ball.r>b.right+.1)escapes++;}
    }
    console.log(JSON.stringify({mode,map,count,scenario,finished:game.order.length,seconds:+game.time.toFixed(2),escapes,broken:game.static.segments.filter(s=>s.broken).length,remaining:game.balls.filter(b=>!b.finished).sort((a,b)=>b.rescueCount-a.rescueCount).slice(0,6).map(b=>({id:b.id,x:+b.x.toFixed(1),y:+b.y.toFixed(1),rescues:b.rescueCount,ability:b.battle?.id}))}));
    assert.equal(game.order.length,count,'new map must finish: '+[mode,map,count,scenario].join(' '));assert.equal(escapes,0);assert.equal(new Set(game.order.map(b=>b.id)).size,count);total++;
  }
}
console.log(JSON.stringify({newMapRacesPassed:total,modes}));
`)(require,__dirname);
