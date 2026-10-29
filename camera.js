(() => {
  'use strict';
  // Camera transforms never change simulation positions or results.
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  window.RaceCamera = class RaceCamera {
    constructor() { this.reset(); }
    reset() {
      this.mode = 'auto'; this.zoom = 1; this.x = 500; this.y = 150;
      this.initialized = false; this.label = '자동 중계';
    }
    moveTo(x, y) {
      this.mode = 'manual'; this.x = x; this.y = y;
      this.initialized = true;
    }
    pan(dx, dy) { this.moveTo(this.x - dx / this.scale, this.y - dy / this.scale); }
    update(game, world, width, height, dt) {
      const running = game.balls.filter(ball => !ball.finished).sort((a, b) => b.y - a.y);
      const winningRank = Math.max(1, Math.min(game.balls.length, game.winningRank ?? game.balls.length));
      let mode = this.mode;
      if (mode === 'auto') mode = game.order.length > game.balls.length * 0.65 ? 'tail' : ['leader', 'pack', 'tail'][Math.floor(game.time / 7) % 3];
      let target;
      if (/^ball:/.test(mode)) target = game.balls.find(ball => ball.id === Number(mode.slice(5)));
      else if (mode === 'winning') target = game.order[winningRank - 1] ?? running[winningRank - game.order.length - 1];
      else if (mode === 'leader') target = running[0];
      else if (mode === 'tail') target = running[running.length - 1];
      else if (mode !== 'manual') target = running[Math.floor(running.length / 2)];
      const overview = mode === 'overview';
      this.scale = Math.max(0.01, overview ? Math.min(width / (world.width + 90), height / (world.height + 70)) : width / (1080 / this.zoom));
      this.visibleWidth = width / this.scale;
      this.visibleHeight = height / this.scale;
      const followsBall = /^ball:/.test(mode) || mode === 'winning';
      const lookAhead = followsBall ? 55 : this.visibleHeight * 0.13;
      let nextX = overview ? world.width / 2 : (followsBall && target ? target.x : world.width / 2);
      let nextY = overview ? world.height / 2 : ((target?.y ?? world.finishY) + lookAhead);
      if (mode === 'manual') { nextX = this.x; nextY = this.y; }
      const bound = (value, span, size) => span >= size ? size / 2 : clamp(value, span / 2 - 15, size - span / 2 + 15);
      nextX = bound(nextX, this.visibleWidth, world.width);
      nextY = bound(nextY, this.visibleHeight, world.height);
      const blend = this.initialized && mode !== 'manual' ? 1 - Math.exp(-Math.max(dt, 1 / 120) * 4) : 1;
      this.x += (nextX - this.x) * blend;
      this.y += (nextY - this.y) * blend;
      this.initialized = true;
      this.left = this.x - this.visibleWidth / 2;
      this.top = this.y - this.visibleHeight / 2;
      const names = { leader: '선두', pack: '중간 그룹', tail: '후미', overview: '전체 코스', manual: '수동 보기' };
      this.label = names[mode] || (target ? '#' + target.id + ' ' + (target.label ?? target.name) + (target.finished ? ' · 완주' : '') : '결승선');
      if(mode==='winning')this.label='당첨 '+winningRank+'등 '+(game.order[winningRank-1]?'확정':'후보')+(target?' · #'+target.id:'');
      if (this.mode === 'auto') this.label = '자동 중계 · ' + this.label;
      this.target = target;
    }
    apply(ctx, dpr) {
      ctx.setTransform(this.scale * dpr, 0, 0, this.scale * dpr, -this.left * this.scale * dpr, -this.top * this.scale * dpr);
    }
    toWorld(x, y) { return { x: this.left + x / this.scale, y: this.top + y / this.scale }; }
  };
})();
