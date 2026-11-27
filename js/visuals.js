// Presentation helpers. No DOM dependencies or gameplay side effects.
export class Camera {
  constructor(){this.x=0;this.y=0;this.world=null;}
  follow(world,player,width,height,dt,reduced=false){
    const x=player.x-width/2,y=player.y-height/2;
    if(this.world!==world||reduced){this.x=x;this.y=y;this.world=world;}
    else {const k=1-Math.exp(-9*Math.max(0,dt));this.x+=(x-this.x)*k;this.y+=(y-this.y)*k;}
    return {x:this.x,y:this.y};
  }
}
// Grid DDA: find first opaque tile boundary, including exact corner crossings.
export function castRay(lab,x,y,angle,range){
  const ts=lab.tileSize,dx=Math.cos(angle),dy=Math.sin(angle);
  let tx=Math.floor(x/ts),ty=Math.floor(y/ts);
  const sx=dx<0?-1:1,sy=dy<0?-1:1;
  const ix=Math.abs(dx)<1e-10?Infinity:ts/Math.abs(dx);
  const iy=Math.abs(dy)<1e-10?Infinity:ts/Math.abs(dy);
  let nx=ix===Infinity?Infinity:((sx>0?(tx+1)*ts:tx*ts)-x)/dx;
  let ny=iy===Infinity?Infinity:((sy>0?(ty+1)*ts:ty*ts)-y)/dy;
  let d=0;
  while(Math.min(nx,ny)<=range){
    if(Math.abs(nx-ny)<1e-8){
      d=nx;
      if(lab.isOpaque(tx+sx,ty)||lab.isOpaque(tx,ty+sy))break;
      tx+=sx;ty+=sy;nx+=ix;ny+=iy;
    }else if(nx<ny){d=nx;tx+=sx;nx+=ix;}
    else{d=ny;ty+=sy;ny+=iy;}
    if(lab.isOpaque(tx,ty))break;
    d=range;
  }
  // No hit, including the case where the initial boundary is out of range.
  if(Math.min(nx,ny)>range && !lab.isOpaque(tx,ty))d=range;
  return {x:x+dx*d,y:y+dy*d,distance:d};
}
export function conePoints(lab,observer,range,halfAngle,segments=32){
  return Array.from({length:segments+1},(_,i)=>castRay(lab,observer.x,observer.y,observer.heading-halfAngle+2*halfAngle*i/segments,range));
}
export function tileNoise(x,y){return ((Math.imul(x+91,73856093)^Math.imul(y+17,19349663))>>>0)%997/997;}
export function pulseOpacity(age,duration=.45){return Math.max(0,1-Math.max(0,age)/duration);}
