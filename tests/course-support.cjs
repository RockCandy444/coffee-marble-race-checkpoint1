const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',harness+`
const results=[];
for(const count of [2,100,1000]){
 simulation.reset('observatory',count,0);const {game,world,maps}=simulation.state(),diameter=game.balls[0].r*2;
 const support=game.static.pins.filter(p=>p.observatorySupport);
 for(const [section,min]of [[0,30],[5,12]]){
  const pins=support.filter(p=>p.section===section);assert.ok(pins.length>=min,section+' needs supporting obstacles throughout');
  assert.ok(pins.filter(p=>p.kind==='power').length>=2,'a few stronger bumpers mixed in');
  assert.ok(pins.filter(p=>!p.kind).every(p=>p.star),'basic pins keep their star collision shape');
  const start=maps.observatory.sections[section][0],end=section===0?maps.observatory.sections[1][0]:world.funnelY;
  assert.ok(pins.some(p=>p.y<start+(end-start)*.25));assert.ok(pins.some(p=>p.y>start+(end-start)*.75),'support reaches the end of the section');
  assert.ok(pins.some(p=>{const b=course.bounds(p.y,world);return Math.abs(p.x-(b.left+b.right)/2)<90}),'center is covered');
  for(const p of pins){const b=course.bounds(p.y,world);assert.ok(p.x-p.r-b.left>=diameter+18-.01&&b.right-p.x-p.r>=diameter+18-.01,'wall clearance');
   for(const other of game.static.pins)if(other!==p)assert.ok(Math.hypot(p.x-other.x,p.y-other.y)>=p.r+other.r+diameter+18-.01,'no pin pockets');
  }
  results.push({count,section,added:pins.length,bumpers:pins.filter(p=>p.kind==='power').length});
 }
 const approach=support.filter(p=>p.y>=world.funnelY);assert.ok(approach.length>=4);assert.ok(approach.every(p=>p.y<=world.finishY-330),'final keeper stays clear');
 assert.ok(support.every(p=>p.section===0||p.section===5),'other sections retain their existing layouts');
}
console.log(JSON.stringify({support:results,clearWallsAndPins:true,clearFinalKeeper:true}));
`)(require,__dirname);
