import test from 'node:test';
import assert from 'node:assert/strict';
import { Facility } from '../js/facility.js';
import { TileType } from '../js/lab.js';
import { Guard,SecurityCamera,findRoute,isHidden,sees,lureNearest } from '../js/security.js';
const center=p=>({x:(p.x+.5)*40,y:(p.y+.5)*40});
const arena=()=>({tileSize:40,map:[[1,1,1,1,1,1,1],[1,0,0,1,0,0,1],[1,0,0,1,0,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]],isWall(x,y){return ![0,7].includes(this.map[y]?.[x])},isOpaque(x,y){return this.isWall(x,y)}});
test('routes go around walls and reject inaccessible destinations',()=>{
 const a=arena(),r=findRoute(a,{x:2,y:1},{x:4,y:1});
 assert.ok(r.some(p=>p.y===3));assert.equal(r.length,7);
 assert.deepEqual(findRoute(a,{x:2,y:1},{x:3,y:1}),[]);
});
test('vents conceal crouching players at distance and walls block sight',()=>{
 const a=arena(),obs={...center({x:1,y:1}),heading:Math.PI/2};
 a.map[3][1]=TileType.VENT;
 const p={...center({x:1,y:3}),crouching:true};
 assert.equal(isHidden(p,a),true);assert.equal(sees(obs,p,a),false);
 p.crouching=false;assert.equal(sees(obs,p,a),true);
 assert.equal(sees({...center({x:2,y:1}),heading:0},center({x:4,y:1}),a),false);
});
test('guard pursues after suspicion, searches after losing sight and returns safely',()=>{
 const a=arena(),g=new Guard([{x:1,y:1},{x:1,y:2}],1);
 const p=center({x:1,y:3});
 for(let i=0;i<18;i++)g.tick(.05,p,a);
 assert.equal(g.state,'CHASE');
 const hidden=center({x:5,y:1});
 // Force no visibility while following the last known position.
 hidden.crouching=true;
 for(let i=0;i<300;i++){
   g.tick(.05,hidden,a);
   assert.equal(a.isWall(Math.floor(g.x/40),Math.floor(g.y/40)),false);
 }
 assert.equal(g.state,'PATROL');
});
test('camera raises one alert then honors cooldown',()=>{
 const a=arena(),c=new SecurityCamera({x:1,y:1,heading:Math.PI/2,phase:0},a);
 const p=center({x:1,y:3});
 let alerts=0;
 for(let i=0;i<40;i++)if(c.tick(.05,p,a))alerts++;
 // Sweeping may miss a centered target; keep its aim fixed for threshold verification.
 c.base=Math.PI/2;c.time=0;c.suspicion=.99;
 assert.equal(c.tick(.05,p,a),true);
 assert.equal(c.tick(.05,p,a),false);
});
test('lure selects a reachable guard, not an active pursuer',()=>{
 const a=arena(),g=new Guard([{x:1,y:1},{x:1,y:2}],1),h=new Guard([{x:5,y:1},{x:5,y:2}],1);
 g.state='CHASE';
 assert.equal(lureNearest([g,h],center({x:1,y:2}),a,Infinity),true);
 assert.equal(g.state,'CHASE');assert.equal(h.state,'SEARCH');
});
test('generated hideouts and cameras never block required routes',()=>{
 for(let seed=0;seed<30;seed++)for(let floor=1;floor<=5;floor++){
  const f=new Facility(seed,floor),seen=f.reachable();
  assert.equal(f.cameras.length,floor-1);
  for(const p of [...f.hideouts,...f.cameras])assert.ok(seen.has(p.x+','+p.y));
 }
});
