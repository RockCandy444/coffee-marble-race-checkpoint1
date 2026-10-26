(() => {
  'use strict';
  const definitions={
    factory:{title:'컨베이어 공장 코스',label:'컨베이어 공장',height:3800,sections:[[180,'입고 벨트'],[820,'피스톤 작업장'],[1460,'역주행 운반로'],[2100,'분배 게이트'],[2740,'출하 라인'],[3250,'골키퍼 게이트']],colors:['#dfe7ed','#d1dde6','#e8e0ca','#d6e3e5','#cedce3','#e3ddd0'],theme:{backdrop:'#293b49',bank:'#435a69',wall:'#526c80',wallLight:'#b5c9d5',ink:'#3b5363',base:'#e1e9ee',end:'#cddae2',finish:'#c9a44a26'}},
    rapids:{title:'급류 계곡 코스',label:'급류 계곡',height:4100,sections:[[180,'계곡 입구'],[880,'굽이치는 급류'],[1580,'소용돌이 웅덩이'],[2280,'징검바위'],[2980,'합류하는 물살'],[3550,'골키퍼 게이트']],colors:['#c5e9f0','#b4dfeb','#c0d9ed','#bce4db','#addce7','#cce5e3'],theme:{backdrop:'#34595d',bank:'#547a6b',wall:'#4b7475',wallLight:'#b1cec0',ink:'#305c68',base:'#ceeef0',end:'#a9d8df',finish:'#b7dcd426'}},
    ruins:{title:'붕괴하는 유적 코스',label:'붕괴하는 유적',height:4300,sections:[[180,'유적의 입구'],[920,'금이 간 석벽'],[1660,'흔들리는 다리'],[2400,'고대 석문'],[3140,'무너지는 회랑'],[3750,'골키퍼 게이트']],colors:['#ddd9ca','#d3cabc','#dce0ce','#c9ccbc','#cfd6bf','#e0d7c4'],theme:{backdrop:'#565e50',bank:'#737665',wall:'#727d6a',wallLight:'#c6c7ac',ink:'#535e48',base:'#e2dfd0',end:'#c6ceba',finish:'#a7af7d26'}}
  };
  const has=map=>Object.hasOwn(definitions,map);
  const unit=seed=>{const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n);};
  const layouts={factory:['lanes','cluster','diagonal','islands','slalom','guard'],rapids:['banks','slalom','rings','islands','split','guard'],ruins:['arches','cluster','rings','slalom','diagonal','guard']};
  const waterEnd=world=>world.funnelY-80;
  const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
  function flowPulse(f,time){if(!f.pulsed)return 1;const phase=((time+f.offset)%f.period+f.period)%f.period;return Math.min(clamp(phase/.4,0,1),clamp((f.onTime-phase)/.4,0,1));}
  function channelAt(f,lane,y,world){
    const b=window.MarbleCourse.bounds(y,world),width=b.right-b.left,u=clamp((y-f.y)/f.height+.5,0,1),wave=u*Math.PI+f.phase;
    const fraction=lane.fraction+Math.sin(wave)*.035+(u-.5)*lane.lean*.11;
    return {x:b.left+width*fraction,halfWidth:width*lane.width,slope:width*(Math.cos(wave)*.035*Math.PI+lane.lean*.11)/f.height};
  }
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
        const positions=[[.14,.34,.79],[.12,.32,.69,.87],[.14,.34,.80],[.14,.34,.80],[.12,.31,.69,.88],[.14]][section];
        for(const [k,fraction] of positions.entries()){
          const direction=(section+k)%2?1:-1,split=(section+k)%2===0;
          feature('current',fraction,{height:190+unit(k+section)*80,direction,strength:[440,540,580,420,560,400][section],phase:section+k*.8,pulsed:k%2===1||section===4,period:4.8+(section+k)%3*.8,onTime:2.6+(section%2)*.5,offset:unit(k+section*13)*5,
            lanes:split?[{fraction:.25,width:.145,lean:direction},{fraction:.75,width:.145,lean:-direction}]:[{fraction:.23,width:.12,lean:1},{fraction:.5,width:.13,lean:direction*.5},{fraction:.77,width:.12,lean:-1}]});
        }
        const vortexPositions=[[.23],[.23,.74],[.22,.68,.86],[.24],[.23,.73],[]][section];
        for(const [k,fraction] of vortexPositions.entries())feature('whirlpool',fraction,{range:145+unit(k+section)*35,direction:(section+k)%2?-1:1,fraction:k%2?.66:.36,power:section===2?1.1:1});
        if(section===0||section===1||section===3||section===5)addShelf(start+span*.57,section%2===0,section===5?150:230,{riverLog:true,section});
        if(section<5){feature('calm',.51,{height:220});
          for(let k=0;k<(section===3||section===4?2:1);k++){
            const yf=k?.81:.51,xf=k?(section===3?.68:.28):[.32,.67,.42,.3,.62][section],r=43+unit(section+k)*13;
            for(const dy of [0,-40,40,-100,100]){const y=start+span*yf+dy,b=Course.bounds(y,world),x=b.left+(b.right-b.left)*xf;
              if(segments.some(s=>distance(x,y,s)<r+s.radius+60)||pins.some(p=>Math.hypot(x-p.x,y-p.y)<r+p.r+50))continue;
              pins.push({x,y,r,section,riverRock:true,island:true});break;
            }
          }
        }
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
      return segments.every(s=>distance(x,y,s)>r+s.radius+48)&&pins.every(p=>Math.hypot(p.x-x,p.y-y)>p.r+r+(p.island?50:25));
    };
    sections.forEach(([start],section)=>{
      const end=Math.min(sections[section+1]?.[0]||world.finishY-260,world.finishY-260),span=end-start,layout=layouts[map][section];
      // Reserve magnetic landmarks first, clear of walls, boards and moving sweeps.
      const magneticEnd=Math.min(end-90,world.funnelY-180),magnetCount=section===5?1:2;
      for(let k=0;k<magnetCount;k++)for(let attempt=0;attempt<240;attempt++){
        const y=start+120+unit(attempt*17+k*331+section*941)*(magneticEnd-start-120),b=Course.bounds(y,world),x=b.left+155+unit(attempt*13+section*21+k)*(b.right-b.left-310),r=16+k*2;
        if(magneticEnd<=start+120||!clear(x,y,r))continue;
        if(segments.some(s=>distance(x,y,s)<r+s.radius+130)||pins.some(p=>(p.kind==='magnet'&&Math.hypot(x-p.x,y-p.y)<250)||(p.island&&Math.hypot(x-p.x,y-p.y)<p.r+r+130)))continue;
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
    if(game.static.features.some(f=>f.kind==='calm'&&Math.abs(ball.y-f.y)<f.height/2))return;
    const banks=Course.bounds(ball.y,world),width=banks.right-banks.left,gap=Math.min(ball.x-banks.left,banks.right-ball.x)-(ball.r||0),t=clamp(gap/(width*.18),0,1),bankFade=t*t*(3-2*t);
    let ax=0,ay=0,bankReturn=0;
    for(const f of game.static.features) {
      if(f.kind==='current'&&Math.abs(ball.y-f.y)<f.height/2) {
        const pulse=flowPulse(f,game.time),u=(ball.y-f.y)/f.height+.5;
        // Bank eddies curl inward gently while the main current loses force at the edge.
        bankReturn+=(ball.x<(banks.left+banks.right)/2?1:-1)*f.strength*.13*pulse*Math.sin(u*Math.PI)*(1-bankFade);
        for(const lane of f.lanes){const c=channelAt(f,lane,ball.y,world),offset=(c.x-ball.x)/c.halfWidth;if(Math.abs(offset)>=1)continue;
          const envelope=(1-offset*offset)*Math.sin(u*Math.PI),strength=f.strength*pulse*envelope;
          ax+=(c.slope*.65+offset*.3)*strength;ay+=strength*.32;
        }
      } else if(f.kind==='whirlpool'&&Math.abs(ball.y-f.y)<f.range) {
        const b=Course.bounds(f.y,world),cx=b.left+(b.right-b.left)*(f.fraction||.5),dx=ball.x-cx,dy=ball.y-f.y,d=Math.hypot(dx,dy);
        if(d>1&&d<f.range){const factor=(1-d/f.range)*(f.power||1);ax+=(-dy/d*f.direction*330-dx/d*65)*factor;ay+=(dx/d*f.direction*100+110)*factor;}
      }
    }
    // Flow loses force at solid board surfaces, allowing gravity to release a marble
    // instead of pressing it against a wall-connected log indefinitely.
    let surfaceFade=1;
    for(const s of game.collisionBuckets?.get(Math.floor(ball.y/160))?.segments||game.static.segments){
      if(s.sideWall||s.funnel||s.broken)continue;
      surfaceFade=Math.min(surfaceFade,Math.max(0,Math.min(1,(distance(ball.x,ball.y,s)-(ball.r||0)-(s.radius||4.5))/45)));
    }
    ball.vx+=(clamp(ax,-380,380)*bankFade+clamp(bankReturn,-85,85))*surfaceFade*dt;ball.vy+=clamp(ay,0,220)*surfaceFade*bankFade*dt;
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
  function pinTones(map,pin){
    if(!has(map)||pin.kind)return null;
    if(map==='factory')return pin.bumper?['#ffe2a3','#b28235']:pin.piston?['#edf5f8','#4d687d']:['#e6eef1','#6e8798'];
    if(map==='rapids')return pin.island?['#c0d1c8','#4c6963']:pin.bumper?['#a9d8c6','#4e8b77']:['#c8dcdf','#597b80'];
    return pin.bumper?['#d5dcba','#7d8c61']:['#e4dfcf','#7e8571'];
  }
  function drawTerrain(ctx,game,world,camera){
    if(!has(game.map))return;ctx.save();
    const outline=window.MarbleCourse.outline(world);ctx.beginPath();ctx.moveTo(outline[0].x,outline[0].y);outline.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.clip();
    const top=Math.max(0,Math.floor(camera.top/120)*120),end=Math.min(world.bottom,camera.top+camera.visibleHeight+120);
    for(let y=top;y<end;y+=120){const b=window.MarbleCourse.bounds(y,world);
      if(game.map==='factory'){
        ctx.strokeStyle='#4a647014';ctx.lineWidth=1;for(let x=0;x<1000;x+=100)ctx.strokeRect(x,y,100,120);
        if(y%600===0){ctx.strokeStyle='#bf943b66';ctx.lineWidth=5;for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(b.left+8,y+k*17);ctx.lineTo(b.left+23,y+k*17+12);ctx.moveTo(b.right-23,y+k*17);ctx.lineTo(b.right-8,y+k*17+12);ctx.stroke();}}
      }else if(game.map==='ruins'){
        ctx.strokeStyle='#68765b24';ctx.lineWidth=1.5;for(let x=-100+(y/120%2)*65;x<1100;x+=130)ctx.strokeRect(x,y,130,120);
        ctx.fillStyle='#73895c25';for(const x of [b.left+16,b.right-16]){ctx.beginPath();ctx.ellipse(x,y+50,18,34,.4,0,Math.PI*2);ctx.fill();}
      }else{
        ctx.strokeStyle='#f4ffff38';ctx.lineWidth=2;for(let x=b.left+30;x<b.right-25;x+=140){ctx.beginPath();ctx.moveTo(x,y+28);ctx.quadraticCurveTo(x+25,y+20,x+50,y+28);ctx.stroke();}
      }
    }ctx.restore();
  }
  function drawWorld(ctx,game,world,camera) {
    if(!has(game.map))return;
    ctx.save();
    for(const f of game.static.features) {
      if(f.y+400<camera.top||f.y-400>camera.top+camera.visibleHeight)continue;
      const b=window.MarbleCourse.bounds(f.y,world),mid=(b.left+b.right)/2;
      if(f.kind==='current') {
        const pulse=flowPulse(f,game.time);ctx.save();ctx.globalAlpha=.22+.78*pulse;
        for(const lane of f.lanes){
          ctx.beginPath();for(let i=0;i<=12;i++){const y=f.y-f.height/2+i*f.height/12,c=channelAt(f,lane,y,world);i?ctx.lineTo(c.x-c.halfWidth,y):ctx.moveTo(c.x-c.halfWidth,y);}
          for(let i=12;i>=0;i--){const y=f.y-f.height/2+i*f.height/12,c=channelAt(f,lane,y,world);ctx.lineTo(c.x+c.halfWidth,y);}ctx.closePath();ctx.fillStyle='#268ba52d';ctx.fill();
          ctx.strokeStyle='#287a9b99';ctx.lineWidth=2.5;
          for(let i=0;i<3;i++){const u=(i/3+game.time*.15)%1,y=f.y+(u-.5)*f.height,c=channelAt(f,lane,y,world),angle=Math.atan2(1,c.slope);ctx.save();ctx.translate(c.x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(-15,0);ctx.lineTo(15,0);ctx.lineTo(7,-6);ctx.moveTo(15,0);ctx.lineTo(7,6);ctx.stroke();ctx.restore();}
        }
        ctx.strokeStyle='#438e9b55';for(const side of [-1,1]){const x=side<0?b.left+22:b.right-22,dx=-side*30;ctx.beginPath();ctx.moveTo(x,f.y-18);ctx.quadraticCurveTo(x,f.y+10,x+dx,f.y+18);ctx.lineTo(x+dx+side*7,f.y+9);ctx.moveTo(x+dx,f.y+18);ctx.lineTo(x+dx+side*10,f.y+23);ctx.stroke();}
        ctx.restore();
      } else if(f.kind==='whirlpool') {
        const cx=b.left+(b.right-b.left)*(f.fraction||.5);
        const gradient=ctx.createRadialGradient(cx,f.y,5,cx,f.y,f.range);gradient.addColorStop(0,'#26779838');gradient.addColorStop(1,'#26779800');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(cx,f.y,f.range,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#397fa1a0';ctx.lineWidth=4;
        for(let i=0;i<4;i++){const angle=game.time*f.direction*1.4+i*1.6;ctx.beginPath();ctx.arc(cx,f.y,f.range*(.2+i*.23),angle,angle+Math.PI*1.5);ctx.stroke();}
      } else if(f.kind==='piston') {
        ctx.strokeStyle='#7e96a6';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(b.left+30,f.y);ctx.lineTo(b.right-30,f.y);ctx.stroke();
      } else if(f.kind==='calm') {
        ctx.fillStyle='#e8f8ef45';ctx.fillRect(b.left,f.y-f.height/2,b.right-b.left,f.height);
        ctx.strokeStyle='#d8f7efb0';ctx.lineWidth=2;for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse(mid,f.y+(k-1)*36,38+k*20,7,0,0,Math.PI*2);ctx.stroke();}
      } else if(f.kind==='boulder') {
        const x=mid+Math.sin(f.section*2.3)*(b.right-b.left)*.23;
        ctx.setLineDash([8,12]);ctx.strokeStyle='#7c88864d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,f.y-f.height/2-35);ctx.lineTo(x,f.y+f.height/2+35);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle='#778581';ctx.font='bold 17px sans-serif';ctx.textAlign='center';ctx.fillText('▼',x,f.y-f.height/2-45);
      }
    }
    ctx.restore();
  }
  function drawSegment(ctx,s,time,map) {
    if(s.broken) {
      if(time-s.brokenAt<.8){ctx.save();ctx.fillStyle='#89938e';for(let i=0;i<6;i++){const t=time-s.brokenAt;ctx.fillRect(s.x1+(s.x2-s.x1)*i/6+Math.sin(i)*t*30,s.y1+(s.y2-s.y1)*i/6+t*t*150,9,7);}ctx.restore();}return true;
    }
    if(!s.conveyor&&!s.breakable&&!s.riverLog&&!s.ancient&&!s.bridge&&!s.sluice)return false;
    ctx.save();ctx.lineCap='round';ctx.strokeStyle=s.conveyor?(s.reverse?'#ab6744':'#405f73'):s.riverLog?'#7b8067':s.breakable?'#737e6e':s.bridge?'#8c9480':s.ancient?'#727f6d':map==='factory'?'#597889':'#74959e';
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
    if(!p.switchFor&&!p.boulder&&!p.island)return;
    ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle=p.switchFor?'#e1ffe5':'#52625b';ctx.lineWidth=2;
    if(p.switchFor){ctx.fillStyle=time<p.flashUntil?'#f1ffba':'#6aae87';ctx.beginPath();ctx.arc(0,0,p.r-2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(7,0);ctx.lineTo(0,8);ctx.lineTo(-7,0);ctx.closePath();ctx.stroke();}
    else if(p.island){ctx.fillStyle='#dae4d438';ctx.beginPath();for(let i=0;i<7;i++){const angle=i*Math.PI*2/7,r=p.r*(.72+unit(i+p.section)*.2);i?ctx.lineTo(Math.cos(angle)*r,Math.sin(angle)*r):ctx.moveTo(Math.cos(angle)*r,Math.sin(angle)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#7e9b7080';ctx.beginPath();ctx.ellipse(-p.r*.3,-p.r*.25,p.r*.3,p.r*.2,-.4,0,Math.PI*2);ctx.fill();}
    else{ctx.rotate(time*.7);ctx.beginPath();ctx.moveTo(-p.r*.6,-p.r*.2);ctx.lineTo(0,3);ctx.lineTo(p.r*.3,-p.r*.6);ctx.moveTo(0,3);ctx.lineTo(p.r*.6,p.r*.35);ctx.stroke();}
    ctx.restore();
  }
  window.ExtraCourses={definitions,has,waterEnd,flowPulse,channelAt,configure,build,dynamic,apply,onContact,onPinContact,belt,pinTones,drawTerrain,drawWorld,drawSegment,drawPin};
})();
