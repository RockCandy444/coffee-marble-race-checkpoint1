(() => {
  'use strict';
  const abilities = [
    { id: 'shortcut', name: '지름길', description: '첫 구간을 건너뛰고 2구간에서 출발해요.' },
    { id: 'heavy', name: '헤비볼', description: '조금 더 빠르게 내려오고, 구슬끼리 부딪힐 때 덜 밀려요.' },
    { id: 'immune', name: '자석·바람 면역', description: '자석과 바람에 흔들리지 않고 달려요.' }
  ];
  function choose(balls, random = Math.random) {
    // One race-wide draw, independent of the number of marbles.
    if (!balls.length || random() >= 0.1) return null;
    return { ballId: balls[Math.floor(random() * balls.length)].id, abilityId: abilities[Math.floor(random() * abilities.length)].id };
  }
  function segmentDistance(x, y, s) {
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
    const t = Math.max(0, Math.min(1, ((x - s.x1) * dx + (y - s.y1) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(x - s.x1 - t * dx, y - s.y1 - t * dy);
  }
  function shortcutStart(ball, world, sections, obstacles) {
    const start = sections[1][0];
    for (let y = start + 50; y <= start + 230; y += 30) {
      const bounds = window.MarbleCourse.bounds(y, world);
      for (const fraction of [.5,.38,.62,.26,.74,.44,.56,.2,.8]) {
        const x = bounds.left + (bounds.right - bounds.left) * fraction;
        if (x - ball.r <= bounds.left + 12 || x + ball.r >= bounds.right - 12) continue;
        if (obstacles.pins.some(p => Math.hypot(x-p.x,y-p.y) <= ball.r+p.r+8)) continue;
        if (obstacles.segments.some(s => segmentDistance(x,y,s) <= ball.r+(s.radius ?? 4.5)+10)) continue;
        return {x,y};
      }
    }
    return null;
  }
  function activate(choice, game, world, sections, dynamic = {pins:[],segments:[]}) {
    if (!choice) return null;
    const ball = game.balls.find(b=>b.id===choice.ballId), ability = abilities.find(a=>a.id===choice.abilityId);
    if (!ball || !ability) return null;
    if (ability.id === 'shortcut') {
      const spot = shortcutStart(ball,world,sections,{pins:game.static.pins.concat(dynamic.pins),segments:game.static.segments.concat(dynamic.segments)});
      // Safely cancel the event if a future course has no clear starting slot.
      if (!spot) return null;
      Object.assign(ball,spot,{prevX:spot.x,prevY:spot.y,maxY:spot.y,vx:0,vy:0});
    } else if (ability.id === 'heavy') {
      ball.mass = 2; ball.gravityScale = 1.28; ball.speedLimit = 375;
    } else ball.immuneFields = true;
    ball.golden = true; ball.ability = ability.id; ball.abilityName = ability.name;
    ball.originalColor = ball.color; ball.originalLabel = ball.label;
    ball.color = 'hsl(43 94% 54%)'; ball.label += ' · ★ ' + ability.name;
    return {ball,ability};
  }
  window.GoldenMarble = {abilities,choose,activate,shortcutStart};
})();
