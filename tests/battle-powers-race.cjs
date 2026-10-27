const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
const checks=`
const battle=sandbox.window.MarbleBattle;elements.get('#raceMode').value='battle';let passed=0;
for(const [index,ability] of battle.abilities.entries()) {
  seed=11+index*19;simulation.reset('spinner',2,index%4);const {game,world}=simulation.state();
  game.balls.forEach(ball=>battle.assign(game,ball,ability.id));battle.placeShortcuts(game,simulation.dynamics());let steps=0,escapes=0;
  while(game.order.length<2&&!game.paused&&steps++<360*120){simulation.step(1/120);for(const ball of game.balls)if(!ball.finished){const b=course.bounds(ball.y,world);if(ball.x-ball.r<b.left-.1||ball.x+ball.r>b.right+.1)escapes++;}}
  console.log(JSON.stringify({power:ability.id,finished:game.order.length,seconds:+game.time.toFixed(2),paused:game.autoPaused,escapes}));
  assert.equal(game.order.length,2,'two '+ability.id+' marbles finish');
  assert.ok(game.balls.every(b=>[b.x,b.y,b.vx,b.vy,b.r].every(Number.isFinite)));
  assert.ok(game.order.every(b=>b.y>=world.finishY));passed++;
  assert.equal(escapes,0,'single ability stays inside course walls');
}
console.log(JSON.stringify({individualPowerRaces:passed,passed}));
`;
new Function('require','__dirname',harness+checks)(require,__dirname);
