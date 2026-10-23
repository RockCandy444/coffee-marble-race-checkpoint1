const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',harness+`
const battle=sandbox.window.MarbleBattle;
// Both edge highways are interrupted in all five pre-funnel sections.
simulation.reset('pinball',2,0);
let {game,world,maps}=simulation.state();
for(let section=0;section<5;section++) {
  const shelves=game.static.segments.filter(s=>s.edgeShelf&&s.section===section);
  assert.equal(shelves.length,section===2?3:2);
  assert.ok(shelves.some(s=>s.x1===20||s.x1===980),'a wall-joined shelf each section');
  assert.ok(game.static.pins.some(p=>p.edgeBumper&&p.section===section),'edge bumpers each section');
  for(const s of shelves) {
    assert.ok(s.y2>s.y1&&s.x1>=20&&s.x1<=980,'boards slope into the course');
    if(s.x1!==20&&s.x1!==980) {
      const opening=Math.min(s.x1-20,980-s.x1)-s.radius;
      assert.equal(opening,35);assert.ok(opening>2*game.balls[0].r+8,'lucky slot fits largest marble');
    }
  }
}
console.log(JSON.stringify({pinballEdgeShelves:game.static.segments.filter(s=>s.edgeShelf).length,edgeBumpers:game.static.pins.filter(p=>p.edgeBumper).length}));
// A 100-way shortcut assignment must use distinct clear slots in section two.
elements.get('#raceMode').value='battle';
for(const map of ['pinball','spinner','fork']) {
  seed=44;simulation.reset(map,100,0);({game,world,maps}=simulation.state());
  game.balls.forEach((b,i)=>{Object.assign(b,{x:60+i*8,y:70});battle.assign(game,b,'shortcut');});
  battle.placeShortcuts(game,simulation.dynamics());
  const env=simulation.dynamics();
  for(const ball of game.balls) {
    assert.equal(ball.battle.startPending,false,map+' shortcut found a clear start');
    assert.ok(ball.y>=maps[map].sections[1][0]&&ball.y<maps[map].sections[2][0]);
    assert.equal(ball.prevY,ball.y);assert.equal(ball.vx,0);assert.equal(ball.vy,0);
    assert.equal(battle.clearAt(ball,ball.x,ball.y,game,env),true,map+' non-overlapping start');
  }
  game.time=20;battle.tick(game,.01,env);
  assert.ok(game.balls.every(b=>b.mass===1&&b.gravityScale===1&&b.speedLimit===340&&!b.immuneFields&&b.r===b.baseR));
  assert.equal(game.battle.activations.shortcut,undefined,'shortcut is a start-only benefit');
}
// Golden attacks affect ordinary receivers without granting those receivers abilities.
elements.get('#raceMode').value='normal';
golden.choose=balls=>({ballId:balls[0].id,abilityId:'bumper'});
simulation.reset('pinball',3,0);({game,world}=simulation.state());
const [a,b]=game.balls;
assert.equal(elements.get('#raceTitle').textContent,'핀볼 코스');
assert.equal(battle.caption(b),'');assert.equal(battle.label(b),b.label);
Object.assign(a,{x:450,y:1000});Object.assign(b,{x:470,y:1000,vx:0});
game.time=10;battle.fire(game,a,'bumper',{pins:[],segments:[]});battle.contact(game,a,b,1,0);
assert.ok(b.vx>100);assert.equal(b.battle.id,null);assert.ok(b.battle.controlGrace>game.time);
// Mimic has a temporary random fallback when ordinary competitors have no power to copy.
battle.assign(game,a,'mimic');assert.equal(battle.fire(game,a,'mimic',{pins:[],segments:[]},()=>0),true);
assert.equal(a.battle.borrowId,'ghost');game.time+=2.3;battle.tick(game,.01,{pins:[],segments:[]});assert.equal(a.battle.borrowId,undefined);
// A mid-race reroll cannot turn a start-only shortcut into repeated teleports.
battle.assign(game,a,'reroll');a.y=game.battle.sections[2][0]+5;
battle.tick(game,.01,{pins:[],segments:[]},()=>.99999);assert.notEqual(a.battle.id,'shortcut');
golden.choose=()=>null;simulation.reset('pinball',3,0);
assert.equal(simulation.state().game.battle,undefined);assert.ok(simulation.state().game.balls.every(b=>!b.battle));
console.log('V17: edge coverage, 300 clear shortcut starts, no persistent shortcut buff, golden-only powers/attacks, ordinary UI, mimic fallback and clean reset passed');
`)(require,__dirname);
