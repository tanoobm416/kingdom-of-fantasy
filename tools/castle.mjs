import {writeFile} from 'node:fs/promises';
import {Group,Mesh,MeshStandardMaterial,BoxGeometry,CylinderGeometry,ConeGeometry} from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';

globalThis.FileReader=class{
 readAsArrayBuffer(blob){blob.arrayBuffer().then(data=>{this.result=data;this.onloadend();});}
};
const castle=new Group();
const plaster=new MeshStandardMaterial({color:0xf0ca9a,roughness:.9});
const stone=new MeshStandardMaterial({color:0xc08b69,roughness:.86});
const roof=new MeshStandardMaterial({color:0x9a384c,roughness:.72});
const copper=new MeshStandardMaterial({color:0xd4a153,roughness:.54,metalness:.19});
const windowLight=new MeshStandardMaterial({color:0xffd17c,emissive:0xffa941,emissiveIntensity:.24,roughness:.84});
function mesh(geometry,material,x,y,z){
 const item=new Mesh(geometry,material);
 item.position.set(x,y,z);castle.add(item);return item;
}
const box=(material,x,y,z,w,h,d)=>mesh(new BoxGeometry(w,h,d),material,x,y,z);
box(stone,0,0,-.018,.76,.115,.18);
box(plaster,0,.14,0,.64,.29,.16);
box(stone,0,.025,.089,.11,.13,.018);
for(let i=-2;i<=2;i++)box(windowLight,i*.117,.17,.085,.033,.070,.015);
for(const [x,base,r,height,z] of [[-.294,.073,.079,.38,.032],[.286,.06,.072,.36,.026],[-.157,.13,.078,.43,-.051],[.175,.13,.072,.37,-.057],[.026,.15,.104,.56,-.049]]){
 const top=base+height;
 mesh(new CylinderGeometry(r,r*1.05,height,10),plaster,x,base+height/2,z);
 mesh(new CylinderGeometry(r*1.16,r*1.16,.031,10),stone,x,top,z);
 mesh(new ConeGeometry(r*1.16,height*.48,10),roof,x,top+height*.24,z);
 mesh(new ConeGeometry(.016,.041,6),copper,x,top+height*.48+.011,z);
 for(let y=base+.11;y<top-.05;y+=.12) box(windowLight,x,y,z+r,.024,.056,.013);
}
const data=await new GLTFExporter().parseAsync(castle,{binary:true});
await writeFile('dist/assets/castle.glb',new Uint8Array(data));
