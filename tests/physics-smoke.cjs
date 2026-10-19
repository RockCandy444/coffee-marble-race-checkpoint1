// Exercise the production simulation with a minimal DOM; no rendering or timing shortcuts in app.js.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const elements = new Map();
function element() {
  return { value: '', hidden: false, textContent: '', children: [], dataset: {}, style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, setAttribute() {}, getContext: () => ({}),
    getBoundingClientRect: () => ({ width: 0, height: 0 }),
    replaceChildren(...children) { this.children = children; },
    append(...children) { this.children.push(...children); }
  };
}
const document = { body: element(), querySelector(selector) { if (!elements.has(selector)) elements.set(selector, element()); return elements.get(selector); }, querySelectorAll: () => [], createElement: element, createDocumentFragment: element };
let seed = 1;
const math = Object.create(Math);
math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const sandbox = { document, Math: math, console, ResizeObserver: class { observe() {} }, requestAnimationFrame: () => 1, cancelAnimationFrame() {} };
sandbox.window = { addEventListener() {}, scrollTo() {} };
const context = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'camera.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'course.js'), 'utf8'), context);
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8').replace(/\}\)\(\);\s*$/, `
  window.simulationTest = {
    reset(map, n, keeperIndex) { selectedMap = map; participants = Array.from({length:n}, (_,i) => 'P' + (i+1)); setUpRace(); if (keeperIndex !== undefined) game.keeper = Course.keepers[keeperIndex]; },
    step: physicsStep,
    state() { return { game, world: WORLD, maps: MAPS, keeper: movingSegments(game.time).find(s => s.goalkeeper) }; }
  };
})();`);
vm.runInContext(app, context);
const simulation = sandbox.window.simulationTest;
const course = sandbox.window.MarbleCourse;
const distribution = [0, 0, 0, 0];
for (let i = 0; i < 10000; i++) distribution[course.keepers.indexOf(course.chooseKeeper(() => (i + 0.5) / 10000))]++;
assert.deepEqual(distribution, [2500, 2500, 2500, 2500]);
for (const [value, index] of [[0,0], [0.249999,0], [0.25,1], [0.5,2], [0.75,3], [0.999999,3]]) assert.equal(course.chooseKeeper(() => value).id, course.keepers[index].id);
const kicked = { vx: 0, vy: 0 };
course.kick(kicked, { id: 'test', kick: 250 }, 1, 0, 1);
assert.equal(kicked.vx, 250);
course.kick(kicked, { id: 'test', kick: 250 }, 1, 0, 1.1);
assert.equal(kicked.vx, 250, 'bumper cooldown must prevent repeated impulses in one contact');
const attracted = { x: 400, y: 400, vx: 0, vy: 0 };
course.field(attracted, { x: 450, y: 400, kind: 'magnet', range: 120, strength: 150 }, 0.1);
assert.ok(attracted.vx > 0);
const blown = { x: 400, y: 400, vx: 0, vy: 0 };
course.field(blown, { x: 450, y: 400, kind: 'wind', range: 120, strength: 230, direction: -1 }, 0.1);
assert.ok(blown.vx < 0);
const outcomes = [];
for (const map of ['pinball', 'spinner', 'fork'].filter(m => !process.env.MARBLE_TEST_MAP || m === process.env.MARBLE_TEST_MAP)) for (const n of [2, 100].filter(n => !process.env.MARBLE_TEST_COUNT || n === Number(process.env.MARBLE_TEST_COUNT))) for (const keeperIndex of [0, 1, 2, 3]) {
  const randomSeed = 11 + keeperIndex * 19;
  seed = randomSeed;
  simulation.reset(map, n, keeperIndex);
  let state = simulation.state();
  assert.equal(state.maps[map].sections.length, 6);
  assert.ok(Math.abs((state.world.finishRight - state.world.finishLeft) / (state.game.balls[0].r * 2) - 2.5) < 1e-10);
  assert.ok(state.keeper && (Number.isFinite(state.keeper.vx) || Number.isFinite(state.keeper.omega)));
  assert.ok(state.game.static.pins.length >= 250, 'dense course must contain at least 250 pin obstacles');
  for (let section = 0; section < 6; section++) {
    for (const kind of ['power', 'magnet', 'wind']) assert.ok(state.game.static.pins.some(p => p.section === section && p.kind === kind), map + ' section ' + section + ' missing ' + kind);
  }
  if (map !== 'pinball') assert.ok(new Set(state.world.sideProfile.map(p=>p.left.toFixed(2))).size > 5);
  const obstacleCount = state.game.static.pins.length;
  let steps = 0;
  while (state.game.order.length !== n && !state.game.paused && steps < 360 * 120 + 1) {
    simulation.step(1 / 120); steps++;
  }
  const { game } = simulation.state();
  const outcome = { map, count: n, keeper: game.keeper.id, obstacles: obstacleCount, seed: randomSeed, finished: game.order.length, seconds: +game.time.toFixed(2), paused: game.autoPaused,
    remaining: game.balls.filter(b => !b.finished).slice(0,12).map(b => ({id:b.id,x:+b.x.toFixed(1),y:+b.y.toFixed(1),rescues:b.rescueCount})) };
  outcomes.push(outcome);
  console.log(JSON.stringify(outcome));
  assert.equal(new Set(game.order.map(b => b.id)).size, game.order.length);
  assert.ok(game.balls.every(b => [b.x,b.y,b.vx,b.vy].every(Number.isFinite)));
  assert.ok(game.order.every((b,i) => i === 0 || b.finishTime >= game.order[i-1].finishTime));
}
console.log(JSON.stringify({total:outcomes.length,passed:outcomes.filter(o => o.finished === o.count).length,keeperIntervals:distribution}));
if (outcomes.some(o => o.finished !== o.count)) process.exitCode = 1;
