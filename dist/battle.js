(() => {
  'use strict';
  const tr = (key, values = []) => window.MarbleI18n ? window.MarbleI18n.t(key, values) : key.replace(/\{(\d+)\}/g, (_, i) => String(values[+i] ?? ''));
  const abilities = [
    ['ghost',tr("유령 통과"),'👻',tr("이동"),8,1.5,tr("잠깐 벽을 제외한 장애물을 통과해요.")],
    ['bumper',tr("범퍼 변신"),'💥',tr("방해"),8,1.8,tr("몸에 닿는 다른 구슬을 튕겨내요.")],
    ['heavy',tr("헤비볼"),'⚓',tr("방어"),0,0,tr("조금 더 빠르게 내려가고 덜 밀려요.")],
    ['immune',tr("자석·바람 면역"),'🧲',tr("방어"),0,0,tr("자석과 바람의 힘을 받지 않아요.")],
    ['warp',tr("순간 도약"),'✨',tr("이동"),11,0,tr("아래쪽의 안전한 빈자리로 짧게 이동해요.")],
    ['rocket',tr("로켓 부스터"),'🚀',tr("이동"),7,.9,tr("짧고 강하게 아래로 가속해요.")],
    ['wallkick',tr("벽차기"),'↘',tr("이동"),3,0,tr("벽에 닿으면 중앙 아래쪽으로 튀어나와요.")],
    ['path',tr("빈틈 탐색"),'🧭',tr("이동"),7,1.4,tr("가까운 빈 통로 쪽으로 방향을 바꿔요.")],
    ['shrink',tr("압축 구슬"),'🔹',tr("이동"),9,1.8,tr("잠깐 작아져 좁은 틈을 빠져나가요.")],
    ['frog',tr("개구리 점프"),'🐸',tr("이동"),6,0,tr("앞이 막힐 때 빈 방향으로 옆·아래 도약해요. 하강 속도는 유지해요.")],
    ['shield',tr("충격 보호막"),'🛡',tr("방어"),7,0,tr("다른 구슬의 방해를 한 번 막아요.")],
    ['absorb',tr("충격 흡수"),'🧽',tr("방어"),7,2,tr("잠깐 장애물에 크게 튕겨 올라가지 않아요.")],
    ['reflect',tr("반사 갑옷"),'🔁',tr("방어"),8,2,tr("받은 공격을 막고 공격자에게 충격을 돌려줘요.")],
    ['orbphase',tr("구슬 통과"),'🫧',tr("방어"),8,1.6,tr("잠깐 다른 구슬과 겹쳐 지나가요.")],
    ['cleanse',tr("상태 정화"),'💚',tr("방어"),6,2,tr("방해를 풀고 잠깐 다시 걸리지 않아요.")],
    ['windride',tr("바람 타기"),'🪁',tr("이동"),0,0,tr("바람의 일부를 아래쪽 추진력으로 바꿔요.")],
    ['reverse',tr("자력 반전"),'🧲',tr("방어"),8,2,tr("잠깐 자석에 끌리는 대신 밀려나요.")],
    ['shock',tr("충격파"),'💫',tr("방해"),9,0,tr("가까운 구슬들을 바깥쪽으로 밀어내요.")],
    ['vacuum',tr("진공 흡입"),'🌀',tr("방해"),9,1.2,tr("주변 구슬을 잠깐 자기 쪽으로 끌어당겨요.")],
    ['lightning',tr("번개 추격"),'⚡',tr("방해"),8,0,tr("가까운 앞쪽 구슬 하나를 잠깐 감속시켜요.")],
    ['ice',tr("냉기 오라"),'❄',tr("방해"),9,1.5,tr("주변에 들어온 구슬을 짧게 감속시켜요.")],
    ['goo',tr("끈끈이 자국"),'🟢',tr("방해"),8,0,tr("0.25초 간격으로 끈끈이 3개를 남겨요. 각각 3.5초 동안 상대를 감속시켜요.")],
    ['vortex',tr("소용돌이"),'🌪',tr("방해"),10,0,tr("3.5초 동안 작은 소용돌이를 설치해요. 들어온 상대를 끌어당기며 휘돌게 해요.")],
    ['freeze',tr("기계 정지"),'⏸',tr("방해"),10,0,tr("주변의 움직이는 장애물·특수 핀 작동을 잠깐 멈춰요.")],
    ['mine',tr("반발 지뢰"),'💣',tr("방해"),9,0,tr("접촉하거나 10초가 지나면 폭발하는 지뢰를 설치해요. 주변 상대를 강하게 튕겨요.")],
    ['mimic',tr("모방 구슬"),'🎭',tr("변수"),12,2.2,tr("가까운 상대 능력을 잠깐 빌려요. 일반 모드에서는 무작위 능력을 빌려요.")],
    ['reroll',tr("변덕쟁이"),'🎲',tr("변수"),0,0,tr("다음 구간에 들어가면 다른 능력으로 바뀌어요.")],
    ['swap',tr("자리 교환"),'🔀',tr("변수"),13,0,tr("가까운 앞쪽 구슬과 안전할 때 자리를 바꿔요.")],
    ['catchup',tr("역전 본능"),'🔥',tr("변수"),0,0,tr("후미에 있을 때 하강력이 조금 강해져요.")],
    ['charge',tr("충전 구슬"),'🔋',tr("변수"),4,0,tr("충돌 에너지를 모아 부스터로 방출해요.")],
    ['shortcut',tr("지름길"),'⏩',tr("이동"),0,0,tr("첫 구간을 건너뛰고 2구간 시작부의 좌우 무작위 위치에서 출발해요. 이후에는 추가 효과가 없어요.")],
    ['wallride',tr("벽타기"),'🧗',tr("이동"),8,1.8,tr("잠깐 벽에 붙으면 튕기지 않고 벽을 따라 빠르게 내려가요.")],
    ['swing',tr("고무줄 스윙"),'🪢',tr("이동"),8,1.5,tr("가까운 핀에 줄을 걸고 주위를 돌아 빠져나와요.")],
    ['springball',tr("스프링볼"),'🏀',tr("이동"),8,1.6,tr("잠깐 탄성이 높아져 크게 튕겨요. 방향에 따라 손해도 봐요.")],
    ['crossjump',tr("횡단 도약"),'↔',tr("이동"),10,0,tr("현재 높이를 유지하며 반대편의 안전한 빈자리로 이동해요.")],
    ['seeker',tr("추적 탄환"),'🔸',tr("방해"),10,0,tr("앞선 구슬을 향해 짧게 날아가는 탄환으로 밀어내요.")],
    ['slingshot',tr("슬링샷"),'🎯',tr("이동"),6,0,tr("움직이는 장애물과 부딪히면 그 이동 방향으로 날아가요.")],
    ['giant',tr("거대화"),'🐘',tr("방어"),10,1.8,tr("잠깐 커져 다른 구슬을 밀기 쉬워져요. 좁은 틈에서는 불리해요.")],
    ['sweeper',tr("지뢰 청소부"),'🧹',tr("방어"),7,0,tr("주변의 지뢰와 끈끈이를 지워 모두가 지나갈 길을 만들어요.")],
    ['revenge',tr("보복 표식"),'🏷',tr("방어"),0,0,tr("공격을 받은 뒤 공격자에게 표식을 남겨 짧은 감속을 돌려줘요.")],
    ['decoy',tr("미끼 분신"),'👥',tr("방어"),9,2,tr("순위에 없는 분신이 번개나 추적 탄환을 한 번 대신 받아요.")],
    ['confuse',tr("혼란파"),'🔄',tr("방해"),9,0,tr("주변 구슬의 좌우 속도를 뒤집어요. 아래로 떨어지는 속도는 유지해요.")],
    ['checkpoint',tr("구간 가속"),'🏁',tr("변수"),0,0,tr("새 구간을 처음 통과할 때마다 짧게 가속해요.")],
    ['tow',tr("견인줄"),'🔗',tr("변수"),10,1.4,tr("가까운 구슬과 잠깐 연결돼 서로 당겨요. 상대 위치에 따라 손해도 봐요.")],
    ['ring',tr("가속 링"),'⭕',tr("변수"),9,0,tr("4초 동안 통과하면 가속되는 링을 만들어요. 다른 구슬도 이용할 수 있어요.")],
    ['ramp',tr("임시 경사판"),'📐',tr("변수"),10,0,tr("뒤쪽에 4초 동안 경사판을 만들어 뒤따르는 구슬의 경로를 바꿔요.")],
    ['machinefast',tr("기계 가속"),'⚙',tr("변수"),10,0,tr("주변 기계의 움직임과 특수 핀의 힘을 잠깐 빠르고 강하게 바꿔요.")],
    ['convert',tr("범퍼 변환"),'✨',tr("변수"),9,0,tr("가까운 일반 핀 하나를 잠깐 강한 범퍼로 바꿔요. 누구나 영향을 받아요.")],
    ['machinereverse',tr("흐름 역전"),'⏮',tr("변수"),11,0,tr("주변 기계·자석·바람의 방향과 급류·소용돌이 흐름을 잠깐 뒤집어요. 모두에게 적용돼요.")],
    ['portal',tr("공용 포털"),'🌀',tr("변수"),12,0,tr("3.5초 동안 짧은 거리를 잇는 포털을 만들어요. 다른 구슬도 이용해요.")]
  ].map(([id,name,icon,group,cooldown,duration,description]) => ({id,name,icon,group,cooldown,duration,description}));
  const byId = new Map(abilities.map(a => [a.id,a]));
  const hiddenAbility={id:'comet',name:tr("혜성 질주"),icon:'☄',group:tr("히든"),cooldown:15,duration:3,description:tr("3초간 벽을 제외한 장애물을 통과하며 가속해요. 혜성 꼬리에 닿은 다른 구슬을 짧게 감속시켜요. 15초마다 발동해요.")};
  byId.set('comet',hiddenAbility);
  // Ordinary marbles can receive a golden marble's attacks without gaining a power.
  byId.set(null,{id:null,name:tr("일반 구슬"),cooldown:0,duration:0,description:tr("특별한 능력 없이 달려요.")});
  const colors = {[tr('이동')]:'#dc9a29',[tr('방어')]:'#2b9d9b',[tr('방해')]:'#aa66ca',[tr('변수')]:'#e56e68',[tr('히든')]:'#58a8cf'};
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
      shield:0,energy:0,slowUntil:0,confusedUntil:0,controlGrace:0,guardUntil:0,lastImpact:-1,flashUntil:0,
      revengeReadyAt:game.time,decoyCharges:0,lastSpring:-1,portalGrace:0,
      checkpointSection:game.battle.sections.filter(([y])=>y<=ball.y).length,
      section:game.battle.sections.filter(([y])=>y<=ball.y).length,reroll:id==='reroll'||keepReroll,
      startPending:id==='shortcut'&&game.time===0&&!keepReroll,
      wasGhost:previous?.wasGhost||previous?.exitPending||false};
  }
  function init(game,world,sections,random=Math.random) {
    game.battle={world,sections,logs:[],effects:[],traps:[],bursts:[],projectiles:[],structures:[],marks:[],clocks:new Map(),disabled:new Map(),converted:new Map(),fieldMods:new Map(),activations:{}};
    game.balls.forEach(ball=>assign(game,ball,abilities[Math.floor(random()*abilities.length)].id,random));
  }
  function chooseComet(balls,random=Math.random,forced=false){
    if(!balls.length||!forced&&random()>=.03)return null;
    return {ballId:balls[Math.floor(random()*balls.length)].id,abilityId:'comet'};
  }
  function grantComet(game,choice,random=Math.random){
    if(!choice)return null;const ball=game.balls.find(b=>b.id===choice.ballId);if(!ball)return null;
    assign(game,ball,'comet',random);ball.battle.initialId='comet';return{ball,ability:hiddenAbility};
  }
  function initGolden(game,world,sections,ball,id,env) {
    game.battle={world,sections,logs:[],effects:[],traps:[],bursts:[],projectiles:[],structures:[],marks:[],clocks:new Map(),disabled:new Map(),converted:new Map(),fieldMods:new Map(),activations:{}};
    game.balls.forEach(b=>assign(game,b,b===ball?id:null));
    placeShortcuts(game,env);
    tick(game,0,env);
  }
  function placeShortcuts(game,env) {
    for(const ball of game.balls)if(ball.battle?.startPending) {
      const p=window.GoldenMarble.shortcutStart(ball,game.battle.world,game.battle.sections,
        {pins:game.static.pins.concat(env.pins),segments:game.static.segments.concat(env.segments),solids:game.static.solids||[]},game.balls);
      if(p){move(ball,p);ball.vx=0;ball.vy=0;ball.battle.section=2;ball.battle.startPending=false;}
    }
  }
  function timeFor(game,key,time) {
    if(!game?.battle)return time;
    let clock=game.battle.clocks.get(key);
    if(!clock){clock={time,seen:time,until:0,lock:0};game.battle.clocks.set(key,clock);}
    if(time<clock.seen)return clock.time;
    const from=Math.max(clock.seen,clock.until),modified=Math.max(0,Math.min(time,clock.modUntil||0)-from);
    clock.time+=modified*(clock.rate??1)+Math.max(0,time-from-modified);clock.seen=time;
    return clock.time;
  }
  function machineRate(game,key){const c=game?.battle?.clocks.get(key);return c?.until>game.time?0:c?.modUntil>game.time?c.rate:1;}
  const frozen = (game,key) => !!game?.battle && (game.battle.clocks.get(key)?.until||0)>game.time;
  const disabled = (game,pin) => !!game?.battle && (game.battle.disabled.get(pin.id)||0)>game.time;
  function segmentDistance(x,y,s) {
    const dx=s.x2-s.x1,dy=s.y2-s.y1,t=clamp(((x-s.x1)*dx+(y-s.y1)*dy)/(dx*dx+dy*dy||1),0,1);
    return Math.hypot(x-s.x1-t*dx,y-s.y1-t*dy);
  }
  function clearAt(ball,x,y,game,env,ignore=new Set(),radius=ball.r) {
    const world=game.battle.world;
    if(window.HiddenCourses&&!window.HiddenCourses.inside(x,y,radius,world))return false;
    if(y-radius<world.top+2||y+radius>=world.finishY-240)return false;
    const bounds=window.MarbleCourse.bounds(y,world);
    if(x-radius<=bounds.left+3||x+radius>=bounds.right-3)return false;
    if((game.static.solids||[]).some(s=>Math.abs(x-s.x)/s.rx+Math.abs(y-s.y)/s.ry<=1))return false;
    if(game.static.pins.concat(env.pins).some(p=>window.MarbleCourse.pinContact({x,y,r:radius+5},p)))return false;
    if(game.static.segments.concat(env.segments,temporarySegments(game)).some(s=>!s.broken&&y>Math.min(s.y1,s.y2)-radius-20&&y<Math.max(s.y1,s.y2)+radius+20&&segmentDistance(x,y,s)<radius+(s.radius||5)+5))return false;
    return !game.balls.some(other=>other!==ball&&!other.finished&&!ignore.has(other.id)&&Math.hypot(other.x-x,other.y-y)<radius+other.r+3);
  }
  function spot(ball,game,env,advance=100) {
    if(safeZone(ball,game.battle.world))return null;
    for(const dy of [advance,advance*.75,advance*.5,0,-20,-50,-90])for(const dx of [0,-28,28,-58,58,-95,95]) {
      if(clearAt(ball,ball.x+dx,ball.y+dy,game,env))return{x:ball.x+dx,y:ball.y+dy};
    }
    return null;
  }
  function move(ball,p) {Object.assign(ball,p,{prevX:p.x,prevY:p.y,maxY:p.y,stallTime:0,noProgressTime:0});}
  function restoreShape(ball,game,env) {
    const state=ball.battle;
    const shrinking=active(ball,'shrink',game.time)&&!safeZone(ball,game.battle.world);
    const ghosting=(active(ball,'ghost',game.time)||active(ball,'comet',game.time))&&!safeZone(ball,game.battle.world);
    const growing=active(ball,'giant',game.time)&&!safeZone(ball,game.battle.world);
    const wanted=growing?ball.baseR*1.55:shrinking?ball.baseR*.65:ball.baseR;
    if((ball.r<wanted||state.wasGhost&&!ghosting)&&!safeZone(ball,game.battle.world)) {
      const oldR=ball.r;ball.r=wanted;
      if(!clearAt(ball,ball.x,ball.y,game,env)) {
        if(growing&&!state.wasGhost){ball.r=oldR;state.growthPending=true;return;}
        const p=spot(ball,game,env,0);
        if(p)move(ball,p);
        else {ball.r=oldR;state.exitPending=true;state.wasGhost=true;return;}
      }
    }
    state.exitPending=false;state.growthPending=false;ball.r=wanted;state.wasGhost=ghosting;
  }
  function nearby(ball,game,range=180) {
    return game.balls.filter(b=>b!==ball&&!b.finished&&Math.abs(b.y-ball.y)<range&&Math.hypot(b.x-ball.x,b.y-ball.y)<range);
  }
  function hit(game,source,target,vx=0,vy=0,slow=0,reflected=false,status=null) {
    const now=game.time,s=target.battle;
    if(!s||target.finished||safeZone(status?.origin||source,game.battle.world)||safeZone(target,game.battle.world)||s.guardUntil>now||s.controlGrace>now)return false;
    if(s.shield>0){s.shield--;s.controlGrace=now+1;emit(game,target,'shield',tr("방어"));return false;}
    if(active(target,'reflect',now)&&!reflected){s.controlGrace=now+1;emit(game,target,'reflect',tr("반사"));hit(game,target,source,-vx*.65,Math.abs(vy)*.3,0,true,status?{...status,origin:undefined}:null);return false;}
    if(status?.targeted&&active(target,'decoy',now)&&s.decoyCharges){s.decoyCharges=0;emit(game,target,'decoy',tr("분신 소멸"));return false;}
    const force=Math.hypot(vx,vy),scale=force>240?240/force:1;
    target.vx+=vx*scale;target.vy+=vy*scale;
    s.slowUntil=now+Math.min(1.1,slow);s.controlGrace=now+Math.max(1.5,slow+1.2);
    if(status?.confuse){target.vx=-target.vx;s.confusedUntil=now+1;}
    if(effective(target)==='revenge'&&!reflected&&now>=s.revengeReadyAt){
      s.revengeReadyAt=now+7;game.battle.marks.push({owner:target.id,target:source.id,at:now+.7,until:now+1.5});emit(game,target,'revenge',tr("표식"));
    }
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
  function placeTrap(game,ball,id){
    const world=game.battle.world,y=ball.y+ball.r*2;
    if(ball.finished||safeZone({y},world))return false;
    game.battle.traps.push({id,owner:ball.id,x:ball.x,y,born:game.time,until:game.time+(id==='mine'?10:3.5),
      ...(id==='vortex'?{range:90,direction:ball.id%2?1:-1,targets:new Map()}:{} )});
    return true;
  }
  function explodeMine(game,trap,ranked){
    if(trap.exploded)return;trap.exploded=true;trap.until=0;
    const radius=115,owner=game.balls.find(b=>b.id===trap.owner),now=game.time;
    game.battle.effects.push({kind:'mine-explosion',x:trap.x,y:trap.y,born:now,until:now+.65,radius,color:'#ee9b43'});
    if(!owner)return;
    for(const target of ranked){
      const dx=target.x-trap.x,dy=target.y-trap.y,d=Math.hypot(dx,dy);
      if(target.id===owner.id||d>radius)continue;
      const distance=d||1,falloff=.55+.45*(1-d/radius);
      hit(game,owner,target,(d?dx/distance:(target.id%2?1:-1))*290*falloff,(dy/distance*220-150)*falloff,0,false,{origin:trap});
    }
  }
  function vortexField(game,trap,owner,target,dt,env){
    const now=game.time,dx=target.x-trap.x,dy=target.y-trap.y,d=Math.hypot(dx,dy),state=target.battle;
    if(d>=trap.range||safeZone(target,game.battle.world))return;
    let entry=trap.targets.get(target.id);
    if(!entry||entry.until<=now){
      if(!hit(game,owner,target,0,0,0,false,{origin:trap}))return;
      entry={until:now+.75};trap.targets.set(target.id,entry);
    }
    if(state.guardUntil>now||state.shield||active(target,'reflect',now)){entry.until=now;return;}
    const Course=window.MarbleCourse,bounds=Course.bounds(target.y,game.battle.world);
    const bankFade=clamp((Math.min(target.x-bounds.left,bounds.right-target.x)-target.r)/45,.1,1);
    let surfaceFade=1;
    for(const segment of game.collisionBuckets?.get(Math.floor(target.y/160))?.segments||game.static.segments.concat(env.segments)){
      if(segment.sideWall||segment.funnel||segment.broken)continue;
      surfaceFade=Math.min(surfaceFade,clamp((segmentDistance(target.x,target.y,segment)-target.r-(segment.radius||4.5))/30,0,1));
    }
    const force=Course.vortexAcceleration(dx,dy,trap.range,trap.direction),scale=bankFade*surfaceFade*dt/(target.mass||1);
    target.vx+=clamp(force.x,-Course.waterTuning.lateralCap,Course.waterTuning.lateralCap)*scale;
    target.vy+=clamp(force.y,-Course.waterTuning.verticalCap,Course.waterTuning.verticalCap)*scale;
  }
  function temporarySegments(game){return (game.battle?.structures||[]).filter(o=>o.kind==='ramp'&&o.until>game.time).map(o=>o.segment);}
  function makeStructure(game,ball,kind,env){
    const b=game.battle,now=game.time,limit={ring:12,ramp:6,portal:6}[kind];
    if(b.structures.filter(o=>o.kind===kind&&o.until>now).length>=limit)return false;
    if(kind==='ramp'){
      const y=ball.y-90;if(y< b.world.top+80||y>b.world.finishY-300)return false;
      const direction=ball.x<b.world.width/2?1:-1,segment={x1:ball.x-55,y1:y-direction*22,x2:ball.x+55,y2:y+direction*22,radius:4.5,temporary:true};
      if(b.structures.some(o=>o.kind==='ramp'&&Math.abs(o.y-y)<140))return false;
      for(const t of [0,.25,.5,.75,1])if(!clearAt(ball,segment.x1+110*t,segment.y1+(segment.y2-segment.y1)*t,game,env,new Set(),8))return false;
      b.structures.push({kind,owner:ball.id,x:ball.x,y,segment,until:now+4,used:new Set()});return true;
    }
    let entrance=null;for(const dy of [65,95,125])for(const dx of [0,-50,50])if(!entrance&&clearAt(ball,ball.x+dx,ball.y+dy,game,env,new Set(),kind==='ring'?32:25))entrance={x:ball.x+dx,y:ball.y+dy};
    if(!entrance)return false;
    if(b.structures.some(o=>Math.hypot(o.x-entrance.x,o.y-entrance.y)<110))return false;
    const object={kind,owner:ball.id,...entrance,until:now+(kind==='ring'?4:3.5),used:new Set()};
    if(kind==='portal'){
      let exit=null;for(const dy of [170,140,110])for(const dx of [0,-70,70])if(!exit&&clearAt(ball,entrance.x+dx,entrance.y+dy,game,env,new Set(),25))exit={x:entrance.x+dx,y:entrance.y+dy};
      if(!exit)return false;object.exitX=exit.x;object.exitY=exit.y;
    }
    b.structures.push(object);return true;
  }
  function modifyMachines(game,ball,kind,env){
    let changed=false;const now=game.time,b=game.battle,keys=new Set();
    for(const o of env.pins.concat(env.segments)){
      if(!o.machineKey||o.temporary||keys.has(o.machineKey))continue;keys.add(o.machineKey);
      const x=o.x??(o.x1+o.x2)/2,y=o.y??(o.y1+o.y2)/2;
      if(Math.hypot(x-ball.x,y-ball.y)>230)continue;
      timeFor(game,o.machineKey,now);const clock=b.clocks.get(o.machineKey);
      if((clock.modLock||0)>now)continue;clock.rate=kind==='machinefast'?1.65:-1;clock.modUntil=now+1.6;clock.modLock=now+4.5;changed=true;
    }
    for(const pin of game.static.pins)if(['wind','magnet'].includes(pin.kind)&&pin.id&&Math.hypot(pin.x-ball.x,pin.y-ball.y)<200&&(b.fieldMods.get(pin.id)?.lock||0)<=now){b.fieldMods.set(pin.id,{kind,until:now+1.6,lock:now+4.5});changed=true;}
    if(kind==='machinereverse')for(const f of game.static.features||[]){
      if(!['current','whirlpool'].includes(f.kind)||(b.fieldMods.get(f.key)?.lock||0)>now)continue;
      const bounds=window.MarbleCourse.bounds(f.y,b.world),cx=bounds.left+(bounds.right-bounds.left)*(f.fraction||.5);
      const near=f.kind==='whirlpool'?Math.hypot(ball.x-cx,ball.y-f.y)<f.range+100:
        Math.abs(ball.y-f.y)<f.height/2+100&&f.lanes.some(l=>{const c=window.ExtraCourses.channelAt(f,l,clamp(ball.y,f.y-f.height/2,f.y+f.height/2),b.world);return Math.abs(ball.x-c.x)<c.halfWidth+100;});
      if(near){b.fieldMods.set(f.key,{kind,until:now+1.6,lock:now+4.5});changed=true;}
    }
    return changed;
  }
  function fire(game,ball,id,env,random=Math.random) {
    const s=ball.battle,a=byId.get(id),now=game.time,world=game.battle.world;
    if(safeZone(ball,world))return false;
    if(id==='comet'){s.wasGhost=true;s.trail=[];s.trailNext=now;boost(ball,now,190);}
    else if(id==='ghost')s.wasGhost=true;
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
      const pins=game.static.pins.concat(env.pins),segments=game.static.segments.concat(env.segments);
      const blocked=pins.some(p=>p.y>=ball.y-ball.r&&p.y-ball.y<ball.r+p.r+90&&Math.abs(p.x-ball.x)<ball.r+p.r+28)||
        segments.some(o=>!o.sideWall&&!o.funnel&&!o.broken&&Math.max(o.y1,o.y2)>=ball.y&&Math.min(o.y1,o.y2)<ball.y+90&&segmentDistance(ball.x,ball.y+35,o)<ball.r+(o.radius||5)+18);
      if(!blocked)return false;
      const inward=ball.x<world.width/2?1:-1;
      // Select a clear short arc, then apply velocity only. Walls and obstacles remain solid.
      const dx=[inward*110,-inward*110,inward*75,-inward*75].find(dx=>[.25,.5,.75,1].every(t=>clearAt(ball,ball.x+dx*t,ball.y+45*t,game,env)));
      if(dx===undefined)return false;
      const length=Math.hypot(dx,45);ball.vx=dx/length*210;ball.vy=Math.max(ball.vy,45/length*210+45);ball.boostUntil=now+.45;
    } else if(id==='shield')s.shield=1;
    else if(id==='cleanse'){s.slowUntil=0;s.confusedUntil=0;s.controlGrace=now+2;s.guardUntil=now+2;}
    else if(id==='shock')pulse(game,ball,id,0);
    else if(id==='lightning') {
      const target=nearby(ball,game,420).filter(b=>b.y>ball.y).sort((a,b)=>a.y-b.y)[0];
      if(!target||!hit(game,ball,target,0,-45,1,false,{targeted:true}))return false;
      game.battle.effects.push({x:ball.x,y:ball.y,x2:target.x,y2:target.y,color:'#dfaa36',icon:'⚡',until:now+.5});
    } else if(id==='goo'||id==='mine'||id==='vortex') {
      if(!placeTrap(game,ball,id))return false;
      if(id==='goo')game.battle.bursts.push({owner:ball.id,remaining:2,next:now+.25});
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
      const target=nearby(ball,game,450).find(b=>effective(b)&&!['mimic','reroll','shortcut','comet'].includes(effective(b)));
      const choices=abilities.filter(a=>!['mimic','reroll','shortcut'].includes(a.id));
      if(!target&&game.mode!=='normal')return false;
      s.borrowId=target?effective(target):choices[Math.floor(random()*choices.length)].id;s.borrowUntil=now+2.2;
      fire(game,ball,s.borrowId,env,random);emit(game,ball,id,byId.get(s.borrowId).name);return true;
    } else if(id==='swap') {
      const target=nearby(ball,game,320).filter(b=>b.y>ball.y+25&&!safeZone(b,world)&&b.battle.controlGrace<=now&&b.battle.guardUntil<=now&&!b.battle.shield&&!active(b,'reflect',now)).sort((a,b)=>a.y-b.y)[0];
      if(!target)return false;
      const ignore=new Set([ball.id,target.id]);
      if(!clearAt(ball,target.x,target.y,game,env,ignore)||!clearAt(target,ball.x,ball.y,game,env,ignore))return false;
      const p={x:ball.x,y:ball.y};move(ball,{x:target.x,y:target.y});move(target,p);target.battle.controlGrace=now+2.3;
    } else if(id==='charge') {
      if(s.energy<3)return false;s.energy=0;boost(ball,now,200);
    } else if(id==='wallride') {
      const b=window.MarbleCourse.bounds(ball.y,world);if(Math.min(ball.x-b.left,b.right-ball.x)>ball.r+50)return false;
    } else if(id==='swing') {
      const pin=game.static.pins.concat(env.pins).filter(p=>Math.hypot(p.x-ball.x,p.y-ball.y)>p.r+ball.r+8&&Math.hypot(p.x-ball.x,p.y-ball.y)<170).sort((a,b)=>Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y))[0];
      if(!pin)return false;s.hook={x:pin.x,y:pin.y,r:pin.r,key:pin.id||pin.machineKey};s.swingSign=ball.x>=pin.x?1:-1;
    } else if(id==='crossjump') {
      const b=window.MarbleCourse.bounds(ball.y,world),width=b.right-b.left,mid=(b.left+b.right)/2;
      const fractions=ball.x<mid?[.8,.7,.9,.6]:[.2,.3,.1,.4];
      const x=fractions.map(f=>b.left+width*f).find(x=>(x-mid)*(ball.x-mid)<0&&clearAt(ball,x,ball.y,game,env));
      if(x===undefined)return false;move(ball,{x,y:ball.y});ball.vx*=.3;
    } else if(id==='seeker') {
      const target=nearby(ball,game,380).filter(b=>b.y>ball.y+25&&!safeZone(b,world)).sort((a,b)=>a.y-b.y)[0];
      if(!target)return false;game.battle.projectiles.push({owner:ball.id,target:target.id,x:ball.x,y:ball.y,until:now+1.4});
    } else if(id==='sweeper') {
      const before=game.battle.traps.length;game.battle.traps=game.battle.traps.filter(t=>!['goo','mine'].includes(t.id)||Math.hypot(t.x-ball.x,t.y-ball.y)>210);
      if(before===game.battle.traps.length)return false;
    } else if(id==='decoy')s.decoyCharges=1;
    else if(id==='confuse') {
      let changed=false;for(const target of nearby(ball,game,175))changed=hit(game,ball,target,0,0,0,false,{confuse:true})||changed;
      if(!changed)return false;
    } else if(id==='tow') {
      const target=nearby(ball,game,180).filter(b=>!safeZone(b,world)).sort((a,b)=>Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y))[0];
      if(!target||!hit(game,ball,target))return false;s.towId=target.id;
    } else if(id==='ring'||id==='ramp'||id==='portal') {
      if(!makeStructure(game,ball,id,env))return false;
    } else if(id==='machinefast'||id==='machinereverse') {
      if(!modifyMachines(game,ball,id,env))return false;
    } else if(id==='convert') {
      const pin=game.static.pins.filter(p=>p.id&&!p.kind&&!p.kick&&!p.pillar&&!p.island&&!p.switchFor&&Math.hypot(p.x-ball.x,p.y-ball.y)<200&&(game.battle.converted.get(p.id)?.lock||0)<=now).sort((a,b)=>Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y))[0];
      if(!pin)return false;game.battle.converted.set(pin.id,{until:now+2.2,lock:now+4.5});
    }
    s.activeUntil=now+a.duration;emit(game,ball,id);return true;
  }
  function tick(game,dt,env,random=Math.random) {
    if(!game.battle)return;
    const now=game.time,world=game.battle.world,battle=game.battle;
    battle.effects=battle.effects.filter(e=>e.until>now).slice(-80);
    // Keep expired mines until their timed explosion has been processed.
    battle.traps=battle.traps.filter(e=>e.until>now||e.id==='mine'&&!e.exploded).slice(-400);
    battle.projectiles=battle.projectiles.filter(e=>e.until>now).slice(-60);
    battle.structures=battle.structures.filter(e=>e.until>now).slice(-24);
    for(const [key,until]of battle.disabled)if(until<now)battle.disabled.delete(key);
    for(const map of [battle.converted,battle.fieldMods])for(const [key,value]of map)if(value.lock<=now)map.delete(key);
    const ranked=game.balls.filter(b=>!b.finished).sort((a,b)=>b.y-a.y),rank=new Map(ranked.map((b,i)=>[b.id,i]));
    for(const ball of ranked){
      const s=ball.battle;
      if(s.borrowUntil<=now){if(s.borrowId==='shield')s.shield=0;delete s.borrowId;delete s.borrowUntil;s.activeUntil=0;s.decoyCharges=0;s.hook=null;s.towId=null;}
      const section=battle.sections.filter(([y])=>y<=ball.y).length;
      if(s.reroll&&section>s.section&&!safeZone(ball,world)){
        const choices=abilities.filter(a=>!['reroll','shortcut'].includes(a.id)&&a.id!==s.id),a=choices[Math.floor(random()*choices.length)];
        assign(game,ball,a.id,random,true);emit(game,ball,'reroll',a.name);
      }
      const state=ball.battle,id=effective(ball),a=byId.get(state.id),safe=safeZone(ball,world);
      if(safe){state.activeUntil=0;state.slowUntil=0;state.confusedUntil=0;state.decoyCharges=0;state.hook=null;state.towId=null;state.trail=[];}
      if(a.cooldown&&now>=state.next&&!['wallkick','slingshot'].includes(state.id)){
        const fired=fire(game,ball,state.id,env,random);state.next=now+(fired?a.cooldown:.55);
      }
      restoreShape(ball,game,env);
      ball.mass=id==='heavy'?1.9:active(ball,'giant',now)&&ball.r>ball.baseR*1.1?2.3:1;
      ball.gravityScale=id==='heavy'?1.2:1;ball.speedLimit=id==='heavy'?370:active(ball,'wallride',now)&&!safe?390:340;ball.immuneFields=id==='immune';
      if(active(ball,'comet',now)&&!safe){
        ball.vy+=110*dt;ball.boostUntil=now+.1;
        state.trail=(state.trail||[]).filter(p=>p.time>now-.7);
        const last=state.trail.at(-1);if(last&&Math.hypot(last.x-ball.x,last.y-ball.y)>150)state.trail=[];
        if(now>=(state.trailNext||0)){state.trail.push({x:ball.x,y:ball.y,time:now});state.trailNext=now+.045;}
      }else if(state.trail)state.trail=[];
      if(!safe){
        if(active(ball,'wallride',now)){
          const b=window.HiddenCourses?.laneBounds(ball.x,ball.y,world)||window.MarbleCourse.bounds(ball.y,world);
          const left=ball.x-b.left<b.right-ball.x,gap=left?ball.x-b.left:b.right-ball.x,slope=left?b.leftSlope:b.rightSlope;
          if(gap<ball.r+50){
            const length=Math.hypot(1,slope),direction=left?1:-1,wallRadius=window.MarbleCourse.wallRadius;
            if(gap<(ball.r+wallRadius)*length-wallRadius+4)rideWall(game,ball,direction/length,-direction*slope/length,dt);
            else{ball.vy=Math.max(110,ball.vy)+90*dt;ball.vx=slope*ball.vy-direction*35;}
          }
        }
        if(active(ball,'swing',now)&&state.hook){
          const pin=game.static.pins.concat(env.pins).find(p=>(p.id||p.machineKey)===state.hook.key)||state.hook;state.hook.x=pin.x;state.hook.y=pin.y;
          const dx=ball.x-pin.x,dy=ball.y-pin.y,d=Math.hypot(dx,dy)||1,rest=Math.max(65,pin.r+ball.r+22),pull=clamp((d-rest)*7,-110,160);
          if(d>240)state.activeUntil=now;else{ball.vx+=(-dx/d*pull-dy/d*state.swingSign*140)*dt;ball.vy+=(-dy/d*pull+dx/d*state.swingSign*140)*dt;}
        }
        if(id==='checkpoint'&&section>state.checkpointSection){state.checkpointSection=section;boost(ball,now,90);emit(game,ball,id);}
        if(active(ball,'tow',now)){
          const target=game.balls.find(b=>b.id===state.towId&&!b.finished);
          if(!target||safeZone(target,world)||target.battle.guardUntil>now)state.activeUntil=now;
          else{const dx=target.x-ball.x,dy=target.y-ball.y,d=Math.hypot(dx,dy)||1,force=clamp((d-55)*1.2,0,110);
            if(d>260)state.activeUntil=now;else{ball.vx+=dx/d*force*dt/ball.mass;ball.vy+=dy/d*force*dt/ball.mass;target.vx-=dx/d*force*dt/(target.mass||1);target.vy-=dy/d*force*dt/(target.mass||1);}}
        }
      }
      if(id==='catchup'&&rank.get(ball.id)>=Math.max(1,Math.floor(ranked.length*.6)))ball.gravityScale=1.28;
      if(active(ball,'path',now)&&state.pathX!==undefined)ball.vx+=clamp((state.pathX-ball.x)*2,-100,100)*dt;
      if(state.slowUntil>now){ball.vx*=Math.pow(.82,dt*60);ball.vy*=Math.pow(.988,dt*60);}
      if(['vacuum','ice'].some(k=>active(ball,k,now)))pulse(game,ball,id,dt);
      if(!active(ball,'decoy',now))state.decoyCharges=0;
    }
    for(const owner of ranked)if(active(owner,'comet',now)&&!safeZone(owner,world)){
      const trail=owner.battle.trail||[];
      for(const target of nearby(owner,game,430))for(let i=1;i<trail.length;i++){
        const p=trail[i-1],q=trail[i];
        if(segmentDistance(target.x,target.y,{x1:p.x,y1:p.y,x2:q.x,y2:q.y})<target.r+owner.r+6){
          if(hit(game,owner,target,0,0,.55))emit(game,owner,'comet',tr("꼬리 감속"));break;
        }
      }
    }
    for(const burst of battle.bursts){
      const owner=game.balls.find(b=>b.id===burst.owner);
      if(!owner||owner.finished||safeZone(owner,world)){burst.remaining=0;continue;}
      while(burst.remaining>0&&now+1e-9>=burst.next){placeTrap(game,owner,'goo');burst.remaining--;burst.next+=.25;}
    }
    battle.bursts=battle.bursts.filter(b=>b.remaining>0);
    for(const trap of battle.traps){const owner=game.balls.find(b=>b.id===trap.owner);if(!owner)continue;
      if(trap.id==='mine'){
        if(!trap.exploded&&(now>=trap.until||ranked.some(b=>b.id!==owner.id&&!safeZone(b,world)&&Math.hypot(b.x-trap.x,b.y-trap.y)<50)))explodeMine(game,trap,ranked);
        continue;
      }
      for(const target of ranked)if(target.id!==owner.id&&Math.abs(target.y-trap.y)<(trap.range||40)){
        if(trap.id==='goo'&&Math.hypot(target.x-trap.x,target.y-trap.y)<40)hit(game,owner,target,0,0,.7,false,{origin:trap});
        else if(trap.id==='vortex')vortexField(game,trap,owner,target,dt,env);
      }
    }
    for(const shot of battle.projectiles){const owner=game.balls.find(b=>b.id===shot.owner),target=game.balls.find(b=>b.id===shot.target);
      if(!owner||owner.finished||!target||target.finished||safeZone(owner,world)||safeZone(target,world)){shot.until=0;continue;}
      const dx=target.x-shot.x,dy=target.y-shot.y,d=Math.hypot(dx,dy),travel=430*dt;
      if(d<=travel+target.r+6){hit(game,owner,target,Math.sign(dx||1)*90,-70,.35,false,{targeted:true});shot.until=0;}
      else{shot.x+=dx/d*travel;shot.y+=dy/d*travel;}
    }
    for(const mark of battle.marks)if(mark.at<=now&&mark.until>now){
      const owner=game.balls.find(b=>b.id===mark.owner),target=game.balls.find(b=>b.id===mark.target);mark.until=0;
      if(owner&&!owner.finished&&target&&!target.finished)hit(game,owner,target,0,0,.65,true);
    }
    battle.marks=battle.marks.filter(m=>m.until>now).slice(-80);
    for(const object of battle.structures)for(const ball of ranked){
      if(safeZone(ball,world)||object.used.has(ball.id)||Math.hypot(ball.x-object.x,ball.y-object.y)>ball.r+(object.kind==='ring'?30:23))continue;
      if(object.kind==='ring'){object.used.add(ball.id);boost(ball,now,100);emit(game,ball,'ring',tr("공용 링"));}
      else if(object.kind==='portal'&&ball.battle.portalGrace<=now&&clearAt(ball,object.exitX,object.exitY,game,env)){
        object.used.add(ball.id);move(ball,{x:object.exitX,y:object.exitY});ball.vy=Math.max(60,ball.vy);ball.battle.portalGrace=now+1.5;emit(game,ball,'portal',tr("공용 포털"));
      }
    }
  }
  function skipObstacle(ball,object,game) {
    return !!ball.battle&&!!(active(ball,'ghost',game.time)||active(ball,'comet',game.time)||ball.battle.exitPending)&&!safeZone(ball,game.battle.world)&&!object.sideWall&&!object.funnel;
  }
  function skipPair(a,b,game){return !!game?.battle&&((!safeZone(a,game.battle.world)&&active(a,'orbphase',game.time))||(!safeZone(b,game.battle.world)&&active(b,'orbphase',game.time)));}
  function contact(game,a,b,nx,ny) {
    if(!game?.battle)return;
    if(active(a,'bumper',game.time))hit(game,a,b,nx*180,ny*120);
    if(active(b,'bumper',game.time))hit(game,b,a,-nx*180,-ny*120);
    if(active(a,'reflect',game.time)&&!active(b,'reflect',game.time)&&a.battle.controlGrace<=game.time&&hit(game,a,b,nx*105,ny*65)){a.battle.controlGrace=game.time+1.5;emit(game,a,'reflect',tr("접촉 반사"));}
    if(active(b,'reflect',game.time)&&!active(a,'reflect',game.time)&&b.battle.controlGrace<=game.time&&hit(game,b,a,-nx*105,-ny*65)){b.battle.controlGrace=game.time+1.5;emit(game,b,'reflect',tr("접촉 반사"));}
    for(const ball of [a,b]){if(effective(ball)==='charge'&&game.time-ball.battle.lastImpact>.25){ball.battle.energy=Math.min(3,ball.battle.energy+1);ball.battle.lastImpact=game.time;}}
  }
  function obstacleHit(game,ball,previous,object=null,nx=0,ny=0,surfaceVx=0,surfaceVy=0){
    if(!ball.battle)return;
    if(!safeZone(ball,game.battle.world)&&object){
      if(active(ball,'springball',game.time)&&game.time-ball.battle.lastSpring>.2){
        const toward=(previous.vx-surfaceVx)*nx+(previous.vy-surfaceVy)*ny;
        if(toward< -12){const impulse=clamp(-toward*.65,35,150);ball.vx+=nx*impulse;ball.vy+=ny*impulse;ball.boostUntil=game.time+.4;ball.battle.lastSpring=game.time;}
      }
      if(effective(ball)==='slingshot'&&game.time>=ball.battle.next&&Math.hypot(surfaceVx,surfaceVy)>12){
        ball.vx+=clamp(surfaceVx*1.4,-165,165);ball.vy+=clamp(surfaceVy*1.4,-140,140);ball.boostUntil=game.time+.5;ball.battle.next=game.time+6;emit(game,ball,'slingshot');
      }
    }
    if(active(ball,'absorb',game.time)){ball.vx=previous.vx*.6+ball.vx*.4;ball.vy=Math.max(12,previous.vy*.4,ball.vy*.15);}
    if(effective(ball)==='charge'&&game.time-ball.battle.lastImpact>.25){ball.battle.energy=Math.min(3,ball.battle.energy+1);ball.battle.lastImpact=game.time;}
  }
  function rideWall(game,ball,nx,ny,dt=0) {
    if(!game?.battle||!ball.battle||!active(ball,'wallride',game.time)||safeZone(ball,game.battle.world)||Math.abs(nx)<.05)return false;
    // Pick the wall tangent with positive y: reflected/upward velocity must never
    // turn the power into a climb. No position change or obstacle phasing.
    const length=Math.hypot(nx,ny),sign=nx>0?1:-1,tx=-ny*sign/length,ty=Math.abs(nx)/length;
    const speed=clamp(ball.vx*tx+ball.vy*ty+160*dt,280,390);
    ball.vx=tx*speed;ball.vy=ty*speed;
    return true;
  }
  function wallHit(game,ball,direction) {
    if(effective(ball)==='wallkick'&&game.time>=ball.battle.next){ball.vx=direction*170;ball.vy=Math.max(80,ball.vy);ball.battle.next=game.time+3;emit(game,ball,'wallkick');}
  }
  function field(game,ball,source,dt) {
    if(disabled(game,source))return;
    const mod=game.battle?.fieldMods.get(source.id);
    if(mod?.until>game.time){source={...source,strength:source.strength*(mod.kind==='machinefast'?1.4:source.kind==='magnet'?-1:1),direction:source.direction*(mod.kind==='machinereverse'?-1:1)};}
    const id=effective(ball),dx=source.x-ball.x,dy=source.y-ball.y,d=Math.hypot(dx,dy);
    if(d&&d<source.range&&id==='windride'&&source.kind==='wind') {
      const force=source.strength*(1-d/source.range);ball.vx+=source.direction*force*.3*dt;ball.vy+=(40+force*.45)*dt;
    } else if(d&&d<source.range&&active(ball,'reverse',game.time)&&source.kind==='magnet') {
      const force=source.strength*(1-d/source.range);ball.vx-=dx/d*force*dt;ball.vy+=(25-dy/d*force*.12)*dt;
    } else window.MarbleCourse.field(ball,source,dt);
  }
  function converted(game,pin){return !!game.battle&&(game.battle.converted.get(pin.id)?.until||0)>game.time;}
  function kick(game,ball,pin,nx,ny){
    const transformed=converted(game,pin);window.MarbleCourse.kick(ball,transformed?{...pin,kick:190}:pin,nx,ny,game.time);
    if(transformed)pin.flashUntil=game.time+.18;
  }
  function caption(ball) {
    if(!ball.battle?.id)return '';
    const a=byId.get(ball.battle.id),copy=ball.battle.borrowId?'→'+ability(ball).name:'';
    return (ball.battle.reroll&&a.id!=='reroll'?tr("🎲 변덕→"):a.icon+' ')+a.name+copy;
  }
  function label(ball) {
    return ball.battle?.id?ball.label+' · '+caption(ball):ball.label;
  }
  function describe(ball,time) {
    if(!ball.battle?.id)return '#'+ball.id+' '+ball.label+tr(" · 일반 구슬");
    const a=byId.get(ball.battle.id),s=ball.battle;
    let state=a.cooldown?tr("다음 {0}초",[Math.max(0,Math.ceil(s.next-time))]):a.id==='shortcut'?tr("2구간 출발 · 추가 효과 없음"):tr("상시");
    if(s.activeUntil>time)state=tr("발동 중");if(s.shield)state=tr("보호막 준비");
    if(a.id==='charge')state=tr("충전 {0}/3",[s.energy]);if(a.id==='reroll')state=tr("다음 구간에서 변경");
    if(a.id==='slingshot')state=s.next>time?tr("다음 {0}초",[Math.ceil(s.next-time)]):tr("움직이는 장애물 충돌 대기");
    if(a.id==='revenge')state=s.revengeReadyAt>time?tr("재준비 {0}초",[Math.ceil(s.revengeReadyAt-time)]):tr("피격 대기");
    if(a.id==='checkpoint')state=tr("다음 구간 통과 대기");
    if(s.confusedUntil>time)state+=tr(" · 혼란");
    return '#'+ball.id+' '+label(ball)+' · '+state+(s.reroll?tr(" · 구간마다 재추첨"):'')+' — '+a.description;
  }
  function drawWorld(ctx,game,camera) {
    if(!game.battle)return;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    ctx.save();
    for(const ball of game.balls)if(!ball.finished&&active(ball,'comet',game.time)){
      const trail=ball.battle.trail||[];ctx.save();ctx.lineCap='round';
      for(let i=1;i<trail.length;i++){const p=trail[i-1],q=trail[i];ctx.globalAlpha=clamp(1-(game.time-p.time)/.7,0,.8);ctx.strokeStyle=i%2?'#75c8f4':'#bd9fff';ctx.lineWidth=ball.r*1.2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
      ctx.restore();
    }
    for(const trap of game.battle.traps)if(!trap.exploded&&trap.until>game.time&&trap.y>camera.top-100&&trap.y<camera.top+camera.visibleHeight+100){
      ctx.save();ctx.globalAlpha=clamp((trap.until-game.time)*3,0,1);
      if(trap.id==='vortex'){
        const gradient=ctx.createRadialGradient(trap.x,trap.y,4,trap.x,trap.y,trap.range);
        gradient.addColorStop(0,'#6aaeba55');gradient.addColorStop(1,'#a9dedb08');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(trap.x,trap.y,trap.range,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#66a9b9bb';ctx.lineWidth=2;const phase=reduced?0:game.time*3*trap.direction;
        for(let arm=0;arm<3;arm++){ctx.beginPath();for(let i=0;i<=26;i++){const t=i/26,r=6+(1-t)*trap.range*.85,angle=phase+arm*Math.PI*2/3+t*Math.PI*2*trap.direction;
          const x=trap.x+Math.cos(angle)*r,y=trap.y+Math.sin(angle)*r;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();}
        ctx.setLineDash([3,6]);ctx.lineWidth=1;ctx.strokeStyle='#78b6bb77';ctx.beginPath();ctx.arc(trap.x,trap.y,trap.range,0,Math.PI*2);ctx.stroke();
      }else if(trap.id==='goo'){
        ctx.fillStyle='#71b95466';ctx.beginPath();ctx.ellipse(trap.x,trap.y,30,23,.25,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#d3efafaa';for(const [dx,dy,r]of [[-9,-5,5],[8,4,3],[1,-11,2]]){ctx.beginPath();ctx.arc(trap.x+dx,trap.y+dy,r,0,Math.PI*2);ctx.fill();}
      }else{
        const warning=trap.until-game.time<2;ctx.fillStyle=warning?'#efb45b66':'#c8947755';ctx.beginPath();ctx.arc(trap.x,trap.y,22,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=warning?'#d77c37':'#b78d64';ctx.lineWidth=2;ctx.beginPath();ctx.arc(trap.x,trap.y,25,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp((trap.until-game.time)/10,0,1));ctx.stroke();
        ctx.font='19px sans-serif';ctx.textAlign='center';ctx.fillStyle='#695342';ctx.fillText('💣',trap.x,trap.y+7);
      }
      ctx.restore();
    }
    for(const object of game.battle.structures){
      if(object.y<camera.top-250||object.y>camera.top+camera.visibleHeight+100)continue;
      ctx.save();ctx.globalAlpha=Math.min(1,(object.until-game.time)*3);ctx.lineWidth=4;
      if(object.kind==='ramp'){const s=object.segment;ctx.strokeStyle='#8970b7';ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();ctx.setLineDash([5,5]);ctx.lineWidth=2;ctx.strokeStyle='#f7edff';ctx.stroke();}
      else{ctx.strokeStyle=object.kind==='ring'?'#dcaa34':'#9174d3';ctx.beginPath();ctx.ellipse(object.x,object.y,object.kind==='ring'?30:23,18,0,0,Math.PI*2);ctx.stroke();ctx.font='bold 17px sans-serif';ctx.textAlign='center';ctx.fillStyle=ctx.strokeStyle;ctx.fillText('↓',object.x,object.y+6);
        if(object.kind==='portal'){ctx.setLineDash([5,6]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(object.x,object.y+20);ctx.lineTo(object.exitX,object.exitY-20);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#4eaaa9';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(object.exitX,object.exitY,23,18,0,0,Math.PI*2);ctx.stroke();}}
      ctx.restore();
    }
    for(const ball of game.balls){
      if(ball.finished||ball.y<camera.top-100||ball.y>camera.top+camera.visibleHeight+100)continue;
      const state=ball.battle;ctx.save();ctx.lineWidth=2;ctx.strokeStyle='#a287bc';
      if(active(ball,'swing',game.time)&&state.hook){ctx.beginPath();ctx.moveTo(ball.x,ball.y);ctx.lineTo(state.hook.x,state.hook.y);ctx.stroke();}
      if(active(ball,'tow',game.time)){const target=game.balls.find(b=>b.id===state.towId&&!b.finished);if(target){ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(ball.x,ball.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.setLineDash([]);}}
      if(active(ball,'decoy',game.time)&&state.decoyCharges){const b=window.MarbleCourse.bounds(ball.y,game.battle.world),x=clamp(ball.x+30,b.left+ball.r+3,b.right-ball.r-3);ctx.globalAlpha=.55;ctx.setLineDash([3,3]);ctx.fillStyle=ball.color;ctx.beginPath();ctx.arc(x,ball.y-18,ball.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.font='bold 12px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText('?',x,ball.y-14);}
      ctx.restore();
    }
    for(const mark of game.battle.marks){const target=game.balls.find(b=>b.id===mark.target&&!b.finished);if(target&&target.y>camera.top&&target.y<camera.top+camera.visibleHeight){ctx.fillStyle='#bf8056';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText('◇',target.x,target.y-target.r-12);}}
    for(const shot of game.battle.projectiles||[])if(shot.until>game.time&&shot.y>camera.top-30&&shot.y<camera.top+camera.visibleHeight+30){ctx.fillStyle='#db9e45';ctx.beginPath();ctx.arc(shot.x,shot.y,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e6be6d99';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(shot.x-8,shot.y-14);ctx.lineTo(shot.x,shot.y);ctx.stroke();}
    for(const e of game.battle.effects)if(e.y>camera.top-130&&e.y<camera.top+camera.visibleHeight+130){
      if(e.kind==='mine-explosion'){
        const age=clamp((game.time-e.born)/.65,0,1),progress=reduced?.65:age,radius=12+progress*e.radius;
        ctx.save();ctx.globalAlpha=1-age;const flare=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,24+progress*28);
        flare.addColorStop(0,'#fff9cdcc');flare.addColorStop(.35,'#ffc15eaa');flare.addColorStop(1,'#ee8b4100');ctx.fillStyle=flare;
        ctx.beginPath();ctx.arc(e.x,e.y,24+progress*28,0,Math.PI*2);ctx.fill();ctx.strokeStyle=e.color;ctx.lineWidth=3*(1-age)+1;
        for(const scale of [1,.62]){ctx.beginPath();ctx.arc(e.x,e.y,radius*scale,0,Math.PI*2);ctx.stroke();}
        for(let i=0;i<12;i++){const angle=i*Math.PI/6,inner=radius*.8,outer=radius+12*(1-age);ctx.beginPath();ctx.moveTo(e.x+Math.cos(angle)*inner,e.y+Math.sin(angle)*inner);ctx.lineTo(e.x+Math.cos(angle)*outer,e.y+Math.sin(angle)*outer);ctx.stroke();}
        ctx.restore();continue;
      }
      ctx.globalAlpha=clamp((e.until-game.time)/.7,0,1);ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,15+(1-(e.until-game.time)/.7)*50,0,Math.PI*2);ctx.stroke();if(e.x2!==undefined){ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x2,e.y2);ctx.stroke();}
    }
    ctx.restore();
  }
  function drawBall(ctx,ball,game,camera) {
    if(!ball.battle?.id)return;
    const s=ball.battle,a=ability(ball),lit=s.activeUntil>game.time||s.flashUntil>game.time||s.shield;
    if(a.id==='comet'&&!ball.finished){
      const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      const pulse=reduced ? .55 :(1+Math.sin(game.time*Math.PI*2/2.6))/2,radius=ball.r+12+pulse*5;
      ctx.save();ctx.globalAlpha=.18+pulse*.62;
      const halo=ctx.createRadialGradient(ball.x,ball.y,ball.r+1,ball.x,ball.y,radius);
      halo.addColorStop(0,'rgba(133,215,255,0)');halo.addColorStop(.32,'rgba(133,215,255,.85)');halo.addColorStop(.68,'rgba(174,148,240,.4)');halo.addColorStop(1,'rgba(133,215,255,0)');
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(ball.x,ball.y,radius,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    ctx.save();ctx.strokeStyle=colors[a.group];ctx.lineWidth=lit?2.5:1.2;
    if(active(ball,'ghost',game.time)||active(ball,'orbphase',game.time)||active(ball,'comet',game.time))ctx.setLineDash([3,3]);
    ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r+3,0,Math.PI*2);ctx.stroke();
    if(lit||game.selectedBall===ball.id||game.balls.length<=20||camera.zoom>=1.8){ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=colors[a.group];ctx.fillText(a.icon,ball.x,ball.y-ball.r-12);}
    ctx.restore();
  }
  window.MarbleBattle={abilities,hiddenAbility,byId,chooseComet,grantComet,init,initGolden,placeShortcuts,assign,tick,fire,hit,spot,clearAt,timeFor,frozen,disabled,skipObstacle,skipPair,contact,obstacleHit,wallHit,rideWall,field,machineRate,temporarySegments,converted,kick,caption,label,describe,drawWorld,drawBall};
})();
