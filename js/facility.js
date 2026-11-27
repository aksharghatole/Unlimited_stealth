// Seeded facility sectors: connected rooms, randomized doors and local patrols.
import { Lab, TileType } from './lab.js';
export const FLOOR_COUNT = 5;
export function randomFromSeed(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
const pick = (rng, array) => array[Math.floor(rng()*array.length)];
const key = p => p.x + ',' + p.y;
export class Facility extends Lab {
  constructor(seed, floor) {
    super();
    if (!Number.isInteger(floor) || floor < 1 || floor > FLOOR_COUNT) throw new RangeError('Invalid floor');
    this.floor = floor;
    this.seed = seed >>> 0;
    const rng = randomFromSeed((this.seed ^ Math.imul(floor, 0x9e3779b9)) >>> 0);
    const cols = floor >= 4 ? 4 : 3, rows = 3;
    this.width = cols * 6 + 1; this.height = rows * 6 + 1;
    this.map = Array.from({length:this.height},()=>Array(this.width).fill(TileType.WALL));
    const rooms = [];
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){
      const room = {id:rooms.length,x:x*6+1,y:y*6+1, col:x,row:y};
      room.center={x:room.x+2,y:room.y+2};
      rooms.push(room);
      for(let j=room.y;j<room.y+5;j++) for(let i=room.x;i<room.x+5;i++) this.map[j][i]=TileType.FLOOR;
    }
    const edges=[];
    for(const room of rooms){
      if(room.col+1<cols) edges.push([room.id,room.id+1]);
      if(room.row+1<rows) edges.push([room.id,room.id+cols]);
    }
    const graph=rooms.map(()=>[]);
    function connect(a,b,map){
      const p=rooms[a],q=rooms[b];
      graph[a].push(b); graph[b].push(a);
      // Door lies between adjoining rooms; choose one of three interior positions.
      if(p.row===q.row) map[p.y+1+Math.floor(rng()*3)][Math.min(p.x,q.x)+5]=TileType.FLOOR;
      else map[Math.min(p.y,q.y)+5][p.x+1+Math.floor(rng()*3)]=TileType.FLOOR;
    }
    const start=pick(rng,rooms).id;
    const visited=new Set([start]);
    while(visited.size<rooms.length){
      const [a,b]=pick(rng,edges.filter(([a,b])=>visited.has(a)!==visited.has(b)));
      connect(a,b,this.map); visited.add(a); visited.add(b);
    }
    const extra=edges.filter(([a,b])=>!graph[a].includes(b));
    for(let i=0;i<Math.min(2,extra.length);i++){
      const [a,b]=extra.splice(Math.floor(rng()*extra.length),1)[0]; connect(a,b,this.map);
    }
    const distance=Array(rooms.length).fill(-1),queue=[start];
    distance[start]=0;
    for(let i=0;i<queue.length;i++) for(const n of graph[queue[i]]) if(distance[n]<0){distance[n]=distance[queue[i]]+1;queue.push(n);}
    const ordered=rooms.filter(r=>r.id!==start).sort((a,b)=>distance[b.id]-distance[a.id]);
    const exitRoom=ordered[0], cardRoom=pick(rng,ordered.slice(1,Math.min(5,ordered.length)));
    this.spawn=rooms[start].center;
    this.exit={x:exitRoom.x+4,y:exitRoom.y+4};
    this.card=cardRoom.center;
    this.map[this.exit.y][this.exit.x]=TileType.DOOR_LOCKED;
    const candidates=rooms.filter(r=>r.id!==start);
    this.patrols=[];
    for(let i=0;i<Math.min(floor+1,candidates.length);i++){
      const r=candidates.splice(Math.floor(rng()*candidates.length),1)[0];
      const path=[{x:r.x,y:r.y},{x:r.x+4,y:r.y},{x:r.x+4,y:r.y+4},{x:r.x,y:r.y+4}];
      // Avoid the locked exit tile in the exit room.
      if(r.id===exitRoom.id) for(const p of path) if(p.x===this.exit.x) p.x--;
      const shift=Math.floor(rng()*path.length);
      this.patrols.push(path.slice(shift).concat(path.slice(0,shift)));
    }
  }
  collect(player) {
    if(this.keycardTaken || this.distanceTo(player,this.card)>55) return false;
    this.keycardTaken=true; this.openExit(); return true;
  }
  distanceTo(player,tile) {
    return Math.hypot(player.x-(tile.x+.5)*this.tileSize,player.y-(tile.y+.5)*this.tileSize);
  }
  reachedExit(player) { return this.exitOpen && this.distanceTo(player,this.exit)<22; }
  // Reachability utility for generation regression tests.
  reachable(from=this.spawn) {
    const seen=new Set([key(from)]),queue=[from];
    for(let i=0;i<queue.length;i++){
      const {x,y}=queue[i];
      for(const p of [{x:x+1,y},{x:x-1,y},{x,y:y+1},{x,y:y-1}]){
        if(!seen.has(key(p))&&!this.isWall(p.x,p.y)){seen.add(key(p));queue.push(p);}
      }
    }
    return seen;
  }
}
