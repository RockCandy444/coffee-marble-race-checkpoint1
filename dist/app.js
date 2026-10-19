(() => {
  'use strict';

  // Physical course dimensions are independent of the camera viewport.
  const WORLD = {
    width: 1000, height: 1600, finishY: 1510,
    left: 20, right: 980, top: 18, bottom: 1578,
    finishLeft: 335, finishRight: 665, funnelY: 1120, funnelKnee: 1370
  };
  const MAPS = {
    pinball: { title: '핀볼 코스', label: '핀볼', height: 3600, sections: [[180, '핀 숲'], [800, '범퍼 정원'], [1400, '지그재그 슬라이드'], [2050, '링 범퍼'], [2630, '스윙 브리지'], [3030, '골키퍼 게이트']] },
    spinner: { title: '회전 장애물 코스', label: '회전 장애물', height: 3900, sections: [[190, '회전 날개'], [850, '엇갈린 회전문'], [1550, '더블 게이트'], [2150, '슬라이딩 블록'], [2800, '삼중 회전문'], [3330, '골키퍼 게이트']] },
    fork: { title: '갈림길 코스', label: '갈림길', height: 4200, sections: [[190, '첫 번째 갈림길'], [1050, '교차 합류'], [1650, '마지막 선택'], [2350, '다이아몬드 미로'], [3000, '움직이는 징검다리'], [3630, '골키퍼 게이트']] }
  };
  const Course = window.MarbleCourse;
  Object.values(MAPS).forEach(map => { map.height *= 2; map.sections = map.sections.map(([y, name]) => [y * 2, name]); });
  const $ = (selector) => document.querySelector(selector);
  const setupView = $('#setupView');
  const mapView = $('#mapView');
  const raceView = $('#raceView');
  const resultsView = $('#resultsView');
  const canvas = $('#raceCanvas');
  const ctx = canvas.getContext('2d');
  const namesInput = $('#namesInput');
  const countInput = $('#countInput');
  const setupError = $('#setupError');
  let participants = ['참가자 1', '참가자 2'];
  let selectedMap = 'pinball';
  let customNamesEdited = false;
  let stage = 'setup';
  let game = null;
  let frameId = 0;
  let previousFrame = 0;
  let accumulator = 0;
  const camera = new window.RaceCamera();
  let canvasDpr = 1;
  const cameraSelect = $('#cameraSelect');

  namesInput.value = participants.join('\n');

  function setStage(next) {
    stage = next;
    setupView.hidden = next !== 'setup';
    mapView.hidden = next !== 'map';
    raceView.hidden = next !== 'race';
    resultsView.hidden = next !== 'results';
    document.body.classList.toggle('race-active', next === 'race');
    const order = ['setup', 'map', 'race', 'results'];
    document.querySelectorAll('.step').forEach((step) => {
      const index = order.indexOf(step.dataset.step);
      step.classList.toggle('active', index === order.indexOf(next));
      step.classList.toggle('done', index < order.indexOf(next));
    });
    if (next === 'race') resizeCanvas();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function updateCountBadge(count) {
    $('#participantCount').textContent = `${count}명`;
    $('#mapParticipantSummary').textContent = `${count}명`;
  }
  function parsedNames() {
    return namesInput.value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
  }
  function generateNames() {
    let count = Number.parseInt(countInput.value, 10);
    if (!Number.isFinite(count)) count = 2;
    count = Math.min(100, Math.max(2, count));
    countInput.value = String(count);
    namesInput.value = Array.from({ length: count }, (_, i) => `참가자 ${i + 1}`).join('\n');
    customNamesEdited = false;
    setupError.textContent = '';
    updateCountBadge(count);
  }
  $('#generateNames').addEventListener('click', generateNames);
  $('#countDown').addEventListener('click', () => {
    countInput.value = String(Math.max(2, (Number.parseInt(countInput.value, 10) || 2) - 1));
    if (!customNamesEdited) generateNames();
  });
  $('#countUp').addEventListener('click', () => {
    countInput.value = String(Math.min(100, (Number.parseInt(countInput.value, 10) || 2) + 1));
    if (!customNamesEdited) generateNames();
  });
  namesInput.addEventListener('input', () => {
    customNamesEdited = true;
    updateCountBadge(parsedNames().length);
    setupError.textContent = '';
  });
  countInput.addEventListener('change', () => {
    const n = Number.parseInt(countInput.value, 10);
    if (Number.isFinite(n)) {
      countInput.value = String(Math.min(100, Math.max(2, n)));
      if (!customNamesEdited) generateNames();
    }
  });
  $('#confirmParticipants').addEventListener('click', () => {
    const names = parsedNames();
    if (names.length < 2 || names.length > 100) {
      setupError.textContent = '참가자는 2명 이상 100명 이하로 입력해 주세요.';
      return;
    }
    participants = names;
    countInput.value = String(names.length);
    updateCountBadge(names.length);
    setupError.textContent = '';
    setStage('map');
  });

  $('#editParticipants').addEventListener('click', () => setStage('setup'));
  document.querySelectorAll('.map-card').forEach((card) => card.addEventListener('click', () => selectMap(card.dataset.map)));
  function selectMap(map) {
    if (!MAPS[map]) return;
    selectedMap = map;
    document.querySelectorAll('.map-card').forEach((card) => {
      const selected = card.dataset.map === map;
      card.classList.toggle('selected', selected);
      card.setAttribute('aria-checked', String(selected));
    });
  }
  function colorFor(index) {
    return `hsl(${((index * 137.508 + 16) % 360).toFixed(1)} 78% 53%)`;
  }
  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function finishFunnelSegments() {
    // Segment radius is 4.5: the clear gap between inner faces is exactly 2.5 diameters.
    const leftGate = WORLD.finishLeft - 4.5;
    const rightGate = WORLD.finishRight + 4.5;
    return [
      { x1: Course.bounds(WORLD.funnelY, WORLD).left, y1: WORLD.funnelY, x2: leftGate, y2: WORLD.funnelKnee, funnel: true },
      { x1: leftGate, y1: WORLD.funnelKnee, x2: leftGate, y2: WORLD.bottom, funnel: true },
      { x1: Course.bounds(WORLD.funnelY, WORLD).right, y1: WORLD.funnelY, x2: rightGate, y2: WORLD.funnelKnee, funnel: true },
      { x1: rightGate, y1: WORLD.funnelKnee, x2: rightGate, y2: WORLD.bottom, funnel: true }
    ];
  }

  function makeStaticObstacles(map) {
    const pins = [];
    const segments = [];
    if (map === 'pinball') {
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 12; col++) {
          const x = 64 + col * 76 + (row % 2) * 38;
          if (x > 950) continue;
          pins.push({ x, y: 260 + row * 68, r: 6 + (row + col) % 4 * 2.5 });
        }
      }
      for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) {
        pins.push({ x: 130 + col * 175 + (row % 2) * 45, y: 890 + row * 120, r: 23 + ((row + col) % 3) * 5, bumper: true });
      }
      segments.push(
        { x1: 60, y1: 1490, x2: 650, y2: 1600, radius: 5 },
        { x1: 940, y1: 1690, x2: 350, y2: 1800, radius: 8 },
        { x1: 80, y1: 1850, x2: 630, y2: 1950, radius: 11 }
      );
      for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
        pins.push({ x: 155 + col * 215 + (row % 2) * 30, y: 2170 + row * 125, r: 20 + (row + col) % 4 * 9, bumper: true, ring: true });
      }
    } else if (map === 'spinner') {
      for (const y of [760, 1210, 2010]) for (const x of [100, 270, 730, 900]) pins.push({ x, y, r: 13 + (x % 7) * 4, bumper: true });
    } else if (map === 'fork') {
      segments.push(
        { x1: 500, y1: 280, x2: 300, y2: 600 },
        { x1: 500, y1: 280, x2: 700, y2: 600 },
        { x1: 300, y1: 600, x2: 300, y2: 900 },
        { x1: 700, y1: 600, x2: 700, y2: 900 },
        { x1: 50, y1: 1080, x2: 390, y2: 1400 },
        { x1: 950, y1: 1080, x2: 610, y2: 1400 },
        { x1: 500, y1: 1730, x2: 320, y2: 2030 },
        { x1: 500, y1: 1730, x2: 680, y2: 2030 },
        { x1: 60, y1: 2160, x2: 330, y2: 2320 },
        { x1: 940, y1: 2160, x2: 670, y2: 2320 }
      );
      [[160, 720], [840, 720], [420, 1500], [580, 1560], [160, 1990], [840, 1990]].forEach(([x, y], index) => pins.push({ x, y, r: 16 + index % 3 * 12, bumper: true }));
      for (const [x, y, size] of [[260, 2500, 65], [740, 2540, 90], [470, 2780, 75]]) {
        const points = [[x, y - size], [x + size, y], [x, y + size], [x - size, y]];
        points.forEach(([x1, y1], i) => { const [x2, y2] = points[(i + 1) % 4]; segments.push({ x1, y1, x2, y2, radius: 5 + (size % 4), diamond: true }); });
      }
    }
    segments.forEach((segment, index) => { segment.radius ??= [4.5, 7, 9][index % 3]; });
    Course.enrich(pins, segments, map, WORLD, MAPS[map].sections);
    // 세 맵 모두 결승선은 한 곳뿐이며, 넓은 트랙을 하나의 결승 통로로 모읍니다.
    segments.push(...finishFunnelSegments());
    return { pins, segments };
  }

  function rotatingSegments(time) {
    const bars = game.map === 'spinner' ? [
      { x: 340, y: 350, phase: 0.2, length: 390, speed: 0.8 },
      { x: 680, y: 630, phase: 2.0, length: 350, speed: -1.0 },
      { x: 420, y: 1030, phase: 4.1, length: 470, speed: 0.85 },
      { x: 620, y: 1370, phase: 1.1, length: 410, speed: -0.9 },
      { x: 280, y: 1730, phase: 0.5, length: 350, speed: 1.05 },
      { x: 720, y: 1870, phase: 2.2, length: 350, speed: -1.05 },
      { x: 230, y: 2920, phase: 0.5, length: 220, speed: 0.75 },
      { x: 530, y: 3050, phase: 1.4, length: 320, speed: -0.85 },
      { x: 800, y: 3200, phase: 2.5, length: 160, speed: 1.1 }
    ] : game.map === 'pinball' ? [
      { x: 330, y: 2730, phase: 0.2, length: 290, speed: 0.7 },
      { x: 700, y: 2920, phase: 1.6, length: 200, speed: -0.9 }
    ] : [];
    return bars.map((bar) => {
      const angle = time * bar.speed + bar.phase;
      const omega = bar.speed;
      const dx = Math.cos(angle) * bar.length / 2;
      const dy = Math.sin(angle) * bar.length / 2;
      return { x1: bar.x - dx, y1: bar.y * 2 - dy, x2: bar.x + dx, y2: bar.y * 2 + dy, cx: bar.x, cy: bar.y * 2, omega, radius: 4 + bar.length / 85, rotating: true };
    });
  }

  function movingPins(time) {
    if (game.map !== 'fork') return [];
    return [
      { x: 240, y: 3160, r: 20, amplitude: 100, speed: 0.85, phase: 0 },
      { x: 750, y: 3280, r: 38, amplitude: 110, speed: 0.7, phase: 2 },
      { x: 430, y: 3470, r: 27, amplitude: 150, speed: 0.9, phase: 1 }
    ].map(pin => ({ ...pin, y: pin.y * 2, x: pin.x + Math.sin(time * pin.speed + pin.phase) * pin.amplitude, vx: Math.cos(time * pin.speed + pin.phase) * pin.amplitude * pin.speed, moving: true, bumper: true }));
  }

  function movingSegments(time) {
    const result = rotatingSegments(time);
    if (game.map === 'spinner') {
      for (const [y, center, length, radius, phase] of [[2280, 310, 190, 13, 0], [2530, 690, 290, 8, 1.8]]) {
        const cx = center + Math.sin(time * 0.9 + phase) * 150;
        result.push({ x1: cx - length / 2, y1: y * 2, x2: cx + length / 2, y2: y * 2, radius, vx: Math.cos(time * 0.9 + phase) * 135, sliding: true });
      }
    }
    const diameter = game.balls[0].r * 2;
    result.push(...Course.defenders(time, WORLD), ...Course.goalkeeper(game.keeper, time, diameter, WORLD));
    return result;
  }

  function setUpRace() {
    WORLD.height = MAPS[selectedMap].height;
    WORLD.bottom = WORLD.height - 22;
    WORLD.finishY = WORLD.height - 60;
    Course.configure(WORLD, selectedMap);
    camera.reset();
    populateCamera();
    const n = participants.length;
    const radius = Math.max(5.2, Math.min(11.2, 12.5 - 0.72 * Math.sqrt(n)));
    WORLD.finishLeft = WORLD.width / 2 - radius * 2.5;
    WORLD.finishRight = WORLD.width / 2 + radius * 2.5;
    const columns = Math.min(n, 24, Math.max(1, Math.ceil(Math.sqrt(n * 4))));
    const rows = Math.ceil(n / columns);
    const xSpacing = columns === 1 ? 0 : Math.min(42, 840 / (columns - 1));
    const ySpacing = rows === 1 ? 0 : Math.max(radius * 2 + 2, 12.5);
    const totalWidth = xSpacing * (columns - 1);
    const xStart = (WORLD.width - totalWidth) / 2;
    const slots = [];
    for (let i = 0; i < n; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      slots.push({ x: xStart + col * xSpacing, y: 52 + row * ySpacing });
    }
    shuffle(slots);
    const balls = participants.map((name, index) => {
      const slot = slots[index];
      return {
        id: index + 1, name, color: colorFor(index), r: radius,
        x: slot.x + (Math.random() - 0.5) * 1.2, y: slot.y + (Math.random() - 0.5) * 1.2,
        vx: (Math.random() - 0.5) * 10, vy: Math.random() * 3,
        finished: false, finishTime: null, maxY: slot.y, stallTime: 0, rescueCount: 0, prevX: slot.x, prevY: slot.y
      };
    });
    game = {
      map: selectedMap, balls, order: [], time: 0, watchdogTime: 0, paused: false, autoPaused: false,
      keeper: Course.chooseKeeper(), static: makeStaticObstacles(selectedMap), lastUiUpdate: 0, stuckCount: 0, selectedBall: null
    };
    game.collisionBuckets = Course.buckets(game.static);
    $('#keeperLabel').textContent = '이번 골키퍼 · ' + game.keeper.name + ' (25%)';
    $('#raceTitle').textContent = MAPS[selectedMap].title;
    $('#raceProgress').textContent = `0 / ${n} 도착`;
    $('#raceStatus').textContent = '구슬이 출발을 기다리고 있어요.';
    $('#beadInfo').textContent = '휠로 확대·축소 · 드래그로 이동 · 미니맵으로 구간 선택';
    $('#liveOrder').replaceChildren();
    $('#liveFooter').textContent = '아직 결승선을 통과한 구슬이 없어요.';
    $('#recoveryControls').hidden = true;
    $('#pauseRace').textContent = '일시 정지';
    setStage('race');
    resizeCanvas();
    previousFrame = 0;
    accumulator = 0;
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(animationFrame);
  }

  $('#startRace').addEventListener('click', setUpRace);
  $('#changeRaceSetup').addEventListener('click', () => setStage('map'));
  $('#restartDuringRace').addEventListener('click', setUpRace);
  $('#rematch').addEventListener('click', setUpRace);
  $('#newSetup').addEventListener('click', () => setStage('setup'));
  $('#pauseRace').addEventListener('click', () => {
    if (!game || game.autoPaused) return;
    game.paused = !game.paused;
    $('#pauseRace').textContent = game.paused ? '계속하기' : '일시 정지';
    $('#raceStatus').textContent = game.paused ? '경주를 잠시 멈췄어요.' : '경주가 다시 시작됐어요!';
  });
  $('#resumeRace').addEventListener('click', () => {
    if (!game) return;
    game.paused = false;
    game.autoPaused = false;
    game.stuckCount = 0;
    game.watchdogTime = 0;
    game.balls.forEach((ball) => { if (!ball.finished) ball.rescueCount = 0; });
    $('#pauseRace').textContent = '일시 정지';
    $('#recoveryControls').hidden = true;
    $('#raceStatus').textContent = '경주를 계속합니다.';
    previousFrame = 0;
  });
  $('#nudgeBalls').addEventListener('click', () => {
    if (!game) return;
    game.balls.filter((ball) => !ball.finished).forEach((ball) => {
      Course.rescue(ball, game.time);
    });
    game.stuckCount = 0;
    game.watchdogTime = 0;
    game.autoPaused = false;
    game.paused = false;
    $('#recoveryControls').hidden = true;
    $('#pauseRace').textContent = '일시 정지';
    $('#raceStatus').textContent = '구슬을 강하게 튀겼어요. 계속 달립니다!';
    previousFrame = 0;
  });

  const FIXED_DT = 1 / 120;
  function animationFrame(timestamp) {
    if (stage !== 'race' || !game) return;
    if (!previousFrame) previousFrame = timestamp;
    const elapsed = Math.min((timestamp - previousFrame) / 1000, 0.08);
    previousFrame = timestamp;
    if (!game.paused) {
      accumulator += elapsed;
      let iterations = 0;
      while (accumulator >= FIXED_DT && iterations < 10 && !game.paused) {
        physicsStep(FIXED_DT);
        accumulator -= FIXED_DT;
        iterations++;
      }
    }
    if (stage !== 'race') return;
    camera.update(game, WORLD, canvas.width / canvasDpr, canvas.height / canvasDpr, elapsed);
    drawTrack();
    if (timestamp - game.lastUiUpdate > 180) {
      updateLiveUI();
      game.lastUiUpdate = timestamp;
    }
    if (stage === 'race') frameId = requestAnimationFrame(animationFrame);
  }

  function physicsStep(dt) {
    game.time += dt;
    game.watchdogTime += dt;
    const dynamicSegments = movingSegments(game.time);
    const dynamicPins = movingPins(game.time);
    const active = game.balls.filter((ball) => !ball.finished);

    for (const ball of active) {
      ball.prevX = ball.x;
      ball.prevY = ball.y;
      const fields = game.collisionBuckets.get(Math.floor(ball.y / 160))?.fields ?? [];
      ball.magnetGrace = Math.max(0, (ball.magnetGrace ?? 0) - dt);
      for (const source of fields) Course.field(ball, source, dt);
      ball.vy += 178 * dt;
      ball.vx += Math.sin(game.time * 1.2 + ball.id * 2.1) * 3.5 * dt;
      const drag = Math.pow(0.999, dt * 60);
      ball.vx *= drag;
      ball.vy *= drag;
      const speed = Math.hypot(ball.vx, ball.vy);
      const maxSpeed = (ball.boostUntil ?? 0) > game.time ? 520 : 340;
      if (speed > maxSpeed) { ball.vx *= maxSpeed / speed; ball.vy *= maxSpeed / speed; }
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      resolveWalls(ball);
      const nearby = game.collisionBuckets.get(Math.floor(ball.y / 160));
      for (const pin of nearby?.pins ?? []) resolvePin(ball, pin);
      for (const pin of dynamicPins) resolvePin(ball, pin);
      for (const segment of nearby?.segments ?? []) resolveSegment(ball, segment);
      for (const segment of dynamicSegments) resolveSegment(ball, segment);
    }
    resolveBallPairs(active);

    const crossed = [];
    for (const ball of active) {
      resolveWalls(ball);
      // Pair separation must not push a ball through the narrow gate or keeper.
      for (const segment of dynamicSegments) if (segment.goalkeeper) resolveSegment(ball, segment);
      Course.contain(ball, WORLD);
      if (ball.y > ball.maxY + 0.7) {
        ball.maxY = ball.y;
        ball.stallTime = 0;
      } else if (Math.hypot(ball.vx, ball.vy) < 18) {
        ball.stallTime += dt;
      } else {
        ball.stallTime = Math.max(0, ball.stallTime - dt * 0.25);
      }
      // 실제 결승선 위에서 아래로 이동하며 좁은 게이트를 통과했을 때만 완주 처리합니다.
      if (ball.prevY < WORLD.finishY && ball.y >= WORLD.finishY) {
        const travel = ball.y - ball.prevY;
        const fraction = travel > 0 ? Math.max(0, Math.min(1, (WORLD.finishY - ball.prevY) / travel)) : 1;
        const crossingX = ball.prevX + (ball.x - ball.prevX) * fraction;
        if (crossingX - ball.r >= WORLD.finishLeft - 0.01 && crossingX + ball.r <= WORLD.finishRight + 0.01) {
          crossed.push({ ball, fraction });
          continue;
        }
      }
      if (ball.stallTime > 7.5) {
        ball.stallTime = 0;
        ball.rescueCount++;
        ball.vy += 70 + Math.random() * 30;
        ball.vx += (Math.random() - 0.5) * 80;
        if (ball.rescueCount >= 4) game.stuckCount++;
      }
    }
    crossed.sort((a, b) => a.fraction - b.fraction);
    for (const crossing of crossed) {
      crossing.ball.finished = true;
      crossing.ball.finishTime = game.time - dt + crossing.fraction * dt;
      game.order.push(crossing.ball);
    }

    if (game.order.length === game.balls.length) { finishRace(); return; }
    if (game.stuckCount >= 2 || game.watchdogTime > 360) {
      game.paused = true;
      game.autoPaused = true;
      $('#pauseRace').textContent = '경주 멈춤';
      $('#recoveryControls').hidden = false;
      const remaining = game.balls.length - game.order.length;
      $('#recoveryMessage').textContent = `${remaining}개의 구슬이 아직 결승선을 통과하지 못했어요. 미완주 구슬을 임의로 꼴찌 처리하지 않았습니다. 힘을 보태 계속하거나 경주를 새로 시작해 주세요.`;
      $('#raceStatus').textContent = '미완주 구슬이 있어 경주를 잠시 멈췄어요.';
    }
  }

  function resolveWalls(ball) {
    Course.contain(ball, WORLD);
    if (ball.y - ball.r < WORLD.top) {
      ball.y = WORLD.top + ball.r;
      if (ball.vy < 0) ball.vy = -ball.vy * 0.48;
    }
    if (ball.y + ball.r > WORLD.bottom) {
      ball.y = WORLD.bottom - ball.r;
      if (ball.vy > 0) ball.vy = -ball.vy * 0.48;
    }
  }
  function resolvePin(ball, pin) {
    const dx = ball.x - pin.x;
    const dy = ball.y - pin.y;
    const min = ball.r + pin.r;
    const d2 = dx * dx + dy * dy;
    if (d2 >= min * min) return;
    const distance = Math.sqrt(d2) || 0.001;
    const nx = dx / distance;
    const ny = dy / distance;
    const overlap = min - distance;
    ball.x += nx * overlap;
    ball.y += ny * overlap;
    const toward = (ball.vx - (pin.vx || 0)) * nx + (ball.vy - (pin.vy || 0)) * ny;
    if (toward < 0) { ball.vx -= 1.48 * toward * nx; ball.vy -= 1.48 * toward * ny; }
    Course.kick(ball, pin, nx, ny, game.time);
  }
  function resolveSegment(ball, segment) {
    if (segment.circle) { resolvePin(ball, { x: segment.x1, y: segment.y1, r: segment.radius, vx: segment.vx, vy: segment.vy }); return; }
    const dx = segment.x2 - segment.x1;
    const dy = segment.y2 - segment.y1;
    const length2 = dx * dx + dy * dy;
    if (length2 < 0.001) return;
    const t = Math.max(0, Math.min(1, ((ball.x - segment.x1) * dx + (ball.y - segment.y1) * dy) / length2));
    const px = segment.x1 + t * dx;
    const py = segment.y1 + t * dy;
    let nx = ball.x - px;
    let ny = ball.y - py;
    const distance = Math.hypot(nx, ny);
    const min = ball.r + (segment.radius ?? (segment.rotating ? 5.5 : 4.5));
    if (distance >= min) return;
    if (distance < 0.001) {
      const length = Math.sqrt(length2);
      nx = -dy / length; ny = dx / length;
    } else { nx /= distance; ny /= distance; }
    ball.x += nx * (min - distance);
    ball.y += ny * (min - distance);
    const surfaceVx = (segment.vx || 0) + (segment.rotating ? -segment.omega * (py - segment.cy) : 0);
    const surfaceVy = (segment.vy || 0) + (segment.rotating ? segment.omega * (px - segment.cx) : 0);
    const toward = (ball.vx - surfaceVx) * nx + (ball.vy - surfaceVy) * ny;
    if (toward < 0) { ball.vx -= 1.5 * toward * nx; ball.vy -= 1.5 * toward * ny; }
  }
  function resolveBallPairs(balls) {
    if (balls.length < 2) return;
    const cellSize = Math.max(12, balls[0].r * 2.2);
    const buckets = new Map();
    for (const ball of balls) {
      const cx = Math.floor(ball.x / cellSize);
      const cy = Math.floor(ball.y / cellSize);
      const key = `${cx},${cy}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(ball);
    }
    const directions = [[1, 0], [-1, 1], [0, 1], [1, 1]];
    for (const [key, cell] of buckets) {
      for (let i = 0; i < cell.length; i++) for (let j = i + 1; j < cell.length; j++) collideBalls(cell[i], cell[j]);
      const [cx, cy] = key.split(',').map(Number);
      for (const [ox, oy] of directions) {
        const neighbor = buckets.get(`${cx + ox},${cy + oy}`);
        if (neighbor) for (const a of cell) for (const b of neighbor) collideBalls(a, b);
      }
    }
  }
  function collideBalls(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const min = a.r + b.r;
    const d2 = dx * dx + dy * dy;
    if (d2 >= min * min) return;
    const distance = Math.sqrt(d2) || 0.001;
    const nx = dx / distance;
    const ny = dy / distance;
    const overlap = min - distance;
    a.x -= nx * overlap * 0.5; a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5; b.y += ny * overlap * 0.5;
    const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (relative < 0) {
      const impulse = -(1 + 0.38) * relative * 0.5;
      a.vx -= impulse * nx; a.vy -= impulse * ny;
      b.vx += impulse * nx; b.vy += impulse * ny;
    }
  }

  function finishRace() {
    if (!game || stage !== 'race') return;
    game.paused = true;
    $('#raceProgress').textContent = `${game.order.length} / ${game.balls.length} 도착`;
    $('#raceStatus').textContent = '모든 구슬이 결승선을 통과했어요!';
    const loser = game.order[game.order.length - 1];
    $('#coffeeWinner').textContent = `#${loser.id} ${loser.name}`;
    $('#resultSubtitle').textContent = `${game.order.length}명이 모두 완주한 ${MAPS[game.map].label} 경기 · ${game.keeper.name}의 마지막 통과자예요.`;
    $('#resultMapLabel').textContent = MAPS[game.map].label;
    const list = $('#finalRanking');
    list.replaceChildren();
    game.order.forEach((ball, index) => {
      const item = document.createElement('li');
      if (index === game.order.length - 1) item.classList.add('last-place');
      const rank = document.createElement('span'); rank.className = 'rank-badge'; rank.textContent = String(index + 1);
      const bead = document.createElement('i'); bead.className = 'ranking-bead'; bead.style.background = ball.color;
      const name = document.createElement('span'); name.className = 'rank-name'; name.textContent = `#${ball.id} ${ball.name}`;
      item.append(rank, bead, name);
      if (index === game.order.length - 1) {
        const note = document.createElement('span'); note.className = 'rank-note'; note.textContent = '☕ 커피 당첨'; item.append(note);
      }
      list.append(item);
    });
    cancelAnimationFrame(frameId);
    setStage('results');
  }
  function updateLiveUI() {
    if (!game) return;
    const remaining = game.balls.length - game.order.length;
    $('#raceProgress').textContent = `${game.order.length} / ${game.balls.length} 도착`;
    if (!game.paused && game.order.length === 0) $('#raceStatus').textContent = '구슬들이 장애물 사이를 달리는 중이에요!';
    else if (!game.paused && remaining > 0) $('#raceStatus').textContent = `${remaining}개의 구슬이 아직 달리는 중이에요.`;
    const list = $('#liveOrder');
    list.replaceChildren();
    const fragment = document.createDocumentFragment();
    const running = game.balls.filter(ball => !ball.finished).sort((a, b) => b.y - a.y);
    $('#liveTitle').textContent = game.order.length ? '결승 도착 순서' : '현재 선두 그룹';
    const displayed = game.order.length ? game.order : running.slice(0, 12);
    displayed.forEach((ball, index) => {
      const li = document.createElement('li');
      const rank = document.createElement('span'); rank.className = 'rank-number'; rank.textContent = String(index + 1);
      const bead = document.createElement('i'); bead.className = 'mini-bead'; bead.style.background = ball.color;
      const name = document.createElement('span'); name.className = 'order-name'; name.textContent = `#${ball.id} ${ball.name}`;
      li.append(rank, bead, name); fragment.append(li);
    });
    list.append(fragment);
    $('#liveFooter').textContent = game.order.length === 0 ? '현재 위치 기준 · 결승 통과 시 순위 확정' : `${game.order.length}명이 완주 · ${remaining}명 경주 중`;
    const section = MAPS[game.map].sections.filter(([y]) => y <= camera.y).at(-1);
    $('#cameraStatus').textContent = camera.label + (section ? ' · ' + section[1] : ' · 출발 구간');
    $('#cameraBadge').textContent = camera.label;
    $('#cameraZoomLabel').textContent = camera.mode === 'overview' ? '전체' : camera.zoom.toFixed(1) + '×';
    if (game.selectedBall) {
      const ball = game.balls.find((item) => item.id === game.selectedBall);
      if (ball) $('#beadInfo').textContent = `구슬 #${ball.id} · ${ball.name}${ball.finished ? ' — 결승선 통과!' : ' — 달리는 중'}`;
    }
  }

  function populateCamera() {
    cameraSelect.replaceChildren();
    for (const [value, label] of [['auto', '자동 중계'], ['leader', '선두 따라가기'], ['pack', '중간 그룹'], ['tail', '후미 따라가기'], ['overview', '전체 코스'], ['manual', '수동 보기']]) {
      const option = document.createElement('option'); option.value = value; option.textContent = label; cameraSelect.append(option);
    }
    const group = document.createElement('optgroup'); group.label = '참가자 추적';
    participants.forEach((name, index) => {
      const option = document.createElement('option'); option.value = 'ball:' + (index + 1); option.textContent = '#' + (index + 1) + ' ' + name; group.append(option);
    });
    cameraSelect.append(group); cameraSelect.value = 'auto';
  }
  cameraSelect.addEventListener('change', () => {
    camera.mode = cameraSelect.value;
    game.selectedBall = camera.mode.startsWith('ball:') ? Number(camera.mode.slice(5)) : null;
    if (camera.mode === 'manual') manualView();
    else $('#beadInfo').textContent = '휠로 확대·축소 · 드래그로 이동 · 미니맵으로 구간 선택';
  });
  function changeZoom(amount) {
    camera.zoom = Math.max(0.8, Math.min(4, camera.zoom + amount));
    if (camera.mode === 'overview') { camera.mode = 'auto'; cameraSelect.value = 'auto'; }
  }
  $('#cameraZoomOut').addEventListener('click', () => changeZoom(-0.2));
  $('#cameraZoomIn').addEventListener('click', () => changeZoom(0.2));
  canvas.addEventListener('wheel', event => {
    if (stage !== 'race' || !game || event.deltaY === 0) return;
    event.preventDefault();
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
    changeZoom(-Math.max(-240, Math.min(240, pixels)) * 0.002);
  }, { passive: false });
  $('#cameraReset').addEventListener('click', () => {
    camera.mode = 'auto'; camera.zoom = 1; cameraSelect.value = 'auto'; game.selectedBall = null;
    $('#beadInfo').textContent = '휠로 확대·축소 · 드래그로 이동 · 미니맵으로 구간 선택';
  });

  function resizeCanvas() {
    if (!canvas || stage !== 'race') return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    canvasDpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * canvasDpr);
    canvas.height = Math.round(rect.height * canvasDpr);
    if (game) camera.update(game, WORLD, rect.width, rect.height, 1);
    drawTrack();
  }
  const observer = new ResizeObserver(resizeCanvas);
  observer.observe(canvas);
  window.addEventListener('resize', resizeCanvas);
  function selectBall(event) {
    if (!game) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = camera.toWorld(event.clientX - rect.left, event.clientY - rect.top);
    let closest = null;
    let minDistance = Math.max(25, 18 / camera.scale);
    for (const ball of game.balls) {
      if (ball.finished) continue;
      const distance = Math.hypot(ball.x - x, ball.y - y);
      if (distance < minDistance) { minDistance = distance; closest = ball; }
    }
    if (closest) {
      game.selectedBall = closest.id;
      camera.mode = 'ball:' + closest.id;
      cameraSelect.value = camera.mode;
      $('#beadInfo').textContent = `구슬 #${closest.id} · ${closest.name} — 달리는 중`;
    }
  }
  let cameraDrag = null;
  function manualView() {
    cameraSelect.value = 'manual'; game.selectedBall = null;
    $('#beadInfo').textContent = '수동 보기 · 드래그로 이동 · 미니맵으로 구간 선택 · 자동 중계 버튼으로 복귀';
  }
  canvas.addEventListener('pointerdown', event => {
    if (!game || event.button !== 0 || cameraDrag) return;
    cameraDrag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, moved: false };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!cameraDrag || cameraDrag.id !== event.pointerId) return;
    if (!cameraDrag.moved && Math.hypot(event.clientX - cameraDrag.startX, event.clientY - cameraDrag.startY) < 5) return;
    if (camera.mode === 'overview') {
      const point = camera.toWorld(event.clientX - canvas.getBoundingClientRect().left, event.clientY - canvas.getBoundingClientRect().top);
      camera.zoom = 1; camera.moveTo(point.x, point.y); resizeCanvas();
    }
    camera.pan(event.clientX - cameraDrag.x, event.clientY - cameraDrag.y);
    cameraDrag.moved = true; cameraDrag.x = event.clientX; cameraDrag.y = event.clientY;
    manualView(); canvas.classList.add('is-dragging'); resizeCanvas();
  });
  function endCameraDrag(event) {
    if (!cameraDrag || cameraDrag.id !== event.pointerId) return;
    const clicked = !cameraDrag.moved && event.type === 'pointerup';
    cameraDrag = null; canvas.classList.remove('is-dragging');
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (clicked) selectBall(event);
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, endCameraDrag);
  const miniMap = $('#miniMap');
  miniMap.addEventListener('click', event => {
    if (!game) return;
    const rect = miniMap.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * miniMap.width / rect.width - 6) / (miniMap.width - 12) * WORLD.width;
    const y = ((event.clientY - rect.top) * miniMap.height / rect.height - 8) / (miniMap.height - 16) * WORLD.height;
    if (camera.mode === 'overview') camera.zoom = 1;
    camera.moveTo(x, y); manualView(); resizeCanvas();
  });
  miniMap.addEventListener('keydown', event => {
    if (!game || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' '].includes(event.key)) return;
    event.preventDefault();
    camera.moveTo(camera.x + (event.key === 'ArrowRight' ? 100 : event.key === 'ArrowLeft' ? -100 : 0), camera.y + (event.key === 'ArrowDown' ? 400 : event.key === 'ArrowUp' ? -400 : 0));
    manualView(); resizeCanvas();
  });

  function drawTrack() {
    if (!ctx || !canvas.width || !game) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f5ead7'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    camera.apply(ctx, canvasDpr);
    const bg = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    bg.addColorStop(0, '#fff7e7'); bg.addColorStop(1, '#ffedca');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = '#fffdf8'; ctx.fillRect(16, 17, 968, WORLD.height - 32);
    MAPS[game.map].sections.forEach(([y, label], index) => {
      ctx.fillStyle = ['#edf7ef', '#fff0dc', '#eef1fb', '#f9edfa', '#e6f4f3', '#fff1e8'][index];
      ctx.fillRect(22, y, 956, (MAPS[game.map].sections[index + 1]?.[0] ?? WORLD.bottom) - y);
      ctx.fillStyle = '#9a8065'; ctx.font = '700 16px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('0' + (index + 1) + '  ' + label, 50, y + 15);
    });
    ctx.fillStyle = '#ecdfca';
    for (const side of ['left', 'right']) {
      const edge = side === 'left' ? 0 : WORLD.width;
      ctx.beginPath(); ctx.moveTo(edge, 0);
      WORLD.sideProfile.forEach(point => ctx.lineTo(point[side], point.y));
      ctx.lineTo(edge, WORLD.funnelY); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = '#dfc9a8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(18, 20); ctx.lineTo(982, 20); ctx.moveTo(18, WORLD.bottom); ctx.lineTo(982, WORLD.bottom); ctx.stroke();
    ctx.fillStyle = '#6caa72'; ctx.fillRect(22, 45, 956, 4);

    // 거리 표식이 길게 이어지는 코스의 진행 방향을 보여줍니다.
    ctx.save();
    ctx.font = '700 10px sans-serif';
    ctx.fillStyle = '#c3b49f';
    ctx.strokeStyle = '#eadfce';
    ctx.lineWidth = 1;
    for (let y = 300, mark = 300; y < WORLD.funnelY; y += 300, mark += 300) {
      ctx.beginPath(); ctx.moveTo(22, y); ctx.lineTo(36, y); ctx.moveTo(964, y); ctx.lineTo(978, y); ctx.stroke();
      ctx.fillText(`${mark}m`, 39, y - 5);
    }
    ctx.restore();

    // 세 코스 공통의 단일 결승 통로.
    ctx.fillStyle = 'rgba(252,218,158,.22)';
    ctx.beginPath();
    ctx.moveTo(Course.bounds(WORLD.funnelY, WORLD).left, WORLD.funnelY);
    ctx.lineTo(WORLD.finishLeft - 5, WORLD.funnelKnee);
    ctx.lineTo(WORLD.finishLeft - 5, WORLD.bottom);
    ctx.lineTo(WORLD.finishRight + 5, WORLD.bottom);
    ctx.lineTo(WORLD.finishRight + 5, WORLD.funnelKnee);
    ctx.lineTo(Course.bounds(WORLD.funnelY, WORLD).right, WORLD.funnelY);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#749bca';
    ctx.fillRect(WORLD.finishLeft, WORLD.finishY, WORLD.finishRight - WORLD.finishLeft, 6);
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 ? '#fff' : '#e98654';
      ctx.fillRect(WORLD.finishLeft + i * ((WORLD.finishRight - WORLD.finishLeft) / 12), WORLD.finishY, (WORLD.finishRight - WORLD.finishLeft) / 12, 6);
    }
    ctx.fillStyle = '#5d9865'; ctx.font = '700 11px sans-serif'; ctx.fillText('START', 28, 39);
    ctx.fillStyle = '#d97945'; ctx.fillText('FINISH', WORLD.finishLeft - 5, WORLD.finishY - 8);
    ctx.textAlign = 'left'; ctx.fillStyle = '#a44950'; ctx.font = '700 13px sans-serif';
    ctx.fillText(game.keeper.name, WORLD.width / 2 + 65, WORLD.finishY - 48);
    ctx.fillText('출구 = 구슬 지름 × 2.5', WORLD.width / 2 + 65, WORLD.finishY - 28);

    {
      for (const pin of game.static.pins.concat(movingPins(game.time))) {
        if (pin.y + pin.r < camera.top || pin.y - pin.r > camera.top + camera.visibleHeight) continue;
        Course.drawField(ctx, pin, game.time);
        ctx.beginPath(); ctx.arc(pin.x + 1, pin.y + 2, pin.r + 1.2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(96,65,36,.12)'; ctx.fill();
        ctx.beginPath(); ctx.arc(pin.x, pin.y, pin.r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(pin.x - 2, pin.y - 2, 1, pin.x, pin.y, pin.r);
        const tones = pin.kind === 'power' ? ['#fff6a8', '#ee7743'] : pin.kind === 'magnet' ? ['#ddd0ff', '#8160b4'] : pin.kind === 'wind' ? ['#c6f2f4', '#338c9f'] : pin.defender ? ['#b9d7ef', '#4a739a'] : pin.bumper ? ['#b8e6db', '#4f9483'] : ['#ffe6aa', '#bc8450'];
        grad.addColorStop(0, tones[0]); grad.addColorStop(1, tones[1]); ctx.fillStyle = grad; ctx.fill();
        if (pin.ring || pin.moving) { ctx.strokeStyle = pin.moving ? '#4d6fa4' : '#a976b3'; ctx.lineWidth = 4; ctx.stroke(); }
        Course.drawPinSymbol(ctx, pin, game.time);
      }
    }
    const segments = game.static.segments.concat(movingSegments(game.time));
    for (const segment of segments) {
      if (Math.max(segment.y1, segment.y2) + segment.radius < camera.top || Math.min(segment.y1, segment.y2) - segment.radius > camera.top + camera.visibleHeight) continue;
      if (segment.circle) {
        ctx.strokeStyle = '#aa6a75'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(500, WORLD.finishY - 120); ctx.lineTo(segment.x1, segment.y1); ctx.stroke();
        ctx.beginPath(); ctx.arc(segment.x1, segment.y1, segment.radius, 0, Math.PI * 2); ctx.fillStyle = '#c94f67'; ctx.fill(); ctx.strokeStyle = '#ffbac8'; ctx.lineWidth = 2; ctx.stroke(); continue;
      }
      ctx.lineCap = 'round'; ctx.lineWidth = (segment.radius ?? 4.5) * 2;
      ctx.strokeStyle = segment.goalkeeper ? '#c64e63' : segment.defender ? '#42678f' : segment.sliding ? '#557faf' : segment.diamond ? '#9573a9' : segment.rotating ? '#bf7545' : (segment.funnel ? '#c58b58' : '#ba946c');
      ctx.beginPath(); ctx.moveTo(segment.x1, segment.y1); ctx.lineTo(segment.x2, segment.y2); ctx.stroke();
      ctx.lineWidth = Math.min(3, (segment.radius ?? 4.5) * 0.65); ctx.strokeStyle = segment.goalkeeper ? '#ffbec9' : segment.sliding ? '#b1d2f2' : segment.diamond ? '#dfc4ec' : segment.rotating ? '#f1bb79' : '#e0c09a'; ctx.stroke();
      if (segment.rotating) for (const [x, y] of [[segment.x1, segment.y1], [segment.x2, segment.y2]]) {
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = '#8b5437'; ctx.fill();
      }
    }
    for (const ball of game.balls) {
      if (ball.finished) continue;
      if (ball.y + ball.r < camera.top || ball.y - ball.r > camera.top + camera.visibleHeight) continue;
      const r = ball.r;
      if ((ball.boostUntil ?? 0) > game.time) { ctx.save(); ctx.globalAlpha = 0.45; ctx.lineWidth = r; ctx.strokeStyle = ball.color; ctx.beginPath(); ctx.moveTo(ball.x - ball.vx * 0.035, ball.y - ball.vy * 0.035); ctx.lineTo(ball.x, ball.y); ctx.stroke(); ctx.restore(); }
      ctx.beginPath(); ctx.arc(ball.x + 1.5, ball.y + 2, r + 1, 0, Math.PI * 2); ctx.fillStyle = 'rgba(60,41,25,.19)'; ctx.fill();
      ctx.beginPath(); ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(ball.x - r * .33, ball.y - r * .38, r * .12, ball.x, ball.y, r * 1.08);
      grad.addColorStop(0, 'rgba(255,255,255,.92)'); grad.addColorStop(.2, lighten(ball.color, .25)); grad.addColorStop(1, ball.color);
      ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = game.selectedBall === ball.id ? '#30271f' : 'rgba(255,255,255,.8)';
      ctx.lineWidth = game.selectedBall === ball.id ? 2 : 1; ctx.stroke();
      ctx.fillStyle = '#2b2520';
      ctx.font = `800 ${Math.max(5.5, Math.min(9, r * .82))}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(ball.id), ball.x, ball.y + .3, r * 1.65);
    }
    if (game.paused) { ctx.fillStyle = 'rgba(255,251,242,.24)'; ctx.fillRect(0, 0, WORLD.width, WORLD.height); }
    drawMiniMap();
  }

  function drawMiniMap() {
    const mini = $('#miniMap'); const m = mini.getContext('2d');
    const w = mini.width, h = mini.height, sx = (w - 12) / WORLD.width, sy = (h - 16) / WORLD.height;
    m.clearRect(0, 0, w, h); m.fillStyle = 'rgba(255,253,248,.95)'; m.fillRect(0, 0, w, h);
    MAPS[game.map].sections.forEach(([y], index) => { m.fillStyle = ['#d9eddf', '#f7dfb9', '#dde3f4', '#e6cbe8', '#b9dfdb', '#f6d6c6'][index]; m.fillRect(6, 8 + y * sy, w - 12, 4); });
    m.fillStyle = '#e77b48'; m.fillRect(6, 8 + WORLD.finishY * sy, w - 12, 2);
    for (const ball of game.balls) if (!ball.finished) { m.fillStyle = ball.color; m.beginPath(); m.arc(6 + ball.x * sx, 8 + ball.y * sy, ball.id === game.selectedBall ? 3 : 1.8, 0, Math.PI * 2); m.fill(); }
    const top = Math.max(0, camera.top), bottom = Math.min(WORLD.height, camera.top + camera.visibleHeight);
    const left = Math.max(0, camera.left), right = Math.min(WORLD.width, camera.left + camera.visibleWidth);
    m.strokeStyle = '#326f69'; m.lineWidth = 1.5; m.strokeRect(6 + left * sx, 8 + top * sy, Math.max(3, (right - left) * sx), Math.max(3, (bottom - top) * sy));
  }
  function lighten(color, amount) {
    const match = color.match(/hsl\(([^ ]+)\s+([^ ]+)\s+([^%]+)%\)/);
    return match ? `hsl(${match[1]} ${match[2]} ${Math.min(88, Number(match[3]) + amount * 30)}%)` : color;
  }

  updateCountBadge(2);
  selectMap(selectedMap);
})();
