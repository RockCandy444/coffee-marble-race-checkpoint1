const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const sandbox = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','roster.js'),'utf8'),sandbox);
const roster = sandbox.window.MarbleRoster;
const plain = value => JSON.parse(JSON.stringify(value));
const cases = [
  ['홍길동 * 5, 김민지, 이준호 * 2', ['홍길동','홍길동','홍길동','홍길동','홍길동','김민지','이준호','이준호']],
  [' 홍길동\t김민지\r\n이준호\n\n', ['홍길동','김민지','이준호']],
  ['홍길동*2，김 민지 × 2;서연＊1', ['홍길동','홍길동','김 민지','김 민지','서연']],
  ['  김   민지 , 김 민지 * 2', ['김 민지','김 민지','김 민지']],
  ['', []],
];
for (const [input,expected] of cases) { const result=roster.parse(input); assert.equal(result.error,''); assert.deepEqual(plain(result.names),expected); }
for (const input of ['홍길동 * 0','홍길동 * -1','홍길동 * 1.5','홍길동 * 다섯','*5','홍길동 ** 5','홍길동 * 1001','홍길동 * 1000,민지','홍길동 * 9999999999999999999999']) {
  const result=roster.parse(input); assert.ok(result.error,input+' must be rejected'); assert.equal(result.names.length,0);
}
assert.equal(roster.parse('홍길동 * 100').names.length,100);
assert.equal(roster.parse('홍길동 * 1000').names.length,1000);
assert.equal(roster.withCopies('민지*2,준호,민지',5).text,'민지 * 5\n준호 * 5');
assert.ok(roster.withCopies('민지,준호',501).error);
assert.ok(roster.withCopies('민지*잘못',2).error);
assert.equal(roster.withCopies('민지,준호',500).error,'');
const entries=roster.entries(roster.parse('홍길동*2,김민지,홍길동,김민지').names);
assert.deepEqual(entries.filter(b=>b.name==='홍길동').map(b=>b.copy).join(','),'1,2,3');
assert.ok(entries.filter(b=>b.name==='홍길동').every(b=>b.total===3 && b.color===entries[0].color && b.pattern===entries[0].pattern));
assert.ok(entries.filter(b=>b.name==='김민지').every(b=>b.total===2 && b.color===entries[2].color && b.pattern===entries[2].pattern));
assert.notEqual(entries[0].color,entries[2].color);
assert.notEqual(entries[0].pattern,entries[2].pattern);
assert.equal(new Set(entries.map(b=>b.id)).size,5);
assert.equal(entries[3].label,'홍길동 · 3/3번 구슬');
assert.deepEqual(plain(roster.entries(roster.parse('홍길동*2,김민지,홍길동,김민지').names)),plain(entries),'rematch identities stay consistent');
const normalized = roster.entries(['가','가']);
assert.ok(normalized.every(b=>b.total===2 && b.color===normalized[0].color));
console.log('Roster: mixed paste, multipliers, invalid counts, 100 limit, grouped appearance, numbering and rematch identity passed');
