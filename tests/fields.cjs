const fs = require('node:fs'), path = require('node:path');
const harness = fs.readFileSync(path.join(__dirname, 'physics-smoke.cjs'), 'utf8').split('// Manual camera movement')[0];
const checks = `
const magnet = {x:600,y:700,r:17,range:120,strength:175,kind:'magnet',id:'isolated-magnet'};
const wind = {...magnet,strength:270,kind:'wind',direction:1};
function impulse(source, distance, flags={}) {
  const ball = {x:source.x-distance,y:source.y,r:10,vx:0,vy:0,...flags};
  course.field(ball,source,.1); return ball;
}
for (const [source,previous] of [[magnet,150],[wind,230]]) {
  const current=impulse(source,60).vx, before=impulse({...source,strength:previous},60).vx;
  assert.ok(current/before>1.15 && current/before<1.2,'moderate mid-range increase');
  assert.equal(impulse(source,120).vx,0,'no extension of the field range');
  assert.equal(impulse(source,60,{immuneFields:true}).vx,0,'golden immunity unchanged');
}
assert.equal(impulse(magnet,27).vx,0,'contact does not attract into the magnet surface');
assert.ok(impulse(magnet,28).vx<impulse(magnet,45).vx*.1,'attraction fades near contact');
assert.equal(impulse(magnet,45,{magnetGrace:1}).vx,0,'rescue grace still blocks reattachment');
for(const map of ['pinball','spinner','fork']) {
  simulation.reset(map,2,0);
  for(const pin of simulation.state().game.static.pins.filter(p=>p.kind==='magnet'||p.kind==='wind')) {
    assert.equal(pin.strength,pin.kind==='magnet'?175:270); assert.equal(pin.range,120);
  }
}
// Start at rest beside an isolated physical magnet, at both supported extreme sizes.
// The real collision and gravity code must carry each marble out of its field.
for(const count of [2,100]) for(const side of [-1,1]) {
  seed=11;simulation.reset('pinball',count,0);
  const {game}=simulation.state(), ball=game.balls[0];
  game.balls=[ball];game.static={pins:[{...magnet}],segments:[]};game.collisionBuckets=course.buckets(game.static);
  Object.assign(ball,{x:magnet.x+side*(magnet.r+ball.r+.1),y:magnet.y,vx:0,vy:0,maxY:magnet.y});
  for(let i=0;i<360;i++) simulation.step(1/120);
  assert.ok(ball.y>magnet.y+magnet.range,'marble escapes magnet flank: '+count+' '+side);
  assert.equal(ball.rescueCount,0,'escape does not require a rescue');
}
console.log('Fields: moderate increase, unchanged range, contact fade, immunity and 4 physical magnet escapes passed');
`;
new Function('require','__dirname',harness+checks)(require,__dirname);
