const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const modules=['app.js','battle.js','camera.js','course.js','maps.js','hidden.js','roster.js'];
const dictionaries={};
for(const locale of ['en','ja']){
 const box={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'locales',locale+'.js'),'utf8'),box);dictionaries[locale]=box.window.MarbleMessages;
 for(const file of modules){
  const code=fs.readFileSync(path.join(root,file),'utf8');
  for(const match of code.matchAll(/tr\(("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g)){
   const key=vm.runInNewContext(match[1]);assert.ok(Object.hasOwn(dictionaries[locale],key),locale+' missing '+key);
   const placeholders=s=>[...s.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort();
   assert.deepEqual(placeholders(dictionaries[locale][key]),placeholders(key),'Placeholder mismatch: '+key);
  }
 }
 const html=fs.readFileSync(path.join(root,locale,'index.html'),'utf8');assert.ok(html.includes('<html lang="'+locale+'">'));assert.ok(html.includes('<base href="../">'));
 const body=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,'');
 assert.equal(body.replaceAll('한국어','').match(/[가-힣]+/g),null,'Korean leaked into '+locale+' page');
 assert.ok(html.includes('href="https://rockcandy444.github.io/coffeemarble/'+locale+'/"'));
 const data=JSON.parse(html.match(/application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(data.inLanguage,locale);assert.equal(data.url,'https://rockcandy444.github.io/coffeemarble/'+locale+'/');
 assert.equal((html.match(/rel="alternate" hreflang=/g)||[]).length,4);assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
}
// Execute the production UI and simulation in each language with identical seeds.
let harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
harness=harness.replace('step: physicsStep,','ui:updateLiveUI, finish:finishRace, settings:()=>window.savedLanguageSettings(), stage:()=>stage, result:()=>game, step: physicsStep,');
harness=harness.replace("const context = vm.createContext(sandbox);",`const context = vm.createContext(sandbox);
const locale=process.env.MARBLE_LOCALE||'ko';
document.documentElement={lang:locale};
if(locale!=='ko')vm.runInContext(fs.readFileSync(path.join(root,'locales',locale+'.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'i18n.js'),'utf8'),context);
sandbox.window.MarbleI18n.bindSettings=save=>sandbox.window.savedLanguageSettings=save;
if(process.env.MARBLE_RESTORE)sandbox.window.MarbleI18n.takeSettings=()=>JSON.parse(process.env.MARBLE_RESTORE);
`);
const snapshots=[];
for(const locale of ['ko','en','ja']){
 process.env.MARBLE_LOCALE=locale;
 new Function('require','__dirname','snapshots',harness+`
 assert.equal(sandbox.window.MarbleBattle.abilities.length,50);
 const names=['구슬 Marble ビー玉','Alex {0}'];
 const roster=sandbox.window.MarbleRoster.entries([names[0],names[0],names[1]]);
 assert.equal(roster[0].name,names[0]);
 assert.ok(roster[0].label.includes(locale==='en'?'Marble 1/2':locale==='ja'?'ビー玉 1/2':'1/2번 구슬'));
 assert.equal(sandbox.window.MarbleRoster.parse(names[0]+' * 2').names[0],names[0]);
 if(locale!=='ko')assert.ok(!/[가-힣]/.test(sandbox.window.MarbleRoster.parse('Alex * 0').error));
 simulation.resetNames('factory',[names[0],names[0],names[1]]);
 elements.get('#namesInput').value=names[0]+' * 2'+String.fromCharCode(10)+names[1];
 let game=simulation.state().game;
 for(let i=0;i<240;i++)simulation.step(1/120);
 snapshots.push(game.balls.map(b=>[b.id,b.x,b.y,b.vx,b.vy]));
 simulation.ui();
 if(locale!=='ko')assert.ok(!/[가-힣]/.test(elements.get('#raceProgress').textContent));
 game.order=[...game.balls];game.balls.forEach(b=>b.finished=true);simulation.finish();
 assert.equal(simulation.stage(),'results');
 const saved=simulation.settings();assert.equal(saved.stage,'results');assert.equal(saved.result.order.length,3);
 assert.equal(saved.result.balls[0].name,names[0]);
 process.env.MARBLE_RESTORE=JSON.stringify(saved);
 `)(require,__dirname,snapshots);
 // Restore results through the same app bootstrap used by a language navigation.
 const next={ko:'en',en:'ja',ja:'ko'}[locale];process.env.MARBLE_LOCALE=next;
 new Function('require','__dirname',harness+`
 assert.equal(simulation.stage(),'results');
 assert.equal(simulation.result().balls[0].name,'구슬 Marble ビー玉');
 assert.equal(simulation.result().order.length,3);
 if(process.env.MARBLE_LOCALE!=='ko')assert.ok(!/[가-힣]/.test(elements.get('#resultSubtitle').textContent));
 `)(require,__dirname);
 delete process.env.MARBLE_RESTORE;
}
delete process.env.MARBLE_LOCALE;
assert.deepEqual(snapshots[0],snapshots[1]);assert.deepEqual(snapshots[1],snapshots[2]);
// Language navigation only transfers this tab's settings, once, to its intended locale.
const storage=new Map(),links=['ko','en','ja'].map(locale=>({dataset:{localeLink:locale},setAttribute(){},addEventListener(type,handler){this.handler=handler;}}));
const box={window:{},document:{documentElement:{lang:'ko'},querySelectorAll:()=>links,querySelector:()=>({textContent:''})},sessionStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},Date};
const i18n=fs.readFileSync(path.join(root,'i18n.js'),'utf8');vm.runInNewContext(i18n,box);box.window.MarbleI18n.bindSettings(()=>({names:'<b>Alex</b> * 5',map:'rapids',random:true}));
let prevented=false;links[0].handler({preventDefault(){prevented=true;}});assert.ok(prevented);assert.equal(storage.size,0);
links[1].handler({preventDefault(){throw Error('Navigation unexpectedly blocked');}});assert.equal(storage.size,1);
box.document.documentElement.lang='en';vm.runInNewContext(i18n,box);
const transferred=box.window.MarbleI18n.takeSettings();assert.equal(transferred.names,'<b>Alex</b> * 5');assert.equal(transferred.random,true);assert.equal(box.window.MarbleI18n.takeSettings(),null);assert.equal(storage.size,0);
console.log('Translation coverage, placeholders, language URLs/metadata, user names, result transfer and identical physics in all 3 languages passed.');
