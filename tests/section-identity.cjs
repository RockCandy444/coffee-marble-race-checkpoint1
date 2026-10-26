const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',harness+`
const extra=sandbox.window.ExtraCourses;
for(const map of ['factory','rapids','ruins']){
  simulation.reset(map,100,0);const {game,world,maps}=simulation.state(),plans=extra.sectionPlans[map];assert.equal(plans.length,6);assert.equal(new Set(plans.map(p=>p[1])).size,6);
  const profiles=[];
  for(let i=0;i<6;i++){
    assert.equal(maps[map].sections[i][1],plans[i][0]);
    const pins=game.static.pins.filter(p=>p.section===i),segments=game.static.segments.filter(s=>s.section===i),features=game.static.features.filter(f=>f.section===i),countKind=kind=>features.filter(f=>f.kind===kind).length;
    const profile={name:plans[i][0],primary:plans[i][1],ambient:pins.filter(p=>p.ambient).length,magnets:pins.filter(p=>p.kind==='magnet').length,belts:segments.filter(s=>s.conveyor).length,walls:segments.filter(s=>s.breakable).length,pillars:pins.filter(p=>p.pillar).length,islands:pins.filter(p=>p.island).length,presses:countKind('press'),gates:countKind('gate'),currents:countKind('current'),pulsed:features.filter(f=>f.pulsed).length,laneCounts:features.filter(f=>f.kind==='current').map(f=>f.lanes.length),vortices:countKind('whirlpool'),bridges:countKind('bridge'),stoneGates:countKind('stoneGate'),boulders:countKind('boulder')};
    assert.ok(pins.filter(p=>p.ambient).every(p=>p.r<=11),'support pins stay visually smaller than landmarks');assert.equal(profile.magnets,extra.magnetCounts[map][i]);profiles.push(profile);
    if(map==='factory'){
      assert.equal(profile.belts,[4,0,8,0,6,0][i]);assert.equal(profile.presses,i===1?5:0);assert.equal(profile.gates,i===3?5:i===5?2:0);
      if(i===0)assert.ok(segments.filter(s=>s.rail).length>=2,'intake lanes have divider rails');
      if(i===2)assert.ok(segments.filter(s=>s.conveyor).every(s=>s.reverse),'reverse section does not mix in forward belts');
      if(i===3)assert.ok(new Set(features.map(f=>f.fraction)).size>=3,'sorting gates alternate their open lane');
    }else if(map==='rapids'){
      assert.equal(profile.vortices,i===2?5:0);assert.equal(profile.islands,i===1?2:i===3?6:0);assert.equal(profile.currents,[4,3,0,2,4,0][i]);
      if(i===0)assert.ok(features.filter(f=>f.kind==='current').every(f=>!f.pulsed&&f.lanes.length===1));
      if(i===4)for(const f of features.filter(f=>f.kind==='current')){assert.ok(f.pulsed);const top=f.lanes.map(l=>extra.channelAt(f,l,f.y-f.height/2,world)),bottom=f.lanes.map(l=>extra.channelAt(f,l,f.y+f.height/2,world));assert.ok(Math.abs(bottom[1].x-bottom[0].x)<Math.abs(top[1].x-top[0].x)*.4,'merge channels converge physically');const isolated={...game,time:f.onTime/2-f.offset,static:{...game.static,features:[f]}},balls=f.lanes.map(l=>({x:extra.channelAt(f,l,f.y,world).x,y:f.y,r:11.2,vx:0,vy:0}));balls.forEach(b=>extra.apply(b,isolated,world,.1));assert.ok(balls[0].vx>0&&balls[1].vx<0,'active merge actually pushes both lanes inward');}
    }else{
      assert.equal(profile.pillars,i===0?18:0);assert.equal(profile.walls,i===1?12:i===5?2:0);assert.equal(profile.bridges,i===2?5:0);assert.equal(profile.stoneGates,i===3?4:i===5?1:0);assert.equal(profile.boulders,i===4?6:0);
      assert.equal(pins.filter(p=>p.switchFor).length,profile.stoneGates);if(i===4)assert.ok(new Set(features.map(f=>f.phase)).size===6,'falling stones use offset timings');
    }
  }
  const physicalProfiles=profiles.map(({name,primary,ambient,magnets,...p})=>JSON.stringify(p));assert.equal(new Set(physicalProfiles).size,6,'all six sections have different obstacle profiles');console.log(JSON.stringify({map,sections:profiles}));
}
console.log('18 named sections have distinct primary mechanics, supporting scale, alternate paths, timed presses, converging flows and switch/chute layouts');
`)(require,__dirname);
