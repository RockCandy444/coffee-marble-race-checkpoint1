const fs=require('node:fs'),path=require('node:path');
let harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
harness=harness.replace('addEventListener() {}','addEventListener(type,callback) {(this.handlers??={})[type]=callback;}');
const checks=`
const battle=sandbox.window.MarbleBattle;
elements.get('#raceMode').value='battle';
const env={pins:[],segments:[]};
function arena(id) {
  seed=11;simulation.reset('pinball',3,0);const {game,world}=simulation.state();
  game.static={pins:[],segments:[]};game.collisionBuckets=new Map();
  game.balls.forEach((b,i)=>{Object.assign(b,{x:450+i*60,y:1000+i*60,vx:0,vy:30,maxY:1000+i*60});delete b.battle;battle.assign(game,b,i===0?id:'immune');b.battle.next=100;});
  game.time=10;return{game,world,a:game.balls[0],b:game.balls[1],c:game.balls[2]};
}
let {game,world,a,b}=arena('ghost');battle.fire(game,a,'ghost',env);assert.equal(battle.skipObstacle(a,{r:20},game),true);assert.equal(battle.skipObstacle(a,{sideWall:true},game),false);assert.equal(battle.skipObstacle(a,{funnel:true},game),false);
game.time+=2;battle.tick(game,.01,env);assert.equal(battle.skipObstacle(a,{},game),false);
({game,a}=arena('ghost'));battle.fire(game,a,'ghost',env);game.static.pins=[{x:a.x,y:a.y,r:25}];game.time+=2;battle.tick(game,.01,env);assert.equal(battle.skipObstacle(a,{},game),false);assert.equal(battle.clearAt(a,a.x,a.y,game,env),true,'phase expiry finds a clear exit');
({game,a,b}=arena('bumper'));battle.fire(game,a,'bumper',env);battle.contact(game,a,b,1,0);assert.ok(b.vx>100);const vx=b.vx;battle.contact(game,a,b,1,0);assert.equal(b.vx,vx,'repeated hits grant control immunity');
({game,a}=arena('heavy'));battle.tick(game,.01,env);assert.ok(a.mass>1&&a.gravityScale>1);
({game,a}=arena('immune'));battle.tick(game,.01,env);const old=a.vx;battle.field(game,a,{x:a.x+40,y:a.y,range:120,strength:175,r:14,kind:'magnet'},.1);assert.equal(a.vx,old);
({game,a}=arena('warp'));const y=a.y;assert.equal(battle.fire(game,a,'warp',env),true);assert.ok(a.y>y);assert.equal(a.prevY,a.y,'teleport cannot create a finish crossing');
({game,a}=arena('rocket'));battle.fire(game,a,'rocket',env);assert.ok(a.vy>180);
({game,a}=arena('wallkick'));a.battle.next=0;battle.wallHit(game,a,1);assert.ok(a.vx>100&&a.vy>=80);
({game,a}=arena('path'));game.static.pins=[{x:a.x,y:a.y+100,r:20}];assert.equal(battle.fire(game,a,'path',env),true);assert.ok(Math.abs(a.vx)>0);
({game,a}=arena('shrink'));battle.fire(game,a,'shrink',env);battle.tick(game,.01,env);assert.ok(a.r<a.baseR);game.time+=2;battle.tick(game,.01,env);assert.equal(a.r,a.baseR);
({game,a}=arena('shrink'));battle.fire(game,a,'shrink',env);battle.tick(game,.01,env);game.static.pins=[{x:a.x-23,y:a.y,r:15},{x:a.x+23,y:a.y,r:15}];game.time+=2;battle.tick(game,.01,env);assert.equal(a.r,a.baseR);assert.equal(battle.clearAt(a,a.x,a.y,game,env),true,'growth moves out of a narrow gap safely');
({game,a}=arena('frog'));game.static.pins=[{x:a.x,y:a.y+35,r:20}];battle.fire(game,a,'frog',env);assert.ok(a.vy<0&&a.vx!==0);
({game,a,b}=arena('shield'));battle.fire(game,a,'shield',env);assert.equal(battle.hit(game,b,a,150,0,1),false);assert.equal(a.battle.shield,0);assert.equal(a.vx,0);
({game,a}=arena('absorb'));battle.fire(game,a,'absorb',env);a.vy=-200;battle.obstacleHit(game,a,{vx:0,vy:150});assert.ok(a.vy>0);
({game,a,b}=arena('reflect'));battle.fire(game,a,'reflect',env);battle.hit(game,b,a,-150,0);assert.equal(a.vx,0);assert.ok(b.vx>0);
({game,a,b}=arena('orbphase'));battle.fire(game,a,'orbphase',env);assert.equal(battle.skipPair(a,b,game),true);
({game,a,b}=arena('cleanse'));a.battle.slowUntil=20;battle.fire(game,a,'cleanse',env);assert.equal(a.battle.slowUntil,0);assert.equal(battle.hit(game,b,a,100,0,1),false);
({game,a}=arena('windride'));battle.field(game,a,{x:a.x+40,y:a.y,range:120,strength:270,kind:'wind',direction:1},.1);assert.ok(a.vy>34);
({game,a}=arena('reverse'));battle.fire(game,a,'reverse',env);battle.field(game,a,{x:a.x+40,y:a.y,range:120,strength:175,r:14,kind:'magnet'},.1);assert.ok(a.vx<0);
({game,a,b}=arena('shock'));battle.fire(game,a,'shock',env);assert.ok(b.vx>0);
for(const id of ['vacuum','ice','vortex']) {({game,a,b}=arena(id));battle.fire(game,a,id,env);battle.tick(game,.01,env);if(id==='ice')assert.ok(b.battle.slowUntil>game.time);else assert.notEqual(b.vx,0);}
({game,a,b}=arena('goo'));battle.fire(game,a,'goo',env);const goo=game.battle.traps[0];b.x=goo.x;b.y=goo.y;battle.tick(game,.01,env);assert.ok(b.battle.slowUntil>game.time);
({game,a}=arena('freeze'));battle.timeFor(game,'rotor-test',10);assert.equal(battle.fire(game,a,'freeze',{pins:[],segments:[{x1:a.x-20,x2:a.x+20,y1:a.y+30,y2:a.y+30,machineKey:'rotor-test'}]}),true);assert.equal(battle.timeFor(game,'rotor-test',10.5),10);assert.ok(battle.timeFor(game,'rotor-test',11.5)>10&&battle.timeFor(game,'rotor-test',11.5)<10.5);
({game,a,b}=arena('mine'));battle.fire(game,a,'mine',env);const mine=game.battle.traps[0];b.x=mine.x+10;b.y=mine.y;battle.tick(game,.01,env);assert.ok(b.vx>0);assert.equal(mine.until,0);
({game,a,b}=arena('mimic'));battle.assign(game,b,'heavy');battle.fire(game,a,'mimic',env);battle.tick(game,.01,env);assert.equal(a.battle.id,'mimic');assert.equal(a.battle.borrowId,'heavy');assert.ok(a.mass>1);game.time+=2.3;battle.tick(game,.01,env);assert.equal(a.battle.borrowId,undefined);assert.equal(a.mass,1);
({game,a,b}=arena('mimic'));battle.assign(game,b,'shield');battle.fire(game,a,'mimic',env);assert.equal(a.battle.shield,1);game.time+=2.3;battle.tick(game,.01,env);assert.equal(a.battle.shield,0,'a copied shield expires with the borrowed ability');
({game,a}=arena('reroll'));a.y=game.battle.sections[1][0]+10;battle.tick(game,.01,env,()=>0);assert.notEqual(a.battle.id,'reroll');assert.equal(a.battle.initialId,'reroll');
const firstRoll=a.battle.id;a.y=game.battle.sections[2][0]+10;battle.tick(game,.01,env,()=>0);assert.notEqual(a.battle.id,firstRoll);assert.equal(a.battle.reroll,true,'reroll repeats at later sections');
({game,a,b}=arena('swap'));const ay=a.y,by=b.y;assert.equal(battle.fire(game,a,'swap',env),true);assert.equal(a.y,by);assert.equal(b.y,ay);assert.equal(a.prevY,by);assert.equal(b.prevY,ay);
({game,a}=arena('catchup'));a.y=800;battle.tick(game,.01,env);assert.ok(a.gravityScale>1);a.y=1500;battle.tick(game,.01,env);assert.equal(a.gravityScale,1);
({game,a}=arena('charge'));for(let i=0;i<3;i++){game.time+=.3;battle.obstacleHit(game,a,{vx:0,vy:30});}assert.equal(a.battle.energy,3);battle.fire(game,a,'charge',env);assert.equal(a.battle.energy,0);assert.ok(a.vy>200);
// A solid obstruction prevents swap/warp into it; finish safety applies to both attacker and target.
({game,world,a,b}=arena('swap'));game.static.pins=[{x:b.x,y:b.y,r:35}];assert.equal(battle.fire(game,a,'swap',env),false);
for(const id of ['warp','swap','ghost','shrink','frog']) {({game,world,a}=arena(id));a.y=world.finishY-100;assert.equal(battle.fire(game,a,id,env),false);}
({game,world,a,b}=arena('shock'));b.y=world.finishY-50;assert.equal(battle.hit(game,a,b,100,0,1),false);
({game,world}=arena('heavy'));const choices=[];for(let i=0;i<50;i++)choices.push((i+.5)/50,.5);
const all={time:0,balls:Array.from({length:50},(_,i)=>({id:i+1,r:10,x:500,y:50,label:'P'+i,name:'P'+i}))};
battle.init(all,world,game.battle.sections,()=>choices.shift());assert.equal(new Set(all.balls.map(b=>b.battle.id)).size,50,'equal selection intervals cover all abilities');assert.ok(all.balls.every(b=>b.r===10));
// Mode switch restores the ordinary golden setting and cannot stack it in battle.
elements.get('#goldenEnabled').checked=true;elements.get('#raceMode').handlers.change();assert.equal(elements.get('#goldenEnabled').checked,false);assert.equal(elements.get('#goldenEnabled').disabled,true);
elements.get('#raceMode').value='normal';elements.get('#raceMode').handlers.change();assert.equal(elements.get('#goldenEnabled').checked,true);assert.equal(elements.get('#goldenEnabled').disabled,false);
// Ability dialog freezes the same race and preserves an existing pause state.
elements.get('#raceMode').value='battle';simulation.reset('pinball',3,0);game=simulation.state().game;
const dialog=elements.get('#battleDialog');dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.handlers.close();};
elements.get('#openBattleAbilities').handlers.click();assert.equal(game.paused,true);assert.equal(elements.get('#battleRoster').children.length,3);
elements.get('#closeBattleAbilities').handlers.click();assert.equal(game.paused,false);
game.paused=true;elements.get('#openBattleAbilities').handlers.click();elements.get('#closeBattleAbilities').handlers.click();assert.equal(game.paused,true);
console.log('50 battle abilities: distinct triggers, immunity windows, safe teleport/swap, finish protection, freeze resume, mimic/reroll cleanup and mode/golden isolation passed');
`;
new Function('require','__dirname',harness+checks)(require,__dirname);
