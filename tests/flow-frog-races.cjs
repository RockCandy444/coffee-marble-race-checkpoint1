const fs=require('node:fs'),path=require('node:path');const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];new Function('require','__dirname',harness+`
const powers=['frog','machinereverse'];let passed=0;elements.get('#raceMode').value='normal';
for(const map of ['pinball','spinner','fork','factory','rapids','ruins'])for(const power of powers)for(const count of [2,100]){
 seed=2701+passed*19;golden.choose=balls=>({ballId:balls.at(-1).id,abilityId:power});simulation.reset(map,count,passed%4);const {game,world}=simulation.state();let steps=0,escapes=0;while(game.order.length<count&&!game.paused&&steps++<360*120){simulation.step(1/120);for(const b of game.balls)if(!b.finished){assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));const bounds=course.bounds(b.y,world);if(b.x-b.r<bounds.left-.1||b.x+b.r>bounds.right+.1)escapes++;}}
 console.log(JSON.stringify({map,power,count,finished:game.order.length,seconds:+game.time.toFixed(2),escapes}));assert.equal(game.order.length,count);assert.equal(escapes,0);assert.ok(game.order.every(b=>b.y>=world.finishY));passed++;
}console.log(JSON.stringify({updatedPowerGoldenRaces:passed}));
`)(require,__dirname);
