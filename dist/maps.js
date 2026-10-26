(() => {
  'use strict';
  const definitions={
    factory:{title:'컨베이어 공장 코스',label:'컨베이어 공장',height:3800,sections:[[180,'입고 벨트'],[820,'피스톤 작업장'],[1460,'엇갈린 운반로'],[2100,'분배 게이트'],[2740,'출하 라인'],[3250,'골키퍼 게이트']],colors:['#edf2f5','#fff0d9','#e7f0f4','#fff2d9','#e7eff0','#fff1e8']},
    rapids:{title:'급류 계곡 코스',label:'급류 계곡',height:4100,sections:[[180,'계곡 입구'],[880,'굽이치는 급류'],[1580,'소용돌이 웅덩이'],[2280,'징검바위'],[2980,'합류하는 물살'],[3550,'골키퍼 게이트']],colors:['#e3f4f6','#dceff6','#dfe9f7','#e3f5ee','#d6f1f2','#e6f1ee']},
    ruins:{title:'붕괴하는 유적 코스',label:'붕괴하는 유적',height:4300,sections:[[180,'유적의 입구'],[920,'금이 간 석벽'],[1660,'흔들리는 다리'],[2400,'고대 석문'],[3140,'무너지는 회랑'],[3750,'골키퍼 게이트']],colors:['#f1ecd9','#eee4d4','#e9e9d6','#eee1ce','#e6ead7','#fff0df']}
  };
  const has=map=>Object.hasOwn(definitions,map);
  function configure(world,map) {
    world.sideProfile=Array.from({length:25},(_,i)=>{
      const t=i/24,y=world.funnelY*t,entry=Math.min(1,y/500);
      const wave=Math.sin(t*Math.PI*(map==='rapids'?5:3));
      const left=map==='factory'?35+entry*25*Math.sin(t*8)**2:map==='rapids'?110+entry*(65*wave+35):65+entry*(40+80*Math.sin(t*10)**2);
      const right=map==='factory'?965-entry*30*Math.cos(t*7)**2:map==='rapids'?870+entry*(65*wave-25):935-entry*(35+80*Math.cos(t*9)**2);
      return {y,left,right};
    });
  }
  function distance(x,y,s) {
    const dx=s.x2-s.x1,dy=s.y2-s.y1,t=Math.max(0,Math.min(1,((x-s.x1)*dx+(y-s.y1)*dy)/(dx*dx+dy*dy||1)));
    return Math.hypot(x-s.x1-t*dx,y-s.y1-t*dy);
  }
  function build(map,world,sections,count) {
    const Course=window.MarbleCourse,pins=[],segments=[],features=[];
    const addShelf=(y,left,length=380,extra={})=>{
      const b=Course.bounds(y,world),b2=Course.bounds(y+100,world);
      segments.push({x1:left?b.left:b.right,y1:y,x2:left?Math.min(b.left+length,b2.right-120):Math.max(b.right-length,b2.left+120),y2:y+100,radius:4.5,...extra});
    };
    for(let section=0;section<5;section++) {
      const start=sections[section][0],end=sections[section+1][0];
      if(map==='factory') {
        addShelf(start+230,section%2===0,440,{conveyor:true,direction:section%2===0?1:-1});
        addShelf(start+640,section%2!==0,380,{conveyor:true,direction:section%2===0?-1:1});
        features.push({kind:'piston',y:start+900,section,key:'factory-piston-'+section});
        features.push({kind:'gate',y:Math.min(end-120,start+1120),section,key:'factory-gate-'+section});
      } else if(map==='rapids') {
        addShelf(start+480,section%2===0,260,{riverLog:true});
        features.push({kind:'current',y:start+210,height:180,section,direction:section%2?1:-1});
        features.push({kind:'whirlpool',y:start+870,range:160,section,direction:section%2?-1:1});
      } else {
        addShelf(start+240,section%2===0,300,{ancient:true});
        const y=start+610,b=Course.bounds(y,world),cx=(b.left+b.right)/2;
        const hp=2+Math.min(3,Math.floor(Math.sqrt(count)/3));
        segments.push({x1:cx-150,y1:y,x2:cx+150,y2:y+85,radius:4.5,breakable:true,hp,maxHp:hp,hits:new Map(),id:'ruin-wall-'+section,section});
        features.push({kind:'bridge',y:start+960,section,key:'ruin-bridge-'+section});
        features.push({kind:'stoneGate',y:Math.min(end-100,start+1200),section,key:'ruin-gate-'+section});
      }
    }
    const clear=(x,y,r)=>{
      const b=Course.bounds(y,world);
      if(x-r<b.left+25||x+r>b.right-25)return false;
      if([world.funnelY+180,world.funnelY+540].some(row=>Math.abs(y-row)<r+100))return false;
      if(features.some(f=>['piston','gate','bridge','stoneGate'].includes(f.kind)&&Math.abs(f.y-y)<(f.kind==='bridge'?135:95)+r))return false;
      return segments.every(s=>distance(x,y,s)>r+s.radius+48)&&pins.every(p=>Math.hypot(p.x-x,p.y-y)>p.r+r+25);
    };
    sections.forEach(([start],section)=>{
      const end=Math.min(sections[section+1]?.[0]||world.funnelKnee,world.funnelKnee-100);
      for(let y=start+100,row=0;y<end-80;y+=110,row++) {
        const b=Course.bounds(y,world),columns=9;
        for(let col=0;col<columns;col++) {
          if(col===(row+section)%columns)continue;
          const x=b.left+42+(b.right-b.left-84)*(col+.5)/columns,r=8+(row+col)%4*3;
          if(clear(x,y,r))pins.push({x,y,r,section,bumper:(row+col)%6===0,riverRock:map==='rapids',ancient:map==='ruins'});
        }
      }
      // Larger special obstacles add landmarks without covering the moving machines.
      for(let k=0;k<3;k++)for(const dy of [0,55,-55,100]) {
        const y=start+170+(end-start-340)*k/2+dy,b=Course.bounds(y,world),x=b.left+(b.right-b.left)*(.25+k*.25),r=20+k*4;
        if(clear(x,y,r)){pins.push({x,y,r,section,kind:'power',kick:190,bumper:true,range:0});break;}
      }
    });
    pins.forEach((p,i)=>p.id=map+'-pin-'+i);
    world.sideProfile.slice(1).forEach((b,i)=>{
      const a=world.sideProfile[i];
      segments.push({x1:a.left-4.5,y1:a.y,x2:b.left-4.5,y2:b.y,radius:4.5,sideWall:true},
        {x1:a.right+4.5,y1:a.y,x2:b.right+4.5,y2:b.y,radius:4.5,sideWall:true});
    });
    return {pins,segments,features};
  }
  function dynamic(game,world,time) {
    const pins=[],segments=[],Course=window.MarbleCourse,Battle=window.MarbleBattle;
    for(const f of game.static.features||[]) {
      if(!f.key)continue;
      const t=Battle.timeFor(game,f.key,time),stopped=Battle.frozen(game,f.key),b=Course.bounds(f.y,world),mid=(b.left+b.right)/2;
      if(f.kind==='piston') {
        const amplitude=105,phase=t*.9+f.section;
        pins.push({x:mid+Math.sin(phase)*amplitude,y:f.y,r:28+f.section%3*6,vx:stopped?0:Math.cos(phase)*amplitude*.9,moving:true,piston:true,machineKey:f.key});
      } else if(f.kind==='gate'||f.kind==='stoneGate') {
        const phase=t*1.05+f.section,opening=95+(1+Math.sin(phase))*135,speed=stopped?0:Math.cos(phase)*135*1.05/2;
        segments.push({x1:b.left,y1:f.y-25,x2:mid-opening/2,y2:f.y+20,radius:6,vx:-speed,machineKey:f.key,sluice:true,ancient:f.kind==='stoneGate'},
          {x1:b.right,y1:f.y-25,x2:mid+opening/2,y2:f.y+20,radius:6,vx:speed,machineKey:f.key,sluice:true,ancient:f.kind==='stoneGate'});
      } else if(f.kind==='bridge') {
        const angle=Math.sin(t*.8+f.section)*.19,omega=stopped?0:Math.cos(t*.8+f.section)*.19*.8,half=140;
        segments.push({x1:mid-Math.cos(angle)*half,y1:f.y-Math.sin(angle)*half,x2:mid+Math.cos(angle)*half,y2:f.y+Math.sin(angle)*half,
          cx:mid,cy:f.y,omega,rotating:true,radius:5,bridge:true,machineKey:f.key});
      }
    }
    return {pins,segments};
  }
  function apply(ball,game,world,dt) {
    if(game.map!=='rapids'||ball.y>world.funnelY)return;
    const Course=window.MarbleCourse;
    for(const f of game.static.features) {
      if(f.kind==='current'&&Math.abs(ball.y-f.y)<f.height/2) {
        const strength=150+45*Math.sin(game.time*.9+f.section);
        ball.vx+=f.direction*strength*dt;ball.vy+=42*dt;
      } else if(f.kind==='whirlpool'&&Math.abs(ball.y-f.y)<f.range) {
        const b=Course.bounds(f.y,world),cx=(b.left+b.right)/2,dx=ball.x-cx,dy=ball.y-f.y,d=Math.hypot(dx,dy);
        if(d>1&&d<f.range){const factor=1-d/f.range;ball.vx+=(-dy/d*f.direction*110-dx/d*28)*factor*dt;ball.vy+=(dx/d*f.direction*65+45)*factor*dt;}
      }
    }
  }
  function onContact(segment,ball,game,toward) {
    if(!segment.breakable||segment.broken)return false;
    if(-toward<35||game.time-(segment.hits.get(ball.id)??-1)<.3)return false;
    segment.hits.set(ball.id,game.time);segment.hp--;segment.flashUntil=game.time+.2;
    if(segment.hp<=0){segment.broken=true;segment.brokenAt=game.time;return true;}return false;
  }
  function belt(segment,ball,game) {
    if(!segment.conveyor)return;
    // A short reverse phase adds timing without permanently holding a marble uphill.
    const direction=segment.direction*(Math.sin(game.time*1.1)>-.65?1:-.3);
    ball.vx+=direction*3;ball.vy+=.8;
  }
  function drawWorld(ctx,game,world,camera) {
    if(!has(game.map))return;
    ctx.save();
    for(const f of game.static.features) {
      if(Math.abs(f.y-camera.y)>camera.visibleHeight/2+250)continue;
      const b=window.MarbleCourse.bounds(f.y,world),mid=(b.left+b.right)/2;
      if(f.kind==='current') {
        ctx.fillStyle='#65c8d526';ctx.fillRect(b.left,f.y-f.height/2,b.right-b.left,f.height);
        ctx.strokeStyle='#54a9c18a';ctx.lineWidth=2;
        for(let i=0;i<7;i++){const x=b.left+45+i*(b.right-b.left-90)/7+Math.sin(game.time+f.section)*16,y=f.y+Math.sin(i)*38;
          ctx.beginPath();ctx.moveTo(x-f.direction*17,y);ctx.lineTo(x+f.direction*17,y);ctx.lineTo(x+f.direction*9,y-7);ctx.moveTo(x+f.direction*17,y);ctx.lineTo(x+f.direction*9,y+7);ctx.stroke();}
      } else if(f.kind==='whirlpool') {
        ctx.strokeStyle='#4f9eb28a';ctx.lineWidth=3;
        for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(mid,f.y,40+i*43,game.time*f.direction+i,game.time*f.direction+i+Math.PI*1.45);ctx.stroke();}
        ctx.fillStyle='#367c99';ctx.font='bold 14px sans-serif';ctx.fillText('↻',mid-5,f.y+5);
      } else if(f.kind==='piston') {
        ctx.strokeStyle='#a5aeb9';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(b.left+30,f.y);ctx.lineTo(b.right-30,f.y);ctx.stroke();
      }
    }
    ctx.restore();
  }
  function drawSegment(ctx,s,time) {
    if(s.broken) {
      if(time-s.brokenAt<.8){ctx.save();ctx.fillStyle='#b29a73';for(let i=0;i<6;i++){const t=time-s.brokenAt;ctx.fillRect(s.x1+(s.x2-s.x1)*i/6+Math.sin(i)*t*30,s.y1+(s.y2-s.y1)*i/6+t*t*150,7,5);}ctx.restore();}return true;
    }
    if(!s.conveyor&&!s.breakable&&!s.riverLog&&!s.ancient&&!s.bridge&&!s.sluice)return false;
    ctx.save();ctx.lineCap='round';ctx.strokeStyle=s.conveyor?'#566b7b':s.riverLog?'#8b9278':s.breakable?'#b6a27f':s.bridge?'#947956':s.ancient?'#a49473':'#74959e';
    ctx.lineWidth=s.radius*2;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
    if(s.conveyor){ctx.lineWidth=2;ctx.strokeStyle='#ffcf75';const dx=s.x2-s.x1,dy=s.y2-s.y1;
      for(let i=1;i<9;i++){const fraction=((i/9+time*.12)%1),x=s.x1+dx*fraction,y=s.y1+dy*fraction;ctx.beginPath();ctx.moveTo(x-s.direction*6,y-6);ctx.lineTo(x,y);ctx.lineTo(x-s.direction*6,y+6);ctx.stroke();}}
    if(s.breakable){ctx.lineWidth=1.5;ctx.strokeStyle='#67583d';for(let i=0;i<s.maxHp-s.hp+1;i++){const x=s.x1+(s.x2-s.x1)*(i+1)/(s.maxHp+1),y=s.y1+(s.y2-s.y1)*(i+1)/(s.maxHp+1);ctx.beginPath();ctx.moveTo(x-6,y-7);ctx.lineTo(x+3,y);ctx.lineTo(x-3,y+7);ctx.stroke();}}
    ctx.restore();return true;
  }
  window.ExtraCourses={definitions,has,configure,build,dynamic,apply,onContact,belt,drawWorld,drawSegment};
})();
