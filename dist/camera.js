(() => {
  'use strict';

  // Camera overlay for the existing canvas renderer: keeps the full course in view by
  // default, and applies a viewport transform when a participant is selected.
  const canvas = document.querySelector('#raceCanvas');
  const raceView = document.querySelector('#raceView');
  const selector = document.querySelector('#cameraSelect');
  const zoomOut = document.querySelector('#cameraZoomOut');
  const zoomIn = document.querySelector('#cameraZoomIn');
  const reset = document.querySelector('#cameraReset');
  const status = document.querySelector('#cameraStatus');
  if (!canvas || !raceView || !selector) return;

  const ctx = canvas.getContext('2d');
  const savedSetTransform = ctx.setTransform.bind(ctx);
  const savedClearRect = ctx.clearRect.bind(ctx);
  const positions = new Map();
  const state = {
    zoom: 1,
    targetId: null,
    centerX: 500,
    centerY: 800,
    baseX: 1,
    baseY: 1,
    inRace: false,
    lastProgress: ''
  };

  function transformedSetTransform(a, b, c, d) {
    state.baseX = a || 1;
    state.baseY = d || 1;
    const sx = state.baseX * state.zoom;
    const sy = state.baseY * state.zoom;
    savedSetTransform(sx, 0, 0, sy,
      canvas.width / 2 - state.centerX * sx,
      canvas.height / 2 - state.centerY * sy);
  }
  ctx.setTransform = transformedSetTransform;
  // The app clears world coordinates each frame. Clear the actual viewport so zooming
  // never leaves trails at the edges, then restore the camera transform.
  ctx.clearRect = () => {
    savedSetTransform(1, 0, 0, 1, 0, 0);
    savedClearRect(0, 0, canvas.width, canvas.height);
    transformedSetTransform(state.baseX, 0, 0, state.baseY);
  };

  const originalFillText = ctx.fillText.bind(ctx);
  ctx.fillText = (text, x, y, maxWidth) => {
    if (/^\d{1,3}$/.test(String(text))) {
      const id = Number(text);
      if (id >= 1 && id <= 100) positions.set(id, { x, y: y - 0.3 });
    }
    if (maxWidth === undefined) originalFillText(text, x, y);
    else originalFillText(text, x, y, maxWidth);
  };

  function participantNames() {
    const field = document.querySelector('#namesInput');
    return field ? field.value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean) : [];
  }

  function populateParticipants() {
    const names = participantNames();
    selector.replaceChildren();
    const overview = document.createElement('option');
    overview.value = 'overview';
    overview.textContent = '전체 코스 보기';
    selector.append(overview);
    names.forEach((name, index) => {
      const option = document.createElement('option');
      option.value = String(index + 1);
      option.textContent = `#${index + 1} ${name}`;
      selector.append(option);
    });
    selector.value = 'overview';
  }

  function restoreOverview() {
    state.targetId = null;
    state.zoom = 1;
    state.centerX = 500;
    state.centerY = 800;
    selector.value = 'overview';
    status.textContent = '전체 코스가 한눈에 보여요.';
  }

  function chooseTarget(id) {
    const targetId = Number(id);
    if (!Number.isInteger(targetId) || targetId < 1 || targetId > 100) {
      restoreOverview();
      return;
    }
    state.targetId = targetId;
    state.zoom = Math.max(state.zoom, 2.1);
    const point = positions.get(targetId);
    if (point) { state.centerX = point.x; state.centerY = point.y; }
    selector.value = String(targetId);
    const option = selector.selectedOptions[0];
    status.textContent = `${option ? option.textContent : `#${targetId}`} 카메라로 따라가는 중`;
  }

  selector.addEventListener('change', () => {
    if (selector.value === 'overview') restoreOverview();
    else chooseTarget(selector.value);
  });
  zoomIn.addEventListener('click', () => setZoom(state.zoom * 1.25));
  zoomOut.addEventListener('click', () => setZoom(state.zoom / 1.25));
  reset.addEventListener('click', restoreOverview);

  function setZoom(nextZoom) {
    state.zoom = Math.max(0.75, Math.min(4, nextZoom));
    if (state.targetId !== null) {
      const point = positions.get(state.targetId);
      if (point) { state.centerX = point.x; state.centerY = point.y; }
    }
  }

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const px = (event.clientX - rect.left) * canvas.width / rect.width;
    const py = (event.clientY - rect.top) * canvas.height / rect.height;
    const beforeX = state.centerX + (px - canvas.width / 2) / (state.baseX * state.zoom);
    const beforeY = state.centerY + (py - canvas.height / 2) / (state.baseY * state.zoom);
    const next = Math.max(0.75, Math.min(4, state.zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12)));
    if (state.targetId === null) {
      state.centerX = beforeX - (px - canvas.width / 2) / (state.baseX * next);
      state.centerY = beforeY - (py - canvas.height / 2) / (state.baseY * next);
    }
    state.zoom = next;
  }, { passive: false });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const px = (event.clientX - rect.left) * canvas.width / rect.width;
    const py = (event.clientY - rect.top) * canvas.height / rect.height;
    const worldX = state.centerX + (px - canvas.width / 2) / (state.baseX * state.zoom);
    const worldY = state.centerY + (py - canvas.height / 2) / (state.baseY * state.zoom);
    let closestId = null;
    let nearest = Infinity;
    for (const [id, point] of positions) {
      const distance = Math.hypot(point.x - worldX, point.y - worldY);
      if (distance < nearest) { nearest = distance; closestId = id; }
    }
    if (closestId !== null && nearest < 34) {
      chooseTarget(closestId);
      const option = selector.selectedOptions[0];
      const beadInfo = document.querySelector('#beadInfo');
      if (beadInfo && option) beadInfo.textContent = `${option.textContent} · 카메라가 구슬을 따라가요.`;
    }
  });

  // Update follow position using bead coordinates captured from the renderer's own draw
  // calls. This follows the live simulation; no result order or trajectory is fabricated.
  function animationFrame() {
    const active = !raceView.hidden;
    if (active && !state.inRace) {
      state.inRace = true;
      state.lastProgress = '';
      positions.clear();
      populateParticipants();
      restoreOverview();
    } else if (!active && state.inRace) {
      state.inRace = false;
    }
    if (active) {
      const progress = document.querySelector('#raceProgress')?.textContent || '';
      if (/^0\s*\//.test(progress) && state.lastProgress && !/^0\s*\//.test(state.lastProgress)) {
        positions.clear();
        restoreOverview();
      }
      state.lastProgress = progress;
      if (state.targetId !== null) {
        const point = positions.get(state.targetId);
        if (point) { state.centerX = point.x; state.centerY = point.y; }
      }
      if (zoomIn) zoomIn.disabled = state.zoom >= 4;
      if (zoomOut) zoomOut.disabled = state.zoom <= 0.75;
    }
    requestAnimationFrame(animationFrame);
  }
  requestAnimationFrame(animationFrame);
})();
