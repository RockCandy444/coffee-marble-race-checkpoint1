const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',harness+`
const battle=sandbox.window.MarbleBattle,maps=['pinball','spinner','fork','factory','rapids','ruins'];let passed=0;
const cases=battle.abilities.slice(31).map((a,i)=>({map:maps[i%6],count:2,power:a.id}));
maps.forEach((map,i)=>{cases.push({map,count:100,power:battle.abilities[31+i].id},{map,count:100,power:null});});
for(const [index,scenario] of cases.entries()){
  const {map,count,power}=scenario;seed=901+index*19;elements.get('#raceMode').value='normal';
  golden.choose=balls=>power?{ballId:balls.at(-1).id,abilityId:power}:null;
  simulation.reset(map,count,index%4);const {game,world}=simulation.state();
  assert.equal(game.balls.filter(b=>b.battle?.id).length,power?1:0);
  let steps=0,escapes=0;
  while(game.order.length<count&&!game.paused&&steps++<360*120){simulation.step(1/120);for(const ball of game.balls)if(!ball.finished){assert.ok([ball.x,ball.y,ball.vx,ball.vy,ball.r].every(Number.isFinite));const b=course.bounds(ball.y,world);if(ball.x-ball.r<b.left-.1||ball.x+ball.r>b.right+.1)escapes++;}}
  console.log(JSON.stringify({mode:power?'golden':'normal',map,count,power,finished:game.order.length,seconds:+game.time.toFixed(2),escapes,remaining:game.balls.filter(b=>!b.finished).map(b=>({id:b.id,x:+b.x.toFixed(1),y:+b.y.toFixed(1),ability:b.battle?.id}))}));
  assert.equal(game.order.length,count,'expanded race finishes '+JSON.stringify(scenario));assert.equal(escapes,0);assert.equal(new Set(game.order.map(b=>b.id)).size,count);passed++;
}
console.log(JSON.stringify({expandedRacesPassed:passed,newGoldenPowers:19,largeGoldenMaps:6,ordinaryMaps:6}));
`)(require,__dirname);
