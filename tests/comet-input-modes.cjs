const fs=require('node:fs'),path=require('node:path');
let h=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
h=h.replace('addEventListener() {}','addEventListener(type,callback) {(this.handlers??={})[type]=callback;}').replace('const document = { body: element(), addEventListener() {},','const document = { body: element(), handlers:{}, addEventListener(type,callback) {this.handlers[type]=callback;},');
new Function('require','__dirname',h+`
const Command=sandbox.window.CometCommand;
for(const [nav,expected] of [
 [{userAgent:'Windows NT 10.0',maxTouchPoints:0},false],
 [{userAgent:'Windows NT 10.0',maxTouchPoints:10},false],
 [{userAgent:'Macintosh',maxTouchPoints:0},false],
 [{userAgent:'X11; Linux x86_64'},false],
 [{userAgent:'Android',maxTouchPoints:5},true],
 [{userAgent:'iPhone'},true],[{userAgent:'iPad'},true],
 [{userAgent:'Macintosh',maxTouchPoints:5},true],
 [{userAgent:'Other',userAgentData:{mobile:true}},true]
])assert.equal(Command.isMobileDevice(nav),expected,JSON.stringify(nav));
const catalog=elements.get('#abilityCatalog'),reservation=document.querySelector('#cometReservation');reservation.hidden=true;
const card=id=>catalog.children.find(c=>c.dataset.ability===id),ids=['ghost','ghost','ghost','rocket','rocket','goo'];
const codes=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyC','KeyO','KeyM','KeyE','KeyT'];
const taps=event=>ids.forEach(id=>card(id).handlers.click(event));
const keys=()=>codes.forEach(code=>document.handlers.keydown({code,key:'Process',preventDefault(){}}));
const cancel=()=>elements.get('#cancelComet').handlers.click();
elements.get('#confirmParticipants').handlers.click();elements.get('#battleGuide').open=true;
sandbox.window.navigator={userAgent:'Windows NT 10.0',maxTouchPoints:10};
taps({detail:1,pointerType:'mouse'});assert.equal(reservation.hidden,true,'PC mouse cannot unlock');
taps({detail:1,pointerType:'touch'});assert.equal(reservation.hidden,true,'touchscreen PC also uses keys');
keys();assert.equal(reservation.hidden,false,'PC physical command still works with IME');cancel();
sandbox.window.navigator={userAgent:'Android',maxTouchPoints:5};
keys();assert.equal(reservation.hidden,true,'mobile keyboard cannot unlock');
taps({detail:0});assert.equal(reservation.hidden,true,'mobile keyboard activation cannot imitate taps');
taps({detail:1,pointerType:'mouse'});assert.equal(reservation.hidden,true,'mobile external mouse cannot unlock');
taps({detail:1,pointerType:'touch'});assert.equal(reservation.hidden,false,'mobile native touch sequence unlocks');cancel();
taps({detail:1});assert.equal(reservation.hidden,false,'legacy mobile native clicks without pointerType still work');cancel();
console.log('Device input split: PC keys only including touchscreen PCs; Android/iOS/iPad touch only, IME command, mobile mouse/keyboard rejection and legacy touch clicks passed');
`)(require,__dirname);
