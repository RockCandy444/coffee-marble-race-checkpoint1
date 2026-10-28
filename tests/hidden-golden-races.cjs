const fs=require('node:fs'),path=require('node:path');const h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',h+`
let passed=0;for(const [map,power]of [['observatory','comet'],['rift','comet'],['rift','ghost'],['rift','portal']]){
 seed=3490+passed*31;elements.get('#raceMode').value='normal';golden.choose=balls=>({ballId:balls.at(-1).id,abilityId:power});simulation.reset(map,100,passed%4);const {game,world}=simulation.state();assert.equal(game.golden.ability.id,power);let steps=0,escapes=0;
 while(game.order.length<100&&!game.paused&&steps++<850*120){simulation.step(1/120);for(const b of game.balls)if(!b.finished){assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));const bounds=sandbox.window.HiddenCourses.laneBounds(b.x,b.y,world)||course.bounds(b.y,world);if(b.x-b.r<bounds.left-.11||b.x+b.r>bounds.right+.11)escapes++;}}
 console.log(JSON.stringify({map,power,count:100,finished:game.order.length,time:+game.time.toFixed(2),escapes,remaining:game.balls.filter(b=>!b.finished).map(b=>({id:b.id,x:b.x,y:b.y}))}));assert.equal(game.order.length,100);assert.equal(escapes,0);passed++;
}console.log(JSON.stringify({hiddenGoldenRacesPassed:passed}));
`)(require,__dirname);
