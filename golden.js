(() => {
  'use strict';
  function choose(balls, random = Math.random) {
    // One race-wide draw, independent of the number of marbles.
    if (!balls.length || random() >= 0.1) return null;
    const abilities=window.MarbleBattle.abilities;
    const ballId=balls[Math.floor(random()*balls.length)].id,roll=random();
    return {ballId,abilityId:roll<.15?'comet':abilities[Math.min(abilities.length-1,Math.floor((roll-.15)/.85*abilities.length))].id};
  }
  function segmentDistance(x, y, s) {
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
    const t = Math.max(0, Math.min(1, ((x - s.x1) * dx + (y - s.y1) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(x - s.x1 - t * dx, y - s.y1 - t * dy);
  }
  function shortcutStart(ball, world, sections, obstacles, balls=[], random=Math.random) {
    const start = sections[1][0],groups=[[],[]];
    for (let y = start + 50; y <= Math.min(start + 500,sections[2][0]-120); y += 30) {
      const bounds = window.MarbleCourse.bounds(y, world);
      for(let i=1;i<32;i++)groups[y<=start+200?0:1].push({x:bounds.left+(bounds.right-bounds.left)*i/32,y});
    }
    // Randomize every candidate before testing: no center-first or left-first fallback bias.
    for(const group of groups)for(let i=group.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[group[i],group[j]]=[group[j],group[i]];}
    // Keep the start band near section two; deeper rows only recover blocked/crowded starts.
    for (const {x,y} of groups.flat()) {
        const bounds=window.MarbleCourse.bounds(y,world);
        if (x - ball.r <= bounds.left + 12 || x + ball.r >= bounds.right - 12) continue;
        if (window.HiddenCourses&&!window.HiddenCourses.inside(x,y,ball.r,world)) continue;
        if ((obstacles.solids||[]).some(s=>Math.abs(x-s.x)/s.rx+Math.abs(y-s.y)/s.ry<=1)) continue;
        if (obstacles.pins.some(p => window.MarbleCourse.pinContact({x,y,r:ball.r+8},p))) continue;
        if (obstacles.segments.some(s => !s.broken&&segmentDistance(x,y,s) <= ball.r+(s.radius ?? 4.5)+10)) continue;
        if (balls.some(b=>b!==ball&&Math.hypot(x-b.x,y-b.y)<=ball.r+b.r+3)) continue;
        return {x,y};
    }
    return null;
  }
  function activate(choice, game, world, sections, dynamic = {pins:[],segments:[]}) {
    if (!choice) return null;
    const ball = game.balls.find(b=>b.id===choice.ballId), ability = window.MarbleBattle.byId.get(choice.abilityId);
    if (!ball || !ability || ability.id===null) return null;
    window.MarbleBattle.initGolden(game,world,sections,ball,ability.id,dynamic);
    ball.golden = true; ball.ability = ability.id; ball.abilityName = ability.name;
    ball.originalColor = ball.color; ball.originalLabel = ball.label;
    ball.color = 'hsl(43 94% 54%)';
    return {ball,ability};
  }
  window.GoldenMarble = {get abilities(){return window.MarbleBattle.abilities;},choose,activate,shortcutStart};
})();
