const fs=require('node:fs'),path=require('node:path');let h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
if(process.env.KEEPER_BEANS==='1')h=h.replace(".replace(/\\}\\)\\(\\);\\s*$/, ",".replace('bean:Beans.enabled','bean:true').replace(/\\}\\)\\(\\);\\s*$/, ");
new Function('require','__dirname',h+`
for(const map of(process.env.KEEPER_MAPS||'pinball,spinner,fork,factory,rapids,ruins,observatory,rift').split(','))for(const count of(process.env.KEEPER_COUNTS||'2,100').split(',').map(Number)){
 seed=6141;elements.get('#raceMode').value=process.env.KEEPER_MODE||'normal';simulation.reset(map,count,4);const{game,world}=simulation.state();let steps=0;
 while(!game.paused&&steps++<360*120)simulation.step(1/120);
 console.log(JSON.stringify({map,count,mode:game.mode,beans:game.balls[0].bean,keeper:game.keeper.id,finished:game.order.length,time:+game.time.toFixed(2),stuck:game.stuckCount}));
 assert.equal(game.order.length,count,map+' mini bumper race completes');assert.equal(new Set(game.order.map(b=>b.id)).size,count);assert.ok(game.order.every(b=>b.y>=world.finishY));
}
`)(require,__dirname);
