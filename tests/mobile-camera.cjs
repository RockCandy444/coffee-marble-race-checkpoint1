const fs=require('node:fs'),path=require('node:path');
let harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
harness=harness.replace('addEventListener() {}','addEventListener(type,callback) { (this.handlers ??= {})[type]=callback; }');
harness=harness.replace('window.simulationTest = {','drawTrack=()=>{}; window.simulationTest = {');
harness=harness.replace('step: physicsStep,','view() { return camera; }, step: physicsStep,');
const checks=`
const screen=elements.get('#raceCanvas'),capture=new Set();
screen.getBoundingClientRect=()=>({left:20,top:30,width:400,height:500});
screen.setPointerCapture=id=>capture.add(id);screen.hasPointerCapture=id=>capture.has(id);
screen.releasePointerCapture=id=>{capture.delete(id);screen.handlers.lostpointercapture({type:'lostpointercapture',pointerId:id});};
sandbox.window.devicePixelRatio=2;
simulation.reset('spinner',2,0);
const camera=simulation.view(),{game,world}=simulation.state();
const initialPositions=game.balls.map(b=>[b.x,b.y,b.vx,b.vy]);
function center(zoom=2) {camera.zoom=zoom;camera.moveTo(500,2500);camera.update(game,world,400,500,1);}
function pointer(type,id,x,y,button=0,pointerType='touch') {screen.handlers[type]({type,pointerId:id,pointerType,button,clientX:x,clientY:y,preventDefault(){}});}
function near(a,b,label) {assert.ok(Math.abs(a-b)<1e-6,label+': '+a+' vs '+b);}
center();const anchor=camera.toWorld(200,250);
pointer('pointerdown',1,170,280);pointer('pointerdown',2,270,280);
pointer('pointermove',1,120,280);
near(camera.zoom,3,'spread increases zoom');
let under=camera.toWorld(175,250);near(under.x,anchor.x,'pinch midpoint holds world x');near(under.y,anchor.y,'pinch midpoint holds world y');
pointer('pointermove',2,320,280);near(camera.zoom,4,'upper zoom limit');
pointer('pointerdown',3,220,380);assert.equal(capture.size,2,'extra finger does not replace active pair');
pointer('pointerup',2,320,280);const x=camera.x;
pointer('pointermove',1,140,280);near(camera.x,x-20/camera.scale,'lifting one finger continues drag without jumping');
pointer('pointerup',1,140,280);assert.equal(camera.mode,'manual');assert.equal(game.selectedBall,null,'pinch release does not select a ball');assert.equal(capture.size,0);
center();pointer('pointerdown',4,170,280);pointer('pointerdown',5,270,280);
pointer('pointermove',4,269,280);near(camera.zoom,.8,'closing fingers reaches lower limit');
pointer('pointercancel',4,269,280);pointer('pointercancel',5,270,280);assert.equal(capture.size,0);
center();pointer('pointerdown',6,170,280);pointer('pointerdown',7,270,280);
const before=camera.zoom;pointer('pointermove',6,190,280);assert.ok(camera.zoom<before,'pinch inward reduces zoom');
elements.get('#cameraReset').handlers.click();assert.equal(capture.size,0);assert.equal(camera.mode,'auto');assert.equal(camera.zoom,1);
pointer('pointermove',7,320,280);assert.equal(camera.mode,'auto','stale touches cannot override reset');
assert.deepEqual(game.balls.map(b=>[b.x,b.y,b.vx,b.vy]),initialPositions,'camera gestures do not change race physics');
// A single tap still selects a marble, while a cancelled tap does not.
camera.moveTo(500,150);camera.update(game,world,400,500,1);
const ball=game.balls[0],px=20+(ball.x-camera.left)*camera.scale,py=30+(ball.y-camera.top)*camera.scale;
pointer('pointerdown',8,px,py);pointer('pointercancel',8,px,py);assert.equal(game.selectedBall,null);
pointer('pointerdown',9,px,py);pointer('pointerup',9,px,py);assert.equal(game.selectedBall,ball.id);
// Ordinary mouse drag and wheel zoom remain available.
center();pointer('pointerdown',10,220,280,0,'mouse');const previous=camera.x;pointer('pointermove',10,240,280,0,'mouse');assert.ok(camera.x<previous);pointer('pointerup',10,240,280,0,'mouse');
const oldZoom=camera.zoom;screen.handlers.wheel({deltaY:-100,deltaMode:0,preventDefault(){}});assert.ok(camera.zoom>oldZoom);
// An overview can become a manual pinch, and navigation/rematch release captures.
camera.mode='overview';camera.update(game,world,400,500,1);
pointer('pointerdown',11,170,280);pointer('pointerdown',12,270,280);assert.equal(camera.mode,'manual');assert.ok([camera.x,camera.y,camera.scale].every(Number.isFinite));
elements.get('#changeRaceSetup').handlers.click();assert.equal(capture.size,0);
simulation.reset('pinball',2,0);center();pointer('pointerdown',13,170,280);pointer('pointerdown',14,270,280);
elements.get('#restartDuringRace').handlers.click();assert.equal(capture.size,0);
console.log('Mobile camera: pinch in/out, midpoint anchoring, 0.8-4 limits, third finger, one-finger continuation, cancel/capture loss, tap selection, wheel, overview, reset and navigation cleanup passed');
`;
new Function('require','__dirname',harness+checks)(require,__dirname);
