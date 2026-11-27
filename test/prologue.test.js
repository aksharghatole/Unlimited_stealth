import test from 'node:test';
import assert from 'node:assert/strict';
import { IntroDirector, IntroState } from '../js/intro.js';
import { Lab, FREE_TILE, EXIT_TILE, TileType, SCIENTIST_PATH } from '../js/lab.js';
import { Player } from '../js/player.js';
import { Scientist } from '../js/scientist.js';

test('intro waits for start, then completes every objective exactly once', () => {
  const d = new IntroDirector();
  const seen = [];
  let completed = 0;
  d.on('onStep', ({started}) => { if (started) seen.push(started); });
  d.on('onComplete', () => completed++);
  d.update(100);
  assert.equal(d.currentStep(), null);
  d.start(); d.start();
  assert.equal(d.currentStep().id, IntroState.AWAKE);
  d.update(4);
  d.registerMouseMove(0,0); d.registerMouseMove(350,0);
  d.update(2.5);
  d.registerAction('hide'); d.registerAction('take_keycard');
  d.update(2); d.registerAction('reached_exit');
  d.advance();
  assert.deepEqual(seen, ['AWAKE','RESTRAINTS','FREE','SCIENTIST','KEYCARD','ALARM','ESCAPE']);
  assert.equal(completed, 1);
});

test('player can leave the table, walk south and crouch independently', () => {
  const lab = new Lab();
  const p = new Player((FREE_TILE.x+.5)*40,(FREE_TILE.y+.5)*40);
  p.canMove = true;
  assert.equal(p._collides(p.x,p.y,lab),false);
  const y = p.y;
  p.update(.1,{s:true},lab);
  assert.ok(p.y>y); assert.equal(p.crouching,false);
  const y2=p.y;
  p.update(.1,{c:true},lab);
  assert.equal(p.y,y2); assert.equal(p.crouching,true);
});

test('locked door and glass block movement, keycard opens exit', () => {
  const lab = new Lab();
  assert.equal(lab.isWall(5,3),true);
  assert.equal(lab.isOpaque(5,3),false);
  assert.equal(lab.isWall(EXIT_TILE.x,EXIT_TILE.y),true);
  lab.takeKeycard(); lab.openExit();
  assert.equal(lab.map[EXIT_TILE.y][EXIT_TILE.x],TileType.DOOR_OPEN);
  assert.equal(lab.isWall(EXIT_TILE.x,EXIT_TILE.y),false);
});

test('patrol stays on walkable tiles and respects direction', () => {
  const lab = new Lab();
  const npc = new Scientist(SCIENTIST_PATH);
  for(let i=0;i<1200;i++){
    npc.update(.05);
    assert.equal(lab.isWall(Math.floor(npc.x/40),Math.floor(npc.y/40)),false);
  }
  npc.x=13.5*40; npc.y=9.5*40; npc.heading=0;
  assert.equal(npc.canSee({x:npc.x-80,y:npc.y,crouching:false},lab),false);
  npc.heading=Math.PI;
  assert.equal(npc.canSee({x:npc.x-80,y:npc.y,crouching:false},lab),true);
  assert.equal(npc.canSee({x:npc.x-80,y:npc.y,crouching:true},lab),false);
});
