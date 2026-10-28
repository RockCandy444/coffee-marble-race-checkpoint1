const fs=require('node:fs'),path=require('node:path');let h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];h=h.replace('step: physicsStep,','resolvePin, step: physicsStep,');
new Function('require','__dirname',h+`
const extra=sandbox.window.ExtraCourses,hidden=sandbox.window.HiddenCourses,battle=sandbox.window.MarbleBattle;
simulation.reset('observatory',2,0);const star={x:500,y:1000,r:40,star:true},notch=-Math.PI/2+Math.PI/5;
const empty={x:500+Math.cos(notch)*30,y:1000+Math.sin(notch)*30,r:2};assert.equal(course.pinContact(empty,star),null,'empty concave notch is not a circular collider');assert.ok(course.pinContact(empty,{...star,star:false}),'same point is inside the old circle');
const tip={x:500,y:956,r:5,vx:0,vy:100};simulation.resolvePin(tip,star);assert.ok(tip.y<=955.001);assert.ok(tip.vy<0,'tip contact reflects velocity');
const rotated={...star,starAngle:0},side={x:544,y:1000,r:5,vx:-100,vy:0};simulation.resolvePin(side,rotated);assert.ok(side.x>=544.999&&side.vx>0,'rotated visible tip has rotated collision');
const embedded={x:500,y:1000,r:5,vx:0,vy:0};for(let i=0;i<12;i++)simulation.resolvePin(embedded,star);const contact=course.pinContact(embedded,star);assert.ok(!contact||contact.depth<.001,'interior overlap escapes the solid star');assert.ok([embedded.x,embedded.y,embedded.vx,embedded.vy].every(Number.isFinite));
const drawn=[];course.pinPath({beginPath(){},moveTo(x,y){drawn.push([x,y]);},lineTo(x,y){drawn.push([x,y]);},closePath(){}},star);assert.equal(drawn.length,10);for(let i=0;i<10;i++){const v=course.starVertices(star)[i];assert.ok(Math.hypot(drawn[i][0]-star.x-v.x,drawn[i][1]-star.y-v.y)<1e-8);}
for(const map of ['observatory','rift']){simulation.reset(map,100,0);const {game}=simulation.state();const basic=game.static.pins.filter(p=>!p.kind&&!p.switchFor&&!p.island&&!p.pillar&&!p.boulder&&!p.moving);assert.ok(basic.length>100);assert.ok(basic.every(p=>p.star));assert.ok(game.static.pins.filter(p=>p.kind).every(p=>!p.star));}
for(const map of ['rapids','observatory','rift']){
 simulation.reset(map,100,0);const {game,world}=simulation.state();if(map==='rapids'){const centered=game.static.pins.filter(p=>p.upstreamCenter);assert.equal(centered.length,8);assert.ok(centered.every(p=>p.section===0&&Math.abs(p.x-(course.bounds(p.y,world).left+course.bounds(p.y,world).right)/2)<65));}
 for(const kind of ['current','whirlpool']){const f=game.static.features.find(f=>f.kind===kind);if(!f){assert.equal(map,'rift');assert.equal(kind,'current');continue;}const banks=course.bounds(f.y,world),center=kind==='current'?extra.channelAt(f,f.lanes[0],f.y,world).x:banks.left+(banks.right-banks.left)*f.fraction;
  const p={x:center,y:f.y+(kind==='whirlpool'?f.range*.36:0),r:5.3,vx:0,vy:0};const isolated={...game,time:f.pulsed?.8-f.offset:game.time,static:{...game.static,segments:[],features:[f]},collisionBuckets:new Map()};(map==='rapids'?extra:hidden).apply(p,isolated,world,.1);
  if(kind==='current')assert.ok(p.vy>=f.strength*.35*.1*1.79,'current has 1.8x force gain at center');else assert.ok(Math.abs(p.vx)>35,'vortex visibly changes lateral velocity');
  const edge={x:banks.left+5.31,y:f.y,r:5.3,vx:0,vy:0};(map==='rapids'?extra:hidden).apply(edge,isolated,world,.1);assert.ok(Math.abs(edge.vx)<=8.6,'wall fade keeps strong water from pinning marbles');
  const finish={x:500,y:world.finishY-100,r:5.3,vx:7,vy:30};(map==='rapids'?extra:hidden).apply(finish,isolated,world,.1);assert.equal(finish.vx,7);assert.equal(finish.vy,30,'finish safety remains dry');
 }
}
console.log('Stars: ten-vertex render/collision identity, real empty notches, rotated tip reflection, embedded release, both cosmic maps; river: eight upstream central pins, stronger real current/vortex vectors on all three maps, bank fade and dry finish passed');
`)(require,__dirname);
