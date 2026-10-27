const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',harness+`
const battle=sandbox.window.MarbleBattle,env={pins:[],segments:[]},newPowers=battle.abilities.slice(31);
assert.equal(battle.abilities.length,50);assert.equal(newPowers.length,19);assert.equal(new Set(battle.abilities.map(a=>a.id)).size,50);
elements.get('#raceMode').value='battle';
function arena(id) {
  seed=11;simulation.reset('spinner',3,0);const {game,world}=simulation.state();game.static={pins:[],segments:[]};game.collisionBuckets=new Map();game.time=10;
  game.balls.forEach((b,i)=>{Object.assign(b,{x:450+i*40,y:1000+i*60,vx:0,vy:30,maxY:1000+i*60});battle.assign(game,b,i===0?id:'immune');b.battle.next=100;});
  return {game,world,a:game.balls[0],b:game.balls[1],c:game.balls[2]};
}
let {game,world,a,b,c}=arena('slipstream');assert.equal(battle.fire(game,a,'slipstream',env),true);battle.tick(game,.1,env);assert.ok(a.vy>35&&a.vx>0);
({game,a}=arena('slipstream'));game.balls=[a];assert.equal(battle.fire(game,a,'slipstream',env),false);
({game,a}=arena('sidestep'));let x=a.x,y=a.y;assert.equal(battle.fire(game,a,'sidestep',env),true);assert.notEqual(a.x,x);assert.equal(a.y,y);assert.equal(a.prevX,a.x);assert.equal(a.prevY,a.y);
({game,a}=arena('sidestep'));game.static.segments=[{x1:20,y1:a.y,x2:980,y2:a.y,radius:8}];assert.equal(battle.fire(game,a,'sidestep',env),false);
({game,a}=arena('spring'));battle.fire(game,a,'spring',env);a.vy=-100;battle.obstacleHit(game,a,{vx:0,vy:140});assert.ok(a.vx>0&&a.vy>=80);const springVx=a.vx;battle.obstacleHit(game,a,{vx:0,vy:140});assert.equal(a.vx,springVx,'spring fires once per armed interval');
({game,a}=arena('glide'));assert.equal(battle.fire(game,a,'glide',env),false);a.vx=170;battle.fire(game,a,'glide',env);battle.tick(game,.1,env);assert.ok(a.vx<150&&a.vy>40);
({game,world,a}=arena('recenter'));assert.equal(battle.fire(game,a,'recenter',env),false);a.x=course.bounds(a.y,world).left+35;battle.fire(game,a,'recenter',env);battle.tick(game,.1,env);assert.ok(a.vx>0);
({game,a}=arena('momentum'));battle.tick(game,.01,env);assert.equal(a.gravityScale,1);game.time+=5;battle.tick(game,.01,env);assert.ok(a.gravityScale>1);battle.obstacleHit(game,a,{vx:0,vy:30});battle.tick(game,.01,env);assert.equal(a.gravityScale,1);
({game,a,b}=arena('dodge'));assert.equal(battle.hit(game,b,a,150,-100,1),false);assert.equal(a.vx,0);assert.equal(battle.skipPair(a,b,game),true);game.time+=1.1;assert.equal(battle.hit(game,b,a,100,0),true);assert.equal(battle.skipPair(a,b,game),false);
({game,a,b}=arena('counterboost'));assert.equal(battle.hit(game,b,a,100,-20,1),true);assert.ok(a.vy>100);assert.equal(a.battle.slowUntil,0);game.time+=3;assert.equal(battle.hit(game,b,a,0,0,1),true);assert.ok(a.battle.slowUntil>game.time,'reaction has a cooldown');
({game,a,b}=arena('armor'));battle.fire(game,a,'armor',env);battle.tick(game,.01,env);assert.equal(a.mass,3);battle.hit(game,b,a,100,-100);assert.ok(Math.abs(a.vx-35)<.001);game.time+=3;battle.tick(game,.01,env);assert.equal(a.mass,1);
({game,a,b}=arena('stabilizer'));battle.fire(game,a,'stabilizer',env);battle.hit(game,b,a,100,-100,1);assert.equal(a.vy,30);assert.ok(a.battle.slowUntil-game.time<=.300001);
({game,a}=arena('insulate'));battle.fire(game,a,'insulate',env);assert.equal(battle.insulates(a,game),true);assert.equal(battle.skipObstacle(a,{kick:190},game),false,'insulation still collides');game.time+=2;assert.equal(battle.insulates(a,game),false);
({game,a,b}=arena('seeker'));battle.fire(game,a,'seeker',env);assert.equal(game.battle.projectiles.length,1);assert.equal(b.vx,0,'projectile needs travel time');for(let i=0;i<60&&b.battle.controlGrace<=game.time;i++){game.time+=1/120;battle.tick(game,1/120,env);}assert.ok(b.battle.controlGrace>game.time);assert.equal(game.battle.projectiles[0]?.until||0,0);
({game,a,b}=arena('oil'));battle.fire(game,a,'oil',env);const trap=game.battle.traps[0];b.x=trap.x;b.y=trap.y;battle.tick(game,.01,env);assert.ok(b.battle.slipUntil>game.time);assert.equal(b.battle.slowUntil,game.time);assert.ok(Math.abs(b.vx)>0);
({game,a,b}=arena('seal'));battle.assign(game,b,'warp');b.battle.next=100;assert.equal(battle.fire(game,a,'seal',env),true);assert.equal(battle.fire(game,b,'warp',env),false);game.time+=1.1;assert.equal(battle.fire(game,b,'warp',env),true);
({game,a,b}=arena('delay'));battle.assign(game,b,'rocket');b.battle.next=20;assert.equal(battle.fire(game,a,'delay',env),true);assert.equal(b.battle.next,21);game.time+=3;battle.fire(game,a,'delay',env);assert.equal(b.battle.next,22);game.time+=3;assert.equal(battle.fire(game,a,'delay',env),false);assert.equal(b.battle.next,22,'delay is capped per charge');
({game,a,b,c}=arena('gust'));assert.equal(battle.fire(game,a,'gust',env),true);assert.ok(b.vx>0&&c.vx>0);
({game,a}=arena('checkpoint'));a.y=game.battle.sections[1][0]+5;battle.tick(game,.01,env);assert.ok(a.vy>100);const checkpointUses=game.battle.activations.checkpoint;battle.tick(game,.01,env);assert.equal(game.battle.activations.checkpoint,checkpointUses);a.y-=20;battle.tick(game,.01,env);a.y+=20;battle.tick(game,.01,env);assert.equal(game.battle.activations.checkpoint,checkpointUses,'revisiting a chapter cannot farm boosts');
({game,a,b,c}=arena('overtake'));battle.tick(game,.01,env);a.y=b.y+5;battle.tick(game,.01,env);assert.ok(a.vy>100);const uses=game.battle.activations.overtake;a.y=c.y+5;battle.tick(game,.01,env);assert.equal(game.battle.activations.overtake,uses);
({game,a,b,c}=arena('overtake'));battle.tick(game,.01,env);c.finished=true;battle.tick(game,.01,env);assert.equal(game.battle.activations.overtake,undefined,'a finisher leaving ranking is not an overtake');
({game,world,a}=arena('laststand'));a.y=world.finishY-700;battle.tick(game,.1,env);assert.ok(a.vy>30);assert.equal(game.battle.activations.laststand,1);game.time+=3;battle.tick(game,.1,env);assert.equal(game.battle.activations.laststand,1);a.y=world.finishY-100;battle.tick(game,.1,env);assert.equal(a.battle.activeUntil,0);
// New hostile states respect shield, reflection, cleanse and finish protection.
for(const id of ['seal','delay']) {({game,a,b}=arena(id));battle.assign(game,b,'shield');b.battle.shield=1;assert.equal(battle.hit(game,a,b,0,0,0,false,id==='seal'?{seal:1}:{delay:1}),false);assert.equal(b.battle.sealedUntil,0);assert.equal(b.battle.delayAdded,0);}
({game,a,b}=arena('oil'));battle.assign(game,b,'cleanse');battle.hit(game,a,b,0,0,0,false,{slip:1,seal:1});battle.fire(game,b,'cleanse',env);assert.equal(b.battle.slipUntil,0);assert.equal(b.battle.sealedUntil,0);
for(const power of newPowers) {({game,world,a}=arena(power.id));a.y=world.finishY-100;assert.equal(battle.fire(game,a,power.id,env),false);battle.tick(game,.01,env);assert.equal(battle.skipObstacle(a,{},game),false);assert.equal(battle.insulates(a,game),false);}
// All 50 golden choices activate only one marble; reroll/mimic do not leave new state behind.
for(const power of battle.abilities) {elements.get('#raceMode').value='normal';golden.choose=balls=>({ballId:balls[0].id,abilityId:power.id});simulation.reset('spinner',2,0);const g=simulation.state().game;assert.equal(g.balls.filter(b=>b.battle.id!==null).length,1);assert.equal(g.balls[0].battle.id,power.id);}
elements.get('#raceMode').value='battle';({game,a,b}=arena('mimic'));battle.assign(game,b,'armor');battle.fire(game,a,'mimic',env);battle.tick(game,.01,env);assert.equal(a.mass,3);game.time+=2.3;battle.tick(game,.01,env);assert.equal(a.mass,1);
for(const id of ['seal','delay']){({game,a,b}=arena(id));game.mode='normal';battle.assign(game,b,null);b.vx=100;assert.equal(battle.fire(game,a,id,env),true);battle.tick(game,.1,env);if(id==='seal')assert.ok(b.vx<80);else assert.ok(b.battle.slowUntil>game.time);}
({game,a}=arena('reroll'));a.battle.slipUntil=99;a.battle.sealedUntil=99;a.battle.springReady=true;a.y=game.battle.sections[1][0]+1;battle.tick(game,.01,env,()=>.95);assert.equal(a.battle.slipUntil,0);assert.equal(a.battle.sealedUntil,0);assert.equal(a.battle.springReady,false);
console.log('19 added powers: distinct triggers, expiry, safe sidestep, bounded attacks, shield/cleanse, delayed projectile, capped cooldown delay, no false overtakes, 50 golden choices and finish protection passed');
`)(require,__dirname);
