import test from 'node:test';
import assert from 'node:assert/strict';
import { Inventory,nearbyItem,MAX_CHARGES,JAM_DURATION,ARCHIVE } from '../js/inventory.js';
import { SecurityCamera } from '../js/security.js';
import { Facility } from '../js/facility.js';
const center=p=>({x:(p.x+.5)*40,y:(p.y+.5)*40});
test('cell capacity and one-time pickups',()=>{
 const i=new Inventory(),a={type:'cell'},b={type:'cell'},c={type:'cell'};
 assert.equal(i.collectCell(a),true);assert.equal(i.collectCell(a),false);
 assert.equal(i.collectCell(b),true);assert.equal(i.charges,MAX_CHARGES);
 assert.equal(i.collectCell(c),false);assert.ok(!c.collected);
});
test('optional records unlock alternate ending once per record',()=>{
 const i=new Inventory();assert.match(i.ending(),/FUGITIVE/);
 for(const r of ARCHIVE.slice(0,4)){const item={type:'archive',id:r.id};assert.ok(i.read(item));assert.ok(!i.read(item));assert.ok(!i.read({type:'archive',id:r.id}));}
 assert.match(i.ending(),/TRANSMISSION/);
});
test('jammer consumes a charge only for active unobstructed cameras and recovers',()=>{
 const lab={tileSize:40,isOpaque:(x,y)=>x===3};
 const a=new SecurityCamera({x:2,y:1,heading:0,phase:0},lab);
 const b=new SecurityCamera({x:4,y:1,heading:0,phase:0},lab);
 const i=new Inventory(),p=center({x:1,y:1});
 assert.equal(i.jam(p,[b],lab),0);assert.equal(i.charges,1);
 assert.equal(i.jam(p,[a,b],lab),1);assert.equal(i.charges,0);assert.equal(a.disabledFor,JAM_DURATION);assert.equal(b.disabledFor,0);
 a.suspicion=.99;assert.equal(a.tick(1,p,lab),false);assert.equal(a.disabledFor,7);
 a.tick(7,p,lab);assert.equal(a.disabledFor,0);
});
test('optional items are reachable and distinct across 250 generated sectors',()=>{
 for(let seed=0;seed<50;seed++)for(let floor=1;floor<=5;floor++){
  const f=new Facility(seed,floor),seen=f.reachable();
  assert.equal(f.items.length,2);
  for(const item of f.items){
   assert.ok(seen.has(item.x+','+item.y));
   assert.notDeepEqual({x:item.x,y:item.y},f.card);
   assert.equal(nearbyItem(f.items,center(item),f),item);
  }
 }
});
