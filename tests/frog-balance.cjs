const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0],root=path.resolve(__dirname,'..');
const current=fs.readFileSync(path.join(root,'battle.js'),'utf8');const before=current.replace(/} else if\(id==='frog'\) \{[\s\S]*?} else if\(id==='shield'\)/,"} else if(id==='frog') { if(!game.static.pins.concat(env.pins).some(p=>Math.hypot(p.x-ball.x,p.y-ball.y)<p.r+ball.r+65))return false;const direction=ball.x<world.width/2?1:-1;ball.vx+=direction*140;ball.vy=-115; } else if(id==='shield')");assert.notEqual(before,current);
const results=[];for(const mode of ['before','after']){const req=name=>name==='node:fs'?{...fs,readFileSync(file,...args){return path.resolve(file)===path.join(root,'battle.js')?(mode==='before'?before:current):fs.readFileSync(file,...args);}}:require(name);
results.push(...new Function('require','__dirname',harness+`
 const rows=[];elements.get('#raceMode').value='normal';golden.choose=balls=>({ballId:balls.at(-1).id,abilityId:'frog'});
 for(const [mi,map]of ['pinball','spinner','fork','factory','rapids','ruins'].entries())for(const variant of [0,1]){
 seed=271+mi*31+variant*13;simulation.reset(map,10,variant);const {game,world}=simulation.state(),target=game.balls.at(-1);let steps=0;
 while(game.order.length<10&&!game.paused&&steps++<360*120)simulation.step(1/120);
 const rank=game.order.findIndex(b=>b.id===target.id)+1;rows.push({map,variant,rank:rank||11,finished:game.order.length,seconds:+game.time.toFixed(2)});
 }return rows;
`)(req,__dirname).map(r=>({mode,...r})));}
const avg=m=>results.filter(r=>r.mode===m).reduce((s,r)=>s+r.rank,0)/12;
console.log(JSON.stringify({cases:12,marbles:10,meanRankBefore:avg('before'),meanRankAfter:avg('after'),lowerRankIsBetter:true,notUniversalBalanceGuarantee:true,results},null,2));assert.ok(results.filter(r=>r.mode==='after').every(r=>r.finished===10),'new frogs races finish');
