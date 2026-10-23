const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
const checks=`
const battle=sandbox.window.MarbleBattle;
elements.get('#raceMode').value='battle';
assert.equal(battle.abilities.length,31);assert.equal(new Set(battle.abilities.map(a=>a.id)).size,31);
let total=0;
for(const map of ['pinball','spinner','fork']) for(const count of [2,100]) {
  seed=11+total*19;simulation.reset(map,count,total%4);const {game,world}=simulation.state();
  assert.equal(game.golden,null);assert.equal(game.goldenEnabled,false);
  assert.ok(game.balls.every(b=>b.battle&&battle.byId.has(b.battle.id)&&!b.golden));
  if(count===100) {game.balls.forEach((b,i)=>battle.assign(game,b,battle.abilities[i%31].id));battle.placeShortcuts(game,simulation.dynamics());}
  let steps=0,escapes=0;
  while(game.order.length<count&&!game.paused&&steps++<360*120) {
    simulation.step(1/120);
    for(const ball of game.balls)if(!ball.finished) {
      assert.ok([ball.x,ball.y,ball.vx,ball.vy,ball.r].every(Number.isFinite),'finite battle state');
      const bounds=course.bounds(ball.y,world);
      if(ball.x-ball.r<bounds.left-.1||ball.x+ball.r>bounds.right+.1)escapes++;
    }
  }
  console.log(JSON.stringify({battle:true,map,count,finished:game.order.length,seconds:+game.time.toFixed(2),paused:game.autoPaused,escapes,abilities:Object.keys(game.battle.activations).length,remaining:game.balls.filter(b=>!b.finished).map(b=>({id:b.id,ability:b.battle.id,x:+b.x.toFixed(1),y:+b.y.toFixed(1)}))}));
  assert.equal(game.order.length,count,'battle must finish: '+map+' '+count);assert.equal(escapes,0,'no wall escapes');
  assert.equal(new Set(game.order.map(b=>b.id)).size,count);total++;
}
elements.get('#raceMode').value='normal';golden.choose=()=>null;simulation.reset('pinball',2,0);
assert.equal(simulation.state().game.battle,undefined);assert.ok(simulation.state().game.balls.every(b=>!b.battle&&!b.baseR));
console.log(JSON.stringify({battleRacesPassed:total,abilities:31,normalReset:'clean'}));
`;
new Function('require','__dirname',harness+checks)(require,__dirname);
