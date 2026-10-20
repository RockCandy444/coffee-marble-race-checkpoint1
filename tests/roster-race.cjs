// Reuse the production simulation harness without its full standard-race matrix.
const fs = require('node:fs');
const path = require('node:path');
const harness = fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
const checks = `
for (const map of ['pinball','spinner','fork']) {
  seed = 11;
  const names = sandbox.window.MarbleRoster.parse('홍길동*5,김민지,이준호*2').names;
  simulation.resetNames(map,names);
  const {game}=simulation.state();
  assert.equal(game.balls.length,8);
  assert.equal(new Set(game.balls.slice(0,5).map(b=>b.color)).size,1);
  assert.equal(new Set(game.balls.slice(0,5).map(b=>b.pattern)).size,1);
  assert.equal(game.balls[4].label,'홍길동 · 5/5번 구슬');
  assert.equal(game.balls[7].label,'이준호 · 2/2번 구슬');
  let steps=0;
  while(game.order.length<8 && !game.paused && steps++<360*120) simulation.step(1/120);
  assert.equal(game.order.length,8,map+' handicap race must finish');
  assert.equal(elements.get('#finalRanking').children.length,8);
  assert.ok(elements.get('#resultSubtitle').textContent.includes('3명 · 구슬 8개'));
  const last=game.order.at(-1);
  assert.equal(elements.get('#coffeeWinner').textContent,'#'+last.id+' '+last.label);
  console.log(JSON.stringify({map,people:3,marbles:8,finished:game.order.length,winner:last.label,seconds:+game.time.toFixed(2)}));
}
simulation.resetNames('pinball',sandbox.window.MarbleRoster.parse('홍길동*100').names);
const oneOwner = simulation.state().game.balls;
assert.equal(oneOwner.length,100);
assert.equal(new Set(oneOwner.map(b=>b.color)).size,1);
assert.equal(new Set(oneOwner.map(b=>b.pattern)).size,1);
assert.equal(oneOwner.at(-1).label,'홍길동 · 100/100번 구슬');
console.log('Three handicap races, result ownership, appearance and 100-marble owner passed');
`;
new Function('require','__dirname',harness+checks)(require,__dirname);
