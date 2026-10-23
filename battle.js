(() => {
  'use strict';
  const abilities = [
    ['ghost','유령 통과','👻','이동',8,1.5,'잠깐 벽을 제외한 장애물을 통과해요.'],
    ['bumper','범퍼 변신','💥','방해',8,1.8,'몸에 닿는 다른 구슬을 튕겨내요.'],
    ['heavy','헤비볼','⚓','방어',0,0,'조금 더 빠르게 내려가고 덜 밀려요.'],
    ['immune','자석·바람 면역','🧲','방어',0,0,'자석과 바람의 힘을 받지 않아요.'],
    ['warp','순간 도약','✨','이동',11,0,'아래쪽의 안전한 빈자리로 짧게 이동해요.'],
    ['rocket','로켓 부스터','🚀','이동',7,.9,'짧고 강하게 아래로 가속해요.'],
    ['wallkick','벽차기','↘','이동',3,0,'벽에 닿으면 중앙 아래쪽으로 튀어나와요.'],
    ['path','빈틈 탐색','🧭','이동',7,1.4,'가까운 빈 통로 쪽으로 방향을 바꿔요.'],
    ['shrink','압축 구슬','🔹','이동',9,1.8,'잠깐 작아져 좁은 틈을 빠져나가요.'],
    ['frog','개구리 점프','🐸','이동',6,0,'앞이 막히면 위와 옆으로 짧게 뛰어요.'],
    ['shield','충격 보호막','🛡','방어',7,0,'다른 구슬의 방해를 한 번 막아요.'],
    ['absorb','충격 흡수','🧽','방어',7,2,'잠깐 장애물에 크게 튕겨 올라가지 않아요.'],
    ['reflect','반사 갑옷','🔁','방어',8,2,'받은 공격을 막고 공격자에게 충격을 돌려줘요.'],
    ['orbphase','구슬 통과','🫧','방어',8,1.6,'잠깐 다른 구슬과 겹쳐 지나가요.'],
    ['cleanse','상태 정화','💚','방어',6,2,'방해를 풀고 잠깐 다시 걸리지 않아요.'],
    ['windride','바람 타기','🪁','이동',0,0,'바람의 일부를 아래쪽 추진력으로 바꿔요.'],
    ['reverse','자력 반전','🧲','방어',8,2,'잠깐 자석에 끌리는 대신 밀려나요.'],
    ['shock','충격파','💫','방해',9,0,'가까운 구슬들을 바깥쪽으로 밀어내요.'],
    ['vacuum','진공 흡입','🌀','방해',9,1.2,'주변 구슬을 잠깐 자기 쪽으로 끌어당겨요.'],
    ['lightning','번개 추격','⚡','방해',8,0,'가까운 앞쪽 구슬 하나를 잠깐 감속시켜요.'],
    ['ice','냉기 오라','❄','방해',9,1.5,'주변에 들어온 구슬을 짧게 감속시켜요.'],
    ['goo','끈끈이 자국','🟢','방해',8,0,'뒤따르는 구슬을 감속시키는 짧은 자국을 남겨요.'],
    ['vortex','소용돌이','🌪','방해',10,1.3,'주변 구슬을 자기 주위로 회전시켜요.'],
    ['freeze','기계 정지','⏸','방해',10,0,'주변의 움직이는 장애물·특수 핀 작동을 잠깐 멈춰요.'],
    ['mine','반발 지뢰','💣','방해',9,0,'접근한 다른 구슬을 한 번 튕기는 지뢰를 남겨요.'],
    ['mimic','모방 구슬','🎭','변수',12,2.2,'가까운 상대의 능력을 잠깐 빌려 써요.'],
    ['reroll','변덕쟁이','🎲','변수',0,0,'다음 구간에 들어가면 다른 능력으로 바뀌어요.'],
    ['swap','자리 교환','🔀','변수',13,0,'가까운 앞쪽 구슬과 안전할 때 자리를 바꿔요.'],
    ['catchup','역전 본능','🔥','변수',0,0,'후미에 있을 때 하강력이 조금 강해져요.'],
    ['charge','충전 구슬','🔋','변수',4,0,'충돌 에너지를 모아 부스터로 방출해요.']
  ].map(([id,name,icon,group,cooldown,duration,description]) => ({id,name,icon,group,cooldown,duration,description}));
  const byId = new Map(abilities.map(a => [a.id,a]));
  const colors = {이동:'#dc9a29',방어:'#2b9d9b',방해:'#aa66ca',변수:'#e56e68'};
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const effective = ball => ball.battle?.borrowId || ball.battle?.id;
  const ability = ball => byId.get(effective(ball));
  const active = (ball,id,time) => effective(ball) === id && ball.battle.activeUntil > time;
  const safeZone = (ball,world) => ball.y > world.finishY - 240;
  function emit(game,ball,id,note='') {
    const a=byId.get(id); if(!a)return;
    ball.battle.flashUntil=game.time+.75;ball.battle.flashId=id;
    game.battle.effects.push({x:ball.x,y:ball.y,color:colors[a.group],icon:a.icon,until:game.time+.7});
    game.battle.logs.push({time:game.time,text:'#'+ball.id+' '+ball.name+' · '+a.icon+' '+a.name+(note?' · '+note:'')});
    if(game.battle.logs.length>8)game.battle.logs.shift();
    game.battle.activations[id]=(game.battle.activations[id]||0)+1;
  }
  function assign(game,ball,id,random=Math.random,keepReroll=false) {
    const previous=ball.battle;
    ball.baseR ??= ball.r;
    ball.battle={id,initialId:previous?.initialId||id,activeUntil:0,next:game.time+1.8+random()*2,
      shield:0,energy:0,slowUntil:0,controlGrace:0,guardUntil:0,lastImpact:-1,flashUntil:0,
      section:game.battle.sections.filter(([y])=>y<=ball.y).length,reroll:id==='reroll'||keepReroll,
      wasGhost:previous?.wasGhost||previous?.exitPending||false};
  }
  function init(game,world,sections,random=Math.random) {
    game.battle={world,sections,logs:[],effects:[],traps:[],clocks:new Map(),disabled:new Map(),activations:{}};
    game.balls.forEach(ball=>assign(game,ball,abilities[Math.floor(random()*abilities.length)].id,random));
  }
  function timeFor(game,key,time) {
    if(!game?.battle)return time;
    let clock=game.battle.clocks.get(key);
    if(!clock){clock={time,seen:time,until:0,lock:0};game.battle.clocks.set(key,clock);}
    if(time<clock.seen)return clock.time;
    clock.time+=Math.max(0,time-Math.max(clock.seen,clock.until));clock.seen=time;
    return clock.time;
  }
  const frozen = (game,key) => !!game?.battle && (game.battle.clocks.get(key)?.until||0)>game.time;
  const disabled = (game,pin) => !!game?.battle && (game.battle.disabled.get(pin.id)||0)>game.time;
  function segmentDistance(x,y,s) {
    const dx=s.x2-s.x1,dy=s.y2-s.y1,t=clamp(((x-s.x1)*dx+(y-s.y1)*dy)/(dx*dx+dy*dy||1),0,1);
    return Math.hypot(x-s.x1-t*dx,y-s.y1-t*dy);
  }
  function clearAt(ball,x,y,game,env,ignore=new Set(),radius=ball.r) {
    const world=game.battle.world;
    if(y-radius<world.top+2||y+radius>=world.finishY-240)return false;
    const bounds=window.MarbleCourse.bounds(y,world);
    if(x-radius<=bounds.left+3||x+radius>=bounds.right-3)return false;
    if(game.static.pins.concat(env.pins).some(p=>Math.abs(p.y-y)<radius+p.r+5&&Math.hypot(p.x-x,p.y-y)<radius+p.r+5))return false;
    if(game.static.segments.concat(env.segments).some(s=>y>Math.min(s.y1,s.y2)-radius-20&&y<Math.max(s.y1,s.y2)+radius+20&&segmentDistance(x,y,s)<radius+(s.radius||5)+5))return false;
    return !game.balls.some(other=>other!==ball&&!other.finished&&!ignore.has(other.id)&&Math.hypot(other.x-x,other.y-y)<radius+other.r+3);
  }
  function spot(ball,game,env,advance=100) {
    if(safeZone(ball,game.battle.world))return null;
    for(const dy of [advance,advance*.75,advance*.5,0,-20,-50,-90])for(const dx of [0,-28,28,-58,58,-95,95]) {
      if(clearAt(ball,ball.x+dx,ball.y+dy,game,env))return{x:ball.x+dx,y:ball.y+dy};
    }
    return null;
  }
  function move(ball,p) {Object.assign(ball,p,{prevX:p.x,prevY:p.y,maxY:p.y,stallTime:0});}
  function restoreShape(ball,game,env) {
    const state=ball.battle;
    const shrinking=active(ball,'shrink',game.time)&&!safeZone(ball,game.battle.world);
    const ghosting=active(ball,'ghost',game.time)&&!safeZone(ball,game.battle.world);
    const wanted=shrinking?ball.baseR*.65:ball.baseR;
    if((ball.r<wanted||state.wasGhost&&!ghosting)&&!safeZone(ball,game.battle.world)) {
      const oldR=ball.r;ball.r=wanted;
      if(!clearAt(ball,ball.x,ball.y,game,env)) {
        const p=spot(ball,game,env,0);
        if(p)move(ball,p);
        else {ball.r=oldR;state.exitPending=true;state.wasGhost=true;return;}
      }
    }
    state.exitPending=false;ball.r=wanted;state.wasGhost=ghosting;
  }
  function nearby(ball,game,range=180) {
    return game.balls.filter(b=>b!==ball&&!b.finished&&Math.abs(b.y-ball.y)<range&&Math.hypot(b.x-ball.x,b.y-ball.y)<range);
  }
  function hit(game,source,target,vx=0,vy=0,slow=0,reflected=false) {
    const now=game.time,s=target.battle;
    if(!s||target.finished||safeZone(source,game.battle.world)||safeZone(target,game.battle.world)||s.guardUntil>now||s.controlGrace>now)return false;
    if(s.shield>0){s.shield--;s.controlGrace=now+1;emit(game,target,'shield','방어');return false;}
    if(active(target,'reflect',now)&&!reflected){s.controlGrace=now+1;emit(game,target,'reflect','반사');hit(game,target,source,-vx*.65,Math.abs(vy)*.3,0,true);return false;}
    const force=Math.hypot(vx,vy),scale=force>240?240/force:1;
    target.vx+=vx*scale;target.vy+=vy*scale;
    s.slowUntil=now+Math.min(1.1,slow);s.controlGrace=now+Math.max(1.5,slow+1.2);
    s.lastAttacker=source.id;return true;
  }
  function pulse(game,ball,kind,dt) {
    if(safeZone(ball,game.battle.world))return;
    for(const target of nearby(ball,game,150)) {
      const dx=target.x-ball.x,dy=target.y-ball.y,d=Math.hypot(dx,dy)||1;
      if(kind==='shock')hit(game,ball,target,dx/d*165,dy/d*110);
      else if(kind==='ice')hit(game,ball,target,0,0,.8);
      else if(target.battle.controlGrace<=game.time&&target.battle.guardUntil<=game.time) {
        // A continuous field delivers one short bounded impulse per entry, then grants immunity.
        if(kind==='vacuum')hit(game,ball,target,-dx/d*80,-dy/d*40);
        else hit(game,ball,target,-dy/d*95,dx/d*45);
      }
    }
  }
  function boost(ball,now,strength=175) {ball.vy=Math.max(70,ball.vy)+strength;ball.boostUntil=now+.8;}
  function fire(game,ball,id,env,random=Math.random) {
    const s=ball.battle,a=byId.get(id),now=game.time,world=game.battle.world;
    if(['ghost','shrink','warp','frog','swap'].includes(id)&&safeZone(ball,world))return false;
    if(id==='ghost')s.wasGhost=true;
    else if(id==='warp') {const p=spot(ball,game,env,110);if(!p||p.y<=ball.y+10)return false;move(ball,p);ball.vy=Math.max(60,ball.vy);}
    else if(id==='rocket')boost(ball,now);
    else if(id==='path') {
      const ahead=game.static.pins.concat(env.pins).filter(p=>p.y>ball.y&&p.y<ball.y+160).sort((a,b)=>a.y-b.y)[0];
      if(!ahead)return false;
      const b=window.MarbleCourse.bounds(ball.y+80,world);
      const candidates=[ball.x-100,ball.x+100,ball.x-55,ball.x+55].filter(x=>x>b.left+ball.r+5&&x<b.right-ball.r-5);
      const x=candidates.find(x=>clearAt(ball,x,ball.y+80,game,env));if(x===undefined)return false;
      s.pathX=x;ball.vx+=Math.sign(x-ball.x)*85;
    } else if(id==='frog') {
      if(!game.static.pins.concat(env.pins).some(p=>Math.hypot(p.x-ball.x,p.y-ball.y)<p.r+ball.r+65))return false;
      const direction=ball.x<world.width/2?1:-1;ball.vx+=direction*140;ball.vy=-115;
    } else if(id==='shield')s.shield=1;
    else if(id==='cleanse'){s.slowUntil=0;s.controlGrace=now+2;s.guardUntil=now+2;}
    else if(id==='shock')pulse(game,ball,id,0);
    else if(id==='lightning') {
      const target=nearby(ball,game,420).filter(b=>b.y>ball.y).sort((a,b)=>a.y-b.y)[0];
      if(!target||!hit(game,ball,target,0,-45,1))return false;
      game.battle.effects.push({x:ball.x,y:ball.y,x2:target.x,y2:target.y,color:'#dfaa36',icon:'⚡',until:now+.5});
    } else if(id==='goo'||id==='mine') {
      if(safeZone(ball,world))return false;
      game.battle.traps.push({id,owner:ball.id,x:ball.x,y:ball.y+ball.r*2,until:now+(id==='goo'?2:3)});
    } else if(id==='freeze') {
      let changed=false;
      for(const object of env.pins.concat(env.segments)) {
        if(!object.machineKey)continue;
        const x=object.x??(object.x1+object.x2)/2,y=object.y??(object.y1+object.y2)/2;
        const clock=game.battle.clocks.get(object.machineKey);
        if(clock&&clock.lock<=now&&Math.hypot(x-ball.x,y-ball.y)<230){clock.until=now+1.1;clock.lock=now+3.5;changed=true;}
      }
      for(const pin of game.static.pins)if(pin.kind&&Math.hypot(pin.x-ball.x,pin.y-ball.y)<200&&(game.battle.disabled.get(pin.id)||0)<=now) {
        game.battle.disabled.set(pin.id,now+1.1);changed=true;
      }
      if(!changed)return false;
    } else if(id==='mimic') {
      const target=nearby(ball,game,450).find(b=>!['mimic','reroll'].includes(effective(b)));
      if(!target)return false;
      s.borrowId=effective(target);s.borrowUntil=now+2.2;
      fire(game,ball,s.borrowId,env,random);emit(game,ball,id,byId.get(s.borrowId).name);return true;
    } else if(id==='swap') {
      const target=nearby(ball,game,320).filter(b=>b.y>ball.y+25&&!safeZone(b,world)&&b.battle.controlGrace<=now&&b.battle.guardUntil<=now&&!b.battle.shield&&!active(b,'reflect',now)).sort((a,b)=>a.y-b.y)[0];
      if(!target)return false;
      const ignore=new Set([ball.id,target.id]);
      if(!clearAt(ball,target.x,target.y,game,env,ignore)||!clearAt(target,ball.x,ball.y,game,env,ignore))return false;
      const p={x:ball.x,y:ball.y};move(ball,{x:target.x,y:target.y});move(target,p);target.battle.controlGrace=now+2.3;
    } else if(id==='charge') {
      if(s.energy<3)return false;s.energy=0;boost(ball,now,200);
    }
    s.activeUntil=now+a.duration;emit(game,ball,id);return true;
  }
  function tick(game,dt,env,random=Math.random) {
    if(!game.battle)return;
    const now=game.time,world=game.battle.world;
    game.battle.effects=game.battle.effects.filter(e=>e.until>now).slice(-80);
    game.battle.traps=game.battle.traps.filter(e=>e.until>now).slice(-100);
    for(const [key,until] of game.battle.disabled)if(until<now)game.battle.disabled.delete(key);
    const ranked=game.balls.filter(b=>!b.finished).sort((a,b)=>b.y-a.y),rank=new Map(ranked.map((b,i)=>[b.id,i]));
    for(const ball of ranked) {
      const s=ball.battle;
      if(s.borrowUntil<=now){if(s.borrowId==='shield')s.shield=0;delete s.borrowId;delete s.borrowUntil;s.activeUntil=0;}
      const section=game.battle.sections.filter(([y])=>y<=ball.y).length;
      if(s.reroll&&section>s.section&&!safeZone(ball,world)) {
        const choices=abilities.filter(a=>a.id!=='reroll'&&a.id!==s.id),a=choices[Math.floor(random()*choices.length)];
        assign(game,ball,a.id,random,true);emit(game,ball,'reroll',a.name);
      }
      const state=ball.battle,id=effective(ball),a=byId.get(state.id);
      if(safeZone(ball,world)&&['ghost','shrink'].includes(id))state.activeUntil=0;
      if(a.cooldown&&now>=state.next&&state.id!=='wallkick') {
        const fired=fire(game,ball,state.id,env,random);
        state.next=now+(fired?a.cooldown:.55);
      }
      restoreShape(ball,game,env);
      ball.mass=id==='heavy'?1.9:1;ball.gravityScale=id==='heavy'?1.2:1;ball.speedLimit=id==='heavy'?370:340;
      ball.immuneFields=id==='immune';
      if(id==='catchup'&&rank.get(ball.id)>=Math.max(1,Math.floor(ranked.length*.6)))ball.gravityScale=1.28;
      if(active(ball,'path',now)&&state.pathX!==undefined)ball.vx+=clamp((state.pathX-ball.x)*2,-100,100)*dt;
      if(state.slowUntil>now){ball.vx*=Math.pow(.82,dt*60);ball.vy*=Math.pow(.988,dt*60);}
      if(['vacuum','ice','vortex'].some(k=>active(ball,k,now)))pulse(game,ball,id,dt);
    }
    for(const trap of game.battle.traps) {
      const owner=game.balls.find(b=>b.id===trap.owner);if(!owner||owner.finished)continue;
      for(const target of ranked)if(target.id!==owner.id&&Math.hypot(target.x-trap.x,target.y-trap.y)<(trap.id==='mine'?50:40)) {
        if(trap.id==='goo')hit(game,owner,target,0,0,.7);
        else if(hit(game,owner,target,Math.sign(target.x-trap.x||1)*140,-65)){trap.until=0;break;}
      }
    }
  }
  function skipObstacle(ball,object,game) {
    return !!ball.battle&&(active(ball,'ghost',game.time)||ball.battle.exitPending)&&!safeZone(ball,game.battle.world)&&!object.sideWall&&!object.funnel;
  }
  function skipPair(a,b,game) {return !!game?.battle&&(active(a,'orbphase',game.time)||active(b,'orbphase',game.time));}
  function contact(game,a,b,nx,ny) {
    if(!game?.battle)return;
    if(active(a,'bumper',game.time))hit(game,a,b,nx*180,ny*120);
    if(active(b,'bumper',game.time))hit(game,b,a,-nx*180,-ny*120);
    if(active(a,'reflect',game.time)&&!active(b,'reflect',game.time)&&a.battle.controlGrace<=game.time&&hit(game,a,b,nx*105,ny*65)){a.battle.controlGrace=game.time+1.5;emit(game,a,'reflect','접촉 반사');}
    if(active(b,'reflect',game.time)&&!active(a,'reflect',game.time)&&b.battle.controlGrace<=game.time&&hit(game,b,a,-nx*105,-ny*65)){b.battle.controlGrace=game.time+1.5;emit(game,b,'reflect','접촉 반사');}
    for(const ball of [a,b])if(effective(ball)==='charge'&&game.time-ball.battle.lastImpact>.25){ball.battle.energy=Math.min(3,ball.battle.energy+1);ball.battle.lastImpact=game.time;}
  }
  function obstacleHit(game,ball,previous) {
    if(!ball.battle)return;
    if(active(ball,'absorb',game.time)){ball.vx=previous.vx*.6+ball.vx*.4;ball.vy=Math.max(12,previous.vy*.4,ball.vy*.15);}
    if(effective(ball)==='charge'&&game.time-ball.battle.lastImpact>.25){ball.battle.energy=Math.min(3,ball.battle.energy+1);ball.battle.lastImpact=game.time;}
  }
  function wallHit(game,ball,direction) {
    if(effective(ball)==='wallkick'&&game.time>=ball.battle.next){ball.vx=direction*170;ball.vy=Math.max(80,ball.vy);ball.battle.next=game.time+3;emit(game,ball,'wallkick');}
  }
  function field(game,ball,source,dt) {
    if(disabled(game,source))return;
    const id=effective(ball),dx=source.x-ball.x,dy=source.y-ball.y,d=Math.hypot(dx,dy);
    if(d&&d<source.range&&id==='windride'&&source.kind==='wind') {
      const force=source.strength*(1-d/source.range);ball.vx+=source.direction*force*.3*dt;ball.vy+=(40+force*.45)*dt;
    } else if(d&&d<source.range&&active(ball,'reverse',game.time)&&source.kind==='magnet') {
      const force=source.strength*(1-d/source.range);ball.vx-=dx/d*force*dt;ball.vy+=(25-dy/d*force*.12)*dt;
    } else window.MarbleCourse.field(ball,source,dt);
  }
  function caption(ball) {
    const a=byId.get(ball.battle.id),copy=ball.battle.borrowId?'→'+ability(ball).name:'';
    return (ball.battle.reroll&&a.id!=='reroll'?'🎲 변덕→':a.icon+' ')+a.name+copy;
  }
  function label(ball) {
    return ball.battle?ball.label+' · '+caption(ball):ball.label;
  }
  function describe(ball,time) {
    const a=byId.get(ball.battle.id),s=ball.battle;
    let state=a.cooldown?'다음 '+Math.max(0,Math.ceil(s.next-time))+'초':'상시';
    if(s.activeUntil>time)state='발동 중';if(s.shield)state='보호막 준비';
    if(a.id==='charge')state='충전 '+s.energy+'/3';if(a.id==='reroll')state='다음 구간에서 변경';
    return '#'+ball.id+' '+label(ball)+' · '+state+(s.reroll?' · 구간마다 재추첨':'')+' — '+a.description;
  }
  function drawWorld(ctx,game,camera) {
    if(!game.battle)return;
    ctx.save();
    for(const trap of game.battle.traps)if(trap.y>camera.top-80&&trap.y<camera.top+camera.visibleHeight+80){ctx.fillStyle=trap.id==='goo'?'#74b55b55':'#c371be66';ctx.beginPath();ctx.arc(trap.x,trap.y,trap.id==='goo'?28:20,0,Math.PI*2);ctx.fill();ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillStyle='#555';ctx.fillText(trap.id==='goo'?'●':'✹',trap.x,trap.y+6);}
    for(const e of game.battle.effects)if(e.y>camera.top-90&&e.y<camera.top+camera.visibleHeight+90){ctx.globalAlpha=clamp((e.until-game.time)/.7,0,1);ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,15+(1-(e.until-game.time)/.7)*50,0,Math.PI*2);ctx.stroke();if(e.x2!==undefined){ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x2,e.y2);ctx.stroke();}}
    ctx.restore();
  }
  function drawBall(ctx,ball,game,camera) {
    if(!ball.battle)return;
    const s=ball.battle,a=ability(ball),lit=s.activeUntil>game.time||s.flashUntil>game.time||s.shield;
    ctx.save();ctx.strokeStyle=colors[a.group];ctx.lineWidth=lit?2.5:1.2;
    if(active(ball,'ghost',game.time)||active(ball,'orbphase',game.time))ctx.setLineDash([3,3]);
    ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r+3,0,Math.PI*2);ctx.stroke();
    if(lit||game.selectedBall===ball.id||game.balls.length<=20||camera.zoom>=1.8){ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fffdf4';ctx.fillRect(ball.x-9,ball.y-ball.r-21,18,17);ctx.fillStyle=colors[a.group];ctx.fillText(a.icon,ball.x,ball.y-ball.r-12);}
    ctx.restore();
  }
  window.MarbleBattle={abilities,byId,init,assign,tick,fire,hit,spot,clearAt,timeFor,frozen,disabled,skipObstacle,skipPair,contact,obstacleHit,wallHit,field,caption,label,describe,drawWorld,drawBall};
})();
