const fs=require('node:fs'),path=require('node:path');const h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',h+`
const battle=sandbox.window.MarbleBattle;let passed=0;
for(const map of ['observatory','rift'])for(const mode of ['normal','battle'])for(const count of [2,100]){
 seed=3401+passed*17;elements.get('#raceMode').value=mode;golden.choose=()=>null;simulation.reset(map,count,passed%4);const {game,world,maps}=simulation.state();
 if(mode==='battle'){game.balls.forEach((b,i)=>battle.assign(game,b,battle.abilities[i%50].id));battle.placeShortcuts(game,simulation.dynamics());}
 assert.equal(world.height,map==='rift'?25000:13500);if(map==='rift'){assert.equal(game.static.chapters.length,7);assert.equal(new Set(game.static.chapters.map(c=>c.source)).size,7);assert.equal(world.exitGates.length,3);}
 let steps=0,escapes=0;
 while(game.order.length<count&&!game.paused&&steps++<850*120){simulation.step(1/120);for(const b of game.balls)if(!b.finished){assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));const bounds=sandbox.window.HiddenCourses.laneBounds(b.x,b.y,world)||course.bounds(b.y,world);if(b.x-b.r<bounds.left-.11||b.x+b.r>bounds.right+.11)escapes++;}}
 console.log(JSON.stringify({map,mode,count,finished:game.order.length,time:+game.time.toFixed(2),paused:game.autoPaused,escapes,lanes:game.order.map(b=>b.exitLane),remaining:game.balls.filter(b=>!b.finished).map(b=>({id:b.id,x:+b.x.toFixed(1),y:+b.y.toFixed(1)}))}));
 assert.equal(game.order.length,count,map+' '+mode+' '+count+' finishes');assert.equal(escapes,0);assert.equal(new Set(game.order.map(b=>b.id)).size,count);assert.ok(game.order.every(b=>b.y>=world.finishY));passed++;
}
console.log(JSON.stringify({hiddenRacesPassed:passed}));
`)(require,__dirname);
