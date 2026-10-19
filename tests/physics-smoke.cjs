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
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8').replace(/\}\)\(\);\s*$/, `
  window.simulationTest = {
    reset(map, n) { selectedMap = map; participants = Array.from({length:n}, (_,i) => 'P' + (i+1)); setUpRace(); },
    step: physicsStep,
    state() { return { game, world: WORLD, maps: MAPS, keeper: movingSegments(game.time).find(s => s.goalkeeper) }; }
  };
})();`);
vm.runInContext(app, context);
const simulation = sandbox.window.simulationTest;
const outcomes = [];
for (const map of ['pinball', 'spinner', 'fork']) for (const n of [2, 100]) for (const randomSeed of [11, 29]) {
  seed = randomSeed;
  simulation.reset(map, n);
  let state = simulation.state();
  assert.equal(state.maps[map].sections.length, 6);
  assert.ok(Math.abs((state.world.finishRight - state.world.finishLeft) / (state.game.balls[0].r * 2) - 2.5) < 1e-10);
  assert.ok(state.keeper && Number.isFinite(state.keeper.vx));
  let steps = 0;
  while (state.game.order.length !== n && !state.game.paused && steps < 180 * 120 + 1) {
    simulation.step(1 / 120); steps++;
  }
  const { game } = simulation.state();
  const outcome = { map, count: n, seed: randomSeed, finished: game.order.length, seconds: +game.time.toFixed(2), paused: game.autoPaused,
    remaining: game.balls.filter(b => !b.finished).map(b => ({id:b.id,x:+b.x.toFixed(1),y:+b.y.toFixed(1),rescues:b.rescueCount})) };
  outcomes.push(outcome);
  assert.equal(new Set(game.order.map(b => b.id)).size, game.order.length);
  assert.ok(game.balls.every(b => [b.x,b.y,b.vx,b.vy].every(Number.isFinite)));
  assert.ok(game.order.every((b,i) => i === 0 || b.finishTime >= game.order[i-1].finishTime));
}
console.log(JSON.stringify(outcomes, null, 2));
if (outcomes.some(o => o.finished !== o.count)) process.exitCode = 1;
