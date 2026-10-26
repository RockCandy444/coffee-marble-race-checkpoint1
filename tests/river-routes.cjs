const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',harness+`
const extra=sandbox.window.ExtraCourses;
simulation.reset('rapids',2,0);let {game,world}=simulation.state();
const f=game.static.features.find(f=>f.kind==='current'&&f.pulsed),isolated={...game,static:{...game.static,features:[f]}};
const channel=extra.channelAt(f,f.lanes[0],f.y,world),on=f.onTime/2-f.offset,off=f.onTime+.5-f.offset;
assert.equal(extra.flowPulse(f,on),1);assert.equal(extra.flowPulse(f,off),0);
const flow=(x,time,y=f.y)=>{const ball={x,y,r:11.2,vx:0,vy:0};isolated.time=time;extra.apply(ball,isolated,world,.1);return ball;};
assert.ok(flow(channel.x,on).vy>5);assert.equal(flow(channel.x,off).vx,0);assert.equal(flow(channel.x,off).vy,0);
const bounds=course.bounds(f.y,world),left=flow(bounds.left+12,on),right=flow(bounds.right-12,on);assert.ok(left.vx>0&&right.vx<0,'bank eddies turn inward');assert.ok(left.vy<flow(channel.x,on).vy*.1,'strong current fades at the bank');
const calm=game.static.features.filter(f=>f.kind==='calm');assert.equal(calm.length,5);
for(const c of calm)for(const fraction of [.1,.3,.5,.7,.9]){const b=course.bounds(c.y,world),ball={x:b.left+(b.right-b.left)*fraction,y:c.y,r:11.2,vx:4,vy:30};extra.apply(ball,game,world,.1);assert.equal(ball.vx,4);assert.equal(ball.vy,30);}
const islands=game.static.pins.filter(p=>p.island);assert.equal(islands.length,7);assert.ok(new Set(islands.map(p=>Math.round(p.x/50))).size>=4,'islands are asymmetric');

seed=31;simulation.reset('rapids',100,0);({game,world}=simulation.state());const {maps}=simulation.state();
const checkpoints=maps.rapids.sections.slice(0,5).map(([start],i)=>({y:start+(maps.rapids.sections[i+1][0]-start)*.42,seen:new Set(),bins:[0,0,0,0,0]}));
let steps=0,samples=0,edges=0,center=0;
while(game.order.length<100&&!game.paused&&steps++<360*120){simulation.step(1/120);
  for(const ball of game.balls){if(ball.finished)continue;const b=course.bounds(ball.y,world),fraction=(ball.x-b.left)/(b.right-b.left);
    for(const c of checkpoints)if(!c.seen.has(ball.id)&&ball.prevY<c.y&&ball.y>=c.y){c.seen.add(ball.id);c.bins[Math.max(0,Math.min(4,Math.floor(fraction*5)))]++;}
    if(steps%12===0&&ball.y>540&&ball.y<extra.waterEnd(world)){samples++;if(fraction<.15||fraction>.85)edges++;if(fraction>.35&&fraction<.65)center++;}
  }
}
assert.equal(game.order.length,100);const edgeFraction=edges/samples,centerFraction=center/samples;
assert.ok(edgeFraction<.4811140209508461*.8,'edge occupancy falls at least 20% relative to measured V21 seed 31');
for(const c of checkpoints){assert.equal(c.seen.size,100);assert.ok(c.bins.filter(n=>n>=5).length>=3,'at least three river routes remain populated');assert.ok(Math.max(...c.bins)<70,'one route does not dominate');}
console.log(JSON.stringify({version:22,seed:31,marbles:100,finished:game.order.length,seconds:+game.time.toFixed(2),samples,edgeFraction,centerFraction,checkpointBins:checkpoints.map(c=>c.bins),calmZones:calm.length,islands:islands.length}));
`)(require,__dirname);
