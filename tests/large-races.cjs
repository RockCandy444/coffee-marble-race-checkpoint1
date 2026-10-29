const fs=require('node:fs'),path=require('node:path');
let h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
if(process.env.LARGE_BEANS==='1')h=h.replace(".replace(/\\}\\)\\(\\);\\s*$/, ", ".replace('bean:Beans.enabled','bean:true').replace(/\\}\\)\\(\\);\\s*$/, ");
new Function('require','__dirname',h+`
for(const map of (process.env.LARGE_MAPS||'pinball,spinner,fork,factory,rapids,ruins,observatory,rift').split(',')){
 seed=5101;elements.get('#raceMode').value=process.env.LARGE_MODE||'normal';const start=performance.now();simulation.reset(map,1000,Number(process.env.LARGE_KEEPER||0));const{game:g,world:w}=simulation.state();
 assert.equal(g.balls.length,1000);assert.equal(new Set(g.balls.map(b=>b.id)).size,1000);
 assert.ok(g.balls.every(b=>b.y<350||b.battle?.id==='shortcut'),'ordinary marbles start before obstacles');
 for(const b of g.balls){if(b.battle?.id==='shortcut')continue;const bounds=course.bounds(b.y,w);assert.ok(b.x-b.r>bounds.left&&b.x+b.r<bounds.right,'safe initial walls');}
 let steps=0;const seconds=Number(process.env.LARGE_SECONDS||420);let maxStep=0;
 while(!g.paused&&g.order.length<1000&&steps++<seconds*120){const t=performance.now();simulation.step(1/120);maxStep=Math.max(maxStep,performance.now()-t);if(steps%7200===0)console.log(JSON.stringify({progress:map,time:+g.time.toFixed(1),finished:g.order.length,wallSeconds:+((performance.now()-start)/1000).toFixed(1)}));}
 assert.ok(g.balls.every(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite)));
 assert.equal(new Set(g.order.map(b=>b.id)).size,g.order.length);
 console.log(JSON.stringify({map,mode:g.mode,beans:g.balls[0].bean,finished:g.order.length,time:+g.time.toFixed(2),paused:g.paused,stuck:g.stuckCount,wallSeconds:+((performance.now()-start)/1000).toFixed(2),maxStepMs:+maxStep.toFixed(1)}));
 if(seconds>=360){assert.equal(g.order.length,1000,map+' full race completes');assert.equal(elements.get('#finalRanking').children.length,1000);}
}
`)(require,__dirname);
