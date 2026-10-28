(() => {
  'use strict';
  const Course=window.MarbleCourse,Extra=window.ExtraCourses;
  const baseMaps=['pinball','spinner','fork','factory','rapids','ruins'];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const theme={backdrop:'#11142b',bank:'#1c2042',wall:'#6d70b4',wallLight:'#c7c8ff',ink:'#626b9b',base:'#252946',end:'#363052',finish:'#aaa7ff30'};
  const names={observatory:['관측 정원','별빛 관문','혜성 잔해대','공전 회랑','성운 항로','천문대 수문장'],rift:['별의 탄생','궤도 관문','평행우주 분기','역행 항로','은하 소용돌이','붕괴하는 성역','천문대의 잔향','삼중 차원 출구']};
  const starts={observatory:[180,2250,4450,6650,8850,11100],rift:[180,3400,6620,9840,13060,16280,19500,22720]};
  const definitions=Object.fromEntries(Object.keys(names).map(id=>[id,{title:id==='rift'?'차원의 틈':'혜성 천문대',label:id==='rift'?'차원의 틈':'혜성 천문대',height:(id==='rift'?25000:13500)/3,sections:starts[id].map((y,i)=>[y/3,names[id][i]]),theme:{...theme},colors:['#252e4c','#302e50','#292f50','#34304f','#273d50','#38334e','#2e354f','#3c3152']}]));
  const has=id=>Object.hasOwn(definitions,id);
  const plans={observatory:[['관측 정원','공전 위성','별 무리 범퍼'],['별빛 관문','개폐 관문','자석 성운'],['혜성 잔해대','교차하는 혜성 잔해','운석 발판'],['공전 회랑','공전 날개','궤도 위성'],['성운 항로','성운 물살','작은 블랙홀'],['천문대 수문장','별빛 검문소','골키퍼']],rift:names.rift.map((name,i)=>[name,['핀볼 대표 구간','회전 장애물 대표 구간','갈림길 대표 구간','공장 대표 구간','계곡 대표 구간','유적 대표 구간','천문대 대표 구간','3갈래 이중 골키퍼'][i],i===7?'각 출구에서 실제 결승선 통과':'연속된 차원문'])};
  function configure(world,map){
    world.sideProfile=Array.from({length:25},(_,i)=>{const y=world.funnelY*i/24,fade=Math.min(1,y/500),wave=map==='rift'?0:Math.sin(i*.65)*18;return{y,left:40+fade*(22+wave),right:960-fade*(22-wave)};});
    if(map==='rift')world.funnelKnee=world.height-420;
  }
  function exits(world,map,radius){
    world.exitGates=null;
    if(map!=='rift')return;
    const b=Course.bounds(world.funnelY,world),width=b.right-b.left;
    world.exitGates=[0,1,2].map(i=>({center:220+i*280,left:220+i*280-radius*2.5,right:220+i*280+radius*2.5,startLeft:b.left+width*i/3,startRight:b.left+width*(i+1)/3}));
    world.finishLeft=world.exitGates[0].left;world.finishRight=world.exitGates[2].right;
  }
  function laneBounds(x,y,world){
    if(!world.exitGates||y<world.funnelY)return null;
    const gate=world.exitGates.reduce((a,b)=>Math.abs(a.center-x)<=Math.abs(b.center-x)?a:b),span=world.funnelKnee-world.funnelY,t=clamp((y-world.funnelY)/span,0,1);
    return {left:gate.startLeft+(gate.left-gate.startLeft)*t,right:gate.startRight+(gate.right-gate.startRight)*t,leftSlope:t<1?(gate.left-gate.startLeft)/span:0,rightSlope:t<1?(gate.right-gate.startRight)/span:0};
  }
  function inside(x,y,r,world){const b=laneBounds(x,y,world);return !b||x-r>=b.left-.01&&x+r<=b.right+.01;}
  function finishSegments(world){return world.exitGates.flatMap(g=>[
    {x1:g.startLeft-4.5,y1:world.funnelY,x2:g.left-4.5,y2:world.funnelKnee,radius:4.5,funnel:true},
    {x1:g.startRight+4.5,y1:world.funnelY,x2:g.right+4.5,y2:world.funnelKnee,radius:4.5,funnel:true},
    {x1:g.left-4.5,y1:world.funnelKnee,x2:g.left-4.5,y2:world.bottom,radius:4.5,funnel:true},
    {x1:g.right+4.5,y1:world.funnelKnee,x2:g.right+4.5,y2:world.bottom,radius:4.5,funnel:true}
  ]);}
  function sideWalls(world){return world.sideProfile.slice(1).flatMap((b,i)=>{const a=world.sideProfile[i];return[{x1:a.left-4.5,y1:a.y,x2:b.left-4.5,y2:b.y,radius:4.5,sideWall:true},{x1:a.right+4.5,y1:a.y,x2:b.right+4.5,y2:b.y,radius:4.5,sideWall:true}];});}
  function distance(x,y,s){const dx=s.x2-s.x1,dy=s.y2-s.y1,t=clamp(((x-s.x1)*dx+(y-s.y1)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-s.x1-t*dx,y-s.y1-t*dy);}
  function buildObservatory(world,sections,count){
    const pins=[],segments=[],features=[];
    const feature=(kind,y,section,extra={})=>features.push({kind,y,section,key:'observatory-'+kind+'-'+features.length,...extra});
    sections.forEach(([start],section)=>{
      const end=Math.min(sections[section+1]?.[0]||world.funnelY-80,world.funnelY-80),span=end-start;
      if(span<150)return;
      if(section===0)for(let k=0;k<7;k++)feature('orbit',start+180+k*(span-360)/6,section,{fraction:k%2?.7:.3,range:85+k%3*12,phase:k,orbitalPin:true});
      if(section===1||section===5)for(let k=0;k<(section===1?5:3);k++)feature('gate',start+180+k*(span-360)/(section===1?4:2),section,{fraction:k%2?.63:.37,phase:k*.8});
      if(section===2)for(let k=0;k<7;k++)feature('boulder',start+180+k*(span-360)/6,section,{height:155,fraction:[.25,.7,.4,.62][k%4],phase:k*.8,period:4.3+k%2*.6,radius:24+k%3*7});
      if(section===3)for(let k=0;k<7;k++)feature('orbit',start+180+k*(span-360)/6,section,{fraction:k%2?.66:.34,range:75,phase:k,rotor:true});
      if(section===4)for(let k=0;k<6;k++){
        if(k%2)feature('whirlpool',start+160+k*(span-320)/5,section,{range:135,direction:k%4===1?1:-1,fraction:k%4===1?.32:.68,power:1.1});
        else feature('current',start+160+k*(span-320)/5,section,{height:270,strength:350,direction:k%4?1:-1,phase:k,pulsed:true,period:4.6,onTime:3,offset:k,lanes:[{fraction:.3,width:.17,lean:1,travel:.2},{fraction:.7,width:.17,lean:-1,travel:.2}]});
      }
      for(let k=0;k<3;k++){
        const y=start+span*(.22+k*.29),b=Course.bounds(y,world),left=(k+section)%2===0;
        if(features.some(f=>Math.abs(f.y-y)<135))continue;
        segments.push({x1:left?b.left:b.right,y1:y,x2:left?b.left+310:b.right-310,y2:y+100,radius:4.5,stellar:true,section});
      }
      for(let row=0;row<13;row++)for(let col=0;col<7;col++){
        const y=start+100+(span-220)*(row+.2)/13,b=Course.bounds(y,world),x=b.left+45+(b.right-b.left-90)*(col+.25+Math.sin(row*2+col)*.14)/7,r=5+(row+col+section)%4*3;
        if(features.some(f=>Math.abs(f.y-y)<110&&(['gate'].includes(f.kind)||Math.abs((f.fraction||.5)*1000-x)<190)))continue;
        if(segments.some(s=>distance(x,y,s)<r+55))continue;
        pins.push({x,y,r,section,id:'observatory-pin-'+pins.length,stellar:true,...((row+col)%19===0?{kind:'power',range:0,kick:210}:{}),...((row*7+col+section)%43===0?{kind:'magnet',range:120,strength:420,r:16}:{} )});
      }
    });
    return{pins,segments:[...segments,...sideWalls(world)],features,solids:[],chapters:sections.map((_,i)=>({source:'observatory',section:i}))};
  }
  function buildRift(world,sections,count,sample){
    const pins=[],segments=[],features=[],solids=[],chapters=[];
    const sources=[['pinball',2],['spinner',1],['fork',3],['factory',2],['rapids',2],['ruins',1],['observatory',3]];
    sources.forEach(([source,chapter],index)=>{
      const ref=sample(source),from=ref.sections[chapter][0],to=ref.sections[chapter+1]?.[0]||ref.world.funnelY-80,start=sections[index][0]+80,end=sections[index+1][0]-100,scale=(end-start)/(to-from),prefix='rift-'+index+'-';
      const ty=y=>start+(y-from)*scale,tx=(x,y)=>{const a=Course.bounds(y,ref.world),b=Course.bounds(ty(y),world);return b.left+(x-a.left)/(a.right-a.left)*(b.right-b.left);};
      const selected=y=>y>=from&&y<to;
      const clone=o=>({...o,section:index,...(o.hits?{hits:new Map()}:{}),...(o.id?{id:prefix+o.id}:{}),...(o.key?{key:prefix+o.key}:{}),...(o.switchFor?{switchFor:prefix+o.switchFor}:{}),stellar:true});
      for(const p of ref.static.pins)if(selected(p.y))pins.push({...clone(p),x:tx(p.x,p.y),y:ty(p.y)});
      for(const s of ref.static.segments)if(!s.sideWall&&!s.funnel&&Math.min(s.y1,s.y2)>=from&&Math.max(s.y1,s.y2)<to)segments.push({...clone(s),x1:tx(s.x1,s.y1),y1:ty(s.y1),x2:tx(s.x2,s.y2),y2:ty(s.y2)});
      for(const f of ref.static.features||[])if(selected(f.y))features.push({...clone(f),y:ty(f.y),...(f.height?{height:f.height*scale}:{} )});
      for(const o of ref.static.solids||[])if(selected(o.y)){const b=Course.bounds(o.y,ref.world),target=Course.bounds(ty(o.y),world);solids.push({...clone(o),x:tx(o.x,o.y),y:ty(o.y),rx:o.rx*(target.right-target.left)/(b.right-b.left),ry:o.ry*scale});}
      if(source==='spinner')for(let k=0;k<5;k++)features.push({kind:'orbit',y:start+(end-start)*(.12+k*.18),section:index,key:prefix+'rotor-'+k,fraction:k%2?.67:.33,range:90,phase:k,rotor:true});
      if(source==='fork')for(let k=0;k<3;k++)features.push({kind:'piston',y:start+(end-start)*(.2+k*.3),section:index,key:prefix+'satellite-'+k,fraction:k%2?.7:.3,amplitude:70});
      // Edge debris blocks straight side highways without closing the inherited routes.
      for(let k=0;k<12;k++)for(const left of [true,false]){const y=start+100+(end-start-200)*(k+.3)/12,b=Course.bounds(y,world),r=13+k%3*4,x=left?b.left+r+22:b.right-r-22;
        if(pins.some(p=>Math.hypot(p.x-x,p.y-y)<p.r+r+35)||segments.some(s=>distance(x,y,s)<r+55)||features.some(f=>Math.abs(f.y-y)<120))continue;
        pins.push({x,y,r,section:index,id:prefix+'edge-'+k+'-'+left,stellar:true,bumper:k%4===0});
      }
      chapters.push({source,section:chapter,pins:pins.filter(p=>p.section===index).length,features:features.filter(f=>f.section===index).length});
    });
    const start=sections[7][0];for(let k=0;k<4;k++){const y=start+150+k*230,b=Course.bounds(y,world);for(const x of [b.left+100,b.right-100])pins.push({x,y,r:18+k%2*8,section:7,id:'rift-final-'+pins.length,stellar:true,bumper:true});}
    return{pins,segments:[...segments,...sideWalls(world)],features,solids,chapters};
  }
  function dynamic(game,world,time){
    const result=Extra.dynamic(game,world,time),Battle=window.MarbleBattle;
    for(const f of game.static.features||[])if(f.kind==='orbit'){
      const t=Battle.timeFor(game,f.key,time),rate=Battle.machineRate(game,f.key),angle=t*.7+f.phase,b=Course.bounds(f.y,world),cx=b.left+(b.right-b.left)*f.fraction;
      if(f.rotor){const half=110,omega=Math.cos(t*.65+f.phase)*.65*.55*rate,a=Math.sin(t*.65+f.phase)*.55;result.segments.push({x1:cx-Math.cos(a)*half,y1:f.y-Math.sin(a)*half,x2:cx+Math.cos(a)*half,y2:f.y+Math.sin(a)*half,cx,cy:f.y,omega,radius:6,rotating:true,machineKey:f.key,stellar:true});}
      else result.pins.push({x:cx+Math.cos(angle)*f.range,y:f.y+Math.sin(angle)*f.range*.45,r:21,vx:-Math.sin(angle)*f.range*.7*rate,vy:Math.cos(angle)*f.range*.45*.7*rate,moving:true,bumper:true,stellar:true,machineKey:f.key});
    }
    if(game.map==='observatory')result.segments.push(...Course.defenders(time,world).map(s=>({...s,stellar:true})));
    return result;
  }
  function goalkeepers(game,time,diameter,world){
    const offset=Math.max(0,Course.keepers.findIndex(k=>k.id===game.keeper.id)),pairs=[[0,1],[2,3],[1,2]];
    return world.exitGates.flatMap((g,lane)=>pairs[lane].flatMap((kind,stage)=>{
      const local={...world,finishLeft:g.left-g.center+500,finishRight:g.right-g.center+500,finishY:world.finishY-(stage?0:155)};
      return Course.goalkeeper(Course.keepers[(kind+offset)%4],time+lane*1.9+stage*.7,diameter,local).map(s=>({...s,x1:s.x1+g.center-500,x2:s.x2+g.center-500,...(s.cx!==undefined?{cx:s.cx+g.center-500}:{}),lane,stage,stellar:true}));
    }));
  }
  function apply(ball,game,world,dt){if(game.static.features.some(f=>(f.kind==='current'&&Math.abs(ball.y-f.y)<f.height/2)||(f.kind==='whirlpool'&&Math.abs(ball.y-f.y)<f.range)))Extra.apply(ball,{...game,map:'rapids'},world,dt);}
  function drawTerrain(ctx,game,world,camera){
    const top=Math.max(0,camera.top-100),end=Math.min(world.height,camera.top+camera.visibleHeight+100);ctx.save();
    for(let row=Math.floor(top/160);row*160<end;row++)for(let i=0;i<10;i++){const x=45+((row*71+i*139)%910),y=row*160+((i*53+row*31)%150);ctx.fillStyle=(row+i)%3?'#e1e3ff60':'#a0e4ed85';ctx.beginPath();ctx.arc(x,y,(i+row)%4===0?2.2:1,0,Math.PI*2);ctx.fill();}
    for(const [y]of definitions[game.map].sections.slice(1))if(y>top&&y<end){ctx.strokeStyle='#afa6ff55';ctx.lineWidth=10;ctx.beginPath();ctx.ellipse(500,y-25,340,50,0,0,Math.PI*2);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#d8d0ffbb';ctx.stroke();}
    for(const y of [90,world.finishY-70])if(y>top&&y<end){ctx.strokeStyle='#aab4e965';ctx.lineWidth=3;ctx.beginPath();ctx.arc(500,y,95,Math.PI,0);ctx.lineTo(595,y+30);ctx.lineTo(405,y+30);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(470,y-50);ctx.lineTo(540,y-95);ctx.lineTo(550,y-80);ctx.lineTo(480,y-35);ctx.closePath();ctx.stroke();}
    ctx.restore();
  }
  function drawWorld(ctx,game,world,camera){
    ctx.save();for(const p of Extra.dynamic(game,world,game.time).pins)if(p.boulder&&p.y>camera.top-100&&p.y<camera.top+camera.visibleHeight+100){
      const trail=ctx.createLinearGradient(p.x,p.y-p.r-90,p.x,p.y);trail.addColorStop(0,'#beb9ff00');trail.addColorStop(1,'#b6c6f99c');ctx.strokeStyle=trail;ctx.lineWidth=p.r*.9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x,p.y-p.r-90);ctx.lineTo(p.x,p.y);ctx.stroke();
    }for(const f of game.static.features||[]){if(f.y<camera.top-200||f.y>camera.top+camera.visibleHeight+200)continue;
      const b=Course.bounds(f.y,world),x=b.left+(b.right-b.left)*(f.fraction||.5);
      if(f.kind==='orbit'){ctx.strokeStyle='#a6a6e96b';ctx.lineWidth=2;ctx.setLineDash([4,8]);ctx.beginPath();ctx.ellipse(x,f.y,f.range||90,(f.range||90)*.45,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
      if(f.kind==='whirlpool'){ctx.strokeStyle='#aa9de7a0';ctx.lineWidth=2;for(let arm=0;arm<3;arm++){ctx.beginPath();for(let k=0;k<=28;k++){const r=f.range*(1-k/30),a=k*.28*f.direction+game.time*.6+arm*Math.PI*2/3;k?ctx.lineTo(x+Math.cos(a)*r,f.y+Math.sin(a)*r):ctx.moveTo(x+Math.cos(a)*r,f.y+Math.sin(a)*r);}ctx.stroke();}}
      if(f.kind==='current'){ctx.strokeStyle='#7fc9d95c';ctx.lineWidth=9;for(const lane of f.lanes){ctx.beginPath();for(let k=0;k<=10;k++){const y=f.y-f.height/2+f.height*k/10,c=Extra.channelAt(f,lane,y,world);k?ctx.lineTo(c.x,y):ctx.moveTo(c.x,y);}ctx.stroke();}}
    }ctx.restore();
  }
  function drawFinish(ctx,world){
    ctx.save();ctx.fillStyle=theme.bank;ctx.fillRect(0,world.funnelY,world.width,world.bottom-world.funnelY);
    for(const g of world.exitGates){ctx.fillStyle='#413e68';ctx.beginPath();ctx.moveTo(g.startLeft,world.funnelY);ctx.lineTo(g.left,world.funnelKnee);ctx.lineTo(g.left,world.bottom);ctx.lineTo(g.right,world.bottom);ctx.lineTo(g.right,world.funnelKnee);ctx.lineTo(g.startRight,world.funnelY);ctx.closePath();ctx.fill();ctx.strokeStyle='#a9a3e1';ctx.lineWidth=3;ctx.stroke();
      for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#dfe8ff':'#9776c4';ctx.fillRect(g.left+i*(g.right-g.left)/8,world.finishY,(g.right-g.left)/8,6);}}
    ctx.restore();
  }
  function drawSegment(ctx,s,time,world){
    if(!s.stellar)return false;
    if(s.broken)return true;
    ctx.save();if(s.goalkeeper&&world?.exitGates&&s.lane!==undefined){const g=world.exitGates[s.lane];ctx.beginPath();ctx.rect(g.left,world.funnelKnee,g.right-g.left,world.bottom-world.funnelKnee);ctx.clip();}ctx.lineCap='round';ctx.lineWidth=(s.radius||4.5)*2;ctx.strokeStyle=s.goalkeeper?'#d88fcc':s.conveyor?'#84bdce':s.breakable?'#b7afd5':'#9398da';
    ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#e4e4ff9c';ctx.stroke();
    if(s.conveyor){ctx.setLineDash([8,10]);ctx.lineDashOffset=time*(s.direction||1)*35;ctx.strokeStyle=s.reverse?'#eeaaad':'#95eee0';ctx.lineWidth=3;ctx.stroke();}
    if(s.breakable){ctx.font='11px sans-serif';ctx.fillStyle='#eae5ff';ctx.fillText('◆'.repeat(Math.max(1,Math.min(6,s.hp))), (s.x1+s.x2)/2,(s.y1+s.y2)/2-10);}
    ctx.restore();return true;
  }
  const sequences={observatory:['ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ArrowUp','ArrowDown',...'SUISEI'].map(x=>x.length===1?'Key'+x:x),rift:['ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ArrowUp','ArrowDown','ArrowUp','ArrowDown','Digit5',...'JIGEN'].map(x=>x.length===1?'Key'+x:x)};
  const taps={observatory:['factory','factory','rapids','rapids','ruins','ruins','spinner','spinner','spinner'],rift:['fork','pinball','rapids','rapids','rapids','ruins','ruins','factory','factory','spinner','spinner','spinner','spinner','spinner']};
  class HiddenMapCommand{
    constructor({allowed,unlock,now=()=>performance.now(),mobile=()=>window.CometCommand.isMobileDevice()}){Object.assign(this,{allowed,onUnlock:unlock,now,mobile});this.observatory=false;this.rift=false;this.reset();}
    reset(){this.inputs=[];this.started=null;}
    unlock(id){if(id==='rift'&&!this.observatory||this[id])return false;this[id]=true;this.reset();this.onUnlock(id);return true;}
    feed(value,table){const now=this.now();if(this.started!==null&&now-this.started>30000)this.reset();if(this.started===null)this.started=now;this.inputs.push(value);
      const eligible=['observatory',...(this.observatory?['rift']:[])];const match=eligible.find(id=>table[id].every((v,i)=>this.inputs[i]===v)&&table[id].length===this.inputs.length);
      if(match){this.reset();return this.unlock(match);}
      if(!eligible.some(id=>this.inputs.length<table[id].length&&this.inputs.every((v,i)=>table[id][i]===v))){this.reset();if(eligible.some(id=>table[id][0]===value)){this.inputs=[value];this.started=now;}}
      return false;
    }
    key(e){if(this.mobile()||!this.allowed()){this.reset();return false;}if(e.target?.closest?.('input,textarea,select,[contenteditable="true"]')){this.reset();return false;}if(e.repeat||e.ctrlKey||e.altKey||e.metaKey)return false;
      let code=e.code||(/^[a-z]$/i.test(e.key||'')?'Key'+e.key.toUpperCase():e.key==='5'?'Digit5':e.key);if(code==='Numpad5')code='Digit5';
      if(['Shift','CapsLock','HangulMode','AltGraph'].includes(e.key))return false;
      if(['Process','Unidentified'].includes(e.key)&&(!e.code||['Process','Unidentified'].includes(e.code)))return false;
      return this.feed(code,sequences);
    }
    tap(id,e){if(!this.mobile()||!this.allowed()||e?.detail===0||e?.pointerType&& !['touch','pen'].includes(e.pointerType)){this.reset();return false;}return this.feed(id,taps);}
    pick(random=Math.random){const r=clamp(random(),0,1-Number.EPSILON);if(r<.02){this.unlock('observatory');return'observatory';}return baseMaps[Math.min(5,Math.floor((r-.02)/.98*6))];}
  }
  window.HiddenMapCommand=HiddenMapCommand;
  window.HiddenCourses={definitions,plans,has,configure,exits,laneBounds,inside,finishSegments,build:(map,w,s,n,sample)=>map==='rift'?buildRift(w,s,n,sample):buildObservatory(w,s,n),dynamic,goalkeepers,apply,drawTerrain,drawWorld,drawFinish,drawSegment};
})();
