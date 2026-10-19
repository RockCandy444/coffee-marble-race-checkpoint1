(() => {
  'use strict';

  // 길게 뻗은 코스와 하나의 좁은 결승 게이트를 공유합니다.
  const WORLD = {
    width: 1000, height: 1600, finishY: 1510,
    left: 20, right: 980, top: 18, bottom: 1578,
    finishLeft: 335, finishRight: 665, funnelY: 1120, funnelKnee: 1370
  };
  const MAPS = {
    pinball: { title: '핀볼 코스', label: '핀볼' },
    spinner: { title: '회전 장애물 코스', label: '회전 장애물' },
    fork: { title: '갈림길 코스', label: '갈림길' }
  };
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
  let canvasScaleX = 1;
  let canvasScaleY = 1;

  namesInput.value = participants.join('\n');

  function setStage(next) {
    stage = next;
    setupView.hidden = next !== 'setup';
    mapView.hidden = next !== 'map';
    raceView.hidden = next !== 'race';
    resultsView.hidden = next !== 'results';
    const order = ['setup', 'map', 'race', 'results'];
    document.querySelectorAll('.step').forEach((step) => {
      const index = order.indexOf(step.dataset.step);
      step.classList.toggle('active', index === order.indexOf(next));
      step.classList.toggle('done', index < order.indexOf(next));
    });
    if (next === 'race') resizeCanvas();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const leftGate = WORLD.finishLeft - 5;
    const rightGate = WORLD.finishRight + 5;
    return [
      { x1: WORLD.left, y1: WORLD.funnelY, x2: leftGate, y2: WORLD.funnelKnee, funnel: true },
      { x1: leftGate, y1: WORLD.funnelKnee, x2: leftGate, y2: WORLD.bottom, funnel: true },
      { x1: WORLD.right, y1: WORLD.funnelY, x2: rightGate, y2: WORLD.funnelKnee, funnel: true },
      { x1: rightGate, y1: WORLD.funnelKnee, x2: rightGate, y2: WORLD.bottom, funnel: true }
    ];
  }

  function makeStaticObstacles(map) {
    const pins = [];
    const segments = [];
    if (map === 'pinball') {
      // 짧은 한 구간에 몰지 않고, 긴 코스에 핀을 여러 구간으로 분산합니다.
      for (let row = 0; row < 18; row++) {
        for (let col = 0; col < 16; col++) {
          const x = 64 + col * 58 + (row % 2) * 29;
          if (x > 950) continue;
          pins.push({ x, y: 180 + row * 52, r: 7.2 });
        }
      }
    } else if (map === 'fork') {
      // 갈림길은 충분한 폭을 확보하고, 아래쪽에서 부드럽게 합류시킵니다.
      segments.push(
        { x1: 65, y1: 155, x2: 235, y2: 335 },
        { x1: 235, y1: 335, x2: 235, y2: 740 },
        { x1: 500, y1: 155, x2: 420, y2: 335 },
        { x1: 420, y1: 335, x2: 420, y2: 740 },
        { x1: 500, y1: 155, x2: 580, y2: 335 },
        { x1: 580, y1: 335, x2: 580, y2: 740 },
        { x1: 935, y1: 155, x2: 765, y2: 335 },
        { x1: 765, y1: 335, x2: 765, y2: 740 }
      );
    }
    // 세 맵 모두 결승선은 한 곳뿐이며, 넓은 트랙을 하나의 결승 통로로 모읍니다.
    segments.push(...finishFunnelSegments());
    return { pins, segments };
  }

  function rotatingSegments(time) {
    const bars = [
      { y: 285, phase: 0.2, length: 430 },
      { y: 555, phase: 2.0, length: 470 },
      { y: 825, phase: 4.1, length: 440 },
      { y: 1080, phase: 1.1, length: 400 }
    ];
    return bars.map((bar) => {
      const phase = time * 1.2 + bar.phase;
      const angle = Math.sin(phase) * 0.68;
      const omega = Math.cos(phase) * 0.82;
      const dx = Math.cos(angle) * bar.length / 2;
      const dy = Math.sin(angle) * bar.length / 2;
      return { x1: 500 - dx, y1: bar.y - dy, x2: 500 + dx, y2: bar.y + dy, cx: 500, cy: bar.y, omega, rotating: true };
    });
  }

  function setUpRace() {
    const n = participants.length;
    const radius = Math.max(5.2, Math.min(11.2, 12.5 - 0.72 * Math.sqrt(n)));
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
      static: makeStaticObstacles(selectedMap), lastUiUpdate: 0, stuckCount: 0, selectedBall: null
    };
    $('#raceTitle').textContent = MAPS[selectedMap].title;
    $('#raceProgress').textContent = `0 / ${n} 도착`;
    $('#raceStatus').textContent = '구슬이 출발을 기다리고 있어요.';
    $('#beadInfo').textContent = '구슬을 누르거나 터치하면 참가자 이름을 확인할 수 있어요.';
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
      ball.vy += 100 + Math.random() * 40;
      ball.vx += (Math.random() - 0.5) * 110;
      ball.stallTime = 0;
      ball.rescueCount = 0;
    });
    game.stuckCount = 0;
    game.watchdogTime = 0;
    game.autoPaused = false;
    game.paused = false;
    $('#recoveryControls').hidden = true;
    $('#pauseRace').textContent = '일시 정지';
    $('#raceStatus').textContent = '멈춘 구슬에 힘을 보냈어요. 계속 달립니다!';
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
    const movingSegments = game.map === 'spinner' ? rotatingSegments(game.time) : [];
    const allSegments = game.static.segments.concat(movingSegments);
    const active = game.balls.filter((ball) => !ball.finished);

    for (const ball of active) {
      ball.prevX = ball.x;
      ball.prevY = ball.y;
      ball.vy += 178 * dt;
      ball.vx += Math.sin(game.time * 1.2 + ball.id * 2.1) * 3.5 * dt;
      const drag = Math.pow(0.999, dt * 60);
      ball.vx *= drag;
      ball.vy *= drag;
      const speed = Math.hypot(ball.vx, ball.vy);
      if (speed > 340) { ball.vx *= 340 / speed; ball.vy *= 340 / speed; }
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      resolveWalls(ball);
      for (const pin of game.static.pins) resolvePin(ball, pin);
      for (const segment of allSegments) resolveSegment(ball, segment);
    }
    resolveBallPairs(active);

    const crossed = [];
    for (const ball of active) {
      resolveWalls(ball);
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
        if (crossingX >= WORLD.finishLeft && crossingX <= WORLD.finishRight) {
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
    if (game.stuckCount >= 2 || game.watchdogTime > 90) {
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
    if (ball.x - ball.r < WORLD.left) {
      ball.x = WORLD.left + ball.r;
      if (ball.vx < 0) ball.vx = -ball.vx * 0.55;
    } else if (ball.x + ball.r > WORLD.right) {
      ball.x = WORLD.right - ball.r;
      if (ball.vx > 0) ball.vx = -ball.vx * 0.55;
    }
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
    const toward = ball.vx * nx + ball.vy * ny;
    if (toward < 0) { ball.vx -= 1.48 * toward * nx; ball.vy -= 1.48 * toward * ny; }
  }
  function resolveSegment(ball, segment) {
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
    const min = ball.r + (segment.rotating ? 5.5 : 4.5);
    if (distance >= min) return;
    if (distance < 0.001) {
      const length = Math.sqrt(length2);
      nx = -dy / length; ny = dx / length;
    } else { nx /= distance; ny /= distance; }
    ball.x += nx * (min - distance);
    ball.y += ny * (min - distance);
    const surfaceVx = segment.rotating ? -segment.omega * (py - segment.cy) : 0;
    const surfaceVy = segment.rotating ? segment.omega * (px - segment.cx) : 0;
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
    $('#resultSubtitle').textContent = `${game.order.length}명이 모두 완주한 ${MAPS[game.map].label} 경기의 마지막 결승선 통과자예요.`;
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
    game.order.forEach((ball, index) => {
      const li = document.createElement('li');
      const rank = document.createElement('span'); rank.className = 'rank-number'; rank.textContent = String(index + 1);
      const bead = document.createElement('i'); bead.className = 'mini-bead'; bead.style.background = ball.color;
      const name = document.createElement('span'); name.className = 'order-name'; name.textContent = `#${ball.id} ${ball.name}`;
      li.append(rank, bead, name); fragment.append(li);
    });
    list.append(fragment);
    $('#liveFooter').textContent = game.order.length === 0 ? '아직 결승선을 통과한 구슬이 없어요.' : `${game.order.length}명이 완주 · ${remaining}명 경주 중`;
    if (game.selectedBall) {
      const ball = game.balls.find((item) => item.id === game.selectedBall);
      if (ball) $('#beadInfo').textContent = `구슬 #${ball.id} · ${ball.name}${ball.finished ? ' — 결승선 통과!' : ' — 달리는 중'}`;
    }
  }

  function resizeCanvas() {
    if (!canvas || stage !== 'race') return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvasScaleX = canvas.width / WORLD.width;
    canvasScaleY = canvas.height / WORLD.height;
    drawTrack();
  }
  const observer = new ResizeObserver(resizeCanvas);
  observer.observe(canvas);
  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('pointerdown', (event) => {
    if (!game) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * WORLD.width / rect.width;
    const y = (event.clientY - rect.top) * WORLD.height / rect.height;
    let closest = null;
    let minDistance = 30;
    for (const ball of game.balls) {
      if (ball.finished) continue;
      const distance = Math.hypot(ball.x - x, ball.y - y);
      if (distance < minDistance) { minDistance = distance; closest = ball; }
    }
    if (closest) {
      game.selectedBall = closest.id;
      $('#beadInfo').textContent = `구슬 #${closest.id} · ${closest.name} — 달리는 중`;
    } else {
      game.selectedBall = null;
      $('#beadInfo').textContent = '구슬을 누르거나 터치하면 참가자 이름을 확인할 수 있어요.';
    }
  });

  function drawTrack() {
    if (!ctx || !canvas.width || !game) return;
    ctx.setTransform(canvasScaleX, 0, 0, canvasScaleY, 0, 0);
    ctx.clearRect(0, 0, WORLD.width, WORLD.height);
    const bg = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    bg.addColorStop(0, '#fff7e7'); bg.addColorStop(1, '#ffedca');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = '#fffdf8'; ctx.fillRect(16, 17, 968, WORLD.height - 32);
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
    ctx.moveTo(WORLD.left, WORLD.funnelY);
    ctx.lineTo(WORLD.finishLeft - 5, WORLD.funnelKnee);
    ctx.lineTo(WORLD.finishLeft - 5, WORLD.bottom);
    ctx.lineTo(WORLD.finishRight + 5, WORLD.bottom);
    ctx.lineTo(WORLD.finishRight + 5, WORLD.funnelKnee);
    ctx.lineTo(WORLD.right, WORLD.funnelY);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#749bca';
    ctx.fillRect(WORLD.finishLeft - 5, WORLD.finishY, WORLD.finishRight - WORLD.finishLeft + 10, 8);
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 ? '#fff' : '#e98654';
      ctx.fillRect(WORLD.finishLeft - 5 + i * ((WORLD.finishRight - WORLD.finishLeft + 10) / 12), WORLD.finishY, (WORLD.finishRight - WORLD.finishLeft + 10) / 12, 8);
    }
    ctx.fillStyle = '#5d9865'; ctx.font = '700 11px sans-serif'; ctx.fillText('START', 28, 39);
    ctx.fillStyle = '#d97945'; ctx.fillText('FINISH', WORLD.finishLeft - 5, WORLD.finishY - 8);

    if (game.map === 'pinball') {
      for (const pin of game.static.pins) {
        ctx.beginPath(); ctx.arc(pin.x + 1, pin.y + 2, pin.r + 1.2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(96,65,36,.12)'; ctx.fill();
        ctx.beginPath(); ctx.arc(pin.x, pin.y, pin.r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(pin.x - 2, pin.y - 2, 1, pin.x, pin.y, pin.r);
        grad.addColorStop(0, '#ffe6aa'); grad.addColorStop(1, '#bc8450'); ctx.fillStyle = grad; ctx.fill();
      }
    }
    if (game.map === 'fork') {
      ctx.fillStyle = 'rgba(252,218,158,.23)';
      ctx.beginPath();
      ctx.moveTo(65, 155); ctx.lineTo(500, 155); ctx.lineTo(420, 335); ctx.lineTo(420, 740); ctx.lineTo(500, 865);
      ctx.lineTo(285, 865); ctx.lineTo(235, 740); ctx.lineTo(235, 335); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(935, 155); ctx.lineTo(500, 155); ctx.lineTo(580, 335); ctx.lineTo(580, 740); ctx.lineTo(500, 865);
      ctx.lineTo(715, 865); ctx.lineTo(765, 740); ctx.lineTo(765, 335); ctx.closePath(); ctx.fill();
    }
    const segments = game.static.segments.concat(game.map === 'spinner' ? rotatingSegments(game.time) : []);
    for (const segment of segments) {
      ctx.lineCap = 'round'; ctx.lineWidth = segment.rotating ? 11 : 8;
      ctx.strokeStyle = segment.rotating ? '#bf7545' : (segment.funnel ? '#c58b58' : '#ba946c');
      ctx.beginPath(); ctx.moveTo(segment.x1, segment.y1); ctx.lineTo(segment.x2, segment.y2); ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = segment.rotating ? '#f1bb79' : '#e0c09a'; ctx.stroke();
      if (segment.rotating) for (const [x, y] of [[segment.x1, segment.y1], [segment.x2, segment.y2]]) {
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = '#8b5437'; ctx.fill();
      }
    }
    for (const ball of game.balls) {
      if (ball.finished) continue;
      const r = ball.r;
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
  }
  function lighten(color, amount) {
    const match = color.match(/hsl\(([^ ]+)\s+([^ ]+)\s+([^%]+)%\)/);
    return match ? `hsl(${match[1]} ${match[2]} ${Math.min(88, Number(match[3]) + amount * 30)}%)` : color;
  }

  updateCountBadge(2);
  selectMap(selectedMap);
})();
