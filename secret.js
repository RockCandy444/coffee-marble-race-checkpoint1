(() => {
  'use strict';
  const sequence=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyC','KeyO','KeyM','KeyE','KeyT'];
  class CometCommand {
    constructor({allowed,arm,now=()=>performance.now(),schedule=setTimeout,cancel=clearTimeout}){
      Object.assign(this,{allowed,arm,now,schedule,cancel});this.keys=[];this.taps=0;this.lastKey=0;this.lastTap=0;this.pointer=null;this.timer=null;
    }
    reset(){this.keys=[];this.taps=0;this.stopPointer();}
    stopPointer(){if(this.timer!==null)this.cancel(this.timer);this.timer=null;this.pointer=null;}
    key(event){
      if(!this.allowed()){this.reset();return false;}
      if(event.target?.closest?.('input,textarea,select,[contenteditable="true"]')){this.reset();return false;}
      if(event.repeat||event.ctrlKey||event.altKey||event.metaKey)return false;
      if(['Shift','CapsLock','AltGraph','HangulMode','Process','Unidentified'].includes(event.key)&&!sequence.includes(event.code))return false;
      const code=event.code||({ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight'}[event.key])||('COMET'.includes((event.key||'').toUpperCase())?'Key'+event.key.toUpperCase():event.key);
      const now=this.now();if(now-this.lastKey>10000)this.keys=[];this.lastKey=now;this.keys.push(code);
      let length=Math.min(this.keys.length,sequence.length);
      while(length&&!sequence.slice(0,length).every((key,i)=>this.keys[this.keys.length-length+i]===key))length--;
      this.keys=this.keys.slice(this.keys.length-length);
      if(length===sequence.length){this.reset();this.arm();return true;}
      return false;
    }
    down(id,event){
      if(!this.allowed()){this.reset();return false;}
      if(!['touch','pen'].includes(event.pointerType)||event.button>0)return false;
      if(this.pointer){this.reset();return false;}
      const now=this.now();if(now-this.lastTap>30000)this.taps=0;
      const holding=id==='goo'&&this.taps===5;
      this.pointer={id,number:event.pointerId,x:event.clientX,y:event.clientY,time:now,holding};
      if(holding)this.timer=this.schedule(()=>{
        this.timer=null;
        if(this.pointer?.holding&&this.taps===5&&this.allowed()){this.reset();this.arm();}
      },1200);
      return holding;
    }
    move(event){if(this.pointer?.number===event.pointerId&&Math.hypot(event.clientX-this.pointer.x,event.clientY-this.pointer.y)>14)this.stopPointer();}
    up(event){
      const p=this.pointer;if(!p||p.number!==event.pointerId)return;
      const now=this.now();this.stopPointer();
      if(!this.allowed()){this.reset();return;}
      if(p.holding||now-p.time>600)return;
      const expected=this.taps<3?'ghost':'rocket';
      this.taps=p.id===expected?this.taps+1:p.id==='ghost'?1:0;
      if(this.taps>5)this.taps=0;this.lastTap=now;
    }
    pointerCancel(event){if(this.pointer?.number===event.pointerId)this.stopPointer();}
  }
  window.CometCommand=CometCommand;
})();
