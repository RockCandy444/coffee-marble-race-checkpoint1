(() => {
  'use strict';
  const normalize = name => name.normalize('NFC').trim().replace(/\s+/g, ' ');
  const colorFor = index => `hsl(${((index * 137.508 + 16) % 360).toFixed(1)} 78% 53%)`;
  const patterns = ['solid', 'stripe', 'ring', 'dots'];
  function parse(text) {
    const names = [];
    for (const raw of text.split(/[\r\n,，\t;]+/)) {
      const token = raw.trim();
      if (!token) continue;
      const match = token.match(/^(.+?)\s*[*×＊]\s*(\d+)$/u);
      if (/[*×＊]/u.test(token) && !match) return { names: [], error: `“${token}”의 개수를 확인해 주세요. 예: 홍길동 * 5 (1~100의 정수)` };
      const name = normalize(match ? match[1] : token);
      const count = match ? Number(match[2]) : 1;
      if (!name || /[*×＊]/u.test(name) || !Number.isSafeInteger(count) || count < 1 || count > 100) {
        return { names: [], error: '이름 뒤에는 1~100의 정수를 적어 주세요. 예: 홍길동 * 5' };
      }
      if (names.length + count > 100) return { names: [], error: '전체 구슬은 최대 100개까지 참가할 수 있어요. 이름별 개수를 줄여 주세요.' };
      for (let i = 0; i < count; i++) names.push(name);
    }
    return { names, error: '' };
  }
  function entries(names) {
    const owners = new Map();
    names.forEach(raw => {
      const name = normalize(raw);
      if (!owners.has(name)) {
        const index = owners.size;
        owners.set(name, { name, color: colorFor(index), pattern: patterns[index % patterns.length], total: 0, copy: 0 });
      }
      owners.get(name).total++;
    });
    return names.map((raw, index) => {
      const owner = owners.get(normalize(raw));
      const copy = ++owner.copy;
      return { id: index + 1, name: owner.name, color: owner.color, pattern: owner.pattern, copy, total: owner.total,
        label: owner.name + (owner.total > 1 ? ` · ${copy}/${owner.total}번 구슬` : '') };
    });
  }
  function styleBead(element, ball) {
    element.style.backgroundColor = ball.color;
    element.dataset.pattern = ball.pattern;
    element.dataset.golden = ball.golden ? 'true' : 'false';
    element.setAttribute('aria-hidden', 'true');
  }
  window.MarbleRoster = { parse, entries, styleBead };
})();
