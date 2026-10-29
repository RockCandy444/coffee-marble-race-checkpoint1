const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',harness+`
elements.get('#raceMode').value='normal';golden.choose=()=>null;
seed=958;simulation.reset('factory',2,3);const {game,world}=simulation.state();
const ball=game.balls[0];game.balls=[ball];game.winningRank=1;
Object.assign(ball,{x:414.384987,y:9158.31189,vx:-245.18,vy:44.81,maxY:9181.987,noProgressTime:11.9,stallTime:0});
let steps=0,rescued=false;while(game.order.length<1&&!game.paused&&steps++<240*120){simulation.step(1/120);if(ball.magnetGrace>1)rescued=true;}
assert.equal(rescued,true,'fast sideways conveyor loop gets a physical rescue');
assert.equal(game.order.length,1,'ordinary marble escapes measured crossing-conveyor loop');
assert.ok(game.order.every(b=>b.y>=world.finishY),'recovery does not award an artificial finish');
assert.equal(game.autoPaused,false);console.log(JSON.stringify({case:'factory-crossing-loop-pose',finished:1,seconds:+game.time.toFixed(2),ranking:'real finish crossing',rescued}));
`)(require,__dirname);
