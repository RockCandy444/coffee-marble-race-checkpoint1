(() => {
  'use strict';
  const sequence=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyC','KeyO','KeyM','KeyE','KeyT'];
  class CometCommand {
    static isMobileDevice(navigator=window.navigator){
      const ua=navigator?.userAgent||'';
      return navigator?.userAgentData?.mobile===true||/Android|iPhone|iPad|iPod/i.test(ua)||/Macintosh/i.test(ua)&&(navigator?.maxTouchPoints||0)>1;
    }
    constructor({allowed,arm,now=()=>performance.now(),mobile=()=>CometCommand.isMobileDevice()}){
      Object.assign(this,{allowed,arm,now,mobile});this.keys=[];this.taps=0;this.lastKey=0;this.lastTap=0;
    }
    reset(){this.keys=[];this.taps=0;}
    key(event){
      if(this.mobile()||!this.allowed()){this.reset();return false;}
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
    tap(id,event){
      if(!this.mobile()||!this.allowed()||event?.detail===0||event?.pointerType&&event.pointerType!=='touch'&&event.pointerType!=='pen'){this.reset();return false;}
      const now=this.now();if(now-this.lastTap>30000)this.taps=0;
      const expected=['ghost','ghost','ghost','rocket','rocket','goo'][this.taps];
      this.taps=id===expected?this.taps+1:id==='ghost'?1:0;this.lastTap=now;
      if(this.taps===6){this.reset();this.arm();return true;}
      return false;
    }
  }
  window.CometCommand=CometCommand;
})();
