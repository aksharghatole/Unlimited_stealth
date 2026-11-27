import test from 'node:test';
import assert from 'node:assert/strict';
import { Facility, FLOOR_COUNT } from '../js/facility.js';
import { Scientist } from '../js/scientist.js';
import { Player } from '../js/player.js';

const key = p => p.x+','+p.y;
const center = p => ({x:(p.x+.5)*40,y:(p.y+.5)*40});

test('every generated sector is connected, has a reachable card and unlockable exit', () => {
  for(let seed=0;seed<100;seed++) for(let floor=1;floor<=FLOOR_COUNT;floor++){
    const lab=new Facility(seed,floor);
    const seen=lab.reachable();
    assert.ok(seen.has(key(lab.card)));
    assert.ok(!seen.has(key(lab.exit)));
    const p=new Player(...Object.values(center(lab.spawn)));
    assert.equal(p._collides(p.x,p.y,lab),false);
    assert.equal(lab.collect(p),false);
    assert.equal(lab.reachedExit(center(lab.exit)),false);
    assert.equal(lab.collect(center(lab.card)),true);
    assert.equal(lab.collect(center(lab.card)),false);
    assert.ok(lab.reachable().has(key(lab.exit)));
    assert.equal(lab.reachedExit(center(lab.exit)),true);
    const unlocked=lab.reachable();
    for(let y=0;y<lab.height;y++) for(let x=0;x<lab.width;x++)
      if(!lab.isWall(x,y)) assert.ok(unlocked.has(x+','+y));
  }
});

test('seed replay is deterministic and floors increase patrol count',()=>{
  for(let n=1;n<=FLOOR_COUNT;n++){
    const a=new Facility(42,n), b=new Facility(42,n);
    assert.deepEqual(a.map,b.map); assert.deepEqual(a.patrols,b.patrols);
    assert.equal(a.patrols.length,n+1);
  }
  assert.notDeepEqual(new Facility(42,1).map,new Facility(43,1).map);
});

test('patrol paths never cross solid tiles, including the locked elevator',()=>{
  for(let seed=0;seed<20;seed++) for(let floor=1;floor<=FLOOR_COUNT;floor++){
    const lab=new Facility(seed,floor);
    for(const path of lab.patrols){
      const guard=new Scientist(path);
      for(let i=0;i<600;i++){
        guard.update(.05);
        assert.equal(lab.isWall(Math.floor(guard.x/40),Math.floor(guard.y/40)),false);
      }
    }
  }
});
