// Security systems for procedural sectors. All simulation is independent of the DOM.
import { Scientist } from './scientist.js';
import { TileType } from './lab.js';
const tile = (p, lab) => ({x:Math.floor(p.x/lab.tileSize),y:Math.floor(p.y/lab.tileSize)});
const key = p => p.x+','+p.y;
const center = (p,lab) => ({x:(p.x+.5)*lab.tileSize,y:(p.y+.5)*lab.tileSize});
const clamp = n => Math.max(0,Math.min(1,n));
export function findRoute(lab, start, goal) {
  if(lab.isWall(start.x,start.y)||lab.isWall(goal.x,goal.y)) return [];
  const queue=[start], prev=new Map([[key(start),null]]);
  for(let i=0;i<queue.length;i++){
    const p=queue[i];
    if(key(p)===key(goal)){
      const route=[];
      for(let at=p;at;at=prev.get(key(at))) route.unshift(at);
      return route;
    }
    for(const n of [{x:p.x+1,y:p.y},{x:p.x-1,y:p.y},{x:p.x,y:p.y+1},{x:p.x,y:p.y-1}]){
      if(!prev.has(key(n))&&!lab.isWall(n.x,n.y)){prev.set(key(n),p);queue.push(n);}
    }
  }
  return [];
}
export function isHidden(player,lab) {
  const t=tile(player,lab);
  return !!player.crouching && lab.map[t.y]?.[t.x]===TileType.VENT;
}
export function clearSight(lab,a,b) {
  const dx=b.x-a.x,dy=b.y-a.y;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5));
  for(let i=1;i<=steps;i++){
    const t=tile({x:a.x+dx*i/steps,y:a.y+dy*i/steps},lab);
    if(lab.isOpaque(t.x,t.y)) return false;
  }
  return true;
}
export function sees(observer,player,lab,range=220,halfAngle=.6) {
  const dx=player.x-observer.x,dy=player.y-observer.y,dist=Math.hypot(dx,dy);
  if(isHidden(player,lab) && dist>28) return false;
  if(dist>range || (player.crouching && dist>range*.60)) return false;
  if(dist>25 && Math.cos(Math.atan2(dy,dx)-observer.heading)<Math.cos(halfAngle)) return false;
  return clearSight(lab,observer,player);
}
export class Guard extends Scientist {
  constructor(path,floor) {
    super(path);
    this.isGuard=true;this.speed=50+floor*5;
    this.suspicion=0;this.memory=0;this.goal=null;this.waypoint=null;this.searchTime=0;
  }
  investigate(point,lab) {
    if(this.state==='CHASE') return;
    this.state='SEARCH';this.goal=tile(point,lab);this.searchTime=3;
  }
  moveToGoal(dt,lab,speed) {
    // Finish the current tile-center waypoint before planning another step.
    if(!this.waypoint){
      const here=tile(this,lab), c=center(here,lab);
      if(Math.hypot(c.x-this.x,c.y-this.y)>.01) this.waypoint=c;
      else {
        const route=findRoute(lab,here,this.goal);
        if(route.length<2) return true;
        this.waypoint=center(route[1],lab);
      }
    }
    const dx=this.waypoint.x-this.x,dy=this.waypoint.y-this.y,dist=Math.hypot(dx,dy);
    if(dist>0){
      this.heading=Math.atan2(dy,dx);
      const travel=Math.min(dist,speed*dt);
      this.x+=dx/dist*travel;this.y+=dy/dist*travel;
    }
    if(dist<=speed*dt+.001){this.x=this.waypoint.x;this.y=this.waypoint.y;this.waypoint=null;}
    return false;
  }
  tick(dt,player,lab) {
    const visible=sees(this,player,lab);
    this.suspicion=clamp(this.suspicion+(visible?dt*(player.crouching?.65:1.25):-dt*.55));
    if(visible && (this.suspicion>=1||this.state==='CHASE')){
      this.state='CHASE';this.goal=tile(player,lab);this.memory=2.5;
    }else if(this.state==='CHASE'){
      this.memory-=dt;
      if(this.memory<=0){this.state='SEARCH';this.searchTime=2;}
    }
    if(this.state==='PATROL'){
      // Stop and look at a suspicious subject rather than walking away.
      if(visible && this.suspicion>.25) this.heading=Math.atan2(player.y-this.y,player.x-this.x);
      else super.update(dt);
    }else if(this.state==='CHASE'){
      this.moveToGoal(dt,lab,this.speed*1.55);
    }else if(this.state==='SEARCH'){
      if(this.moveToGoal(dt,lab,this.speed)){
        this.heading+=dt*1.7;this.searchTime-=dt;
        if(this.searchTime<=0){this.state='RETURN';this.goal=this.path[0];}
      }
    }else if(this.state==='RETURN'){
      if(this.moveToGoal(dt,lab,this.speed)){
        this.state='PATROL';this.pathIndex=0;this.pauseTimer=0;
      }
    }
    return this.state==='CHASE' && Math.hypot(player.x-this.x,player.y-this.y)<23 && clearSight(lab,this,player);
  }
}
export class SecurityCamera {
  constructor(spec,lab){
    Object.assign(this,center(spec,lab));
    this.base=spec.heading;this.heading=this.base;this.time=spec.phase;this.suspicion=0;this.cooldown=0;
  }
  tick(dt,player,lab){
    this.time+=dt;this.heading=this.base+Math.sin(this.time*.8)*.65;
    this.cooldown=Math.max(0,this.cooldown-dt);
    this.suspicion=clamp(this.suspicion+(sees(this,player,lab,190,.45)?dt*.8:-dt*.65));
    if(this.suspicion>=1 && this.cooldown===0){this.cooldown=4;return true;}
    return false;
  }
}
export function lureNearest(guards,point,lab,radius=240){
  const eligible=guards.filter(g=>g.state!=='CHASE'&&Math.hypot(g.x-point.x,g.y-point.y)<=radius)
    .filter(g=>findRoute(lab,tile(g,lab),tile(point,lab)).length>0)
    .sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y));
  if(!eligible.length)return false;
  eligible[0].investigate(point,lab);return true;
}
