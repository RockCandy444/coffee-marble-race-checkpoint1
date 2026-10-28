(() => {
  'use strict';
  const definitions={
    factory:{title:'컨베이어 공장 코스',label:'컨베이어 공장',height:3800,sections:[[180],[820],[1460],[2100],[2740],[3250]],colors:['#dfe7ed','#d1dde6','#e8e0ca','#d6e3e5','#cedce3','#e3ddd0'],theme:{backdrop:'#293b49',bank:'#435a69',wall:'#526c80',wallLight:'#b5c9d5',ink:'#3b5363',base:'#e1e9ee',end:'#cddae2',finish:'#c9a44a26'}},
    rapids:{title:'급류 계곡 코스',label:'급류 계곡',height:4100,sections:[[180],[880],[1580],[2280],[2980],[3550]],colors:['#c5e9f0','#b4dfeb','#c0d9ed','#bce4db','#addce7','#cce5e3'],theme:{backdrop:'#34595d',bank:'#547a6b',wall:'#4b7475',wallLight:'#b1cec0',ink:'#305c68',base:'#ceeef0',end:'#a9d8df',finish:'#b7dcd426'}},
    ruins:{title:'붕괴하는 유적 코스',label:'붕괴하는 유적',height:4300,sections:[[180],[920],[1660],[2400],[3140],[3750]],colors:['#ddd9ca','#d3cabc','#dce0ce','#c9ccbc','#cfd6bf','#e0d7c4'],theme:{backdrop:'#565e50',bank:'#737665',wall:'#727d6a',wallLight:'#c6c7ac',ink:'#535e48',base:'#e2dfd0',end:'#c6ceba',finish:'#a7af7d26'}}
  };
  const has=map=>Object.hasOwn(definitions,map);
  const unit=seed=>{const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n);};
  const sectionPlans={
    factory:[['입고 레인','운반 벨트','세 갈래 레인'],['압축 작업장','왕복 압착판','반발 핀'],['역주행 라인','역방향 벨트','측면 배출구'],['분류 게이트','좌우 분류문','자석'],['출하 교차로','엇갈린 운반 벨트','반발 핀'],['최종 검수','검수 게이트','골키퍼']],
    rapids:[['상류 물길','완만한 중앙 물살','강변 바위'],['갈라지는 여울','갈래 물길','분기 바위섬'],['소용돌이 분지','연속 소용돌이','반발 바위'],['바위섬 수로','지그재그 바위섬','잔잔한 물길'],['합류 급류','간헐적 합류 물살','자석'],['마지막 협곡','좁은 바위 통로','골키퍼']],
    ruins:[['석주 정원','큰 돌기둥','자석'],['붕괴 회랑','부서지는 석벽','반발 핀'],['흔들다리','왕복 회전 다리','징검 돌'],['스위치 석문','접촉 스위치와 석문','자석'],['낙석 신전','교차 낙석','잔해 바위'],['봉인 출구','봉인 석벽','골키퍼']]
  };
  for(const [map,plans] of Object.entries(sectionPlans))definitions[map].sections=definitions[map].sections.map(([y],i)=>[y,plans[i][0]]);
  const layouts={factory:['lanes','cluster','diagonal','split','slalom','guard'],rapids:['banks','split','rings','islands','split','guard'],ruins:['arches','diagonal','islands','split','cluster','guard']};
  const magnetCounts={factory:[0,0,0,3,2,1],rapids:[0,0,0,2,2,0],ruins:[2,0,0,2,0,1]};
  const fillerCounts={factory:[100,70,80,75,90,55],rapids:[100,90,70,80,90,60],ruins:[75,65,65,70,75,50]};
  const powerCounts={factory:[0,3,2,0,3,1],rapids:[0,0,2,3,0,0],ruins:[1,2,0,1,2,1]};
  const waterEnd=world=>world.funnelY-80;
  const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
  function flowPulse(f,time){if(!f.pulsed)return 1;const phase=((time+f.offset)%f.period+f.period)%f.period;return Math.min(clamp(phase/.4,0,1),clamp((f.onTime-phase)/.4,0,1));}
  function channelAt(f,lane,y,world){
    const b=window.MarbleCourse.bounds(y,world),width=b.right-b.left,u=clamp((y-f.y)/f.height+.5,0,1),wave=u*Math.PI+f.phase;
    const travel=lane.travel??.11,fraction=lane.fraction+Math.sin(wave)*.035+(u-.5)*lane.lean*travel;
    return {x:b.left+width*fraction,halfWidth:width*lane.width,slope:width*(Math.cos(wave)*.035*Math.PI+lane.lean*travel)/f.height};
  }
  function configure(world,map) {
    world.sideProfile=Array.from({length:25},(_,i)=>{
      const t=i/24,y=world.funnelY*t,entry=Math.min(1,y/500);
      const wave=Math.sin(t*Math.PI*(map==='rapids'?5:3));
      let left=map==='factory'?35+entry*25*Math.sin(t*8)**2:map==='rapids'?110+entry*(65*wave+35):65+entry*(40+80*Math.sin(t*10)**2);
      let right=map==='factory'?965-entry*30*Math.cos(t*7)**2:map==='rapids'?870+entry*(65*wave-25):935-entry*(35+80*Math.cos(t*9)**2);
      if(map==='rapids'){const section=Math.max(0,definitions.rapids.sections.findLastIndex(([start])=>y>=start)),width=760+entry*([680,800,760,720,780,570][section]-760),mid=500+entry*55*wave;left=mid-width/2;right=mid+width/2;}
      return {y,left,right};
    });
  }
  function distance(x,y,s) {
    const dx=s.x2-s.x1,dy=s.y2-s.y1,t=Math.max(0,Math.min(1,((x-s.x1)*dx+(y-s.y1)*dy)/(dx*dx+dy*dy||1)));
    return Math.hypot(x-s.x1-t*dx,y-s.y1-t*dy);
  }
  function build(map,world,sections,count) {
    const Course=window.MarbleCourse,pins=[],segments=[],features=[];
    const addShelf=(y,left,length,extra={})=>{
      const drop=extra.drop||75,b=Course.bounds(y,world),b2=Course.bounds(y+drop,world),gap=extra.reverse?58:0;
      segments.push({x1:left?b.left+gap:b.right-gap,y1:y,x2:left?Math.min(b.left+length,b2.right-100):Math.max(b.right-length,b2.left+100),y2:y+drop,radius:4.5,...extra});
    };
    const landmark=(y,fraction,r,extra)=>{
      for(const dy of [0,45,-45,90,-90]){const py=y+dy,b=Course.bounds(py,world),x=b.left+(b.right-b.left)*fraction;
        if(x-r<b.left+40||x+r>b.right-40||segments.some(s=>distance(x,py,s)<r+s.radius+55)||pins.some(p=>Math.hypot(x-p.x,py-p.y)<r+p.r+45))continue;
        pins.push({x,y:py,r,...extra});return;
      }
    };
    sections.forEach(([start],section)=>{
      const end=Math.min(sections[section+1]?.[0]||world.finishY-280,world.finishY-280),span=end-start;
      const feature=(kind,fraction,extra={})=>{const f={kind,y:start+span*fraction,section,key:map+'-'+kind+'-'+section+'-'+features.length,...extra};features.push(f);return f;};
      const stoneGate=(fraction,gateFraction)=>{const gate=feature('stoneGate',fraction,{fraction:gateFraction,openUntil:0,locked:true}),b=Course.bounds(gate.y-155,world);
        pins.push({x:b.left+(b.right-b.left)*Math.max(.2,Math.min(.8,gateFraction+(section%2?-.12:.12))),y:gate.y-155,r:22,switchFor:gate.key,section,hits:new Map()});
      };
      if(map==='factory'){
        const beltCount=[4,0,8,0,6,0][section];
        for(let k=0;k<beltCount;k++){
          const left=k%2===0,reverse=section===2,y=start+120+(span-300)*k/Math.max(1,beltCount-1),b=Course.bounds(y,world);
          addShelf(y,left,(b.right-b.left)*(section===0?.30:section===4?.64:.48),{conveyor:true,reverse,direction:(left?1:-1)*(reverse?-1:1),downhill:left?1:-1,section,drop:section===4?105:72,push:section===4?4.1:undefined,crossing:section===4});
        }
        if(section===0)for(const fraction of [.32,.67])for(const yf of [.27,.57,.86]){
          const y=start+span*yf,b=Course.bounds(y,world),x=b.left+(b.right-b.left)*fraction,s={x1:x-12,y1:y-75,x2:x+12,y2:y+75,radius:4.5,rail:true,section};
          if([0,.25,.5,.75,1].every(t=>segments.every(other=>distance(s.x1+(s.x2-s.x1)*t,s.y1+150*t,other)>42)))segments.push(s);
        }
        if(section===1)for(let k=0;k<5;k++)feature('press',.12+k*.19,{phase:k*.9});
        if(section===3)for(let k=0;k<5;k++)feature('gate',.12+k*.19,{fraction:[.3,.7,.35,.65,.5][k],phase:k*.7});
        if(section===5){feature('gate',.42,{fraction:.4});feature('gate',.80,{fraction:.6});}
      }else if(map==='rapids'){
        const positions=[[.14,.38,.68,.87],[.15,.43,.77],[],[.13,.88],[.13,.36,.66,.88],[]][section];
        for(const [k,fraction] of positions.entries()){
          const direction=(k+section)%2?1:-1;
          const lanes=section===0?[{fraction:.5,width:.27,lean:direction*.35}]:section===3?[{fraction:.5,width:.22,lean:direction*.3}]:section===4?[{fraction:.32,width:.13,lean:1,travel:.32},{fraction:.68,width:.13,lean:-1,travel:.32}]:[{fraction:.25,width:.16,lean:direction},{fraction:.75,width:.16,lean:-direction}];
          feature('current',fraction,{height:section===0?350:section===1?400:section===4?360:240,strength:[300,440,0,260,500,0][section],direction,phase:k*.8+section,pulsed:section===4,period:4.8+k*.4,onTime:2.8,offset:k*1.3,lanes});
        }
        if(section===2)for(let k=0;k<5;k++)feature('whirlpool',.13+k*.18,{range:165+unit(k)*20,direction:k%2?1:-1,fraction:k%2?.67:.33,power:1.1});
        if(section===0){feature('calm',.53,{height:180});for(let k=0;k<8;k++)landmark(start+180+(span-400)*k/7,.5+[-.06,.04,0,.07,-.035,.055,-.02,0][k],10+k%3*2,{section,riverRock:true,upstreamCenter:true});}
        if(section===1){landmark(start+span*.30,.42,50,{section,riverRock:true,island:true});landmark(start+span*.64,.60,55,{section,riverRock:true,island:true});}
        if(section===3){feature('calm',.5,{height:span*.56});for(let k=0;k<6;k++)landmark(start+span*(.14+k*.14),k%2?.7:.3,48+k%3*5,{section,riverRock:true,island:true});}
        if(section===5)for(let k=0;k<3;k++)addShelf(start+100+k*(span-330)/2,k%2===0,Math.max(100,(Course.bounds(start+100+k*(span-330)/2,world).right-Course.bounds(start+100+k*(span-330)/2,world).left)*.25),{riverLog:true,section,drop:65});
      }else{
        if(section===0)for(let row=0;row<6;row++)for(let col=0;col<3;col++)landmark(start+140+row*(span-330)/5,.22+col*.28+(row%2?-.045:.045),28+(row+col)%3*5,{section,pillar:true,ancient:true});
        const wallCount=section===1?12:section===5?2:0;
        for(let k=0;k<wallCount;k++){
          const y=start+100+(span-290)*k/Math.max(1,wallCount-1),b=Course.bounds(y,world),cx=b.left+(b.right-b.left)*(k%2?.67:.33),half=Math.min((b.right-b.left)*.23,100+unit(k)*65),hp=[1,3,5,2,6][k%5]+Math.min(2,Math.floor(Math.sqrt(count)/4));
          segments.push({x1:Math.max(b.left+35,cx-half),y1:y,x2:Math.min(b.right-35,cx+half),y2:y+55,radius:8,breakable:true,hp,maxHp:hp,hits:new Map(),id:'ruin-wall-'+section+'-'+k,section});
        }
        if(section===2)for(let k=0;k<5;k++)feature('bridge',.12+k*.19,{fraction:k%2?.65:.35,phase:k*.8});
        if(section===3)for(let k=0;k<4;k++)stoneGate(.15+k*.23,k%2?.65:.35);
        if(section===4)for(let k=0;k<6;k++)feature('boulder',.13+k*.15,{height:180+unit(k)*45,fraction:[.3,.7,.4,.65,.28,.72][k],phase:k*.8,period:4.2+k%3*.5,radius:26+k%3*6});
        if(section===5)stoneGate(.66,.5);
      }
    });
    // Break uninterrupted bank routes with downhill spurs and near-bank rocks.
    // Keep the final chapter intact and leave each chapter's main mechanism clear.
    if(map==='rapids'||map==='ruins')sections.slice(0,5).forEach(([start],section)=>{
      const end=sections[section+1][0],span=end-start;
      for(const left of [true,false])for(let k=0;k<8;k++){
        const attached=k%3===0,baseY=start+150+(span-340)*(k+.25+(left?0:.3))/8;
        for(const dy of [0,45,-45,90,-90,135,-135,180,-180,225,-225]){
          const y=baseY+dy;if(y<start+90||y>end-100)continue;
          const b=Course.bounds(y,world),radius=22+(k+section)%3*5;
          const gap=25+(k+section)%3*9,x=left?b.left+(radius+gap)*Math.hypot(1,b.leftSlope):b.right-(radius+gap)*Math.hypot(1,b.rightSlope);
          if(features.some(f=>['press','gate','stoneGate','bridge'].includes(f.kind)&&Math.abs(f.y-y)<(attached?180:125)))continue;
          if(attached){
            const drop=65+(k+section)%3*15,b2=Course.bounds(y+drop,world),length=105+(k+section)%3*18;
            const s={x1:left?b.left:b.right,y1:y,x2:left?Math.max(b.left,b2.left)+length:Math.min(b.right,b2.right)-length,y2:y+drop,radius:5.5,section,bankObstacle:true,bankSide:left?'left':'right',wallAttached:true,riverLog:map==='rapids',ancient:map==='ruins'};
            const samples=[0,.25,.5,.75,1].map(t=>({x:s.x1+(s.x2-s.x1)*t,y:s.y1+(s.y2-s.y1)*t}));
            if(samples.some((p,i)=>{const bounds=Course.bounds(p.y,world);return i>0&&(p.x<bounds.left+s.radius||p.x>bounds.right-s.radius);}))continue;
            if(samples.some(p=>segments.some(o=>distance(p.x,p.y,o)<s.radius+o.radius+65)||pins.some(o=>Math.hypot(p.x-o.x,p.y-o.y)<o.r+s.radius+60)))continue;
            segments.push(s);break;
          }
          if(segments.some(s=>distance(x,y,s)<radius+s.radius+65)||pins.some(p=>Math.hypot(x-p.x,y-p.y)<radius+p.r+45))continue;
          pins.push({x,y,r:radius,section,bankObstacle:true,bankSide:left?'left':'right',riverRock:map==='rapids',ancient:map==='ruins'});break;
        }
      }
    });
    if(map==='rapids')for(let i=features.length-1;i>=0;i--){const f=features[i];if(f.kind==='current'){if(f.y>=waterEnd(world)){features.splice(i,1);continue;}f.height=Math.min(f.height,2*(waterEnd(world)-f.y));}if(f.kind==='whirlpool')f.y=Math.min(f.y,waterEnd(world)-f.range);}
    const clear=(x,y,r)=>{
      const b=Course.bounds(y,world),wallGap=y>=world.funnelY?40:28;
      if((x-b.left)/Math.hypot(1,b.leftSlope)-r<wallGap||(b.right-x)/Math.hypot(1,b.rightSlope)-r<wallGap)return false;
      if(features.some(f=>{
        if(f.kind==='boulder'){const fb=Course.bounds(f.y,world),cx=fb.left+(fb.right-fb.left)*(f.fraction||.5);return Math.abs(f.y-y)<f.height/2+75+r&&Math.abs(x-cx)<90+r;}
        return ['piston','press','gate','bridge','stoneGate'].includes(f.kind)&&Math.abs(f.y-y)<(f.kind==='bridge'?125:95)+r;
      }))return false;
      return segments.every(s=>distance(x,y,s)>r+s.radius+50)&&pins.every(p=>Math.hypot(p.x-x,p.y-y)>p.r+r+(p.island||p.pillar?45:28));
    };
    sections.forEach(([start],section)=>{
      const end=Math.min(sections[section+1]?.[0]||world.finishY-260,world.finishY-260),span=end-start,layout=layouts[map][section],target=fillerCounts[map][section];
      const magneticEnd=Math.min(end-100,world.funnelY-180);
      for(let k=0;k<magnetCounts[map][section];k++)for(let attempt=0;attempt<600;attempt++){
        const y=start+120+unit(attempt*17+k*331+section*941)*(magneticEnd-start-120),b=Course.bounds(y,world),x=b.left+155+unit(attempt*13+section*21+k)*(b.right-b.left-310),r=16+k%2*2;
        if(magneticEnd<=start+120||!clear(x,y,r))continue;
        if(segments.some(s=>distance(x,y,s)<r+s.radius+130)||pins.some(p=>(p.kind==='magnet'&&Math.hypot(x-p.x,y-p.y)<250)||((p.island||p.pillar)&&Math.hypot(x-p.x,y-p.y)<p.r+r+130)))continue;
        if(features.some(f=>{if(f.kind==='boulder'){const fb=Course.bounds(f.y,world),cx=fb.left+(fb.right-fb.left)*(f.fraction||.5);return Math.abs(f.y-y)<f.height/2+195&&Math.abs(x-cx)<195;}return ['piston','press','gate','bridge','stoneGate'].includes(f.kind)&&Math.abs(f.y-y)<175;}))continue;
        pins.push({x,y,r,section,kind:'magnet',bumper:true,range:120,strength:420});break;
      }
      let placed=0;
      for(let i=0;i<target*28&&placed<target;i++){
        const u=unit(i+section*293),v=unit(i*3+section*177+8);let yf=u,xf=v;
        if(i<target*17){
          if(layout==='lanes')xf=[.17,.5,.83][i%3]+(v-.5)*.15;
          if(layout==='cluster'||layout==='islands'){yf=[.18,.47,.78][i%3]+(u-.5)*.22;xf=[.23,.75,.43][i%3]+(v-.5)*.4;}
          if(layout==='slalom')xf=.5+Math.sin(u*Math.PI*4)*.29+(v-.5)*.22;
          if(layout==='banks')xf=i%2?.76+(v-.5)*.24:.24+(v-.5)*.24;
          if(layout==='split')xf=i%2?.72+(v-.5)*.22:.28+(v-.5)*.22;
          if(layout==='diagonal')xf=(u*.75+v*.3)%1;
          if(layout==='rings'||layout==='arches'){const angle=v*Math.PI*2;xf=.5+Math.cos(angle)*(.18+(i%2)*.16);yf=[.23,.60,.82][i%3]+Math.sin(angle)*.1;}
          if(layout==='guard')xf=.5+Math.sin(i*2.4)*(.18+v*.23);
        }
        const y=start+65+clamp(yf,0,1)*(span-130),b=Course.bounds(y,world),x=b.left+35+(b.right-b.left-70)*clamp(xf,0,1),r=5+unit(i*7+section)*6;
        if(clear(x,y,r)){pins.push({x,y,r,section,ambient:true,bumper:powerCounts[map][section]>0&&i%13===0,riverRock:map==='rapids',ancient:map==='ruins'});placed++;}
      }
      for(let k=0;k<powerCounts[map][section];k++)for(const dy of [0,50,-50,100,-100]){
        const y=start+160+(span-320)*(k+.5)/Math.max(1,powerCounts[map][section])+dy,b=Course.bounds(y,world),x=b.left+(b.right-b.left)*(.25+(k%3)*.25),r=22+k%3*3;
        if(clear(x,y,r)){pins.push({x,y,r,section,kind:'power',kick:190,bumper:true,range:0});break;}
      }
    });
    pins.forEach((p,i)=>p.id=map+'-pin-'+i);
    world.sideProfile.slice(1).forEach((b,i)=>{const a=world.sideProfile[i];segments.push({x1:a.left-4.5,y1:a.y,x2:b.left-4.5,y2:b.y,radius:4.5,sideWall:true},{x1:a.right+4.5,y1:a.y,x2:b.right+4.5,y2:b.y,radius:4.5,sideWall:true});});
    return {pins,segments,features};
  }
  function dynamic(game,world,time) {
    const pins=[],segments=[],Course=window.MarbleCourse,Battle=window.MarbleBattle;
    for(const f of game.static.features||[]) {
      if(!f.key)continue;
      const t=Battle.timeFor(game,f.key,time),rate=Battle.machineRate(game,f.key),stopped=rate===0,b=Course.bounds(f.y,world),mid=(b.left+b.right)/2;
      if(f.kind==='piston') {
        const amplitude=f.amplitude||105,phase=t*.9+f.section,cx=b.left+(b.right-b.left)*(f.fraction||.5);
        pins.push({x:cx+Math.sin(phase)*Math.min(amplitude,(b.right-b.left)*.22),y:f.y,r:28+f.section%3*6,vx:Math.cos(phase)*Math.min(amplitude,(b.right-b.left)*.22)*.9*rate,moving:true,piston:true,machineKey:f.key});
      } else if(f.kind==='gate'||f.kind==='stoneGate'||f.kind==='press') {
        const frequency=f.kind==='press'?1.3:1.05,phase=t*frequency+(f.phase??f.section),held=f.openUntil>game.time,cx=b.left+(b.right-b.left)*(f.fraction||.5);
        const maxOpening=Math.max(100,Math.min((b.right-b.left)*.78,2*Math.min(cx-b.left,b.right-cx)-60)),minOpening=f.locked?54:90;
        const travel=f.locked?20:maxOpening-minOpening,opening=held?maxOpening:minOpening+(1+Math.sin(phase))*travel/2,speed=held?0:Math.cos(phase)*travel*frequency/4*rate;
        const top=Course.bounds(f.y-25,world);
        segments.push({x1:top.left,y1:f.y-25,x2:cx-opening/2,y2:f.y+20,radius:f.kind==='press'?11:6,vx:-speed,machineKey:f.key,sluice:true,press:f.kind==='press',ancient:f.kind==='stoneGate'},
          {x1:top.right,y1:f.y-25,x2:cx+opening/2,y2:f.y+20,radius:f.kind==='press'?11:6,vx:speed,machineKey:f.key,sluice:true,press:f.kind==='press',ancient:f.kind==='stoneGate'});
      } else if(f.kind==='bridge') {
        const angle=Math.sin(t*.8+(f.phase??f.section))*.25,omega=Math.cos(t*.8+(f.phase??f.section))*.25*.8*rate,half=Math.min(140,(b.right-b.left)*.25),cx=b.left+(b.right-b.left)*(f.fraction||.5);
        segments.push({x1:cx-Math.cos(angle)*half,y1:f.y-Math.sin(angle)*half,x2:cx+Math.cos(angle)*half,y2:f.y+Math.sin(angle)*half,
          cx,cy:f.y,omega,rotating:true,radius:5,bridge:true,machineKey:f.key});
      } else if(f.kind==='boulder') {
        const period=f.period||4.8,cycle=(((t+(f.phase??f.section*.7))%period)+period)%period/period;
        if(cycle<.84){const phase=cycle/.84,y=f.y-f.height/2+f.height*phase*phase,x=b.left+(b.right-b.left)*(f.fraction||.5),radius=f.radius||32;
          if(phase>.08||!game.balls.some(ball=>!ball.finished&&Math.hypot(ball.x-x,ball.y-y)<ball.r+radius+24))pins.push({x,y,r:radius,vy:2*f.height*phase/(period*.84)*rate,moving:true,boulder:true,ancient:true,machineKey:f.key});}
      }
    }
    return {pins,segments};
  }
  function apply(ball,game,world,dt) {
    if(game.map!=='rapids'||ball.y>=waterEnd(world))return;
    const Course=window.MarbleCourse;
    if(game.static.features.some(f=>f.kind==='calm'&&Math.abs(ball.y-f.y)<f.height/2))return;
    const banks=Course.bounds(ball.y,world),width=banks.right-banks.left,gap=Math.min(ball.x-banks.left,banks.right-ball.x)-(ball.r||0),t=clamp(gap/(width*.18),0,1),bankFade=t*t*(3-2*t);
    const section=Math.max(0,definitions.rapids.sections.findLastIndex(([start])=>ball.y>=start));
    let ax=0,ay=0,bankReturn=[0,1,2,4].includes(section)?(ball.x<(banks.left+banks.right)/2?1:-1)*45*(1-bankFade):0;
    for(const f of game.static.features) {
      const sign=flowDirection(game,f);
      if(f.kind==='current'&&Math.abs(ball.y-f.y)<f.height/2) {
        const pulse=flowPulse(f,game.time),u=(ball.y-f.y)/f.height+.5;
        // Bank eddies curl inward gently while the main current loses force at the edge.
        bankReturn+=(ball.x<(banks.left+banks.right)/2?1:-1)*f.strength*.13*pulse*Math.sin(u*Math.PI)*(1-bankFade);
        for(const lane of f.lanes){const c=channelAt(f,lane,ball.y,world),offset=(c.x-ball.x)/c.halfWidth;if(Math.abs(offset)>=1)continue;
          const envelope=(1-offset*offset)*Math.sin(u*Math.PI),strength=f.strength*pulse*envelope*Course.waterTuning.currentGain;
          ax+=(c.slope*.85+offset*.45)*strength*sign;ay+=strength*.35*sign;
        }
      } else if(f.kind==='whirlpool'&&Math.abs(ball.y-f.y)<f.range) {
        const b=Course.bounds(f.y,world),cx=b.left+(b.right-b.left)*(f.fraction||.5),dx=ball.x-cx,dy=ball.y-f.y,d=Math.hypot(dx,dy);
        if(d>1&&d<f.range){const force=Course.vortexAcceleration(dx,dy,f.range,f.direction*sign,f.power||1);ax+=force.x;ay+=force.y;}
      }
    }
    // Flow loses force at solid board surfaces, allowing gravity to release a marble
    // instead of pressing it against a wall-connected log indefinitely.
    let surfaceFade=1;
    for(const s of game.collisionBuckets?.get(Math.floor(ball.y/160))?.segments||game.static.segments){
      if(s.sideWall||s.funnel||s.broken)continue;
      surfaceFade=Math.min(surfaceFade,Math.max(0,Math.min(1,(distance(ball.x,ball.y,s)-(ball.r||0)-(s.radius||4.5))/45)));
    }
    ball.vx+=(clamp(ax,-Course.waterTuning.lateralCap,Course.waterTuning.lateralCap)*bankFade+clamp(bankReturn,-85,85))*surfaceFade*dt;ball.vy+=clamp(ay,-Course.waterTuning.verticalCap,Course.waterTuning.verticalCap)*surfaceFade*bankFade*dt;
  }
  function flowDirection(game,feature){const mod=game.battle?.fieldMods?.get(feature.key);return mod?.kind==='machinereverse'&&mod.until>game.time?-1:1;}
  function onContact(segment,ball,game,toward) {
    if(!segment.breakable||segment.broken)return false;
    if(-toward<35||game.time-(segment.hits.get(ball.id)??-1)<.3)return false;
    segment.hits.set(ball.id,game.time);segment.hp--;segment.flashUntil=game.time+.2;
    if(segment.hp<=0){segment.broken=true;segment.brokenAt=game.time;return true;}return false;
  }
  function belt(segment,ball,game) {
    if(!segment.conveyor)return;
    ball.vx+=segment.direction*(segment.push||(segment.reverse?3.8:3.2));ball.vy+=.8;
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
      const sign=flowDirection(game,f);
      if(f.kind==='current') {
        const pulse=flowPulse(f,game.time);ctx.save();ctx.globalAlpha=.22+.78*pulse;
        for(const lane of f.lanes){
          ctx.beginPath();for(let i=0;i<=12;i++){const y=f.y-f.height/2+i*f.height/12,c=channelAt(f,lane,y,world);i?ctx.lineTo(c.x-c.halfWidth,y):ctx.moveTo(c.x-c.halfWidth,y);}
          for(let i=12;i>=0;i--){const y=f.y-f.height/2+i*f.height/12,c=channelAt(f,lane,y,world);ctx.lineTo(c.x+c.halfWidth,y);}ctx.closePath();ctx.fillStyle='#268ba52d';ctx.fill();
          ctx.strokeStyle=sign<0?'#9a65bddd':'#287a9b99';ctx.lineWidth=2.5;
          for(let i=0;i<3;i++){const u=((i/3+game.time*.15*sign)%1+1)%1,y=f.y+(u-.5)*f.height,c=channelAt(f,lane,y,world),angle=Math.atan2(1,c.slope)+(sign<0?Math.PI:0);ctx.save();ctx.translate(c.x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(-15,0);ctx.lineTo(15,0);ctx.lineTo(7,-6);ctx.moveTo(15,0);ctx.lineTo(7,6);ctx.stroke();ctx.restore();}
        }
        ctx.strokeStyle='#438e9b55';for(const side of [-1,1]){const x=side<0?b.left+22:b.right-22,dx=-side*30;ctx.beginPath();ctx.moveTo(x,f.y-18);ctx.quadraticCurveTo(x,f.y+10,x+dx,f.y+18);ctx.lineTo(x+dx+side*7,f.y+9);ctx.moveTo(x+dx,f.y+18);ctx.lineTo(x+dx+side*10,f.y+23);ctx.stroke();}
        ctx.restore();
      } else if(f.kind==='whirlpool') {
        const cx=b.left+(b.right-b.left)*(f.fraction||.5);
        const gradient=ctx.createRadialGradient(cx,f.y,5,cx,f.y,f.range);gradient.addColorStop(0,'#26779838');gradient.addColorStop(1,'#26779800');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(cx,f.y,f.range,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=sign<0?'#9a65bddd':'#397fa1a0';ctx.lineWidth=4;
        for(let i=0;i<4;i++){const angle=game.time*f.direction*sign*1.4+i*1.6;ctx.beginPath();ctx.arc(cx,f.y,f.range*(.2+i*.23),angle,angle+Math.PI*1.5);ctx.stroke();}
      } else if(f.kind==='press') {
        ctx.strokeStyle='#738a9c55';ctx.lineWidth=4;for(const x of [b.left+12,b.right-12])ctx.strokeRect(x-8,f.y-65,16,130);
      } else if(f.kind==='piston') {
        ctx.strokeStyle='#7e96a6';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(b.left+30,f.y);ctx.lineTo(b.right-30,f.y);ctx.stroke();
      } else if(f.kind==='calm') {
        ctx.fillStyle='#e8f8ef45';ctx.fillRect(b.left,f.y-f.height/2,b.right-b.left,f.height);
        ctx.strokeStyle='#d8f7efb0';ctx.lineWidth=2;for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse(mid,f.y+(k-1)*36,38+k*20,7,0,0,Math.PI*2);ctx.stroke();}
      } else if(f.kind==='boulder') {
        const x=b.left+(b.right-b.left)*(f.fraction||.5);
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
    if(!s.conveyor&&!s.breakable&&!s.riverLog&&!s.ancient&&!s.bridge&&!s.sluice&&!s.rail)return false;
    ctx.save();ctx.lineCap='round';ctx.strokeStyle=s.conveyor?(s.reverse?'#ab6744':'#405f73'):s.riverLog?'#7b8067':s.breakable?'#737e6e':s.bridge?'#8c9480':s.ancient?'#727f6d':map==='factory'?'#597889':'#74959e';
    ctx.lineWidth=s.radius*2;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
    if(s.press){const dx=s.x2-s.x1,dy=s.y2-s.y1,length=Math.hypot(dx,dy);ctx.strokeStyle='#e4bb62';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(s.x2-dx/length*35,s.y2-dy/length*35);ctx.lineTo(s.x2,s.y2);ctx.stroke();}
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
    if(!p.switchFor&&!p.boulder&&!p.island&&!p.pillar)return;
    ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle=p.switchFor?'#e1ffe5':'#52625b';ctx.lineWidth=2;
    if(p.switchFor){ctx.fillStyle=time<p.flashUntil?'#f1ffba':'#6aae87';ctx.beginPath();ctx.arc(0,0,p.r-2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(7,0);ctx.lineTo(0,8);ctx.lineTo(-7,0);ctx.closePath();ctx.stroke();}
    else if(p.pillar){ctx.strokeStyle='#64715b';ctx.beginPath();ctx.arc(0,0,p.r*.76,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#eef0d994';ctx.beginPath();ctx.arc(0,0,p.r*.47,0,Math.PI*2);ctx.stroke();for(const x of [-8,0,8]){ctx.beginPath();ctx.moveTo(x,-p.r*.4);ctx.lineTo(x,p.r*.4);ctx.stroke();}}
    else if(p.island){ctx.fillStyle='#dae4d438';ctx.beginPath();for(let i=0;i<7;i++){const angle=i*Math.PI*2/7,r=p.r*(.72+unit(i+p.section)*.2);i?ctx.lineTo(Math.cos(angle)*r,Math.sin(angle)*r):ctx.moveTo(Math.cos(angle)*r,Math.sin(angle)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#7e9b7080';ctx.beginPath();ctx.ellipse(-p.r*.3,-p.r*.25,p.r*.3,p.r*.2,-.4,0,Math.PI*2);ctx.fill();}
    else{ctx.rotate(time*.7);ctx.beginPath();ctx.moveTo(-p.r*.6,-p.r*.2);ctx.lineTo(0,3);ctx.lineTo(p.r*.3,-p.r*.6);ctx.moveTo(0,3);ctx.lineTo(p.r*.6,p.r*.35);ctx.stroke();}
    ctx.restore();
  }
  window.ExtraCourses={definitions,sectionPlans,magnetCounts,has,waterEnd,flowPulse,flowDirection,channelAt,configure,build,dynamic,apply,onContact,onPinContact,belt,pinTones,drawTerrain,drawWorld,drawSegment,drawPin};
})();
