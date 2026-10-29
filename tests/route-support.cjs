const fs=require('node:fs'),path=require('node:path'),h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',h+`
for(const map of ['factory','rapids'])for(const count of [2,100,1000]){
 simulation.reset(map,count,0);const{game,world,maps}=simulation.state();
 const supports=game.static.pins.filter(p=>p.routeSupport),sections=map==='factory'?[0]:[1,4];
 assert.equal(supports.length,sections.length*8,map+' all requested placements exist');
 for(const section of sections){const pins=supports.filter(p=>p.section===section);assert.equal(pins.filter(p=>p.kind==='power').length,2);assert.equal(pins.filter(p=>!p.kind).length,6);
 for(const p of pins){const b=course.bounds(p.y,world),center=map==='factory'?400:(b.left+b.right)/2;assert.ok(Math.abs(p.x-center)<=15);assert.ok(p.y>maps[map].sections[section][0]&&p.y<maps[map].sections[section+1][0]);
 for(const q of game.static.pins)if(q!==p)assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>p.r+q.r+27,'added pins preserve a physical passage');
 for(const s of game.static.segments){const dx=s.x2-s.x1,dy=s.y2-s.y1,t=Math.max(0,Math.min(1,((p.x-s.x1)*dx+(p.y-s.y1)*dy)/(dx*dx+dy*dy||1)));assert.ok(Math.hypot(p.x-s.x1-t*dx,p.y-s.y1-t*dy)>p.r+(s.radius||4.5)+49,'no support pin-board pocket');}
 }}console.log(JSON.stringify({map,count,sections:sections.map(i=>i+1),supportPins:supports.length,powerBumpers:supports.filter(p=>p.kind==='power').length}));
}
`)(require,__dirname);
