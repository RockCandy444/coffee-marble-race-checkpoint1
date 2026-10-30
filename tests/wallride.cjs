const fs=require('node:fs'),path=require('node:path');
let harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
harness=harness.replace('step: physicsStep,','wall:resolveWalls, segment:resolveSegment, raw:()=>({game,world:WORLD}), step: physicsStep,');
new Function('require','__dirname',harness+`
const battle=sandbox.window.MarbleBattle,env={pins:[],segments:[]};elements.get('#raceMode').value='battle';
const trajectories=[];
for(const bean of [false,true])for(const side of ['left','right'])for(const slope of [-1.4,-.45,0,.45,1.4]){
 seed=123;simulation.reset('pinball',2,0);const {game,world}=simulation.raw(),ball=game.balls[0];game.balls=[ball];
 world.sideProfile=[{y:0,left:220-slope*200,right:780-slope*200},{y:1800,left:220+slope*1600,right:780+slope*1600}];world.funnelY=1800;
 game.static={pins:[],segments:world.sideProfile.slice(1).flatMap((b,i)=>{const a=world.sideProfile[i];return[{x1:a.left-4.5,y1:a.y,x2:b.left-4.5,y2:b.y,radius:4.5,sideWall:true},{x1:a.right+4.5,y1:a.y,x2:b.right+4.5,y2:b.y,radius:4.5,sideWall:true}];}),features:[]};game.collisionBuckets=course.buckets(game.static);
 const clearance=(ball.r+4.5)*Math.hypot(1,slope)-4.5+.01;
 game.time=10;Object.assign(ball,{bean,angle:.4,spin:0,x:side==='left'?220+clearance:780-clearance,y:200,vx:0,vy:-70,maxY:200});
 battle.assign(game,ball,'wallride');ball.battle.activeUntil=11.8;ball.battle.next=1000;
 const start=ball.y;let minVy=Infinity;
 for(let i=0;i<168;i++){simulation.step(1/120);minVy=Math.min(minVy,ball.vy);assert.ok(Number.isFinite(ball.x)&&Number.isFinite(ball.y));assert.ok(ball.y>=start-.001,JSON.stringify({bean,side,slope,i,x:ball.x,y:ball.y,vx:ball.vx,vy:ball.vy}));}
 const distance=ball.y-start;assert.ok(minVy>100,JSON.stringify({bean,side,slope,minVy}));assert.ok(distance>230,JSON.stringify({bean,side,slope,distance}));
 const b=course.bounds(ball.y,world),horizontal=bean?sandbox.window.CoffeeBeans.radius(ball,1,0):ball.r;assert.ok(ball.x-horizontal>=b.left-.01&&ball.x+horizontal<=b.right+.01,'walls remain solid');
 trajectories.push({bean,side,slope,distance:+distance.toFixed(1),minVy:+minVy.toFixed(1)});
}
// Wall capsules participate in the same response; ordinary obstacles still bounce.
simulation.reset('pinball',2,0);let {game,world}=simulation.raw(),ball=game.balls[0];game.time=10;battle.assign(game,ball,'wallride');ball.battle.activeUntil=12;ball.battle.next=100;
Object.assign(ball,{x:500,y:800,r:10,vx:0,vy:200});simulation.segment(ball,{x1:400,y1:805,x2:600,y2:805,radius:5});assert.ok(ball.vy<0,'wall ride does not phase through boards');
Object.assign(ball,{x:30,y:world.finishY-100,vx:-50,vy:-20});const before={vx:ball.vx,vy:ball.vy};assert.equal(battle.rideWall(game,ball,1,0),false);assert.equal(ball.vx,before.vx);assert.equal(ball.vy,before.vy);
ball.y=800;game.time=13;assert.equal(battle.rideWall(game,ball,1,0),false,'expired power cannot ride');
battle.assign(game,ball,'wallkick');ball.battle.next=0;battle.wallHit(game,ball,1);assert.equal(ball.vx,170,'wall kick behavior is unchanged');
console.log(JSON.stringify({trajectories,solidObstacles:true,finishSafety:true,expiry:true,wallKick:true}));
`)(require,__dirname);
