import {createPerformance} from './character-actions.js';
import * as T from 'three';

export const realmEncounters={
  witches:{label:'Ask Cackle to cast',title:'Queen Cackle',line:'“Stand back, little mouse. I only need one flick of my wand!”',color:0xf27a71},
  mermaids:{label:'Knock on the clamshell',title:'Queen Aquafin',line:'“Who is knocking? Come closer, Geronimo. Meet my dancing shoal!”',color:0x97f6ee},
  dragons:{label:'Call the Rainbow Dragon',title:'Dragon of the Rainbow',line:'“Look up, Geronimo. I’ll circle back for a closer hello!”',color:0xffc972},
  pixies:{label:'Ring Big Bluebell',title:'King Chuckles',line:'“Now that’s a bell worth dancing under!”',color:0xa2aefa},
  gnomes:{label:'Help in the garden',title:'Queen Cozy',line:'“Thank you, Geronimo dear. Look how the garden is growing!”',color:0xbde382},
  giants:{label:'Challenge Strongheart',title:'Strongheart',line:'“That boulder? One stomp ought to split it!”',color:0xdac7ff},
  fairies:{label:'Greet Queen Blossom',title:'Queen Blossom',line:'“Welcome, Geronimo. Let Blinkette light the way to Crystal Castle.”',color:0xffd5ef}
};

const bead=new T.IcosahedronGeometry(1,1);
const shard=new T.OctahedronGeometry(1);
const blade=new T.ConeGeometry(1,1,6);
const slab=new T.BoxGeometry(1,1,1);
const plate=new T.CylinderGeometry(1,1,1,14);
function mesh(parent,geo,mat,x,y,z,sx=1,sy=sx,sz=sx){
  const o=new T.Mesh(geo,mat);
  o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;
}
const matte=color=>new T.MeshStandardMaterial({color,roughness:.84,flatShading:true});
const glow=color=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.55,roughness:.49});

export function decorateRealm(id,scene,creature){
  const info=realmEncounters[id];
  const group=new T.Group();scene.add(group);
  const highlights=[], animateDecor=[];
  const hit=mesh(creature,new T.SphereGeometry(1,9,6),new T.MeshBasicMaterial({colorWrite:false,depthWrite:false}),0,.77,0,.49,.83,.53);
  const light=glow(info.color);
  let strength=0;
  let stamp=-Infinity;
  const base=creature.position.clone();
  const rotation=creature.rotation.clone();
  const worldBase=creature.parent.localToWorld(base.clone());
  const ground=matte(0x736172);
  const perform=createPerformance(id,group,creature,worldBase,hit);
  let cue,lastCue;

  if(id==='witches'){
    const ember=glow(0xfc846b), iron=matte(0x4c3d58), trail=matte(0x63526a);
    for(let i=0;i<10;i++){
      const z=3.03-i*.29,x=Math.sin(i*.62)*.42;
      mesh(group,bead,trail,x,-.04,z,.34,.076,.19).rotation.y=i*.74;
    }
    for(const side of [-1,1])for(let i=0;i<5;i++){
      const x=side*(1.9+i*.41),z=2.04-i*.78;
      mesh(group,plate,iron,x,.36,z,.07,.79,.07);
      const lantern=mesh(group,shard,ember,x,.83,z,.11,.17,.11);
      lantern.name='Witch lantern';highlights.push(lantern);
      mesh(group,blade,iron,x,1,z,.18,.15,.18);
    }
    const heights=matte(0x3a2a47), shingle=matte(0x544165);
    for(let i=0;i<10;i++){
      const x=(i-4.5)*1.7,z=-6.6-Math.sin(i*2)*2.2,h=2.1+(i%4)*.52;
      mesh(group,plate,heights,x,h*.5-.65,z,.30,h,.30);
      mesh(group,blade,shingle,x,h-.22,z,.49,.92,.49);
    }
    const scorpion=new T.Group();group.add(scorpion);
    mesh(scorpion,bead,iron,0,.12,0,.31,.15,.47);
    for(const side of [-1,1])for(let i=0;i<4;i++){
      mesh(scorpion,slab,iron,side*.31,.09,.2-i*.135,.34,.06,.065).rotation.z=-side*.27;
    }
    for(const side of [-1,1])mesh(scorpion,bead,iron,side*.25,.14,.48,.14,.10,.16);
    for(let i=0;i<5;i++)mesh(scorpion,bead,iron,0,.18+i*.112,-.34-i*.084+Math.max(0,i-3)*.15,.073);
    animateDecor.push(t=>{scorpion.position.set(2.22+Math.sin(t*.8)*.49,.02,1.12+Math.cos(t*.9)*.23);scorpion.rotation.y=t*.55;});
  }else if(id==='mermaids'){
    const fins=matte(0xfabe95), belly=matte(0x65bea9), coral=matte(0xd480ab);
    const fish=[];
    const reef=matte(0x747aa7);
    for(let i=0;i<19;i++){
      const theta=i*.30;
      const x=Math.cos(theta)*6.6,z=-5.4+Math.sin(theta)*1.1;
      mesh(group,bead,reef,x,.22+(i%4)*.38,z,.67,.81+(i%3)*.45,.49).rotation.y=theta;
    }
    for(let i=0;i<18;i++){
      const swimmer=new T.Group();group.add(swimmer);fish.push(swimmer);
      mesh(swimmer,bead,i%2?belly:fins,0,0,0,.215,.114,.074);
      mesh(swimmer,blade,fins,-.23,.01,0,.126,.19,.031).rotation.z=Math.PI/2;
      mesh(swimmer,bead,ground,.127,.032,.056,.026);
    }
    for(let i=0;i<30;i++){
      const a=i*2.399,x=Math.sin(a)*(2.73+(i%4)*.28),z=Math.cos(a)*(1.89+(i%3)*.2);
      mesh(group,bead,coral,x,.1,z,.10+i%3*.05,.16+i%4*.10,.11);
    }
    animateDecor.push(t=>{
      fish.forEach((item,i)=>{
        const a=t*(.67+strength*.57)+i*.43, spacing=3.25-strength*1.02;
        item.position.set(Math.sin(a)*spacing,.58+(i%6)*.21+Math.sin(a*2)*.24,Math.cos(a)*1.75);
        item.rotation.y=Math.cos(a)>.0?0:Math.PI;
      });
    });
  }else if(id==='pixies'){
    const bluebell=creature.parent.getObjectByName('Big Bluebell');
    const stem=matte(0x53734e), bloom=[matte(0xb29be7),matte(0xe59ab9),matte(0xefcb69)];
    for(let i=0;i<26;i++){
      const a=i*2.399,x=Math.sin(a)*(2+(i%5)*.38),z=Math.cos(a)*(1.45+(i%3)*.43);
      const h=.22+(i%4)*.16;
      mesh(group,plate,stem,x,h*.5,z,.028,h,.028);
      mesh(group,bead,bloom[i%3],x,h,z,.13,.085,.13);
    }
    const meadow=matte(0x597e58);
    for(let i=0;i<16;i++){
      const x=(i-7.5)*.94,z=-5.3-(i%3)*1.16,h=.42+(i%5)*.54;
      mesh(group,bead,meadow,x,-.37,z,.92,h,1.13);
      mesh(group,blade,stem,x,h*.55,z,.16,h*1.34,.16).rotation.z=Math.sin(i)*.24;
      mesh(group,bead,bloom[i%3],x,h*1.23,z,.21,.17,.21);
    }
    const notes=[];
    for(let i=0;i<8;i++){
      const item=mesh(group,shard,light,0,0,0,.085,.145,.085);notes.push(item);
    }
    animateDecor.push(t=>{
      bluebell.rotation.z+=Math.sin((t-stamp)*9 || 0)*strength*.42;
      notes.forEach((item,i)=>{
      const a=t*1.7+i*Math.PI/4;
      item.visible=strength>.05;
      item.position.set(Math.sin(a)*(1+i*.10),2.24+(i%3)*.26+Math.sin(a*2)*.27,Math.cos(a)*.81);
      item.rotation.y=t+i;
      });
    });
  }else if(id==='gnomes'){
    const loam=matte(0x77523d), leaves=matte(0x799353), tops=[matte(0xe7a85d),matte(0xbf6f94),matte(0xd0bf7d)];
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const x=side*(1.47+i*.57), z=2.19-(i%2)*.41;
      mesh(group,slab,loam,x,-.016,z,.47,.12,.92);
      for(let j=0;j<4;j++){
        mesh(group,bead,leaves,x,.12,z-.28+j*.19,.10,.14,.102);
        const fruit=mesh(group,bead,tops[(i+j)%3],x,.208,z-.28+j*.19,.085,.10,.085);
        highlights.push(fruit);
      }
    }
    for(let i=0;i<5;i++){
      const x=(i-2)*2.3,z=-4.0-Math.sin(i*2)*1.47;
      mesh(group,plate,loam,x,.19,z,.49,.82,.47);
      mesh(group,blade,leaves,x,.81,z,.65,.72,.65);
      mesh(group,slab,tops[2],x,.33,z+.46,.12,.16,.03);
    }
    for(let i=0;i<12;i++)mesh(group,slab,loam,Math.sin(i*.6)*.33,-.008,3.05-i*.24,.48,.034,.135);
    animateDecor.push(()=>highlights.forEach((fruit,i)=>{
      const s=1+strength*(.55+.12*Math.sin(i*2));
      fruit.scale.set(.085*s,.10*s,.085*s);
    }));
  }else if(id==='giants'){
    const snow=matte(0xe6e5ef), cliff=matte(0x666582);
    for(let i=0;i<16;i++){
      const a=i*2.399,r=3.15+i%5*.18,x=Math.sin(a)*r,z=Math.cos(a)*r*.68;
      const h=.22+(i%4)*.21;
      mesh(group,bead,cliff,x,h*.2,z,.39,h,.33);
      mesh(group,bead,snow,x,h*.89,z,.34,h*.30,.29);
    }
    for(let i=0;i<8;i++){
      const x=(i%2===0?-.17:.22)+1.18,z=2.96-i*.32;
      mesh(group,bead,cliff,x,.018,z,.16,.019,.245).rotation.y=.23;
    }
    for(let i=0;i<16;i++)highlights.push(mesh(group,bead,snow,0,0,0,.04+.015*(i%3)));
    animateDecor.push(t=>{
      highlights.forEach((flake,i)=>{
        const a=i*2.399,elapsed=strength>0?t-stamp:0,r=.2+elapsed*.8;
        flake.visible=strength>.05;
        flake.position.set(worldBase.x+Math.sin(a)*r,Math.max(.04,Math.sin(Math.min(elapsed,2)*2+i*.4)*.58+.58),worldBase.z+Math.cos(a)*r);
      });
    });
  }else if(id==='fairies'){
    const pink=matte(0xe8a9c8), water=matte(0x8ac8ce), leaves=matte(0x75a079);
    mesh(group,plate,water,0,.013,2.34,1.34,.045,.47);
    for(let i=0;i<15;i++){
      const a=i*2.399,x=Math.sin(a)*2.8,z=Math.cos(a)*1.87;
      mesh(group,bead,leaves,x,.11,z,.16,.085,.17);
      mesh(group,bead,pink,x,.24,z,.13,.10,.12);
    }
    const bridge=matte(0xa7bfba);
    for(let i=0;i<10;i++){
      const s=i/9,a=-.85+s*1.7;
      mesh(group,slab,bridge,Math.sin(a)*1.38,.11+Math.cos(a)*.065,2.39+Math.cos(a)*.17,.25,.07,.45).rotation.y=-a*.34;
    }
    for(let i=0;i<11;i++)highlights.push(mesh(group,shard,light,0,0,0,.062));
    animateDecor.push(t=>{
      highlights.forEach((spark,i)=>{
        const a=t*1.4+i*.64;
        spark.visible=strength>.05;
        spark.position.set(Math.sin(a)*1.19,.59+i*.135+Math.cos(a)*.22,1.74-i*.173);
        spark.rotation.set(a*1.22,a,0);
      });
    });
  }

  function interact(t){stamp=t;cue=null;lastCue=null;update(t);}
  function reset(){stamp=-Infinity;cue=null;lastCue=null;update(0);}
  function update(t){
    const age=Number.isFinite(stamp)?t-stamp:-1;
    strength=age<0||age>=5?0:Math.min(age*5+.16,1,(5-age)*1.2);
    creature.rotation.y=rotation.y+Math.sin(age<5?age*3:0)*strength*.32;
    const friendlyMotion=id==='giants'?Math.abs(Math.sin(t*3.2))*.37:Math.sin(t*4.1)*.105;
    creature.position.x=base.x+strength*Math.sin(t*2.45)*(id==='pixies'?.28:.04);
    if(id==='mermaids'||id==='fairies')creature.position.y+=strength*friendlyMotion;
    else creature.position.y=base.y+strength*friendlyMotion;
    if(id==='witches')highlights.forEach((lantern,i)=>{
      lantern.scale.set(.11,.17,.11).multiplyScalar(1+strength*(.49+.16*Math.sin(t*7-i)));
    });
    const nextCue=perform(age,t);
    if(nextCue&&nextCue!==lastCue){cue=nextCue;lastCue=nextCue;}
    animateDecor.forEach(tick=>tick(t));
  }
  update(0);
  return {hit,interact,update,reset,takeCue(){const value=cue;cue=null;return value;},...info};
}
