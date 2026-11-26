import * as T from 'three';
import {createDragonRealm,dragonView} from './dragons.js';
import {decorateRealm} from './realm-life.js';

export const kingdoms=[
  {id:'witches', name:'Witches', gem:'Ruby', color:0xeb526c, sky:0x241e3d, floor:0x332e48, title:'Fortress of Fear', detail:'Queen Cackle’s fortress rises above the Wicked Witch Woods.'},
  {id:'mermaids', name:'Mermaids', gem:'Topaz', color:0xffb354, sky:0x154c65, floor:0x248288, title:'Coral Castle', detail:'Queen Aquafin’s rose-colored palace lies beneath the waves.'},
  {id:'dragons', name:'Dragons', gem:'Citrine', color:0xf2d15c, sky:0x532a37, floor:0x462b37, title:'Dragonaire', detail:'King Firebreath III’s volcano palace overlooks the dragon runway.'},
  {id:'pixies', name:'Pixies', gem:'Emerald', color:0x59d796, sky:0x23574d, floor:0x4c7a40, title:'Big Bluebell', detail:'Look for King Chuckles’s great bluebell among the flowers.'},
  {id:'gnomes', name:'Gnomes', gem:'Sapphire', color:0x659cf0, sky:0x334f72, floor:0x57674a, title:'Big Bark Lodge', detail:'King Factual and Queen Cozy live beside the woodland gardens.'},
  {id:'giants', name:'Giants', gem:'Amethyst', color:0xbf91f4, sky:0x474966, floor:0x5d5c72, title:'Falcon’s Beak', detail:'Meet the giant Strongheart among the snowy crags of Falcon’s Beak.'},
  {id:'fairies', name:'Fairies', gem:'Diamond', color:0xd5f7ff, sky:0x627ca6, floor:0x738973, title:'Crystal Castle', detail:'Sunlight falls on Queen Blossom’s Crystal Castle.'},
  {id:'island', name:'Return to the island', gem:'', color:0xeac385, sky:0x354b3e, floor:0x657d3e, title:'The golden stair', detail:''}
];

export const vec=(x,y,z)=>new T.Vector3(x,y,z);

const box=new T.BoxGeometry(1,1,1);
const stone=new T.DodecahedronGeometry(1,0);
const orb=new T.IcosahedronGeometry(1,1);
const cone=new T.ConeGeometry(1,1,7);
const cylinder=new T.CylinderGeometry(1,1,1,9);
const materials=new Map();
export function paint(color,extra){
  if(extra)return new T.MeshStandardMaterial({color,roughness:.76,...extra});
  if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.88,flatShading:true}));
  return materials.get(color);
}
export function place(group,geometry,material,x,y,z,w=1,h=w,d=w){
  const item=new T.Mesh(geometry,typeof material==='number'?paint(material):material);
  item.position.set(x,y,z);item.scale.set(w,h,d);group.add(item);return item;
}
function groupAt(parent,x=0,y=0,z=0){
  const group=new T.Group();group.position.set(x,y,z);parent.add(group);return group;
}
function branch(parent,a,b,color,r=.1,tip=r*.68){
  const d=vec(...b).sub(vec(...a)),mid=vec(...a).addScaledVector(d,.5);
  const mesh=place(parent,new T.CylinderGeometry(tip,r,d.length(),6),color,...mid.toArray());
  mesh.quaternion.setFromUnitVectors(vec(0,1,0),d.normalize());return mesh;
}
function crystal(parent,color,x,y,z,h,r){
  const geometry=new T.CylinderGeometry(r*.82,r,h*.67,5,1);
  const m=paint(color,{roughness:.28,metalness:.28,emissive:color,emissiveIntensity:.15});
  place(parent,geometry,m,x,y+h*.34,z);
  place(parent,cone,m,x,y+h*.82,z,r*.87,h*.34,r*.87);
}
function tree(parent,x,y,z,scale,leaf){
  const t=groupAt(parent,x,y,z);t.scale.setScalar(scale);
  branch(t,[0,0,0],[-.17,.83,.05],0x503a3b,.22,.13);
  branch(t,[-.17,.79,.05],[.03,1.56,-.04],0x674945,.13,.072);
  for(const s of [-1,1]){
    branch(t,[-.15,.54,0],[s*.54,1.12,-.03],0x664548,.09,.046);
    branch(t,[s*.54,1.12,-.03],[s*.79,1.65,.04],0x664548,.046,.008);
    branch(t,[s*.46,1.11,-.03],[s*.38,1.58,-.17],0x664548,.05,.009);
    if(leaf)place(t,orb,leaf,s*.47,1.53,.06,.49,.37,.48);
  }
  if(leaf)place(t,orb,leaf,.02,1.84,-.03,.47,.38,.51);
}
function towers(parent,{wall,roof,width=3,kind='castle'}){
  place(parent,box,wall,0,.52,-.15,width*.72,1.02,1);
  place(parent,box,0x3e263e,0,.31,.375,.37,.59,.02);
  const turret=(x,h,r,z)=>{
    place(parent,cylinder,wall,x,h*.5,z,r,h,r);
    if(kind==='fortress'){
      place(parent,cylinder,roof,x,h,z,r*1.20,.15,r*1.20);
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3;
        place(parent,box,wall,x+Math.cos(a)*r*.87,h+.13,z+Math.sin(a)*r*.87,.16,.25,.18);
      }
    }else place(parent,cone,roof,x,h+.28,z,r*1.14,.6,r*1.14);
    place(parent,box,kind==='fortress'?0xdc5b66:0xffde9b,x,h*.69,z+r*.94,.10,.25,.02);
  };
  turret(-width*.40,1.43,.36,.06);
  turret(width*.40,1.55,.37,.06);
  turret(0,2.05,.44,-.47);
  for(const x of [-.64,.64])place(parent,box,0xf2b786,x,.70,.36,.109,.27,.02);
}
function bell(parent,x,y,z,size,color){
  const petal=paint(color,{side:T.DoubleSide});
  const points=[new T.Vector2(.05,.52),new T.Vector2(.18,.41),new T.Vector2(.29,.18),new T.Vector2(.31,-.10),new T.Vector2(.47,-.27),new T.Vector2(.36,-.31)];
  place(parent,new T.LatheGeometry(points,16),petal,x,y,z,size);
  place(parent,orb,0xe9cb64,x,y-size*.26,z,size*.105,size*.21,size*.105);
}
function figure(parent,x,y,z,{body=0x788956,skin=0xe5ac88,hat=0xa44e4d,size=1,tail=false,wings=false}={}){
  const p=groupAt(parent,x,y,z);p.scale.setScalar(size);
  place(p,orb,body,0,.53,0,.32,.44,.24);
  place(p,orb,skin,0,1.11,.02,.245,.27,.215);
  for(const s of [-1,1]){
    const arm=groupAt(p,s*.20,.75,.015);arm.name=s>0?'Right arm':'Left arm';
    branch(arm,[0,0,0],[s*.18,-.35,.085],skin,.083,.045);
    place(arm,orb,skin,s*.18,-.35,.088,.061,.068,.056);
    place(p,orb,0x39263b,s*.091,1.15,.199,.032,.041,.028);
  }
  const smile=place(p,orb,0x8b503e,0,1.021,.211,.068,.024,.024);
  smile.name='Smile';
  for(const s of [-1,1]){
    place(p,orb,0xc37d73,s*.143,1.058,.184,.051,.022,.028);
    place(p,orb,0x654748,s*.086,1.222,.179,.057,.017,.022).rotation.z=s*.12;
  }
  if(hat)place(p,cone,hat,0,1.49,0,.30,.52,.29);
  if(tail){
    branch(p,[0,.40,0],[.11,.10,.13],0x7eaaa2,.25,.14);
    branch(p,[.11,.10,.13],[.34,-.10,.22],0xaacac7,.14,.06);
    for(const s of [-1,1])place(p,orb,0x82aaa6,.32+s*.11,-.115,.22,.16,.036,.075).rotation.y=s*.25;
  }else for(const s of [-1,1]){
    const leg=groupAt(p,s*.13,.31,0);leg.name=s>0?'Right leg':'Left leg';
    branch(leg,[0,0,0],[s*.03,-.29,.06],body,.11);
    place(leg,orb,0x4c3542,s*.03,-.27,.11,.12,.072,.17);
  }
  if(wings)for(const s of [-1,1]){
    const wing=place(p,orb,paint(0xc9effd,{roughness:.3,transparent:true,opacity:.82}),s*.26,.90,-.20,.20,.37,.055);
    wing.rotation.z=-s*.48;wing.name=s>0?'Right wing':'Left wing';
  }
  return p;
}

// These landmarks are shared between the map’s landmark pins and the full scenes.
export function diorama(id,preview=false){
  const root=new T.Group(), motion=[];
  let creature;
  if(id==='witches'){
    towers(root,{wall:0x634663,roof:0x3c2947,kind:'fortress'});
    tree(root,-1.89,0,.25,1.03);tree(root,1.87,0,.10,1.03);
    const cauldron=place(root,orb,0x373447,1.58,.19,.88,.30,.23,.28);
    place(root,cylinder,0x7eb575,1.58,.29,.88,.23,.025,.23);
    const well=groupAt(root,-1.79,0,.94);
    place(well,new T.TorusGeometry(.25,.076,6,11),0x8a7583,0,.26,0).rotation.x=-Math.PI/2;
    place(well,cylinder,0x5b4b68,0,.13,0,.295,.26,.295);
    place(well,cylinder,0x33273e,0,.264,0,.18,.012,.18);
    const cackle=creature=figure(root,-1.13,0,1.02,{body:0x733e78,hat:0x33233b,size:.75});
    cackle.rotation.y=.10;
    for(const side of [-1,1]){
      branch(cackle,[side*.17,1.29,.02],[side*.32,1.36,.10],0x67704c,.041,.029);
      branch(cackle,[side*.32,1.36,.10],[side*.36,1.47,.17],0x67704c,.031,.018);
    }
    motion.push(t=>{cauldron.rotation.y=t*.13;});
  }else if(id==='mermaids'){
    towers(root,{wall:0xe48b94,roof:0xb05e84,width:3.15});
    for(const s of [-1,1]){
      const x=s*1.88;
      for(let i=0;i<3;i++){
        branch(root,[x,.01,.36],[x+(i-1)*.26,.56+i*.17,.43],i%2?0xee746c:0xc16e91,.09,.038);
        place(root,orb,0xe07685,x+(i-1)*.26,.56+i*.17,.43,.075);
      }
    }
    const aquafin=creature=figure(root,-1.13,.20,.99,{body:0x9a58a3,skin:0xedbc94,hat:0xe2c688,tail:true,size:.8});
    motion.push(t=>{aquafin.position.y=.2+Math.sin(t*1.7)*.12;});
  }else if(id==='dragons'){
    place(root,new T.CylinderGeometry(.5,1.9,2,8),0x593742,0,.98,-.25);
    place(root,cylinder,paint(0xff7957,{emissive:0xff6b3c,emissiveIntensity:.6}),0,2.01,-.25,.48,.06,.48);
    place(root,cylinder,0x904d54,0,1.50,.05,.82,.18,.85);
    for(let i=0;i<5;i++)place(root,box,0xb26966,(i-2)*.23,1.65,.56,.13,.25,.12);
    place(root,box,0x4d4250,1.16,.03,.91,1.10,.07,.36);
    for(let i=0;i<4;i++)place(root,box,0xeaba6b,.77+i*.23,.07,.91,.085,.03,.043);
    const dragon=groupAt(root,-1.12,1.68,.53);
    place(dragon,orb,0xd58e45,0,0,0,.42,.23,.21);
    place(dragon,orb,0xe1a349,.36,.13,.02,.20,.16,.16);
    branch(dragon,[-.22,0,0],[-.68,-.13,-.07],0xe1a349,.10,.018);
    for(const s of [-1,1])place(dragon,cone,0xb56943,-.04,.18,s*.25,.34,.094,.50).rotation.z=s*.45;
    motion.push(t=>{dragon.position.y=1.64+Math.sin(t*1.4)*.15;});
  }else if(id==='pixies'){
    const rise=[[-.14,0,0],[.09,.64,-.05],[-.04,1.32,-.09],[.09,1.97,-.02]];
    rise.slice(1).forEach((b,i)=>branch(root,rise[i],b,0x658c55,.13-i*.025,.107-i*.021));
    const petal=groupAt(root,.09,1.89,-.02);petal.name='Big Bluebell';bell(petal,0,0,0,1.65,0x706ce1);
    for(const s of [-1,1]){
      place(root,orb,0x548b5c,s*.48,.38,.09,.63,.105,.26).rotation.z=s*.25;
      branch(root,[s*1.58,.0,.28],[s*1.61,.83,.27],0x668450,.055);
      bell(root,s*1.61,.72,.27,.64,0x9d8ce1);
    }
    creature=figure(root,-.86,0,.98,{body:0x88a255,hat:0x478554,size:.52});
    motion.push(t=>{petal.rotation.z=Math.sin(t*.91)*.12;});
  }else if(id==='gnomes'){
    const lodge=groupAt(root,0,0,-.12);
    place(lodge,cylinder,0x78503b,0,.68,0,1.30,1.36,.76);
    place(lodge,cone,0x604c3d,0,1.52,0,1.54,.83,.95);
    place(lodge,box,0x463630,0,.39,.73,.38,.67,.045);
    for(const s of [-1,1]){
      place(lodge,box,0xf5cc8b,s*.65,.77,.67,.23,.24,.039);
      for(let i=0;i<4;i++)place(lodge,box,0x694532,s*(.34+i*.19),.57,.69,.045,1.11,.039);
      tree(root,s*1.79,0,.03,1.1,0x477155);
    }
    for(let i=0;i<5;i++)place(root,orb,i%2?0xd9a576:0x91a44e,1.19+(i%2)*.29,.09,.71+Math.floor(i/2)*.25,.13,.15,.12);
    figure(root,-1.07,0,1.01,{body:0x77975e,hat:0xbc564d,size:.58});
    creature=figure(root,.92,0,1.10,{body:0xa97d65,hat:0xba8173,size:.60});
  }else if(id==='giants'){
    place(root,stone,0x6a687e,-.18,.57,-.25,1.72,1.20,1.02);
    place(root,stone,0x858298,.07,1.42,-.44,1.47,1.03,.89).rotation.z=-.22;
    place(root,cone,0x888296,.75,1.85,-.06,.57,1.31,.62).rotation.z=-Math.PI*.44;
    place(root,stone,0x554d69,-1.71,.36,.42,.52,.72,.64);
    place(root,stone,0xcecbd8,-.11,1.97,-.44,1.20,.37,.69).rotation.z=-.17;
    place(root,stone,0xd9d7df,.62,1.84,.15,.64,.17,.54).rotation.z=.43;
    for(let i=0;i<5;i++)place(root,stone,0x93869c,-.65-i*.22,.12+i*.095,.90-i*.10,.25,.19,.19);
    creature=figure(root,1.05,.03,.89,{body:0x817465,skin:0xe2ac82,hat:0,size:1.15});
  }else if(id==='fairies'){
    towers(root,{wall:0xc8dcdf,roof:0x9bade0,width:2.95});
    for(const s of [-1,1]){
      crystal(root,0xb6eafd,s*.79,1.08,-.09,.90,.13);
      crystal(root,0xa9c9ed,s*1.76,0,.41,.84,.24);
      for(let i=0;i<3;i++)place(root,orb,i%2?0xdb95bf:0xf3bfdb,s*(1.33+i*.20),.16,.78+i*.15,.20,.18,.22);
    }
    const fairy=creature=figure(root,-.85,.22,1.12,{body:0xcd77a0,skin:0xf4caa2,hat:0xf2ce91,wings:true,size:.62});
    const firefly=place(root,orb,new T.MeshBasicMaterial({color:0xffdf83}),-1.19,1.32,1.23,.057);
    motion.push(t=>{
      fairy.position.y=.26+Math.sin(t*1.4)*.13;
      firefly.position.set(-1.18+Math.sin(t*1.1)*.22,1.15+Math.cos(t*1.7)*.15,1.22);
    });
  }else{
    tree(root,-1.3,0,-.15,1.18,0x60844a);tree(root,1.32,0,-.14,1.01,0x75884c);
    for(let i=0;i<6;i++)place(root,box,0xd9a05b,0,.08+i*.11,.8-i*.24,1.14,.16,.44);
    place(root,box,0xba8655,0,.88,-.55,1.38,1.34,.10);
    place(root,box,0x286781,0,.91,-.48,1.1,1.13,.05);
    place(root,orb,0xe5b979,0,1.56,-.44,.25);
  }
  if(!preview)root.scale.setScalar(1.44);
  return {root,creature,animate(t){for(const tick of motion)tick(t);}};
}

export function realmView(id,aspect){
  if(id==='dragons')return dragonView(aspect);
  return {eye:vec(.12,3.2,aspect<.86?8.3:6.8),target:vec(0,1.34,0),fov:aspect<.86?63:52};
}

export function createKingdom(id){
  if(id==='dragons')return createDragonRealm();
  const info=kingdoms.find(entry=>entry.id===id);
  if(!info||id==='island')throw new Error('Unknown kingdom '+id);
  const scene=new T.Scene();
  scene.background=new T.Color(info.sky);scene.fog=new T.FogExp2(info.sky,.061);
  const {root,creature,animate}=diorama(id);scene.add(root);
  const encounter=decorateRealm(id,scene,creature);
  place(scene,cylinder,info.floor,0,-.36,0,4.52,.70,3.19);
  const ground=place(scene,new T.PlaneGeometry(84,84),info.sky,0,-.70,0);
  if(id==='witches'){
    const moon=new T.MeshBasicMaterial({color:0xffa899,fog:false});
    place(scene,orb,moon,-7,6.2,-11,1.25);
    for(const x of [-6,-4.7,4.7,6])tree(scene,x,-.64,-3,1.45);
  }
  if(id==='mermaids'){
    for(const side of [-1,1])for(let i=0;i<8;i++){
      const x=side*(3.3+(i%3)*.67),z=(i-4)*.61;
      branch(scene,[x,-.55,z],[x+side*.28,.45+(i%3)*.22,z-.12],i%2?0x766a9d:0xe07c88,.102,.033);
      branch(scene,[x+side*.14,-.12,z],[x-side*.26,.18,z+.14],0xca7b9f,.066,.020);
    }
  }
  if(id==='fairies'||id==='giants'){
    for(const side of [-1,1])for(let i=0;i<5;i++){
      const x=side*(4.5+i*.71),z=-3-i*.94;
      if(id==='fairies')crystal(scene,i%2?0xb1cce4:0xa9a6db,x,-.56,z,.92+i*.33,.29+i*.09);
      else place(scene,cone,0x6c6886,x,.69+i*.35,z,.81+i*.46,2.90+i*.72,.69+i*.4);
    }
  }
  ground.rotation.x=-Math.PI/2;
  let seed=29710;
  const rng=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  const rocks=new T.InstancedMesh(stone,paint(info.floor),85);
  const matrix=new T.Object3D();
  for(let i=0;i<rocks.count;i++){
    const a=rng()*Math.PI*2;
    const r=i<43?3.75+rng()*.83:5.5+rng()*11.5;
    matrix.position.set(Math.sin(a)*r,-.42,Math.cos(a)*r*.77);
    const s=i<43?.18+rng()*.27:.51+rng()*1.45;
    matrix.scale.set(s,s*(.45+rng()*1.0),s);
    matrix.rotation.set(rng(),rng()*6.28,rng());matrix.updateMatrix();rocks.setMatrixAt(i,matrix.matrix);
  }
  scene.add(rocks);
  scene.add(new T.HemisphereLight(id==='mermaids'?0xb2f5fb:0xffe7d4,info.sky,2.25));
  const sun=new T.DirectionalLight(id==='witches'?0xd5a7ec:0xffdfaa,2.5);sun.position.set(-5,7,6);scene.add(sun);
  const rim=new T.DirectionalLight(info.color,1.45);rim.position.set(4,3,-7);scene.add(rim);
  const count=100, dots=new Float32Array(count*3), starts=[];
  for(let i=0;i<count;i++)starts.push([(rng()-.5)*16,rng()*6,(rng()-.5)*15,rng()*6.28]);
  const dustGeo=new T.BufferGeometry();
  const pos=new T.BufferAttribute(dots,3);dustGeo.setAttribute('position',pos);
  const bubbles=id==='mermaids';
  const dust=new T.Points(dustGeo,new T.PointsMaterial({color:info.color,transparent:true,opacity:bubbles?.55:.82,
    size:bubbles?.12:.071,depthWrite:false,blending:T.AdditiveBlending}));
  dust.frustumCulled=false;scene.add(dust);
  function advance(t){
    animate(t);
    encounter.update(t);
    starts.forEach(([x,y,z,phase],i)=>{
      dots[i*3]=x+Math.sin(t*.46+phase)*.29;
      dots[i*3+1]=bubbles?(y+t*.48)%6:y+Math.cos(t*.8+phase)*.20;
      dots[i*3+2]=z+Math.sin(t*.26+phase)*.25;
    });
    pos.needsUpdate=true;
  }
  advance(0);
  return {scene,animate:advance,encounter};
}

export function allowsRealmTransition(from,to){
  if(from===to)return false;
  if(from==='island')return to==='map';
  if(from==='map')return kingdoms.some(info=>info.id===to);
  return to==='map'&&kingdoms.some(info=>info.id===from);
}
