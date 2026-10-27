const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const box={window:{}};for(const file of ['golden.js','battle.js','secret.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),box);
const battle=box.window.MarbleBattle,golden=box.window.GoldenMarble,Command=box.window.CometCommand;
const rng=values=>()=>{assert.ok(values.length);return values.shift();};
for(const n of [2,100]){const balls=Array.from({length:n},(_,i)=>({id:i+1}));let hidden=0,regular=0,battleHits=0;
 for(let i=0;i<10000;i++){let choice=golden.choose(balls,rng([0,.5,(i+.5)/10000]));if(choice.abilityId==='comet')hidden++;else regular++;if(battle.chooseComet(balls,rng([(i+.5)/10000,.5])))battleHits++;}
 assert.equal(hidden,1500);assert.equal(regular,8500);assert.equal(battleHits,300);assert.equal(golden.choose(balls,rng([.1])),null);
 assert.equal(golden.choose(balls,rng([0,0,.149999])).abilityId,'comet');assert.equal(golden.choose(balls,rng([0,0,.15])).abilityId,'ghost');assert.equal(battle.chooseComet(balls,rng([.03])),null);
 for(let i=0;i<n;i++)assert.equal(battle.chooseComet(balls,rng([(i+.5)/n]),true).ballId,i+1);
}
assert.equal(battle.abilities.length,50);assert.equal(battle.abilities.some(a=>a.id==='comet'),false);
let now=100,allowed=true,armed=0;
const command=new Command({allowed:()=>allowed,arm:()=>armed++,now:()=>now});
const codes=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyC','KeyO','KeyM','KeyE','KeyT'];
for(const style of ['lower','upper','ime'])for(const code of codes)command.key({code,key:style==='ime'?'Process':code.startsWith('Key')?(style==='upper'?code.slice(3):code.slice(3).toLowerCase()):code,isComposing:style==='ime'});
assert.equal(armed,3,'physical key codes ignore case and IME composition');
for(const code of codes.slice(0,8))command.key({code});now+=10001;for(const code of codes.slice(8))command.key({code});assert.equal(armed,3);
command.reset();allowed=false;for(const code of codes)command.key({code});assert.equal(armed,3);allowed=true;
for(const code of codes)command.key({code,target:{closest:()=>({})}});assert.equal(armed,3);
command.reset();for(const code of codes)command.key({code,repeat:true});assert.equal(armed,3);
const tap=id=>{now+=50;return command.tap(id);},prefix=()=>{command.reset();for(const id of ['ghost','ghost','ghost','rocket','rocket'])tap(id);};
prefix();assert.equal(armed,3,'five taps are not a full command');assert.equal(tap('goo'),true);assert.equal(armed,4,'six native activations unlock without a hold');assert.equal(tap('goo'),false);assert.equal(armed,4,'extra final taps do not repeat');
prefix();tap('heavy');tap('goo');assert.equal(armed,4,'wrong card resets');prefix();now+=30001;tap('goo');assert.equal(armed,4,'old taps expire');prefix();allowed=false;tap('goo');allowed=true;tap('goo');assert.equal(armed,4,'closed guide/race blocks command and resets');
command.reset();tap('ghost');tap('rocket');tap('ghost');tap('rocket');tap('rocket');tap('goo');assert.equal(armed,4,'wrong order cannot unlock');
prefix();command.reset();tap('goo');assert.equal(armed,4,'navigation reset clears partial input');
console.log('Hidden probabilities and PC case/IME guards unchanged; native six-tap command, one unlock, wrong order/card, timeout, closed guide and navigation reset passed');
