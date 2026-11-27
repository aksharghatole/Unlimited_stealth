import test from 'node:test';
import assert from 'node:assert/strict';
import { Camera,castRay,conePoints,tileNoise,pulseOpacity } from '../js/visuals.js';
import { render } from '../js/render.js';
import { Facility } from '../js/facility.js';
import { Player } from '../js/player.js';
import { Guard,SecurityCamera } from '../js/security.js';
const room={tileSize:40,isOpaque(x,y){return x<0||y<0||x>4||y>4||x===2;}};
test('camera eases, snaps on world changes and honors reduced motion',()=>{
 const c=new Camera(),w={},p={x:100,y:100};
 assert.deepEqual(c.follow(w,p,100,100,.016),{x:50,y:50});
 p.x=200;const a=c.follow(w,p,100,100,.016);
 assert.ok(a.x>50&&a.x<150);
 assert.equal(c.follow({},p,100,100,.016).x,150);
 p.x=250;assert.equal(c.follow(c.world,p,100,100,.016,true).x,200);
});
test('rays stop at walls and retain unobstructed range',()=>{
 assert.equal(castRay(room,60,60,0,200).distance,20);
 assert.equal(castRay(room,60,60,Math.PI/2,10).distance,10);
 assert.equal(castRay(room,60,60,Math.PI,100).distance,60);
 const pts=conePoints(room,{x:60,y:60,heading:0},200,.5);
 assert.equal(pts.length,33);
 assert.ok(pts.every(p=>p.x<=80.0001));
});
test('tile detail and pulse are deterministic and bounded',()=>{
 assert.equal(tileNoise(2,5),tileNoise(2,5));
 assert.ok(tileNoise(9,1)>=0&&tileNoise(9,1)<1);
 assert.equal(pulseOpacity(0),1);assert.equal(pulseOpacity(1),0);
});
test('renderer executes full facility frame without invalid canvas coordinates',()=>{
 const lab=new Facility(18,3),p=new Player((lab.spawn.x+.5)*40,(lab.spawn.y+.5)*40);
 const guard=new Guard(lab.patrols[0],3);
 guard.x=p.x+40;guard.y=p.y;guard.state='CHASE';guard.suspicion=1;
 const cam=new SecurityCamera(lab.cameras[0],lab);cam.x=p.x;cam.y=p.y+40;
 let calls=0;
 const fn=(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));calls++;};
 const ctx=new Proxy({createRadialGradient(...args){fn(...args);return {addColorStop:fn};}},{
  get(target,k){return k in target?target[k]:fn;},set(target,k,v){target[k]=v;return true;}
 });
 render(ctx,{lab,player:p,canvas:{width:960,height:640},guards:[guard],cameras:[cam],time:1,dt:.016,impact:{kind:'danger',age:.1},lurePulse:{x:p.x,y:p.y,time:.8}});
 assert.ok(calls>100);
});
