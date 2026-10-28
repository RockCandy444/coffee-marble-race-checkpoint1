const fs=require('node:fs'),path=require('node:path');const h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',h+`
const battle=sandbox.window.MarbleBattle;let passed=0;
for(const map of ['rapids','observatory','rift'])for(const power of ['shortcut','vortex']){
 seed=3791+passed*31;elements.get('#raceMode').value=power==='vortex'?'battle':'normal';golden.choose=balls=>power==='shortcut'?{ballId:balls.at(-1).id,abilityId:power}:null;simulation.reset(map,100,passed%4);const {game,world}=simulation.state();
 if(power==='vortex')game.balls.forEach(b=>battle.assign(game,b,'vortex'));
 let steps=0,escapes=0,maxTraps=0;while(game.order.length<100&&!game.paused&&steps++<420*120){simulation.step(1/120);maxTraps=Math.max(maxTraps,game.battle.traps.length);for(const b of game.balls)if(!b.finished){assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));const bounds=sandbox.window.HiddenCourses.laneBounds(b.x,b.y,world)||course.bounds(b.y,world);if(b.x-b.r<bounds.left-.1||b.x+b.r>bounds.right+.1)escapes++;}}
 console.log(JSON.stringify({map,power,count:100,finished:game.order.length,seconds:+game.time.toFixed(2),escapes,maxTraps,remaining:game.balls.filter(b=>!b.finished).map(b=>({id:b.id,x:b.x,y:b.y}))}));assert.equal(game.order.length,100);assert.equal(escapes,0);assert.equal(new Set(game.order.map(b=>b.id)).size,100);passed++;
}console.log(JSON.stringify({flowShortcutRaces:passed}));
`)(require,__dirname);
