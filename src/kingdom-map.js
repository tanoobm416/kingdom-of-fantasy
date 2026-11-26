import * as T from 'three';
import {diorama,kingdoms,paint,place,vec} from './kingdoms.js';

// The illustrated atlas is original. The route follows the order of the Book 1 kingdoms.
const regions={
  witches:[.24,.65],mermaids:[.74,.79],dragons:[.73,.60],pixies:[.27,.44],
  gnomes:[.41,.27],giants:[.74,.32],fairies:[.55,.105],island:[.21,.855]
};
const islands=[
  [[.11,.82],[.23,.74],[.31,.75],[.36,.83],[.29,.91],[.19,.94],[.12,.92]],
  [[.12,.66],[.16,.56],[.13,.49],[.22,.40],[.29,.38],[.31,.29],[.39,.24],[.46,.26],
   [.45,.18],[.51,.13],[.53,.065],[.63,.081],[.66,.16],[.62,.20],[.69,.23],[.80,.23],
   [.87,.29],[.84,.40],[.72,.42],[.65,.38],[.55,.44],[.47,.42],[.43,.51],[.33,.53],
   [.36,.60],[.32,.68],[.24,.73],[.18,.71]],
  [[.60,.62],[.62,.55],[.72,.53],[.84,.51],[.90,.59],[.83,.69],[.71,.71],[.62,.68]],
  [[.67,.82],[.73,.75],[.80,.74],[.86,.82],[.83,.89],[.75,.92],[.66,.88]],
  [[.52,.73],[.55,.70],[.59,.72],[.58,.77],[.53,.78]],
  [[.38,.73],[.42,.70],[.48,.71],[.49,.75],[.42,.78]],
  [[.88,.73],[.92,.69],[.95,.74],[.92,.79]]
];

function chartTexture(wide){
  const canvas=document.createElement('canvas');
  canvas.width=wide?1440:900;canvas.height=wide?900:1330;
  const ctx=canvas.getContext('2d');
  const w=canvas.width,h=canvas.height;
  ctx.scale(w,h);
  const water=ctx.createLinearGradient(0,0,1,1);
  water.addColorStop(0,'#e6cf9c');water.addColorStop(.36,'#c2c8a3');water.addColorStop(.90,'#8aaba0');water.addColorStop(1,'#d7be93');
  ctx.fillStyle=water;ctx.fillRect(0,0,1,1);
  let seed=5843;
  const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let i=0;i<15500;i++){
    ctx.fillStyle=i%3===0?'#624b3030':'#fff0cb42';
    ctx.fillRect(random(),random(),.001+random()*.002,.001+random()*.002);
  }
  function coast(shape){
    ctx.beginPath();
    for(let i=0;i<shape.length;i++){
      const p=shape[i], next=shape[(i+1)%shape.length];
      const x=(p[0]+next[0])/2,y=(p[1]+next[1])/2;
      if(!i)ctx.moveTo(x,y);
      else ctx.quadraticCurveTo(p[0],p[1],x,y);
    }
    ctx.quadraticCurveTo(...shape[0],(shape[0][0]+shape[1][0])/2,(shape[0][1]+shape[1][1])/2);
    ctx.closePath();
  }
  for(let i=0;i<islands.length;i++){
    const shape=islands[i];
    coast(shape);ctx.strokeStyle='#dce0b898';ctx.lineWidth=.019;ctx.stroke();
    ctx.strokeStyle='#557b716a';ctx.lineWidth=.009;ctx.stroke();
    const land=ctx.createLinearGradient(.25,.13,.7,.79);
    land.addColorStop(0,i===2?'#b7876c':'#b3b576');
    land.addColorStop(.65,i===2?'#d59d78':'#c9b889');
    land.addColorStop(1,'#e4c791');
    ctx.fillStyle=land;ctx.fill();
    ctx.strokeStyle='#637d60';ctx.lineWidth=.0027;ctx.stroke();
    ctx.save();ctx.clip();
    for(let j=0;j<330;j++){
      const x=random(),y=random();
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+.006+random()*.009,y-.006);
      ctx.strokeStyle=j%2===0?'#3d65483a':'#ffebbc64';ctx.lineWidth=.0011;ctx.stroke();
    }
    ctx.restore();
  }
  for(let i=0;i<104;i++){
    const x=.045+random()*.91,y=.115+random()*.79;
    if(Object.values(regions).some(([a,b])=>Math.hypot(a-x,b-y)<.105))continue;
    ctx.beginPath();ctx.moveTo(x-.011,y);ctx.quadraticCurveTo(x,y-.007,x+.010,y);
    ctx.strokeStyle='#e9e5baab';ctx.lineWidth=.00115;ctx.stroke();
  }
  // Draw etched terrain symbols around the raised landmark markers.
  function forest(x,y,scale){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale*(wide?1.35:.68));
    ctx.strokeStyle='#5867479e';ctx.fillStyle='#7b875163';ctx.lineWidth=.075;
    ctx.beginPath();ctx.moveTo(0,-1);ctx.lineTo(.56,.28);ctx.lineTo(.26,.22);
    ctx.lineTo(.61,.73);ctx.lineTo(-.61,.73);ctx.lineTo(-.26,.22);ctx.lineTo(-.56,.28);
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,.72);ctx.lineTo(0,1.04);ctx.stroke();ctx.restore();
  }
  function ridge(x,y,scale,shade){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale*(wide?1.40:.70));
    ctx.fillStyle=shade;ctx.strokeStyle='#77664b91';ctx.lineWidth=.065;
    ctx.beginPath();ctx.moveTo(-1.03,.5);ctx.lineTo(-.30,-.36);ctx.lineTo(.02,-1);
    ctx.lineTo(.38,-.39);ctx.lineTo(1.03,.56);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(.02,-1);ctx.lineTo(.14,-.28);ctx.lineTo(.69,.54);ctx.lineTo(.12,.33);
    ctx.closePath();ctx.fillStyle='#75674c55';ctx.fill();ctx.restore();
  }
  for(const [x,y] of [[.186,.59],[.214,.57],[.309,.61],[.331,.42],[.358,.44],[.363,.36],[.405,.34],[.436,.36],[.255,.48],[.223,.50],[.29,.49],[.174,.85],[.226,.91],[.253,.88]]){
    forest(x,y,.017+random()*.007);
  }
  for(const [x,y] of [[.707,.273],[.748,.255],[.786,.279],[.779,.365],[.807,.343],[.618,.133],[.602,.163],[.846,.568],[.832,.625],[.798,.650],[.684,.563]]){
    ridge(x,y,.025+random()*.007,y>.5?'#b9866d90':'#ddd6b7b8');
  }
  ctx.save();
  ctx.fillStyle='#5e6d5f9e';
  ctx.textAlign='center';
  ctx.font='italic '+(wide?22:20)+'px Georgia';
  ctx.scale(1/w,1/h);
  ctx.fillText('The Golden Sea',w*.54,h*.845);
  ctx.fillText('Beyond the mountains',w*.73,h*.185);
  ctx.restore();
  const order=['island',...kingdoms.filter(item=>item.gem).map(item=>item.id)];
  ctx.beginPath();
  order.forEach((id,i)=>{
    const [x,y]=regions[id];
    if(!i)ctx.moveTo(x,y+.014);
    else {
      const [px,py]=regions[order[i-1]];
      ctx.quadraticCurveTo((x+px)/2+.027,(y+py)/2-.029,x,y+.014);
    }
  });
  ctx.setLineDash([.007,.009]);ctx.strokeStyle='#7f503c';ctx.lineWidth=.0026;ctx.stroke();ctx.setLineDash([]);
  ctx.save();ctx.translate(.865,.126);ctx.scale(.85,wide?1.34:.61);
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8,r=i%2?.014:i%4===0?.058:.039;
    if(!i)ctx.beginPath();
    ctx.lineTo(Math.sin(a)*r,Math.cos(a)*r);
  }
  ctx.closePath();ctx.fillStyle='#76563cab';ctx.fill();
  ctx.beginPath();ctx.arc(0,0,.034,0,Math.PI*2);ctx.strokeStyle='#76563cb0';ctx.lineWidth=.0026;ctx.stroke();
  ctx.restore();
  ctx.strokeStyle='#735943';ctx.lineWidth=.0025;ctx.strokeRect(.014,.012,.972,.976);
  ctx.strokeStyle='#977952';ctx.lineWidth=.0013;ctx.strokeRect(.022,.019,.956,.962);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  return texture;
}

const brass=paint(0xb18346,{metalness:.35,roughness:.47});
function makePin(info){
  const root=new T.Group();root.name=info.id;
  const vignette=diorama(info.id,true);
  vignette.root.scale.set(.19,.24,.14);
  vignette.root.position.set(0,.02,.045);
  root.add(vignette.root);
  const backing=place(root,new T.CircleGeometry(.565,32),new T.MeshBasicMaterial({color:info.sky}),0,.235,-.17,1.08,1,1);
  backing.material.color.lerp(new T.Color(0xeae0ab),.24);
  place(root,new T.RingGeometry(.554,.574,32),brass,0,.235,-.16,1.08,1,1);
  const gem=place(root,new T.OctahedronGeometry(1),paint(info.color,{emissive:info.color,emissiveIntensity:.25,roughness:.32}),0,.77,.185,.108,.132,.095);
  const hit=place(root,new T.SphereGeometry(1,12,8),new T.MeshBasicMaterial({colorWrite:false,depthWrite:false}),0,.23,.18,.68,.69,.46);
  hit.userData.destination=info.id;
  const anchor=new T.Object3D();anchor.position.set(0,-.24,.22);root.add(anchor);
  return {info,root,anchor,hit,animate(t){vignette.animate(t);gem.rotation.y=t*.4;}};
}

export function createKingdomMap(){
  const scene=new T.Scene();scene.background=new T.Color(0x19282b);
  const page=place(scene,new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({toneMapped:false}),0,0,-.47);
  const pins=kingdoms.map(makePin);pins.forEach(({root})=>scene.add(root));
  scene.add(new T.HemisphereLight(0xffeac1,0x7b8793,2.15));
  const sun=new T.DirectionalLight(0xffe2b5,2.08);sun.position.set(-3,6,12);scene.add(sun);
  let landscape;
  const fov=46;
  function setLayout(aspect){
    const wide=aspect>1.12;
    const width=wide?13.35:7.37,height=wide?8.48:12.13;
    if(wide!==landscape){
      landscape=wide;
      page.material.map?.dispose();
      page.material.map=chartTexture(wide);page.material.needsUpdate=true;
      page.scale.set(width,height,1);
      pins.forEach(({info,root})=>{
        const [x,y]=regions[info.id];
        root.position.set((x-.5)*width,(.5-y)*height,0);
        root.scale.setScalar(wide?1.20:1);
      });
      scene.updateMatrixWorld(true);
    }
    const half=Math.max((height+.31)*.5,(width+.20)*.5/aspect);
    return {eye:vec(0,.41,.53+half/Math.tan(fov*Math.PI/360)),target:vec(0,.41,0),fov};
  }
  return {scene,pins,setLayout,animate(t){pins.forEach(pin=>pin.animate(t));}};
}
