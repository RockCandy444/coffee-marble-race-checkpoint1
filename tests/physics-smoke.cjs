// Exercise the production simulation with a minimal DOM; no rendering or timing shortcuts in app.js.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const elements = new Map();
function element() {
  return { value: '', checked: true, hidden: false, textContent: '', children: [], dataset: {}, style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, setAttribute() {}, getContext: () => ({}),
    getBoundingClientRect: () => ({ width: 0, height: 0 }),
    replaceChildren(...children) { this.children = children; },
    append(...children) { this.children.push(...children); }
  };
}
const document = { body: element(), addEventListener() {}, querySelector(selector) { if (!elements.has(selector)) elements.set(selector, element()); return elements.get(selector); }, querySelectorAll: () => [], createElement: element, createDocumentFragment: element };
let seed = 1;
const math = Object.create(Math);
math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const sandbox = { document, Math: math, console, ResizeObserver: class { observe() {} }, requestAnimationFrame: () => 1, cancelAnimationFrame() {} };
sandbox.window = { addEventListener() {}, scrollTo() {} };
const context = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'camera.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'course.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'roster.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'golden.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'battle.js'), 'utf8'), context);
const golden = sandbox.window.GoldenMarble;
// The baseline matrix deliberately exercises the ordinary race branch.
golden.choose = () => null;
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8').replace(/\}\)\(\);\s*$/, `
  window.simulationTest = {
    reset(map, n, keeperIndex) { selectedMap = map; participants = Array.from({length:n}, (_,i) => 'P' + (i+1)); setUpRace(); if (keeperIndex !== undefined) game.keeper = Course.keepers[keeperIndex]; },
    resetNames(map, names) { selectedMap = map; participants = names; setUpRace(); },
    step: physicsStep,
    collide: collideBalls,
    dynamics() { return {pins:movingPins(0),segments:movingSegments(0)}; },
    frame(timestamp) { const render=drawTrack; drawTrack=()=>{}; canvas.width=600; canvas.height=400; animationFrame(timestamp); drawTrack=render; },
    state() { return { game, world: WORLD, maps: MAPS, keeper: movingSegments(game.time).find(s => s.goalkeeper) }; }
  };
})();`);
vm.runInContext(app, context);
const simulation = sandbox.window.simulationTest;
const course = sandbox.window.MarbleCourse;
// Manual camera movement must hold its position as the race advances, including paused frames.
const camera = new sandbox.window.RaceCamera();
const cameraGame = { balls: [{id:1,x:700,y:800}], order: [], time: 0 };
const cameraWorld = {width:1000,height:7800,finishY:7740};
camera.zoom = 3;
camera.update(cameraGame, cameraWorld, 600, 400, 1);
camera.moveTo(650, 5053);
camera.update(cameraGame, cameraWorld, 600, 400, 1/120);
assert.equal(camera.mode, 'manual'); assert.equal(camera.y, 5053);
const heldX = camera.x;
camera.pan(100, -50);
camera.update(cameraGame, cameraWorld, 600, 400, 1/120);
assert.ok(camera.x < heldX && camera.y > 5053);
const heldY = camera.y;
cameraGame.time = 40; cameraGame.balls[0].y = 6000;
camera.update(cameraGame, cameraWorld, 600, 400, 1);
assert.equal(camera.y, heldY);
const center = camera.toWorld(300,200);
assert.ok(Math.abs(center.x-camera.x)<1e-8 && Math.abs(center.y-camera.y)<1e-8);
camera.moveTo(-10000,10000); camera.update(cameraGame,cameraWorld,600,400,1);
assert.ok(camera.left >= -15 && camera.top + camera.visibleHeight <= 7815);
camera.mode='auto'; camera.update(cameraGame,cameraWorld,600,400,1);
assert.ok(camera.y < 7000, 'automatic tracking resumes');
// Reproduce the reported slider pocket with both marble sizes and impulses in both directions.
for (const n of [2,100]) for (const random of [() => 0.1, () => 0.9]) {
  seed = 123; simulation.reset('spinner', n, 0);
  const {game} = simulation.state();
  const magnet = game.static.pins.find(p=>p.kind==='magnet' && p.section===3 && p.y>4900);
  assert.equal(magnet.x,342);
  const distance = Math.hypot(395-magnet.x, 5060-magnet.y);
  assert.ok(distance > magnet.r + 8 + 2*11.2, 'full slider sweep leaves a maximum-marble passage');
  const ball = game.balls[0];
  game.balls = [ball];
  Object.assign(ball,{x:655.98,y:5060-8-ball.r-0.1,vx:0,vy:0,maxY:5060,stallTime:20,rescueCount:4});
  const initialY = ball.y;
  course.rescue(ball,game.time,random);
  assert.ok(ball.vy<=-320 && Math.abs(ball.vx)>=280 && Math.hypot(ball.vx,ball.vy)>420);
  const before = ball.vx;
  course.field(ball,{x:ball.x+50,y:ball.y,kind:'magnet',range:120,strength:150},0.1);
  assert.equal(ball.vx,before,'brief grace prevents immediate reattachment to magnet');
  for (let i=0;i<120*35 && ball.y<initialY+150;i++) simulation.step(1/120);
  assert.ok(ball.y>initialY+150,'rescued marble must pass the reported gate with production collisions');
  while (game.time < 1.5) simulation.step(1/120);
  assert.equal(ball.magnetGrace,0,'magnet grace expires normally');
}
console.log('Camera hold/pan/bounds/return, slider clearance and four trapped-marble rescue cases passed');
const distribution = [0, 0, 0, 0];
for (let i = 0; i < 10000; i++) distribution[course.keepers.indexOf(course.chooseKeeper(() => (i + 0.5) / 10000))]++;
assert.deepEqual(distribution, [2500, 2500, 2500, 2500]);
for (const [value, index] of [[0,0], [0.249999,0], [0.25,1], [0.5,2], [0.75,3], [0.999999,3]]) assert.equal(course.chooseKeeper(() => value).id, course.keepers[index].id);
const kicked = { vx: 0, vy: 0 };
course.kick(kicked, { id: 'test', kick: 250 }, 1, 0, 1);
assert.equal(kicked.vx, 250);
course.kick(kicked, { id: 'test', kick: 250 }, 1, 0, 1.1);
assert.equal(kicked.vx, 250, 'bumper cooldown must prevent repeated impulses in one contact');
const attracted = { x: 400, y: 400, r: 10, vx: 0, vy: 0 };
course.field(attracted, { x: 450, y: 400, r: 14, kind: 'magnet', range: 120, strength: 175 }, 0.1);
assert.ok(attracted.vx > 0);
const blown = { x: 400, y: 400, vx: 0, vy: 0 };
course.field(blown, { x: 450, y: 400, kind: 'wind', range: 120, strength: 270, direction: -1 }, 0.1);
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
  const walls = state.game.static.segments.filter(s=>s.sideWall);
  assert.ok(walls.every(s=>s.radius===course.wallRadius), 'outer walls have one constant thickness');
  assert.ok(state.game.static.segments.every(s=>(s.radius ?? 4.5)===course.wallRadius), 'fixed partitions match the outer wall thickness');
  for (const side of ['left','right']) {
    const wall = course.wallPath(state.world,side);
    assert.equal(wall.length,state.world.sideProfile.length+2);
    assert.equal(wall.at(-1).y,state.world.bottom);
    const offset = side==='left' ? -course.wallRadius : course.wallRadius;
    state.world.sideProfile.forEach((p,i)=>assert.equal(wall[i].x,p[side]+offset));
  }
  assert.ok(course.outline(state.world).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
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
