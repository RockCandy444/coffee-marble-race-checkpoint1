const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};
for(const file of ['course.js','golden.js','battle.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),sandbox);
const golden=sandbox.window.GoldenMarble,course=sandbox.window.MarbleCourse;
const random=values=>()=>{assert.ok(values.length,'unexpected extra random draw');return values.shift();};
for(const count of [2,100]) {
  const balls=Array.from({length:count},(_,i)=>({id:i+1}));
  assert.equal(golden.choose(balls,random([.1])),null);
  assert.equal(golden.choose(balls,random([.9999])),null);
  const hit=golden.choose(balls,random([.099999,.999999,.999999]));
  assert.equal(hit.ballId,count); assert.equal(hit.abilityId,'shortcut');
  let hits=0;
  for(let i=0;i<10000;i++) if(golden.choose(balls,random([(i+.5)/10000,.5,.5]))) hits++;
  assert.equal(hits,1000,'one race-wide 10% interval, independent of marble count');
  for(const [i,ability] of golden.abilities.entries()) assert.equal(golden.choose(balls,random([0,0,(i+.5)/golden.abilities.length])).abilityId,ability.id);
  const selected=Array(count).fill(0),abilities=Array(golden.abilities.length).fill(0);
  for(let i=0;i<count;i++) selected[golden.choose(balls,random([0,(i+.5)/count,0])).ballId-1]++;
  assert.ok(selected.every(n=>n===1),'each marble has one equal selection interval');
  for(let i=0;i<3100;i++) abilities[golden.abilities.findIndex(a=>a.id===golden.choose(balls,random([0,0,(i+.5)/3100])).abilityId)]++;
  assert.ok(abilities.every(n=>n===100));
}
const immune={immuneFields:true,x:400,y:400,vx:20,vy:30};
for(const kind of ['magnet','wind']) course.field(immune,{x:450,y:400,range:120,strength:230,kind,direction:1},.1);
assert.equal(immune.vx,20);assert.equal(immune.vy,30);
console.log('Golden lottery: race-wide 10%, equal marble and ability intervals, boundary rolls and both field immunities passed');
