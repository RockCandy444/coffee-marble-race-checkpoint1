const fs=require('node:fs'),path=require('node:path');
const h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',h+`
const battle=sandbox.window.MarbleBattle,maps=['pinball','spinner','fork','factory','rapids','ruins'],powers=['goo','mine','ring','ramp','portal','vortex'],scenarios=[];
maps.forEach((map,i)=>{for(const count of [2,100])scenarios.push({map,count,mode:'battle',mix:i});scenarios.push({map,count:100,mode:'normal',power:powers[i]});});
powers.forEach(power=>scenarios.push({map:'spinner',count:2,mode:'battle',power}));
for(const [map,power]of [['rapids','vortex'],['spinner','goo'],['factory','mine'],['ruins','ramp']])scenarios.push({map,count:100,mode:'battle',power});
let passed=0;
for(const [index,s]of scenarios.entries()){
 if(index<Number(process.argv[2]||0))continue;
 seed=3301+index*31;elements.get('#raceMode').value=s.mode;golden.choose=balls=>s.mode==='normal'?{ballId:balls.at(-1).id,abilityId:s.power}:null;simulation.reset(s.map,s.count,index%4);
 const {game,world}=simulation.state();if(s.mode==='battle')game.balls.forEach((b,i)=>battle.assign(game,b,s.power||powers[(i+s.mix)%powers.length]));
 let steps=0,escapes=0,maxTraps=0;
 while(game.order.length<s.count&&!game.paused&&steps++<420*120){simulation.step(1/120);maxTraps=Math.max(maxTraps,game.battle.traps.length);
  for(const b of game.balls)if(!b.finished){assert.ok([b.x,b.y,b.vx,b.vy,b.r].every(Number.isFinite));const bounds=course.bounds(b.y,world);if(b.x-b.r<bounds.left-.1||b.x+b.r>bounds.right+.1)escapes++;}
 }
 console.log(JSON.stringify({...s,finished:game.order.length,seconds:+game.time.toFixed(2),paused:game.autoPaused,escapes,maxTraps,remaining:game.balls.filter(b=>!b.finished).map(b=>({id:b.id,power:b.battle.id,x:+b.x.toFixed(1),y:+b.y.toFixed(1)}))}));
 assert.equal(game.order.length,s.count,'installed power race finishes '+JSON.stringify(s));assert.equal(escapes,0);assert.equal(new Set(game.order.map(b=>b.id)).size,s.count);assert.ok(game.order.every(b=>b.y>=world.finishY));assert.ok(maxTraps<=400);passed++;
}
console.log(JSON.stringify({installedRacesPassed:passed,allMaps:6,installedPowers:6}));
`)(require,__dirname);
