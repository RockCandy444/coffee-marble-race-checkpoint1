const fs=require('node:fs'),path=require('node:path');
let harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
harness=harness.replace('addEventListener() {}','addEventListener(type,callback) { (this.handlers ??= {})[type]=callback; }');
harness=harness.replace('const sandbox =', 'const pendingFrames=new Map();let nextFrame=0;\nconst sandbox =');
harness=harness.replace('requestAnimationFrame: () => 1, cancelAnimationFrame() {}','requestAnimationFrame(callback) { pendingFrames.set(++nextFrame,callback);return nextFrame; }, cancelAnimationFrame(id) { pendingFrames.delete(id); }');
harness=harness.replace("sandbox.window = { addEventListener() {}, scrollTo() {} };","sandbox.window = {handlers:{}, addEventListener(type,callback) { this.handlers[type]=callback; }, scrollTo() {} };");
const checks=`
const names=elements.get('#namesInput'),count=elements.get('#countInput'),copies=elements.get('#ballsPerPerson');
const confirm=elements.get('#confirmParticipants'),toggle=document.querySelector('#goldenEnabled');
function setupFrame() {
  const frames=[...pendingFrames.values()];pendingFrames.clear();frames.forEach(fn=>fn(1000));
}
// Restore browser form values with no input event, including a change after pageshow.
names.value=Array.from({length:7},(_,i)=>'참가자 '+(i+1)+' * 1').join('\\n');count.value='7';copies.value='1';
setupFrame();
assert.equal(elements.get('#participantCount').textContent,'7명 · 구슬 7개');
assert.equal(elements.get('#rosterPreview').children.length,7);
assert.equal(elements.get('#mapParticipantSummary').textContent,'7명 · 구슬 7개');
assert.equal(pendingFrames.size,1,'one setup watcher, no accumulation');
sandbox.window.handlers.pageshow();
names.value='민지 * 5, 준호 * 2';setupFrame();
assert.equal(elements.get('#participantCount').textContent,'2명 · 구슬 7개');
count.value='8';count.handlers.input();assert.equal(names.value,'민지 * 5, 준호 * 2','manual roster survives quick settings');
names.value='민지 * 1001';setupFrame();assert.equal(confirm.disabled,true);
names.value='민지 * 2';sandbox.window.handlers.focus();assert.equal(confirm.disabled,false);
assert.equal(elements.get('#participantCount').textContent,'1명 · 구슬 2개');
confirm.handlers.click();assert.equal(pendingFrames.size,0,'setup watcher stops when leaving setup');
elements.get('#editParticipants').handlers.click();assert.equal(pendingFrames.size,1);
count.value='3';copies.value='5';elements.get('#generateNames').handlers.click();
count.value='7';count.handlers.input();
assert.equal(elements.get('#participantCount').textContent,'7명 · 구슬 35개','direct number entry updates immediately');
count.value='100';copies.value='1';count.handlers.input();assert.equal(elements.get('#participantCount').textContent,'100명 · 구슬 100개');
let draws=0;golden.choose=balls=>{draws++;return{ballId:balls[0].id,abilityId:'heavy'};};
toggle.checked=false;simulation.reset('pinball',2,0);let game=simulation.state().game;
assert.equal(draws,0,'off skips the lottery');assert.equal(game.golden,null);assert.equal(game.introRemaining,0);
assert.ok(game.balls.every(b=>!b.golden&&!b.mass&&!b.immuneFields));
let timestamp=1000;simulation.frame(timestamp);
const startPositions=game.balls.map(b=>[b.x,b.y]);
function advance(seconds) {for(let i=0;i<Math.round(seconds*120);i++) simulation.frame(timestamp+=1000/120);}
assert.equal(elements.get('#countdownNumber').textContent,'3');advance(1.1);
assert.equal(elements.get('#countdownNumber').textContent,'2');
assert.equal(game.time,0);assert.equal(game.watchdogTime,0);assert.deepEqual(game.balls.map(b=>[b.x,b.y]),startPositions);
elements.get('#pauseRace').handlers.click();const left=game.countdownRemaining;advance(1);
assert.equal(game.countdownRemaining,left,'pause freezes countdown');assert.equal(game.time,0);
elements.get('#pauseRace').handlers.click();advance(1);
assert.equal(elements.get('#countdownNumber').textContent,'1');assert.equal(game.time,0);
advance(1);assert.ok(game.time>0);assert.equal(elements.get('#countdownNumber').textContent,'출발!');
advance(.7);assert.equal(elements.get('#startCountdown').hidden,true);
toggle.checked=true;simulation.reset('spinner',2,0);game=simulation.state().game;assert.equal(draws,1);
timestamp=1000;simulation.frame(timestamp);assert.equal(elements.get('#startCountdown').hidden,true);
advance(2.9);assert.equal(game.introRemaining,0);assert.ok(game.countdownRemaining>2.8);assert.equal(game.time,0);
assert.equal(elements.get('#goldenReveal').hidden,true);assert.equal(elements.get('#startCountdown').hidden,false);
assert.ok(elements.get('#beadInfo').textContent.includes('미니맵'),'auto camera does not retain a stale preparation message');
advance(3.1);assert.ok(game.time>0);
// Rematch retains the option and creates a fresh preparation sequence.
elements.get('#rematch').handlers.click();game=simulation.state().game;
assert.equal(draws,2);assert.equal(game.countdownRemaining,3);assert.equal(game.time,0);
toggle.checked=false;elements.get('#restartDuringRace').handlers.click();game=simulation.state().game;
assert.equal(draws,2);assert.equal(game.golden,null);assert.equal(game.countdownRemaining,3);
assert.equal(elements.get('#goldenBadge').hidden,true);
timestamp=1000;simulation.frame(timestamp);advance(3.1);
let steps=0;while(game.order.length<2&&!game.paused&&steps++<360*120) simulation.step(1/120);
assert.equal(game.order.length,2);assert.equal(elements.get('#goldenResult').hidden,true,'ordinary result has no stale golden event');
elements.get('#rematch').handlers.click();assert.equal(draws,2);assert.equal(simulation.state().game.goldenEnabled,false);
console.log('Final polish: eventless restoration, delayed pageshow, 100-entry count, manual roster preservation, watcher cleanup, event off/on, 3-2-1, pause, reveal ordering and rematch passed');
`;
new Function('require','__dirname',harness+checks)(require,__dirname);
