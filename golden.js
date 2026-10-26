(() => {
  'use strict';
  function choose(balls, random = Math.random) {
    // One race-wide draw, independent of the number of marbles.
    if (!balls.length || random() >= 0.1) return null;
    const abilities=window.MarbleBattle.abilities;
    return { ballId: balls[Math.floor(random() * balls.length)].id, abilityId: abilities[Math.floor(random() * abilities.length)].id };
  }
  function segmentDistance(x, y, s) {
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
    const t = Math.max(0, Math.min(1, ((x - s.x1) * dx + (y - s.y1) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(x - s.x1 - t * dx, y - s.y1 - t * dy);
  }
  function shortcutStart(ball, world, sections, obstacles, balls=[]) {
    const start = sections[1][0];
    for (let y = start + 50; y <= Math.min(start + 500,sections[2][0]-120); y += 30) {
      const bounds = window.MarbleCourse.bounds(y, world);
      const fractions=[.5,.38,.62,.26,.74,.44,.56,.2,.8,...Array.from({length:31},(_,i)=>(i+1)/32)];
      for (const fraction of fractions) {
        const x = bounds.left + (bounds.right - bounds.left) * fraction;
        if (x - ball.r <= bounds.left + 12 || x + ball.r >= bounds.right - 12) continue;
        if (obstacles.pins.some(p => Math.hypot(x-p.x,y-p.y) <= ball.r+p.r+8)) continue;
        if (obstacles.segments.some(s => !s.broken&&segmentDistance(x,y,s) <= ball.r+(s.radius ?? 4.5)+10)) continue;
        if (balls.some(b=>b!==ball&&Math.hypot(x-b.x,y-b.y)<=ball.r+b.r+3)) continue;
        return {x,y};
      }
    }
    return null;
  }
  function activate(choice, game, world, sections, dynamic = {pins:[],segments:[]}) {
    if (!choice) return null;
    const ball = game.balls.find(b=>b.id===choice.ballId), ability = window.MarbleBattle.abilities.find(a=>a.id===choice.abilityId);
    if (!ball || !ability) return null;
    window.MarbleBattle.initGolden(game,world,sections,ball,ability.id,dynamic);
    ball.golden = true; ball.ability = ability.id; ball.abilityName = ability.name;
    ball.originalColor = ball.color; ball.originalLabel = ball.label;
    ball.color = 'hsl(43 94% 54%)';
    return {ball,ability};
  }
  window.GoldenMarble = {get abilities(){return window.MarbleBattle.abilities;},choose,activate,shortcutStart};
})();
