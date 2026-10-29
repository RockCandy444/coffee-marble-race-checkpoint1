const fs=require('node:fs'),path=require('node:path');
const h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',h+`
assert.equal(course.keepers.length,5);
const distribution=Array(5).fill(0);for(let i=0;i<10000;i++)distribution[course.keepers.indexOf(course.chooseKeeper(()=>(i+.5)/10000))]++;
assert.deepEqual(distribution,[2000,2000,2000,2000,2000]);
const hidden=sandbox.window.HiddenCourses;
function painter(){const calls=[],state={};const ctx=new Proxy(state,{get(t,k){if(k==='createRadialGradient')return()=>({addColorStop(){}});return(...args)=>calls.push({op:k,args,width:t.lineWidth});},set(t,k,v){t[k]=v;return true;}});return{ctx,calls};}
simulation.reset('pinball',2,3);let{game,world}=simulation.state();
for(let i=0;i<50;i++){const s=course.goalkeeper(course.keepers[3],i*.17,22.4,world)[0],p=painter();assert.equal(s.x1,s.x2);assert.equal(s.y1,s.y2);course.drawKeeper(p.ctx,s,i*.17,world);const arcs=p.calls.filter(c=>c.op==='arc');assert.equal(arcs.length,1);assert.equal(arcs[0].args[2],s.radius);assert.equal(s.radius,22.4*.43);}
const expectedRadius=22.4*.52;
for(const t of [0,.4,1,2])assert.equal(course.goalkeeper(course.keepers[4],t,22.4,world)[0].radius,expectedRadius);
simulation.reset('rift',2,0);({game,world}=simulation.state());
let foundPendulum=0,foundBumper=0;
for(let i=0;i<5;i++){game.keeper=course.keepers[i];const segments=hidden.goalkeepers(game,1.1,22.4,world),ids=segments.filter(s=>s.kind==='power').map(s=>s.id);assert.equal(new Set(ids).size,ids.length);
for(const s of segments.filter(s=>s.circle)){const p=painter();hidden.drawSegment(p.ctx,s,1.1,world,1.2);assert.ok(p.calls.findIndex(c=>c.op==='clip')<p.calls.findIndex(c=>c.op==='arc'));const body=p.calls.filter(c=>c.op==='arc').at(-1);assert.deepEqual(body.args.slice(0,3),[s.x1,s.y1,s.radius]);if(s.kind==='power')foundBumper++;else{foundPendulum++;assert.equal(s.anchorX,world.exitGates[s.lane].center);assert.equal(p.calls.filter(c=>c.op==='lineTo').length,1,'only the thin rope is a line');}}
}assert.ok(foundPendulum&&foundBumper);
// Production circle collision must keep the bumper impulse, stable hit ID and flash.
simulation.reset('pinball',2,4);({game,world}=simulation.state());const ball=game.balls[0],s=course.goalkeeper(course.keepers[4],0,ball.r*2,world)[0];game.balls=[ball];game.winningRank=1;
Object.assign(ball,{x:s.x1,y:s.y1-s.radius-ball.r+.6,vx:0,vy:80,maxY:s.y1});simulation.step(1/120);
assert.ok(ball.vy< -180,'mini keeper adds a real upward bumper impulse');assert.ok(ball.bumperHits['keeper-bumper']>0);assert.ok(game.keeperFlashes['keeper-bumper']>game.time);
const velocity=ball.vy;course.kick(ball,{id:'keeper-bumper',kick:210},0,-1,game.time+.01);assert.equal(ball.vy,velocity,'fresh dynamic objects share a cooldown');
console.log(JSON.stringify({keeperTypes:5,equalDistribution:distribution,constantPendulumDraws:50,riftPendulums:foundPendulum,riftBumpers:foundBumper,bumperImpulse:true,flash:true}));
`)(require,__dirname);
