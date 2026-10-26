const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',harness+`
const extra=sandbox.window.ExtraCourses;
const previousHeights={pinball:7200,spinner:7800,fork:8400,factory:7600,rapids:8200,ruins:8600};
for(const [map,height] of Object.entries(previousHeights)) {
  simulation.reset(map,100,0);const {game,world,maps}=simulation.state();
  assert.equal(world.height,height*1.5);assert.equal(maps[map].sections.length,6);
  assert.equal(world.finishY,world.height-60);assert.equal(world.funnelY,world.height-1120);
  assert.ok(maps[map].sections.every(([y],i,all)=>y>0&&y<world.finishY&&(!i||y>all[i-1][0])));
  if(!extra.has(map))continue;
  const magnets=game.static.pins.filter(p=>p.kind==='magnet');assert.equal(magnets.length,{factory:6,rapids:4,ruins:5}[map],map+' magnets support selected sections');
  assert.ok(game.static.pins.length>250,map+' keeps supporting obstacles while highlighting landmarks');
  for(const p of game.static.pins.filter(p=>p.y>=world.funnelY)){const b=course.bounds(p.y,world);assert.ok((p.x-b.left)/Math.hypot(1,b.leftSlope)-p.r>=40&& (b.right-p.x)/Math.hypot(1,b.rightSlope)-p.r>=40,'fixed pins leave room along narrowing wall');}
  for(const p of magnets){const b=course.bounds(p.y,world);assert.ok(p.x-p.range>b.left+20&&p.x+p.range<b.right-20);assert.ok(p.y<world.funnelY-180);
    for(const s of game.static.segments.filter(s=>!s.sideWall&&!s.funnel)){const dx=s.x2-s.x1,dy=s.y2-s.y1,t=Math.max(0,Math.min(1,((p.x-s.x1)*dx+(p.y-s.y1)*dy)/(dx*dx+dy*dy||1)));assert.ok(Math.hypot(p.x-s.x1-t*dx,p.y-s.y1-t*dy)>p.range+p.r+(s.radius||5),'magnet field stays clear of board');}
    const ball={x:p.x+65,y:p.y,r:11.2,vx:0,vy:0};course.field(ball,p,.1);assert.ok(ball.vx<0,'added magnets exert real force');ball.immuneFields=true;ball.vx=0;ball.vy=0;course.field(ball,p,.1);assert.equal(ball.vx,0);assert.equal(ball.vy,0);
  }
  const sections=maps[map].sections;
  sections.forEach(([start],i)=>{const end=sections[i+1]?.[0]||world.finishY-280;for(let y=start+60;y+450<end;y+=225){const pins=game.static.pins.filter(p=>p.y>=y&&p.y<y+450).length,boards=game.static.segments.filter(s=>!s.sideWall&&!s.funnel&&s.y1>=y&&s.y1<y+450).length,landmarks=game.static.features.filter(f=>f.y>=y&&f.y<y+450).length;assert.ok(pins+boards+landmarks*2>=5,map+' section '+i+' has no empty 450-unit band');}});
  if(map==='rapids'){
    const stop=extra.waterEnd(world);assert.ok(stop<world.funnelY);
    for(const f of game.static.features){if(f.kind==='current')assert.ok(f.y+f.height/2<=stop+.001);if(f.kind==='whirlpool')assert.ok(f.y+f.range<=stop+.001);}
    for(let y=stop;y<world.finishY;y+=20){const b=course.bounds(y,world);for(const x of [b.left+20,(b.left+b.right)/2,b.right-20]){const ball={x,y,vx:17,vy:80};extra.apply(ball,game,world,.1);assert.equal(ball.vx,17);assert.equal(ball.vy,80);}}
  }
  console.log(JSON.stringify({map,height:world.height,pins:game.static.pins.length,magnets:magnets.length}));
}
simulation.reset('rapids',2,0);{
  const {game}=simulation.state(),ball=game.balls[0];game.balls=[ball];Object.assign(ball,{x:784.1,y:3824.4,vx:0,vy:0,maxY:3824.4,stallTime:0,rescueCount:0});
  for(let i=0;i<30*120&&ball.y<4025;i++)simulation.step(1/120);assert.ok(ball.y>4025,'current cannot hold a marble on the wall-connected log');
}
console.log('Six 1.5x courses, section density, magnetic force/immunity/clearance and water-free finish approach passed');
`)(require,__dirname);
