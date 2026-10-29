const fs=require('node:fs'),path=require('node:path');let h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
h=h.replace('addEventListener() {}','addEventListener(type,callback) { (this.handlers ??= {})[type]=callback; }').replace('step: physicsStep,','view() {return camera;}, render: drawTrack, step: physicsStep,');
h=h.replace('getContext: () => ({})','getContext: () => new Proxy({}, {get(t,k){if(k in t)return t[k];if(k.startsWith("create")&&k.endsWith("Gradient"))return()=>({addColorStop(){}});if(k==="measureText")return()=>({width:10});return (...args)=>{if(k==="arc")paintCalls.push(args);};},set(t,k,v){t[k]=v;return true;}})');
new Function('require','__dirname','const paintCalls=[];'+h+`
const names=elements.get('#namesInput'),mode=elements.get('#winnerMode'),rank=elements.get('#winnerRank'),select=elements.get('#cameraSelect');
names.value='같은 이름 * 50';names.handlers.input();mode.value='custom';rank.value='47';mode.handlers.change();elements.get('#confirmParticipants').handlers.click();elements.get('#startRace').handlers.click();
const{game,world}=simulation.state(),cam=simulation.view();game.paused=true;
assert.ok(select.children.some(o=>o.value==='winning'&&o.textContent.includes('47등')));
game.balls.forEach((b,i)=>Object.assign(b,{x:200+i*9,y:300+i*130,vx:i,vy:100+i}));
select.value='winning';select.handlers.change();cam.zoom=2;cam.initialized=false;simulation.frame(1000);
assert.equal(cam.target.id,4,'47th in progress is marble #4, not marble #47');assert.equal(game.selectedBall,null);assert.ok(cam.label.includes('47등 후보'));
const unchanged=JSON.stringify(game.balls.map(b=>[b.x,b.y,b.vx,b.vy]));simulation.frame(1200);assert.equal(JSON.stringify(game.balls.map(b=>[b.x,b.y,b.vx,b.vy])),unchanged,'tracking never alters physics');
game.balls[0].y=9000;simulation.frame(1400);assert.equal(cam.target.id,5,'candidate changes on an overtake');
const progress=game.balls.slice().sort((a,b)=>b.y-a.y);game.order=progress.slice(0,20);game.order.forEach(b=>b.finished=true);simulation.frame(1600);assert.equal(cam.target,progress[46],'finished ranks are included before active rank');
game.order=progress.slice(0,47);game.order.forEach(b=>b.finished=true);const winner=game.order[46];winner.y=world.finishY;cam.initialized=false;simulation.frame(1800);assert.equal(cam.target,winner);assert.ok(cam.label.includes('47등 확정'));assert.ok(elements.get('#beadInfo').textContent.includes('당첨 확정'));
game.balls.filter(b=>!b.finished).forEach(b=>b.y=world.finishY+100);simulation.frame(2000);assert.equal(cam.target,winner,'confirmed winner stays locked while others continue');
paintCalls.length=0;simulation.render();assert.ok(paintCalls.some(a=>a[0]===winner.x&&a[1]===winner.y&&a[2]===winner.r),'finished winning marble remains visible');
select.value='manual';select.handlers.change();simulation.frame(2200);assert.equal(cam.mode,'manual');
paintCalls.length=0;simulation.render();assert.ok(!paintCalls.some(a=>a[0]===winner.x&&a[1]===winner.y&&a[2]===winner.r),'leaving winner mode restores normal finished-marble hiding');
for(const targetRank of [1,50]){game.winningRank=targetRank;game.order=[];game.balls.forEach(b=>b.finished=false);cam.mode='winning';cam.update(game,world,600,400,.1);const sorted=game.balls.slice().sort((a,b)=>b.y-a.y);assert.equal(cam.target,sorted[targetRank-1]);}
elements.get('#restartDuringRace').handlers.click();assert.equal(cam.mode,'auto');
console.log('Winning camera: 47th vs ID, overtakes, finished-rank offset, locked finish, first/last, duplicate owners, manual exit, rematch and physics isolation passed');
`)(require,__dirname);
