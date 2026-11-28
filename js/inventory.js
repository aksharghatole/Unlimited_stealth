// Run-scoped equipment and optional archive evidence.
import { clearSight } from './security.js';
export const MAX_CHARGES=3;
export const JAM_DURATION=8;
export const JAM_RANGE=190;
export const ARCHIVE=[
 {id:'01',title:'Admission record',body:'Subject 07 arrived without a name. The memory treatment was authorized before consent was recorded. A nurse entered the name Mara in the margin, then crossed it out.'},
 {id:'02',title:'Night shift',body:'The order was to keep the lower floors running after evacuation. I heard someone calling from the ventilation shaft. I left a cell by the terminal. If you find this, keep moving. — M.'},
 {id:'03',title:'Protocol zero',body:'The treatment does not erase memory. It separates the memory from the person who owns it. Every successful subject has reported the same recurring dream: a door opening onto daylight.'},
 {id:'04',title:'Containment review',body:'The board voted to seal the facility. Staff on the lower levels were classified as equipment losses. The surface relay can transmit the archive, provided at least four independent records survive.'},
 {id:'05',title:'Surface relay',body:'If Subject 07 reaches the surface, the relay will accept the recovered records. Do not return to the operating room. Whoever you were before, you are still a person.'}
];
export class Inventory {
 constructor(){this.charges=1;this.records=new Map();}
 collectCell(item){
   if(item?.type!=='cell'||item.collected||this.charges>=MAX_CHARGES)return false;
   this.charges++;item.collected=true;return true;
 }
 read(item){
   const entry=ARCHIVE.find(r=>r.id===item?.id);
   if(item?.type!=='archive'||!entry||item.collected||this.records.has(entry.id))return false;
   this.records.set(entry.id,entry);item.collected=true;return true;
 }
 jam(player,cameras,lab){
   if(this.charges<=0)return 0;
   const targets=cameras.filter(c=>!c.disabledFor&&Math.hypot(c.x-player.x,c.y-player.y)<=JAM_RANGE&&clearSight(lab,player,c));
   if(!targets.length)return 0;
   this.charges--;
   for(const c of targets)c.disable(JAM_DURATION);
   return targets.length;
 }
 ending(){
   return this.records.size>=4?'TRANSMISSION — you escaped and exposed Protocol Zero.':'FUGITIVE — you escaped, but the facility kept its secrets.';
 }
}
export function nearbyItem(items,player,lab,range=52){
 return items.filter(i=>!i.collected&&lab.distanceTo(player,i)<=range&&clearSight(lab,player,{x:(i.x+.5)*lab.tileSize,y:(i.y+.5)*lab.tileSize}))
   .sort((a,b)=>lab.distanceTo(player,a)-lab.distanceTo(player,b))[0]||null;
}
