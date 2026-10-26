(() => {
  'use strict';
  const definitions={
    factory:{title:'컨베이어 공장 코스',label:'컨베이어 공장',height:3800,sections:[[180,'입고 벨트'],[820,'피스톤 작업장'],[1460,'역주행 운반로'],[2100,'분배 게이트'],[2740,'출하 라인'],[3250,'골키퍼 게이트']],colors:['#edf2f5','#fff0d9','#e7f0f4','#fff2d9','#e7eff0','#fff1e8']},
    rapids:{title:'급류 계곡 코스',label:'급류 계곡',height:4100,sections:[[180,'계곡 입구'],[880,'굽이치는 급류'],[1580,'소용돌이 웅덩이'],[2280,'징검바위'],[2980,'합류하는 물살'],[3550,'골키퍼 게이트']],colors:['#e3f4f6','#dceff6','#dfe9f7','#e3f5ee','#d6f1f2','#e6f1ee']},
    ruins:{title:'붕괴하는 유적 코스',label:'붕괴하는 유적',height:4300,sections:[[180,'유적의 입구'],[920,'금이 간 석벽'],[1660,'흔들리는 다리'],[2400,'고대 석문'],[3140,'무너지는 회랑'],[3750,'골키퍼 게이트']],colors:['#f1ecd9','#eee4d4','#e9e9d6','#eee1ce','#e6ead7','#fff0df']}
  };
  const has=map=>Object.hasOwn(definitions,map);
  const unit=seed=>{const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n);};
  const layouts={factory:['lanes','cluster','diagonal','islands','slalom','guard'],rapids:['banks','slalom','rings','islands','split','guard'],ruins:['arches','cluster','rings','slalom','diagonal','guard']};
  const waterEnd=world=>world.funnelY-80;
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
      const drop=extra.drop||75,b=Course.bounds(y,world),b2=Course.bounds(y+drop,world),gap=extra.reverse?58:0;
      segments.push({x1:left?b.left+gap:b.right-gap,y1:y,x2:left?Math.min(b.left+length,b2.right-100):Math.max(b.right-length,b2.left+100),y2:y+drop,radius:4.5,...extra});
    };
    sections.forEach(([start],section)=>{
      const end=Math.min(sections[section+1]?.[0]||world.finishY-280,world.finishY-280),span=end-start;
      const feature=(kind,fraction,extra={})=>features.push({kind,y:start+span*fraction,section,key:map+'-'+kind+'-'+section+'-'+features.length,...extra});
      if(map==='factory') {
        const beltCount=[5,6,8,6,8,5][section];
        for(let k=0;k<beltCount;k++) {
          const left=(k+section)%2===0,reverse=section===2?k%2===0:(section===1||section===4||section===5)&&k%3===1;
          const y=start+95+(span-250)*k/Math.max(1,beltCount-1)+unit(k+section*11)*22;
          const b=Course.bounds(y,world),width=b.right-b.left;
          addShelf(y,left,Math.min(width*.53,300+unit(k+section*7)*170),{conveyor:true,reverse,direction:(left?1:-1)*(reverse?-1:1),downhill:left?1:-1,section,drop:section===5?48:65+unit(k)*28});
        }
        if(section===0||section===1||section===4)feature('piston',section===1?.77:.63,{amplitude:section===1?170:100});
        if(section===1)feature('piston',.35,{amplitude:115,fraction:.3});
        if(section===3){feature('gate',.28);feature('gate',.82);}
        if(section===4||section===5)feature('gate',.68);
      } else if(map==='rapids') {
        const bands=[3,4,2,3,5,2][section],strengths=[460,620,680,400,640,440];
        for(let k=0;k<bands;k++)feature('current',.15+.66*k/Math.max(1,bands-1),{height:section===2?span*.75:150+unit(k+section)*130,direction:(section+k)%2?1:-1,strength:strengths[section],fraction:section===4?(k%2?.72:.28):.5});
        const vortices=[1,2,4,2,3,1][section];
        for(let k=0;k<vortices;k++)feature('whirlpool',.28+.43*k/Math.max(1,vortices-1),{range:section===5?125:180+unit(k+section)*55,direction:(section+k)%2?-1:1,fraction:vortices>1?(k%2?.72:.28):.5,power:section===2?1.25:1});
        if(section===0||section===1||section===3||section===5)addShelf(start+span*.57,section%2===0,section===5?150:230,{riverLog:true,section});
      } else {
        const wallCount=[3,5,6,5,7,3][section];
        for(let k=0;k<wallCount;k++) {
          const y=start+95+(span-240)*k/Math.max(1,wallCount-1)+unit(k+section*13)*25,b=Course.bounds(y,world);
          const fraction=[.32,.67,.48,.74,.25][(k+section)%5],cx=b.left+(b.right-b.left)*fraction,half=Math.min((b.right-b.left)*.23,75+unit(k*3+section)*110);
          const hp=[1,3,5,2,6][(k+section*2)%5]+Math.min(2,Math.floor(Math.sqrt(count)/4));
          segments.push({x1:Math.max(b.left+30,cx-half),y1:y,x2:Math.min(b.right-30,cx+half),y2:y+45+unit(k+8)*35,radius:8,breakable:true,hp,maxHp:hp,hits:new Map(),id:'ruin-wall-'+section+'-'+k,section});
        }
        if(section===1||section===4)feature('boulder',.63,{height:210,amplitude:75});
        if(section===2||section===4)feature('bridge',.76);
        if(section===3||section===5) {
          feature('stoneGate',.70,{openUntil:0});const gate=features.at(-1),b=Course.bounds(gate.y-155,world);
          pins.push({x:b.left+(b.right-b.left)*(section===3?.3:.68),y:gate.y-155,r:18,switchFor:gate.key,section,hits:new Map(),id:'switch-'+section});
        }
        if(section===5)feature('boulder',.27,{height:110,amplitude:30});
      }
    });
    // Water stops before the narrowing finish approach, in both physics and rendering.
    if(map==='rapids')for(let i=features.length-1;i>=0;i--){const f=features[i];
      if(f.kind==='current'){if(f.y>=waterEnd(world)){features.splice(i,1);continue;}f.height=Math.min(f.height,2*(waterEnd(world)-f.y));}
      if(f.kind==='whirlpool')f.y=Math.min(f.y,waterEnd(world)-f.range);
    }
    // Machines occupy the gaps between belts; their sweeps never cut through a belt.
    if(map==='factory')for(const f of features){
      const start=sections[f.section][0],end=Math.min(sections[f.section+1]?.[0]||world.finishY-280,world.finishY-280),candidates=[];
      const clearance=f.kind==='piston'?48:44;
      for(let y=start+85;y<end-70;y+=2)if(segments.every(s=>Math.abs(y-(s.y1+s.y2)/2)>Math.abs(s.y2-s.y1)/2+clearance)&&features.every(other=>other===f||Math.abs(other.y-y)>110))candidates.push(y);
      if(candidates.length)f.y=candidates.reduce((best,y)=>Math.abs(y-f.y)<Math.abs(best-f.y)?y:best);
    }
    const clear=(x,y,r)=>{
      const b=Course.bounds(y,world);
      const wallGap=y>=world.funnelY?40:25;
      if((x-b.left)/Math.hypot(1,b.leftSlope)-r<wallGap||(b.right-x)/Math.hypot(1,b.rightSlope)-r<wallGap)return false;
      if(features.some(f=>{
        if(f.kind==='boulder'){const fb=Course.bounds(f.y,world),cx=(fb.left+fb.right)/2+Math.sin(f.section*2.3)*(fb.right-fb.left)*.23;return Math.abs(f.y-y)<f.height/2+65+r&&Math.abs(x-cx)<80+r;}
        return ['piston','gate','bridge','stoneGate'].includes(f.kind)&&Math.abs(f.y-y)<(f.kind==='bridge'?95:70)+r;
      }))return false;
      return segments.every(s=>distance(x,y,s)>r+s.radius+48)&&pins.every(p=>Math.hypot(p.x-x,p.y-y)>p.r+r+25);
    };
    sections.forEach(([start],section)=>{
      const end=Math.min(sections[section+1]?.[0]||world.finishY-260,world.finishY-260),span=end-start,layout=layouts[map][section];
      // Reserve magnetic landmarks first, clear of walls, boards and moving sweeps.
      const magneticEnd=Math.min(end-90,world.funnelY-180),magnetCount=section===5?1:2;
      for(let k=0;k<magnetCount;k++)for(let attempt=0;attempt<240;attempt++){
        const y=start+120+unit(attempt*17+k*331+section*941)*(magneticEnd-start-120),b=Course.bounds(y,world),x=b.left+155+unit(attempt*13+section*21+k)*(b.right-b.left-310),r=16+k*2;
        if(magneticEnd<=start+120||!clear(x,y,r))continue;
        if(segments.some(s=>distance(x,y,s)<r+s.radius+130)||pins.some(p=>p.kind==='magnet'&&Math.hypot(x-p.x,y-p.y)<250))continue;
        if(features.some(f=>{
          if(f.kind==='boulder'){const fb=Course.bounds(f.y,world),cx=(fb.left+fb.right)/2+Math.sin(f.section*2.3)*(fb.right-fb.left)*.23;return Math.abs(f.y-y)<f.height/2+195&&Math.abs(x-cx)<195;}
          return ['piston','gate','bridge','stoneGate'].includes(f.kind)&&Math.abs(f.y-y)<190;
        }))continue;
        pins.push({x,y,r,section,kind:'magnet',bumper:true,range:120,strength:420});break;
      }
      for(let i=0;i<Math.ceil(span*.65);i++) {
        const u=unit(i+section*293),v=unit(i*3+section*177+8);let yf=u,xf=v;
        if(layout==='lanes')xf=[.15,.45,.82][i%3]+(v-.5)*.1;
        if(layout==='cluster'||layout==='islands'){yf=[.18,.47,.78][i%3]+(u-.5)*.18;xf=[.23,.75,.43][i%3]+(v-.5)*.35;}
        if(layout==='slalom')xf=.5+Math.sin(u*Math.PI*4)*.29+(v-.5)*.22;
        if(layout==='banks')xf=i%2?.84+(v-.5)*.15:.16+(v-.5)*.15;
        if(layout==='split')xf=i%2?.7+(v-.5)*.2:.3+(v-.5)*.2;
        if(layout==='diagonal')xf=(u*.75+v*.3)%1;
        if(layout==='rings'||layout==='arches'){const angle=v*Math.PI*2;xf=.5+Math.cos(angle)*(.18+(i%2)*.16);yf=[.23,.60,.82][i%3]+Math.sin(angle)*.1;}
        if(layout==='guard'){yf=u;xf=.5+Math.sin(i*2.4)*(.18+v*.23);}
        const y=start+70+Math.max(0,Math.min(1,yf))*(span-140),b=Course.bounds(y,world),x=b.left+35+(b.right-b.left-70)*Math.max(0,Math.min(1,xf)),r=7+unit(i*7+section)*12;
        if(clear(x,y,r))pins.push({x,y,r,section,bumper:i%7===0,riverRock:map==='rapids',ancient:map==='ruins'});
      }
      // Fill only the large holes left by each section's main pattern, retaining its landmarks.
      for(let i=0;i<Math.ceil(span*.45);i++){
        const y=start+70+unit(i*19+section*71)*(span-140),b=Course.bounds(y,world),x=b.left+40+unit(i*23+section*83)*(b.right-b.left-80),r=8+unit(i*31+section)*13;
        if(pins.some(p=>Math.hypot(p.x-x,p.y-y)<90)||!clear(x,y,r))continue;
        pins.push({x,y,r,section,bumper:i%5===0,riverRock:map==='rapids',ancient:map==='ruins'});
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
        const amplitude=f.amplitude||105,phase=t*.9+f.section,cx=b.left+(b.right-b.left)*(f.fraction||.5);
        pins.push({x:cx+Math.sin(phase)*Math.min(amplitude,(b.right-b.left)*.22),y:f.y,r:28+f.section%3*6,vx:stopped?0:Math.cos(phase)*Math.min(amplitude,(b.right-b.left)*.22)*.9,moving:true,piston:true,machineKey:f.key});
      } else if(f.kind==='gate'||f.kind==='stoneGate') {
        const phase=t*1.05+f.section,maxSwing=Math.min(135,(b.right-b.left)*.23),held=f.openUntil>game.time;
        const opening=held?(b.right-b.left)*.85:Math.min((b.right-b.left)*.8,75+(1+Math.sin(phase))*maxSwing),speed=stopped||held?0:Math.cos(phase)*maxSwing*1.05/2;
        const top=Course.bounds(f.y-25,world);
        segments.push({x1:top.left,y1:f.y-25,x2:mid-opening/2,y2:f.y+20,radius:6,vx:-speed,machineKey:f.key,sluice:true,ancient:f.kind==='stoneGate'},
          {x1:top.right,y1:f.y-25,x2:mid+opening/2,y2:f.y+20,radius:6,vx:speed,machineKey:f.key,sluice:true,ancient:f.kind==='stoneGate'});
      } else if(f.kind==='bridge') {
        const angle=Math.sin(t*.8+f.section)*.25,omega=stopped?0:Math.cos(t*.8+f.section)*.25*.8,half=Math.min(140,(b.right-b.left)*.25);
        segments.push({x1:mid-Math.cos(angle)*half,y1:f.y-Math.sin(angle)*half,x2:mid+Math.cos(angle)*half,y2:f.y+Math.sin(angle)*half,
          cx:mid,cy:f.y,omega,rotating:true,radius:5,bridge:true,machineKey:f.key});
      } else if(f.kind==='boulder') {
        const cycle=((t+f.section*.7)%4.8)/4.8;
        if(cycle<.84){const phase=cycle/.84,y=f.y-f.height/2+f.height*phase*phase,x=mid+Math.sin(f.section*2.3)*(b.right-b.left)*.23;
          const radius=f.section===5?22:30+f.section*2;
          if(phase>.08||!game.balls.some(ball=>!ball.finished&&Math.hypot(ball.x-x,ball.y-y)<ball.r+radius+24))pins.push({x,y,r:radius,vy:stopped?0:2*f.height*phase/(4.8*.84),moving:true,boulder:true,ancient:true,machineKey:f.key});}
      }
    }
    return {pins,segments};
  }
  function apply(ball,game,world,dt) {
    if(game.map!=='rapids'||ball.y>=waterEnd(world))return;
    const Course=window.MarbleCourse;
    let ax=0,ay=0;
    for(const f of game.static.features) {
      if(f.kind==='current'&&Math.abs(ball.y-f.y)<f.height/2) {
        const b=Course.bounds(f.y,world),fraction=(ball.x-b.left)/(b.right-b.left);
        if(f.section===4&&Math.abs(fraction-f.fraction)>.27)continue;
        const strength=f.strength*(.85+.15*Math.sin(game.time*.9+f.section));
        ax+=f.direction*strength;ay+=90;
      } else if(f.kind==='whirlpool'&&Math.abs(ball.y-f.y)<f.range) {
        const b=Course.bounds(f.y,world),cx=b.left+(b.right-b.left)*(f.fraction||.5),dx=ball.x-cx,dy=ball.y-f.y,d=Math.hypot(dx,dy);
        if(d>1&&d<f.range){const factor=(1-d/f.range)*(f.power||1);ax+=(-dy/d*f.direction*470-dx/d*110)*factor;ay+=(dx/d*f.direction*170+120)*factor;}
      }
    }
    // Flow loses force at solid board surfaces, allowing gravity to release a marble
    // instead of pressing it against a wall-connected log indefinitely.
    let surfaceFade=1;
    for(const s of game.collisionBuckets?.get(Math.floor(ball.y/160))?.segments||game.static.segments){
      if(s.sideWall||s.funnel||s.broken)continue;
      surfaceFade=Math.min(surfaceFade,Math.max(0,Math.min(1,(distance(ball.x,ball.y,s)-(ball.r||0)-(s.radius||4.5))/45)));
    }
    ball.vx+=Math.max(-760,Math.min(760,ax))*surfaceFade*dt;ball.vy+=Math.max(-80,Math.min(260,ay))*surfaceFade*dt;
  }
  function onContact(segment,ball,game,toward) {
    if(!segment.breakable||segment.broken)return false;
    if(-toward<35||game.time-(segment.hits.get(ball.id)??-1)<.3)return false;
    segment.hits.set(ball.id,game.time);segment.hp--;segment.flashUntil=game.time+.2;
    if(segment.hp<=0){segment.broken=true;segment.brokenAt=game.time;return true;}return false;
  }
  function belt(segment,ball,game) {
    if(!segment.conveyor)return;
    ball.vx+=segment.direction*(segment.reverse?3.8:3.2);ball.vy+=.8;
    // Reverse belts discharge into an open side chute instead of pinning a ball to a wall.
    if(segment.reverse&&Math.hypot(ball.x-segment.x1,ball.y-segment.y1)<ball.r+24){ball.vx=segment.direction*95;ball.vy=Math.max(60,ball.vy);}
  }
  function onPinContact(pin,ball,game) {
    if(!pin.switchFor||game.time-(pin.hits.get(ball.id)??-2)<1)return;
    pin.hits.set(ball.id,game.time);pin.flashUntil=game.time+.4;
    const gate=game.static.features.find(f=>f.key===pin.switchFor);if(gate)gate.openUntil=game.time+3;
  }
  function drawWorld(ctx,game,world,camera) {
    if(!has(game.map))return;
    ctx.save();
    for(const f of game.static.features) {
      if(f.y+400<camera.top||f.y-400>camera.top+camera.visibleHeight)continue;
      const b=window.MarbleCourse.bounds(f.y,world),mid=(b.left+b.right)/2;
      if(f.kind==='current') {
        const left=f.section===4?b.left+(b.right-b.left)*Math.max(0,f.fraction-.27):b.left,right=f.section===4?b.left+(b.right-b.left)*Math.min(1,f.fraction+.27):b.right;
        ctx.fillStyle='#4ab6d03a';ctx.fillRect(left,f.y-f.height/2,right-left,f.height);
        ctx.strokeStyle='#267fafa8';ctx.lineWidth=3;
        for(let row=0;row<3;row++)for(let i=0;i<6;i++){const phase=((i/6+game.time*.12*f.direction)%1+1)%1,x=left+25+phase*(right-left-50),y=f.y+(row-1)*f.height*.27;
          ctx.beginPath();ctx.moveTo(x-f.direction*22,y);ctx.lineTo(x+f.direction*22,y);ctx.lineTo(x+f.direction*11,y-9);ctx.moveTo(x+f.direction*22,y);ctx.lineTo(x+f.direction*11,y+9);ctx.stroke();}
      } else if(f.kind==='whirlpool') {
        const cx=b.left+(b.right-b.left)*(f.fraction||.5);
        const gradient=ctx.createRadialGradient(cx,f.y,5,cx,f.y,f.range);gradient.addColorStop(0,'#26779838');gradient.addColorStop(1,'#26779800');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(cx,f.y,f.range,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#367faba0';ctx.lineWidth=4;
        for(let i=0;i<4;i++){const angle=game.time*f.direction*1.4+i*1.6;ctx.beginPath();ctx.arc(cx,f.y,f.range*(.2+i*.23),angle,angle+Math.PI*1.5);ctx.stroke();}
      } else if(f.kind==='piston') {
        ctx.strokeStyle='#a5aeb9';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(b.left+30,f.y);ctx.lineTo(b.right-30,f.y);ctx.stroke();
      } else if(f.kind==='boulder') {
        const x=mid+Math.sin(f.section*2.3)*(b.right-b.left)*.23;
        ctx.setLineDash([8,12]);ctx.strokeStyle='#7c88864d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,f.y-f.height/2-35);ctx.lineTo(x,f.y+f.height/2+35);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle='#778581';ctx.font='bold 17px sans-serif';ctx.textAlign='center';ctx.fillText('▼',x,f.y-f.height/2-45);
      }
    }
    ctx.restore();
  }
  function drawSegment(ctx,s,time) {
    if(s.broken) {
      if(time-s.brokenAt<.8){ctx.save();ctx.fillStyle='#89938e';for(let i=0;i<6;i++){const t=time-s.brokenAt;ctx.fillRect(s.x1+(s.x2-s.x1)*i/6+Math.sin(i)*t*30,s.y1+(s.y2-s.y1)*i/6+t*t*150,9,7);}ctx.restore();}return true;
    }
    if(!s.conveyor&&!s.breakable&&!s.riverLog&&!s.ancient&&!s.bridge&&!s.sluice)return false;
    ctx.save();ctx.lineCap='round';ctx.strokeStyle=s.conveyor?(s.reverse?'#945e66':'#446d78'):s.riverLog?'#8b9278':s.breakable?'#798681':s.bridge?'#8b9690':s.ancient?'#7c8983':'#74959e';
    ctx.lineWidth=s.radius*2;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
    if(s.conveyor){ctx.lineWidth=2;ctx.strokeStyle=s.reverse?'#ffd0d5':'#aee4df';const dx=s.x2-s.x1,dy=s.y2-s.y1;
      for(let i=0;i<9;i++){const fraction=((i/9+time*.12*(s.reverse?-1:1))%1+1)%1,x=s.x1+dx*fraction,y=s.y1+dy*fraction;ctx.beginPath();ctx.moveTo(x-s.direction*6,y-6);ctx.lineTo(x,y);ctx.lineTo(x-s.direction*6,y+6);ctx.stroke();}}
    if(s.breakable){const dx=s.x2-s.x1,dy=s.y2-s.y1,length=Math.hypot(dx,dy);ctx.translate(s.x1,s.y1);ctx.rotate(Math.atan2(dy,dx));
      ctx.lineCap='butt';ctx.strokeStyle=time<s.flashUntil?'#eef9ef':'#b5c0b9';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(2,-5);ctx.lineTo(length-2,-5);ctx.stroke();
      ctx.lineWidth=1.5;ctx.strokeStyle='#465750';for(let x=22;x<length-6;x+=38){ctx.beginPath();ctx.moveTo(x,-7);ctx.lineTo(x,7);ctx.stroke();}
      const cracks=Math.min(12,s.maxHp-s.hp+1);ctx.lineWidth=2;for(let i=0;i<cracks;i++){const x=length*(i+1)/(cracks+1);ctx.beginPath();ctx.moveTo(x-5,-7);ctx.lineTo(x+3,0);ctx.lineTo(x-3,7);ctx.stroke();}
      // Shallow rune marks distinguish tougher masonry without numeric hit labels.
      ctx.strokeStyle='#d5ddd6';for(let i=0;i<Math.min(4,Math.ceil(s.maxHp/2));i++){const x=length/2+(i-(Math.ceil(s.maxHp/2)-1)/2)*13;ctx.strokeRect(x-2,-3,4,6);}
    }
    ctx.restore();return true;
  }
  function drawPin(ctx,p,time) {
    if(!p.switchFor&&!p.boulder)return;
    ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle=p.switchFor?'#e1ffe5':'#52625b';ctx.lineWidth=2;
    if(p.switchFor){ctx.fillStyle=time<p.flashUntil?'#f1ffba':'#6aae87';ctx.beginPath();ctx.arc(0,0,p.r-2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(7,0);ctx.lineTo(0,8);ctx.lineTo(-7,0);ctx.closePath();ctx.stroke();}
    else{ctx.rotate(time*.7);ctx.beginPath();ctx.moveTo(-p.r*.6,-p.r*.2);ctx.lineTo(0,3);ctx.lineTo(p.r*.3,-p.r*.6);ctx.moveTo(0,3);ctx.lineTo(p.r*.6,p.r*.35);ctx.stroke();}
    ctx.restore();
  }
  window.ExtraCourses={definitions,has,waterEnd,configure,build,dynamic,apply,onContact,onPinContact,belt,drawWorld,drawSegment,drawPin};
})();
