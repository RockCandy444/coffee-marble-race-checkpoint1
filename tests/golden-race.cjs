const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
const checks=`
// Heavy marbles transfer less of their velocity and overlap correction to themselves.
const normalA={x:500,y:500,r:10,vx:100,vy:0}, normalB={x:519,y:500,r:10,vx:0,vy:0};
simulation.collide(normalA,normalB);
const heavyA={x:500,y:500,r:10,vx:100,vy:0,mass:2}, heavyB={x:519,y:500,r:10,vx:0,vy:0};
simulation.collide(heavyA,heavyB);
assert.ok(heavyA.vx>normalA.vx && heavyA.x>normalA.x);
// Safe second-section starts for every supported marble size on all maps.
for(const map of ['pinball','spinner','fork']) {
  golden.choose=()=>null; simulation.reset(map,2,0);
  const {game,world,maps}=simulation.state(),dynamic=simulation.dynamics();
  for(let n=2;n<=100;n++) {
    const ball={r:Math.max(5.2,Math.min(11.2,12.5-.72*Math.sqrt(n)))};
    const spot=golden.shortcutStart(ball,world,maps[map].sections,{pins:game.static.pins.concat(dynamic.pins),segments:game.static.segments.concat(dynamic.segments)});
    assert.ok(spot,map+' clear shortcut start for count '+n);
    assert.ok(spot.y>maps[map].sections[1][0] && spot.y<=maps[map].sections[1][0]+230);
  }
}
// Compare free-fall acceleration, preserving ordinary gravity for immune marbles.
const velocities=[];
for(const abilityId of [null,'heavy','immune']) {
  golden.choose=balls=>abilityId?{ballId:balls[0].id,abilityId}:null; seed=11; simulation.reset('pinball',2,0);
  const {game}=simulation.state(),ball=game.balls[0];
  game.balls=[ball];game.static={pins:[],segments:[]};game.collisionBuckets=new Map();
  Object.assign(ball,{x:500,y:1000,vx:0,vy:0,maxY:1000});simulation.step(.1);velocities.push(ball.vy);
}
assert.ok(velocities[1]>velocities[0]*1.2);assert.equal(velocities[2],velocities[0]);
let total=0;
for(const map of ['pinball','spinner','fork']) for(const count of [2,100]) for(const [index,ability] of golden.abilities.entries()) {
  seed=11+index*19;
  golden.choose=balls=>({ballId:balls.at(-1).id,abilityId:ability.id});
  simulation.reset(map,count,index);
  const {game,world,maps}=simulation.state(),ball=game.golden?.ball;
  assert.ok(ball && ball.id===count && ball.ability===ability.id);
  assert.equal(game.balls.filter(b=>b.golden).length,1);assert.equal(game.introRemaining,2.8);
  assert.equal(elements.get('#goldenReveal').hidden,false);assert.equal(elements.get('#goldenBadge').hidden,false);
  assert.ok(ball.label.includes(ball.originalLabel));assert.equal(ball.r,game.balls[0].r);
  assert.equal(ball.pattern,sandbox.window.MarbleRoster.entries(Array.from({length:count},(_,i)=>'P'+(i+1))).at(-1).pattern);
  if(ability.id==='shortcut') assert.ok(ball.y>maps[map].sections[1][0]);
  if(ability.id==='heavy') assert.equal(ball.mass,2);
  if(ability.id==='immune') assert.equal(ball.immuneFields,true);
  let steps=0;
  while(game.order.length<count && !game.paused && steps++<360*120) simulation.step(1/120);
  console.log(JSON.stringify({map,count,ability:ability.id,finished:game.order.length,seconds:+game.time.toFixed(2),paused:game.autoPaused}));
  assert.equal(game.order.length,count,'all marbles must finish with '+map+' '+ability.id+' '+count);
  assert.equal(new Set(game.order.map(b=>b.id)).size,count);
  assert.ok(game.balls.every(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite)));
  assert.ok(elements.get('#goldenResult').textContent.includes(ability.name));
  total++;
}
golden.choose=()=>null;simulation.reset('pinball',2,0);
assert.equal(simulation.state().game.golden,null);assert.equal(simulation.state().game.introRemaining,0);
assert.equal(elements.get('#goldenBadge').hidden,true);assert.equal(elements.get('#goldenReveal').hidden,true);
assert.ok(simulation.state().game.balls.every(b=>!b.golden && !b.immuneFields && !b.mass));
console.log(JSON.stringify({goldenRacesPassed:total,shortcutSizesChecked:297,reset:'clean'}));
`;
new Function('require','__dirname',harness+checks)(require,__dirname);
