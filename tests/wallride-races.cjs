const fs=require('node:fs'),path=require('node:path');
let h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
h=h.replace('step: physicsStep,','raw:()=>({game,world:WORLD}), step: physicsStep,');
new Function('require','__dirname',h+`
const battle=sandbox.window.MarbleBattle;elements.get('#raceMode').value='battle';
for(const map of ['spinner','fork','observatory','rift']){
 seed=2142;simulation.reset(map,12,0);const {game,world}=simulation.raw();
 for(const ball of game.balls)battle.assign(game,ball,'wallride');
 let steps=0;while(!game.paused&&steps++<360*120)simulation.step(1/120);
 console.log(JSON.stringify({map,ability:'wallride',count:game.balls.length,finished:game.order.length,time:+game.time.toFixed(2),stuck:game.stuckCount}));
 assert.equal(game.order.length,12,map+' wall riders must complete');assert.equal(new Set(game.order.map(b=>b.id)).size,12);assert.ok(game.order.every(b=>b.y>=world.finishY));
}
`)(require,__dirname);
