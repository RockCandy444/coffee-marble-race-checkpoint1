const fs=require('node:fs'),path=require('node:path');const h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',h+`
const hidden=sandbox.window.HiddenCourses,battle=sandbox.window.MarbleBattle;let cases=0;
for(const count of [2,100])for(let keeper=0;keeper<course.keepers.length;keeper++)for(let lane=0;lane<3;lane++){
 seed=3500+cases;elements.get('#raceMode').value='normal';simulation.reset('rift',count,keeper);const {game,world}=simulation.state(),g=world.exitGates[lane],ball=game.balls[0];game.balls=[ball];game.winningRank=1;
 Object.assign(ball,{x:(g.startLeft+g.startRight)/2,y:world.funnelY+5,vx:0,vy:160,maxY:world.funnelY+5});
 for(let i=0;i<120*100&&!game.order.length&&!game.paused;i++){simulation.step(1/120);assert.ok(hidden.inside(ball.x,ball.y,ball.r,world),'physical marble stays in a real exit');}
 assert.equal(game.order.length,1,'each exit is traversable with every keeper seed and marble size');assert.equal(ball.exitLane,lane);cases++;
}
elements.get('#raceMode').value='battle';simulation.reset('rift',100,0);const {game,world}=simulation.state();assert.equal(world.riftIslands.length,6);for(const s of world.riftIslands){const b={x:s.x+1,y:s.y,r:5.3,vx:0,vy:180};assert.equal(hidden.inside(b.x,b.y,b.r,world),false);course.contain(b,world);assert.equal(hidden.inside(b.x,b.y,b.r,world),true);assert.equal(battle.clearAt(game.balls[0],s.x,s.y,game,simulation.dynamics()),false);}
const source=fs.readFileSync(path.join(root,'hidden.js'),'utf8');assert.ok(!source.includes('[90,world.finishY-70]'),'decorative dome removed at finish');assert.ok(source.includes('ctx.lineTo(9,-7)'),'flow direction chevrons are drawn');
console.log(JSON.stringify({finalRouteCases:cases,structuralIslands:6,portalAndGhostWallProtection:true,flowChevrons:true,noFinishDome:true}));
`)(require,__dirname);
