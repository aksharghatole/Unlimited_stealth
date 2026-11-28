// UMBRA presentation: industrial tiles, wall-clipped light and procedural sprites.
import { TileType } from './lab.js';
import { Camera, conePoints, tileNoise, pulseOpacity } from './visuals.js';
const cameraRig=new Camera();
const palettes=[
  ['#273039','#37434b','#80949b','#73b9bb'],
  ['#29353b','#455356','#80928b','#81c7b4'],
  ['#302b35','#45404c','#99869e','#b596d1'],
  ['#302f28','#4d483b','#a39c77','#d1b773'],
  ['#23323c','#394b57','#7e9fad','#80c9e7'],
  ['#352b2b','#51403c','#a4877b','#d18d72']
];
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
function line(c,x,y,a,b,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke();}
function circle(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
function glow(c,x,y,r,color){
  const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
}
function drawTile(c,t,x,y,s,noise,p,light){
  const [base,wall,edge,accent]=p;
  rect(c,x,y,s,s,t===TileType.WALL?wall:base);
  rect(c,x+1,y+1,s-2,s-2,t===TileType.WALL?'#273036':noise>.5?'#303a3d':'#293235');
  line(c,x,y+s-1,x+s,y+s-1,'#10171b');
  line(c,x+s-1,y,x+s-1,y+s,'#141a1d');
  if(t===TileType.WALL){
    rect(c,x+1,y+1,s-2,5,edge);rect(c,x+1,y+s-7,s-2,6,'#12191d');
    rect(c,x+5,y+9,s-10,s-19,wall);
    if(noise>.87){rect(c,x+7,y+13,3,s-25,'#11191d');rect(c,x+s-10,y+13,3,s-25,'#11191d');}
  }else if(t===TileType.TABLE || t===TileType.DESK){
    rect(c,x+3,y+4,s-6,s-5,'#10191d');rect(c,x+3,y+1,s-6,s-9,t===TileType.TABLE?'#708184':'#545550');
    rect(c,x+6,y+4,s-12,s-15,t===TileType.TABLE?'#465d61':'#363b38');
    if(t===TileType.DESK){rect(c,x+10,y+8,14,9,'#142728');rect(c,x+12,y+10,10,5,'#75c0ae');}
  }else if(t===TileType.VENT){
    rect(c,x+4,y+4,s-8,s-8,'#142d29');rect(c,x+6,y+6,s-12,s-12,'#234b42');
    for(let i=9;i<s-5;i+=5)line(c,x+8,y+i,x+s-8,y+i,'#111e20',2);
    rect(c,x+6,y+6,3,3,'#83d5b3');
  }else if(t===TileType.DOOR_OPEN || t===TileType.DOOR_LOCKED){
    rect(c,x+2,y+2,s-4,s-4,'#121a1b');rect(c,x+5,y+5,s-10,s-10,t===TileType.DOOR_OPEN?'#315e4f':'#653d39');
    for(let i=6;i<s-5;i+=8)line(c,x+i,y+5,x+5,y+i,'#b69a59',2);
    rect(c,x+s-10,y+5,5,4,t===TileType.DOOR_OPEN?'#7affbb':'#ff8f75');
  }else if(t===TileType.GLASS){
    rect(c,x+2,y+2,s-4,s-4,'#32515b');line(c,x+5,y+s-6,x+s-6,y+5,'#729aa4',2);
  }else{
    if(noise>.92){rect(c,x+5,y+5,5,2,accent);rect(c,x+5,y+9,2,3,'#8e9a91');}
    if(noise<.08)line(c,x+10,y+12,x+17,y+16,'#171f22');
  }
  if(light<1)rect(c,x,y,s,s,'rgba(3,8,12,'+(1-light)+')');
}
function beam(c,lab,observer,range,angle,offset,tint){
  const pts=conePoints(lab,observer,range,angle);
  const x=observer.x-offset.x,y=observer.y-offset.y;
  const g=c.createRadialGradient(x,y,0,x,y,range);
  g.addColorStop(0,tint);g.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=g;c.beginPath();c.moveTo(x,y);
  for(const p of pts)c.lineTo(p.x-offset.x,p.y-offset.y);
  c.closePath();c.fill();
}
function character(c,x,y,heading,kind,stride,crouched){
  const player=kind==='player',guard=kind==='guard';
  c.save();c.translate(x,y);c.rotate(heading||0);
  if(crouched)c.scale(.76,.83);
  c.fillStyle='rgba(0,0,0,.55)';c.beginPath();c.ellipse(-2,3,14,9,0,0,Math.PI*2);c.fill();
  const step=Math.sin(stride||0)*3;
  rect(c,-9+step,-6,7,4,'#172125');rect(c,-9-step,3,7,4,'#172125');
  rect(c,-6,-8,12,16,player?'#354d4a':guard?'#6d5045':'#b3b9b4');
  rect(c,-4,-6,8,12,player?'#728e84':guard?'#b28163':'#d6dcd3');
  rect(c,-7,-4,4,8,player?'#182e2d':'#353b3a');
  circle(c,5,0,5.5,player?'#b7c9bd':guard?'#373b3d':'#738b91');
  rect(c,7,-3,3,6,player?'#a7f9ce':guard?'#ffb36e':'#a8dfff');
  c.restore();
}
function label(c,text,x,y,color){c.textAlign='center';c.font='bold 10px monospace';c.fillStyle=color;c.fillText(text,x,y);c.textAlign='start';}
export function render(ctx,state){
  const {lab,player,canvas}=state,ts=lab.tileSize,time=state.time||0,reduced=!!state.reducedMotion;
  const offset=cameraRig.follow(lab,player,canvas.width,canvas.height,state.dt??.016,reduced);
  const camX=offset.x,camY=offset.y;
  const p=palettes[Math.min(5,lab.floor||0)];
  rect(ctx,0,0,canvas.width,canvas.height,'#05090d');
  const radius=player.crouching?270:320;
  for(let y=0;y<lab.height;y++)for(let x=0;x<lab.width;x++){
    const tx=x*ts-camX,ty=y*ts-camY;
    if(tx+ts<0||ty+ts<0||tx>canvas.width||ty>canvas.height)continue;
    const dist=Math.hypot(x*ts+ts/2-player.x,y*ts+ts/2-player.y);
    const light=Math.max(0,1-dist/radius);
    if(light<.01)continue;
    drawTile(ctx,lab.map[y][x],tx,ty,ts,tileNoise(x,y),p,.16+.84*light);
  }
  const px=player.x-camX,py=player.y-camY;
  glow(ctx,px,py,145,'rgba(100,180,162,.10)');
  if(state.introStep==='AWAKE'||state.introStep==='RESTRAINTS'){
    glow(ctx,px,py,190,'rgba(192,226,238,.22)');
  }
  const actors=[...(state.scientist?[state.scientist]:[]),...(state.guards||[])];
  for(const a of actors){
    if(Math.hypot(a.x-player.x,a.y-player.y)>330)continue;
    const chase=a.state==='CHASE';
    beam(ctx,lab,a,220,.6,offset,chase?'rgba(255,90,65,.40)':'rgba(255,205,126,.24)');
    const x=a.x-camX,y=a.y-camY;
    character(ctx,x,y,a.heading,a.isGuard?'guard':'scientist',reduced?0:time*9,false);
    if(a.isGuard&&(a.state!=='PATROL'||a.suspicion>.25)){
      label(ctx,chase?'!':'?',x,y-20,chase?'#ff8d76':'#ffce87');
      rect(ctx,x-12,y-16,24,2,'#182021');rect(ctx,x-12,y-16,24*(chase?1:a.suspicion||0),2,chase?'#ff745d':'#efbf73');
    }
  }
  for(const a of state.cameras||[]){
    if(Math.hypot(a.x-player.x,a.y-player.y)>330)continue;
    if(!a.disabledFor)beam(ctx,lab,a,190,.45,offset,a.suspicion>.5?'rgba(255,82,85,.34)':'rgba(112,183,255,.24)');
    const x=a.x-camX,y=a.y-camY;
    ctx.save();ctx.translate(x,y);ctx.rotate(a.heading);
    rect(ctx,-10,-6,19,12,'#1b282f');rect(ctx,-8,-4,13,8,'#71838b');rect(ctx,5,-3,5,6,a.disabledFor?'#4a555a':a.suspicion>.5?'#ff766d':'#9ed8ff');ctx.restore();
    if(a.disabledFor)label(ctx,'OFFLINE '+Math.ceil(a.disabledFor)+'s',x,y-14,'#9dddc9');
  }
  if(state.lurePulse){const a=state.lurePulse;ctx.strokeStyle='rgba(117,223,203,'+Math.max(0,a.time/1.2)+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x-camX,a.y-camY,12+(1.2-a.time)*120,0,Math.PI*2);ctx.stroke();}
  const objectiveCard=lab.card||(!lab.keycardTaken&&state.introStep==='KEYCARD'?{x:8,y:12}:null);
  const objectiveExit=lab.exit||(lab.exitOpen?{x:14,y:14}:null);
  if(objectiveCard&&!lab.keycardTaken){
    const x=(objectiveCard.x+.5)*ts,y=(objectiveCard.y+.5)*ts;
    if(Math.hypot(x-player.x,y-player.y)<230){
      const sx=x-camX,sy=y-camY;
      glow(ctx,sx,sy,30,'rgba(255,184,92,.24)');
      rect(ctx,sx-9,sy-5,18,10,'#f7c67c');rect(ctx,sx-6,sy-2,5,4,'#584029');
      label(ctx,'ACCESS CARD',sx,sy-14,'#ffd799');
    }
  }
  if(objectiveExit){
    const x=(objectiveExit.x+.5)*ts,y=(objectiveExit.y+.5)*ts;
    if(Math.hypot(x-player.x,y-player.y)<250){
      const sx=x-camX,sy=y-camY,col=lab.exitOpen?'#95eac4':'#e08b7c';
      glow(ctx,sx,sy,34,lab.exitOpen?'rgba(80,255,160,.18)':'rgba(255,80,65,.13)');
      label(ctx,lab.exitOpen?'EXIT':'LOCKED',sx,sy-24,col);
    }
  }
  for(const item of lab.items||[]){
    if(item.collected)continue;
    const x=(item.x+.5)*ts,y=(item.y+.5)*ts;
    if(Math.hypot(x-player.x,y-player.y)>210)continue;
    const sx=x-camX,sy=y-camY,cell=item.type==='cell';
    rect(ctx,sx-9,sy-7,18,14,'#15252b');rect(ctx,sx-7,sy-5,14,10,cell?'#b3d58b':'#7fbddc');
    if(cell)rect(ctx,sx+9,sy-2,3,4,'#b3d58b');else line(ctx,sx-4,sy,sx+4,sy,'#233f50',2);
    label(ctx,cell?'CELL [E]':'ARCHIVE [E]',sx,sy-13,cell?'#d1e7ae':'#a2daf6');
  }
  character(ctx,px,py,player.heading,'player',reduced?0:player.stride,player.crouching);
  if(player.crouching)label(ctx,state.concealed?'CONCEALED':'CROUCH',px,py-19,'#a7e8cc');
  // Low-cost foreground dust, static for reduced-motion users.
  ctx.globalAlpha=.16;
  for(let i=0;i<25;i++){const x=(i*97.31+(reduced?0:time*7))%canvas.width,y=(i*53.9+(reduced?0:time*3))%canvas.height;rect(ctx,x,y,1,1,'#bcd1ce');}
  ctx.globalAlpha=1;
  if(state.impact && state.impact.age<.45){
    const alpha=pulseOpacity(state.impact.age)*(reduced?.25:.65);
    ctx.strokeStyle=state.impact.kind==='danger'?'rgba(238,103,80,'+alpha+')':'rgba(138,230,195,'+alpha+')';
    ctx.lineWidth=8;ctx.strokeRect(4,4,canvas.width-8,canvas.height-8);
  }
  return {camX,camY,ts};
}
