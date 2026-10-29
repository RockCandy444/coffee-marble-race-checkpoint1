const fs=require('node:fs'),path=require('node:path');let h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
h=h.replace(".replace(/\\}\\)\\(\\);\\s*$/,", ".replace('bean:Beans.enabled','bean:true').replace(/\\}\\)\\(\\);\\s*$/,");
new Function('require','__dirname',h+`
const beans=sandbox.window.CoffeeBeans;let passed=0;
for(const [map,power]of [['observatory','comet'],['rift','comet'],['rift','ghost'],['rift','portal']]){
 seed=4090+passed*31;elements.get('#raceMode').value='normal';golden.choose=balls=>({ballId:balls.at(-1).id,abilityId:power});simulation.reset(map,16,passed%4);const {game,world}=simulation.state();assert.equal(game.golden.ability.id,power);let steps=0,escapes=0;
 while(game.order.length<16&&!game.paused&&steps++<420*120){simulation.step(1/120);for(const b of game.balls)if(!b.finished){assert.ok([b.x,b.y,b.vx,b.vy,b.angle,b.spin].every(Number.isFinite));const bounds=sandbox.window.HiddenCourses.laneBounds(b.x,b.y,world)||course.bounds(b.y,world),ln=Math.hypot(1,bounds.leftSlope),rn=Math.hypot(1,bounds.rightSlope);if(b.x-beans.radius(b,1/ln,-bounds.leftSlope/ln)*ln<bounds.left-.12||b.x+beans.radius(b,-1/rn,bounds.rightSlope/rn)*rn>bounds.right+.12)escapes++;}}
 console.log(JSON.stringify({map,power,count:16,finished:game.order.length,time:+game.time.toFixed(2),escapes}));assert.equal(game.order.length,16);assert.equal(escapes,0);passed++;
}console.log(JSON.stringify({beanGoldenRacesPassed:passed}));
`)(require,__dirname);
