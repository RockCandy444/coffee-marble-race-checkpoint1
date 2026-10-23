const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
const checks=`
const battle=sandbox.window.MarbleBattle;elements.get('#raceMode').value='battle';let passed=0;
for(const [index,ability] of battle.abilities.entries()) {
  seed=11+index*19;simulation.reset('spinner',2,index%4);const {game,world}=simulation.state();
  game.balls.forEach(ball=>battle.assign(game,ball,ability.id));let steps=0;
  while(game.order.length<2&&!game.paused&&steps++<360*120)simulation.step(1/120);
  console.log(JSON.stringify({power:ability.id,finished:game.order.length,seconds:+game.time.toFixed(2),paused:game.autoPaused}));
  assert.equal(game.order.length,2,'two '+ability.id+' marbles finish');
  assert.ok(game.balls.every(b=>[b.x,b.y,b.vx,b.vy,b.r].every(Number.isFinite)));
  assert.ok(game.order.every(b=>b.y>=world.finishY));passed++;
}
console.log(JSON.stringify({individualPowerRaces:passed,passed}));
`;
new Function('require','__dirname',harness+checks)(require,__dirname);
