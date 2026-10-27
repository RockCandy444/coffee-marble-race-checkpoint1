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
let now=100,timers=new Map(),next=0,allowed=true,armed=0;
const command=new Command({allowed:()=>allowed,arm:()=>armed++,now:()=>now,schedule:(fn,ms)=>{timers.set(++next,{fn,at:now+ms});return next;},cancel:id=>timers.delete(id)});
const advance=ms=>{now+=ms;for(const [id,t]of [...timers])if(t.at<=now){timers.delete(id);t.fn();}};
const codes=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyC','KeyO','KeyM','KeyE','KeyT'];
for(const style of ['lower','upper','ime']){for(const code of codes)command.key({code,key:style==='ime'?'Process':code.startsWith('Key')?(style==='upper'?code.slice(3):code.slice(3).toLowerCase()):code,isComposing:style==='ime'});}assert.equal(armed,3,'physical key codes ignore case and IME composition');
for(const code of codes.slice(0,8))command.key({code});advance(10001);for(const code of codes.slice(8))command.key({code});assert.equal(armed,3,'old prefix expires');
command.reset();allowed=false;for(const code of codes)command.key({code});assert.equal(armed,3);allowed=true;
for(const code of codes)command.key({code,target:{closest:()=>({})}});assert.equal(armed,3,'name entry cannot arm');
command.reset();for(const code of codes)command.key({code,repeat:true});assert.equal(armed,3);
const event=(id=1,x=50,y=50)=>({pointerType:'touch',pointerId:id,clientX:x,clientY:y,button:0});
function tap(id){command.down(id,event());advance(50);command.up(event());}
function prefix(){command.reset();tap('ghost');tap('ghost');tap('ghost');tap('rocket');tap('rocket');}
prefix();command.down('goo',event());advance(1199);assert.equal(armed,3);advance(1);assert.equal(armed,4);advance(2000);assert.equal(armed,4,'holding does not repeat');command.up(event());
prefix();command.down('goo',event());advance(500);command.up(event());advance(1000);assert.equal(armed,4,'early release cancels');
prefix();command.down('goo',event());command.move(event(1,80,50));advance(1300);assert.equal(armed,4,'drag is not a hold');
prefix();command.down('goo',event());command.pointerCancel(event());advance(1300);assert.equal(armed,4);
prefix();command.down('goo',event());allowed=false;advance(1300);assert.equal(armed,4,'closing/background cancels hold');allowed=true;command.reset();
tap('ghost');tap('rocket');tap('ghost');tap('rocket');tap('rocket');command.down('goo',event());advance(1300);assert.equal(armed,4,'wrong tap order does not arm');
prefix();command.down('goo',event());command.down('goo',event(2));advance(1300);assert.equal(armed,4,'multitouch cancels');
console.log('Hidden selection: normal 10% x15%, battle3%, uniform target, isolated 50 pool; PC case/IME/timeout/input guards and mobile sequence/hold/cancel/multitouch passed');
