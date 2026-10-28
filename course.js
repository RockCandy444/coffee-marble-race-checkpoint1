(() => {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const wallRadius = 4.5;
  const verticalScale = 3;
  function wallPath(world, side, radius = wallRadius) {
    if(world.exitGates)return window.HiddenCourses.outerPath(world,side,radius);
    const offset = side === 'left' ? -radius : radius;
    const gate = side === 'left' ? world.finishLeft : world.finishRight;
    return [...world.sideProfile.map(point => ({ x: point[side] + offset, y: point.y })),
      { x: gate + offset, y: world.funnelKnee }, { x: gate + offset, y: world.bottom }];
  }
  function outline(world) { return [...wallPath(world, 'left', 0), ...wallPath(world, 'right', 0).reverse()]; }
  const keepers = [
    { id: 'slider', name: '슬라이딩 골키퍼' },
    { id: 'rotor', name: '회전 방패' },
    { id: 'doors', name: '쌍문 수문장' },
    { id: 'pendulum', name: '진자 골키퍼' }
  ];
  const chooseKeeper = (random = Math.random) => keepers[Math.min(3, Math.floor(random() * 4))];

  function configure(world, map) {
    world.exitGates=null;
    world.riftIslands=[];
    world.funnelY = world.height - 1120;
    world.funnelKnee = world.height - 170;
    if(window.HiddenCourses?.has(map)){window.HiddenCourses.configure(world,map);return;}
    if(window.ExtraCourses?.has(map)){window.ExtraCourses.configure(world,map);return;}
    world.sideProfile = Array.from({ length: 25 }, (_, i) => {
      const t = i / 24, y = world.funnelY * t;
      const entry = Math.min(1, y / 550);
      const left = map === 'pinball' ? 20 : 20 + entry * (map === 'spinner' ? 65 + 100 * Math.sin(t * Math.PI * 4) ** 2 : 35 + 185 * Math.sin(t * Math.PI * 3) ** 2);
      const right = map === 'pinball' ? 980 : 980 - entry * (map === 'spinner' ? 40 + 130 * Math.sin(t * Math.PI * 3.5 + 0.7) ** 2 : 45 + 165 * Math.sin(t * Math.PI * 4 + 1.1) ** 2);
      return { y, left, right };
    });
  }
  function bounds(y, world) {
    if (y >= world.funnelY) {
      if(world.exitGates){const a=window.HiddenCourses.laneBounds(-1000,y,world),b=window.HiddenCourses.laneBounds(2000,y,world);return{left:a.left,right:b.right,leftSlope:a.leftSlope,rightSlope:b.rightSlope};}
      const start = world.sideProfile.at(-1);
      const span = world.funnelKnee - world.funnelY;
      const t = clamp((y - world.funnelY) / span, 0, 1);
      return { left: start.left + (world.finishLeft - start.left) * t, right: start.right + (world.finishRight - start.right) * t,
        leftSlope: t < 1 ? (world.finishLeft - start.left) / span : 0, rightSlope: t < 1 ? (world.finishRight - start.right) / span : 0 };
    }
    const index = clamp(Math.floor(y / world.funnelY * (world.sideProfile.length-1)), 0, world.sideProfile.length-2);
    const a = world.sideProfile[index], b = world.sideProfile[index + 1];
    const t = clamp((y - a.y) / (b.y - a.y), 0, 1);
    return { left: a.left + (b.left - a.left) * t, right: a.right + (b.right - a.right) * t,
      leftSlope: (b.left - a.left) / (b.y - a.y), rightSlope: (b.right - a.right) / (b.y - a.y) };
  }
  function contain(ball, world) {
    window.HiddenCourses?.containStructure(ball,world);
    const b = window.HiddenCourses?.laneBounds(ball.x,ball.y,world)||bounds(ball.y, world);
    if (ball.x - ball.r < b.left) {
      ball.x = b.left + ball.r;
      const length = Math.hypot(1, b.leftSlope), nx = 1 / length, ny = -b.leftSlope / length;
      const toward = ball.vx * nx + ball.vy * ny;
      if (toward < 0) { ball.vx -= 1.5 * toward * nx; ball.vy -= 1.5 * toward * ny; }
    }
    if (ball.x + ball.r > b.right) {
      ball.x = b.right - ball.r;
      const length = Math.hypot(1, b.rightSlope), nx = -1 / length, ny = b.rightSlope / length;
      const toward = ball.vx * nx + ball.vy * ny;
      if (toward < 0) { ball.vx -= 1.5 * toward * nx; ball.vy -= 1.5 * toward * ny; }
    }
  }
  function distanceToSegment(x, y, s) {
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
    const t = clamp(((x - s.x1) * dx + (y - s.y1) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return Math.hypot(x - s.x1 - t * dx, y - s.y1 - t * dy);
  }
  function enrich(pins, segments, map, world, sections) {
    pins.forEach(pin => { pin.y *= verticalScale; });
    segments.forEach(segment => { segment.y1 *= verticalScale; segment.y2 *= verticalScale; });
    if(map==='pinball') {
      // Sloping shelves interrupt both edge highways; some leave a lucky narrow slot.
      sections.slice(0,-1).forEach(([start],section)=>{
        if(section===2)return; // Three original slides already alternate across this section.
        const end=sections[section+1][0];
        for(let k=0;k<2;k++) {
          const left=(section+k)%2===0,y=section===4?(k===0?2810:2985)*verticalScale:start+(end-start)*(.28+k*.4);
          const b=bounds(y,world),gap=(section+k)%3===0?35:0,radius=wallRadius;
          segments.push({x1:left?b.left+gap+ (gap?radius:0):b.right-gap-(gap?radius:0),y1:y,
            x2:section===4?(left?440:580):(left?540:460),y2:y+(section===4?70:125),radius,edgeShelf:true,section});
        }
      });
      // Keep inherited pins and later grids clear of board surfaces and their exit tips.
      // A pin resting just above a sloped board otherwise forms a closed pocket.
      for(let i=pins.length-1;i>=0;i--)if(segments.some(s=>distanceToSegment(pins[i].x,pins[i].y,s)<pins[i].r+wallRadius+45))pins.splice(i,1);
    }
    function clear(x, y, r) {
      const b = bounds(y, world);
      // Leave room for moving defenders to sweep without forming pockets with fixed pins.
      if ([world.funnelY + 180, world.funnelY + 540].some(row => Math.abs(y - row) < r + 90)) return false;
      return x - r > b.left + 28 && x + r < b.right - 28
        && pins.every(p => Math.hypot(p.x - x, p.y - y) > p.r + r + 28)
        && segments.every(s => distanceToSegment(x, y, s) > r + (s.radius ?? 5) + (map==='pinball'?45:24));
    }
    sections.forEach(([start], section) => {
      const end = Math.min((sections[section + 1]?.[0] ?? world.funnelKnee) - 100, world.funnelKnee - 120);
      if(map==='pinball'&&section<sections.length-1)for(let row=0;row<4;row++)for(const side of ['left','right']) {
        const y=start+160+(end-start-260)*row/3,b=bounds(y,world),r=13+(row+section)%3*4;
        const x=side==='left'?b.left+31+r:b.right-31-r;
        if(clear(x,y,r))pins.push({x,y,r,bumper:true,edgeBumper:true,section});
      }
      // Reserve seven distinct effect obstacles in every section before filling the grid.
      ['power', 'magnet', 'wind', 'power', 'magnet', 'wind', 'power'].forEach((kind, k) => {
        const baseY = start + 140 + (end - start - 280) * k / 6;
        const r = kind === 'power' ? 18 + (section + k) % 3 * 6 : 14 + k % 2 * 3;
        let placed = false;
        for (const offset of [0, 45, -45, 85]) {
          const y = baseY + offset, b = bounds(y, world);
          for (let attempt = 0; attempt < 9; attempt++) {
            const fraction = 0.13 + ((k * 3 + attempt * 2 + section) % 9) / 8 * 0.74;
            // Keep the right middle-gate magnet clear of the slider's full sweep (395..985).
            const x = map === 'spinner' && section === 3 && k === 4
              ? 342 : b.left + (b.right - b.left) * fraction;
            if (!clear(x, y, r)) continue;
            if(map==='pinball'&&kind!=='power'&&segments.some(s=>!s.sideWall&&distanceToSegment(x,y,s)<150))continue;
            pins.push({ x, y, r, kind, bumper: true, section, kick: kind === 'power' ? 220 + k % 3 * 25 : 0,
              range: kind === 'power' ? 0 : 120, strength: kind === 'magnet' ? 420 : 270, direction: (k + section) % 2 ? 1 : -1, defender: section === sections.length - 1 });
            placed = true; break;
          }
          if (placed) break;
        }
      });
      for (let y = start + 90, row = 0; y < end; y += 105, row++) {
        const b = bounds(y, world), span = b.right - b.left;
        const columns = Math.min(10, Math.max(2, Math.floor((span - 100) / 66)));
        for (let col = 0; col < columns; col++) {
          // A wandering open lane prevents a solid row across the track.
          if (col === (row + section) % columns) continue;
          const x = b.left + 55 + (span - 110) * (col + 0.5) / columns;
          const r = 6 + (row + col + section) % 4 * 2.5;
          if (clear(x, y, r)) pins.push({ x, y, r, bumper: (row + col) % 4 === 0, section, defender: section === sections.length - 1 });
        }
      }
    });
    // Remove old assets stranded outside the new variable walls.
    for (let i = pins.length - 1; i >= 0; i--) {
      const b = bounds(pins[i].y, world);
      if (pins[i].x - pins[i].r < b.left + 8 || pins[i].x + pins[i].r > b.right - 8) pins.splice(i, 1);
    }
    pins.forEach((pin, i) => {
      pin.id = 'pin-' + i;
      pin.section ??= Math.max(0, sections.findLastIndex(([y]) => pin.y >= y));
    });
    world.sideProfile.slice(1).forEach((b, i) => {
      const a = world.sideProfile[i], radius = wallRadius;
      segments.push({ x1: a.left - radius, y1: a.y, x2: b.left - radius, y2: b.y, radius, sideWall: true });
      segments.push({ x1: a.right + radius, y1: a.y, x2: b.right + radius, y2: b.y, radius, sideWall: true });
    });
  }
  function buckets(obstacles) {
    const result = new Map();
    function add(type, value, min, max) {
      for (let key = Math.floor((min - 12) / 160); key <= Math.floor((max + 12) / 160); key++) {
        if (!result.has(key)) result.set(key, { pins: [], segments: [], fields: [] });
        result.get(key)[type].push(value);
      }
    }
    obstacles.pins.forEach(pin => { add('pins', pin, pin.y - pin.r, pin.y + pin.r); if (pin.range) add('fields', pin, pin.y - pin.range, pin.y + pin.range); });
    obstacles.segments.forEach(s => add('segments', s, Math.min(s.y1, s.y2) - (s.radius ?? 5), Math.max(s.y1, s.y2) + (s.radius ?? 5)));
    return result;
  }
  function field(ball, source, dt) {
    if (ball.immuneFields && (source.kind === 'magnet' || source.kind === 'wind')) return;
    if (source.kind === 'magnet' && ball.magnetGrace > 0) return;
    const dx = source.x - ball.x, dy = source.y - ball.y, distance = Math.hypot(dx, dy);
    if (!distance || distance >= source.range) return;
    const force = source.strength * (1 - distance / source.range);
    if (source.kind === 'magnet') {
      // Fade attraction over the last 18 units before contact so a stronger field lets marbles slide past its surface.
      const attraction = force * clamp((distance - ball.r - (source.r ?? 0)) / 18, 0, 1);
      ball.vx += dx / distance * attraction * dt;
      ball.vy += (dy / distance * attraction * 0.2 + 25) * dt;
    }
    else { ball.vx += source.direction * force * dt; ball.vy += 40 * dt; }
  }
  function kick(ball, pin, nx, ny, time) {
    if (!pin.kick) return;
    ball.bumperHits ??= {};
    if (time - (ball.bumperHits[pin.id] ?? -1) < 0.3) return;
    ball.bumperHits[pin.id] = time;
    ball.vx += nx * pin.kick; ball.vy += ny * pin.kick;
    ball.boostUntil = time + 0.4; pin.flashUntil = time + 0.18;
  }
  function rescue(ball, time, random = Math.random) {
    const direction = random() < 0.5 ? -1 : 1;
    ball.vx = direction * (280 + random() * 80);
    ball.vy = -(320 + random() * 80);
    ball.boostUntil = time + 1.4;
    ball.magnetGrace = 1.4;
    ball.stallTime = 0; ball.noProgressTime = 0; ball.rescueCount = 0;
  }
  function goalkeeper(type, time, diameter, world) {
    const mid = world.width / 2, gap = world.finishRight - world.finishLeft, y = world.finishY - 45;
    const radius = Math.max(2, diameter * 0.16);
    if (type.id === 'rotor') {
      const angle = time * 1.4, half = diameter * 0.68;
      // The rotating shield also sweeps completely clear of the throat periodically.
      const cx = mid + Math.sin(time * 0.7) * gap * 0.95;
      return [{ x1: cx - Math.cos(angle) * half, y1: y - Math.sin(angle) * half, x2: cx + Math.cos(angle) * half, y2: y + Math.sin(angle) * half,
        cx, cy: y, vx: Math.cos(time * 0.7) * gap * 0.95 * 0.7, omega: 1.4, rotating: true, radius, goalkeeper: true }];
    }
    if (type.id === 'doors') {
      const opening = diameter * 0.3 + (gap + diameter * 0.8) * (1 + Math.sin(time * 1.45)) / 2;
      const speed = (gap + diameter * 0.8) * Math.cos(time * 1.45) * 1.45 / 4;
      return [
        { x1: world.finishLeft - diameter * 1.2, y1: y, x2: mid - opening / 2, y2: y, radius, vx: -speed, goalkeeper: true },
        { x1: mid + opening / 2, y1: y, x2: world.finishRight + diameter * 1.2, y2: y, radius, vx: speed, goalkeeper: true }
      ];
    }
    const amplitude = gap * (type.id === 'pendulum' ? 0.85 : 0.9), speed = type.id === 'pendulum' ? 1.25 : 1.65;
    const cx = mid + Math.sin(time * speed) * amplitude;
    if (type.id === 'pendulum') return [{ x1: cx, y1: y - 10 + Math.cos(time * speed * 2) * 10, x2: cx, y2: y,
      radius: diameter * 0.43, vx: Math.cos(time * speed) * amplitude * speed, vy: -20 * speed * Math.sin(time * speed * 2), circle: true, goalkeeper: true }];
    return [{ x1: cx - diameter * 0.55, y1: y, x2: cx + diameter * 0.55, y2: y, radius, vx: Math.cos(time * speed) * amplitude * speed, goalkeeper: true }];
  }
  function defenders(time, world) {
    const result = [];
    for (let row = 0; row < 2; row++) {
      const y = world.funnelY + 180 + row * 360, b = bounds(y, world), width = b.right - b.left;
      for (let side = 0; side < 2; side++) {
        const phase = time * 0.8 + row * 1.7 + side * Math.PI;
        const cx = b.left + width * (side ? 0.72 : 0.28) + Math.sin(phase) * width * 0.07;
        const half = Math.min(100, width * 0.12);
        result.push({ x1: cx - half, y1: y - 45, x2: cx + half, y2: y + 45, radius: 6 + row * 2, vx: Math.cos(phase) * width * 0.07 * 0.8, defender: true });
      }
    }
    return result;
  }
  function drawField(ctx, pin, time) {
    if (!pin.range) return;
    ctx.save(); ctx.strokeStyle = pin.kind === 'magnet' ? '#9274c9' : '#59acbb'; ctx.fillStyle = pin.kind === 'magnet' ? 'rgba(146,116,201,.055)' : 'rgba(89,172,187,.06)';
    ctx.lineWidth = 2; ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.arc(pin.x, pin.y, pin.range, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function drawPinSymbol(ctx, pin, time) {
    if (pin.kind) {
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = '800 ' + Math.max(12, pin.r) + 'px sans-serif';
      ctx.fillText(pin.kind === 'power' ? '⚡' : pin.kind === 'magnet' ? 'M' : (pin.direction > 0 ? '→' : '←'), pin.x, pin.y);
      if ((pin.flashUntil ?? 0) > time) { ctx.strokeStyle = '#ff9d36'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(pin.x, pin.y, pin.r + 7 + (pin.flashUntil - time) * 35, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    } else if (pin.defender) { ctx.strokeStyle = '#426a91'; ctx.lineWidth = 2.5; ctx.stroke(); }
  }
  window.MarbleCourse = { wallRadius, verticalScale, wallPath, outline, keepers, chooseKeeper, configure, bounds, contain, enrich, buckets, field, kick, rescue, goalkeeper, defenders, drawField, drawPinSymbol };
})();
