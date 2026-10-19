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
    update(game, world, width, height, dt) {
      const running = game.balls.filter(ball => !ball.finished).sort((a, b) => b.y - a.y);
      let mode = this.mode;
      if (mode === 'auto') mode = game.order.length > game.balls.length * 0.65 ? 'tail' : ['leader', 'pack', 'tail'][Math.floor(game.time / 7) % 3];
      let target;
      if (/^ball:/.test(mode)) target = game.balls.find(ball => ball.id === Number(mode.slice(5)));
      else if (mode === 'leader') target = running[0];
      else if (mode === 'tail') target = running[running.length - 1];
      else target = running[Math.floor(running.length / 2)];
      const overview = mode === 'overview';
      this.scale = Math.max(0.01, overview ? Math.min(width / (world.width + 90), height / (world.height + 70)) : width / (1080 / this.zoom));
      this.visibleWidth = width / this.scale;
      this.visibleHeight = height / this.scale;
      const lookAhead = /^ball:/.test(mode) ? 55 : this.visibleHeight * 0.13;
      let nextX = overview ? world.width / 2 : (/^ball:/.test(mode) && target ? target.x : world.width / 2);
      let nextY = overview ? world.height / 2 : ((target?.y ?? world.finishY) + lookAhead);
      const bound = (value, span, size) => span >= size ? size / 2 : clamp(value, span / 2 - 15, size - span / 2 + 15);
      nextX = bound(nextX, this.visibleWidth, world.width);
      nextY = bound(nextY, this.visibleHeight, world.height);
      const blend = this.initialized ? 1 - Math.exp(-Math.max(dt, 1 / 120) * 4) : 1;
      this.x += (nextX - this.x) * blend;
      this.y += (nextY - this.y) * blend;
      this.initialized = true;
      this.left = this.x - this.visibleWidth / 2;
      this.top = this.y - this.visibleHeight / 2;
      const names = { leader: '선두', pack: '중간 그룹', tail: '후미', overview: '전체 코스' };
      this.label = names[mode] || (target ? '#' + target.id + ' ' + target.name + (target.finished ? ' · 완주' : '') : '결승선');
      if (this.mode === 'auto') this.label = '자동 중계 · ' + this.label;
      this.target = target;
    }
    apply(ctx, dpr) {
      ctx.setTransform(this.scale * dpr, 0, 0, this.scale * dpr, -this.left * this.scale * dpr, -this.top * this.scale * dpr);
    }
    toWorld(x, y) { return { x: this.left + x / this.scale, y: this.top + y / this.scale }; }
  };
})();
