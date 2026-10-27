const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',harness+`
elements.get('#raceMode').value='normal';golden.choose=balls=>({ballId:balls.at(-1).id,abilityId:'glide'});
seed=958;simulation.reset('factory',2,3);const {game,world}=simulation.state();
let steps=0;while(game.order.length<2&&!game.paused&&steps++<240*120)simulation.step(1/120);
assert.equal(game.order.length,2,'ordinary marble escapes the measured crossing-conveyor loop');
assert.ok(game.order.every(b=>b.y>=world.finishY),'recovery does not award an artificial finish');
assert.equal(game.autoPaused,false);console.log(JSON.stringify({case:'factory-crossing-loop',finished:2,seconds:+game.time.toFixed(2),ranking:'real finish crossings'}));
`)(require,__dirname);
