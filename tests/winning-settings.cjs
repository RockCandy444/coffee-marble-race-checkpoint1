const fs=require('node:fs'),path=require('node:path');
let h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
h=h.replace('addEventListener() {}','addEventListener(type, callback) { (this.handlers ??= {})[type] = callback; }');
h=h.replace('step: physicsStep,','ui: updateLiveUI, step: physicsStep,');
new Function('require','__dirname',h+`
const names=elements.get('#namesInput'),copies=elements.get('#ballsPerPerson'),mode=elements.get('#winnerMode'),rank=elements.get('#winnerRank'),confirm=elements.get('#confirmParticipants');
names.value='홍길동*2,민지,홍길동';names.handlers.input();
copies.value='3';copies.handlers.input();assert.equal(names.value,'홍길동 * 3\\n민지 * 3');
elements.get('#copiesUp').handlers.click();assert.equal(names.value,'홍길동 * 4\\n민지 * 4');
elements.get('#copiesDown').handlers.click();assert.equal(names.value,'홍길동 * 3\\n민지 * 3');
const saved=names.value;copies.value='501';copies.handlers.input();assert.equal(names.value,saved);assert.equal(confirm.disabled,true);
copies.value='3';copies.handlers.input();assert.equal(confirm.disabled,false);assert.equal(names.value,'홍길동 * 3\\n민지 * 3');
mode.value='custom';rank.value='7';mode.handlers.change();assert.equal(confirm.disabled,true);
rank.value='4';rank.handlers.input();assert.equal(confirm.disabled,false);confirm.handlers.click();
simulation.resetNames('pinball',['홍길동','홍길동','홍길동','민지','민지','민지']);let g=simulation.state().game;assert.equal(g.winningRank,4);
// A later form edit cannot alter the race's agreed winning rank.
rank.value='1';assert.equal(g.winningRank,4);
let steps=0;while(!g.paused&&steps++<360*120)simulation.step(1/120);
assert.equal(g.order.length,6);assert.equal(elements.get('#coffeeWinner').textContent,'#'+g.order[3].id+' '+g.order[3].label);
const ranking=elements.get('#finalRanking').children;
assert.ok(ranking[3].children.some(c=>c.className==='rank-note'));assert.ok(!ranking[5].children.some(c=>c.className==='rank-note'));
assert.ok(elements.get('#resultSubtitle').textContent.includes('4등'));
mode.value='first';simulation.reset('spinner',4,0);g=simulation.state().game;
steps=0;while(!g.paused&&steps++<360*120)simulation.step(1/120);
assert.equal(g.order.length,4);assert.equal(g.winningRank,1);assert.equal(elements.get('#coffeeWinner').textContent,'#'+g.order[0].id+' '+g.order[0].label);
mode.value='last';simulation.reset('fork',4,0);assert.equal(simulation.state().game.winningRank,4);
// Quick generation accepts the new upper bound and rejects 1,001 without losing names.
elements.get('#countInput').value='1000';copies.value='1';elements.get('#generateNames').handlers.click();assert.equal(sandbox.window.MarbleRoster.parse(names.value).names.length,1000);
assert.ok(names.value.endsWith('참가자 1000 * 1'));const thousand=names.value;
elements.get('#countInput').value='1001';elements.get('#generateNames').handlers.click();assert.equal(names.value,thousand);assert.equal(confirm.disabled,true);
simulation.reset('pinball',1000,0);g=simulation.state().game;g.order=g.balls.slice(0,950);g.order.forEach(b=>b.finished=true);simulation.ui();
const live=elements.get('#liveOrder').children[0].children;assert.equal(live.length,100);assert.equal(live[0].children[0].textContent,'851');assert.equal(live[99].children[0].textContent,'950');
console.log('Manual roster steppers, limit preservation, custom rank validation, race snapshot, first/fourth/last winner passed');
`)(require,__dirname);
