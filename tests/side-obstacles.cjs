const fs=require('node:fs'),path=require('node:path');
const harness=fs.readFileSync(path.join(__dirname,'physics-smoke.cjs'),'utf8').split('// Manual camera movement')[0];
new Function('require','__dirname',harness+`
for(const map of ['rapids','ruins'])for(const count of [2,100]){
  simulation.reset(map,count,0);const {game,world,maps}=simulation.state();
  const pins=game.static.pins.filter(p=>p.bankObstacle),boards=game.static.segments.filter(s=>s.bankObstacle);
  for(let section=0;section<5;section++)for(const side of ['left','right']){
    const p=pins.filter(p=>p.section===section&&p.bankSide===side),s=boards.filter(s=>s.section===section&&s.bankSide===side);
    assert.ok(p.length>=2,map+' section '+section+' '+side+' near-bank rocks');
    assert.ok(s.length>=1,map+' section '+section+' '+side+' wall-connected deflector');
    assert.ok(p.length+s.length>=4,'side support is distributed over the chapter');
    for(const rock of p){const b=course.bounds(rock.y,world);assert.ok(rock.x-rock.r>b.left+20&&rock.x+rock.r<b.right-20);}
    for(const board of s){const b=course.bounds(board.y1,world);assert.equal(board.x1,side==='left'?b.left:b.right);assert.ok(board.y2>board.y1,'downhill surface sheds marbles inward');
      assert.ok(Math.abs(board.x2-board.x1)<160,'bank obstacle preserves central route');
    }
  }
  assert.ok(pins.every(p=>p.section<5)&&boards.every(s=>s.section<5),'no added obstacles in final chapter');
  for(const s of boards)for(const fraction of [.25,.5,.75,1]){const x=s.x1+(s.x2-s.x1)*fraction,y=s.y1+(s.y2-s.y1)*fraction,b=course.bounds(y,world);assert.ok(x-s.radius>=b.left&&x+s.radius<=b.right,'deflector does not protrude outside course');}
  console.log(JSON.stringify({map,count,nearBankRocks:pins.length,wallDeflectors:boards.length,sections:5}));
}
console.log('Both banks of chapters 1-5 have staggered obstacles, wall attachments, a central route and no final-chapter changes');
`)(require,__dirname);
