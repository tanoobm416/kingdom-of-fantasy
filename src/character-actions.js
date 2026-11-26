import * as T from 'three';

const ball=new T.IcosahedronGeometry(1,1);
const flake=new T.DodecahedronGeometry(1,0);
const crystal=new T.OctahedronGeometry(1);
const mat=(color,options={})=>new T.MeshStandardMaterial({color,roughness:.78,flatShading:true,...options});
const smooth=(t,a,b)=>T.MathUtils.smoothstep(t,a,b);
function put(parent,geometry,material,name,x,y,z,a=1,b=a,c=a){
  const item=new T.Mesh(geometry,material);item.name=name;
  item.position.set(x,y,z);item.scale.set(a,b,c);parent.add(item);return item;
}

function shellGeometry(isUpper){
  const values=[],colors=[],indices=[];
  const strips=32, bands=8;
  const lip=new T.Color(isUpper?0xf1b2c1:0xe09ca2), base=new T.Color(isUpper?0xb1779c:0x945e85);
  for(let i=0;i<=bands;i++)for(let j=0;j<=strips;j++){
    const r=i/bands,a=j/strips*Math.PI;
    const scallop=1+Math.cos(a*13)*.061*r;
    const x=Math.cos(a)*r*.83*scallop;
    const z=(.015+Math.sin(a)*r*1.15)*scallop;
    const shellProfile=Math.sin(r*Math.PI)*(.21+.09*Math.sin(a))+.045*Math.sin(a);
    values.push(x,(isUpper?1:-1)*shellProfile,z);
    const color=base.clone().lerp(lip,r*.91+(Math.cos(a*13)+1)*.035);
    colors.push(color.r,color.g,color.b);
    if(i<bands&&j<strips){
      const k=i*(strips+1)+j;
      indices.push(k,k+1,k+strips+1,k+1,k+strips+2,k+strips+1);
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(values,3));
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  return g;
}

export function createPerformance(id,group,creature,worldBase,hit){
  const arm=creature.getObjectByName('Right arm');
  const otherArm=creature.getObjectByName('Left arm');
  const boot=creature.getObjectByName('Right leg');

  if(id==='mermaids'){
    const origin=new T.Group();origin.name='Aquafin’s clamshell';
    origin.position.set(worldBase.x,.23,worldBase.z-.30);group.add(origin);
    const nacre=mat(0xffffff,{vertexColors:true,side:T.DoubleSide,roughness:.44,metalness:.15});
    put(origin,shellGeometry(false),nacre,'Lower shell',0,-.025,0);
    const lid=new T.Group();lid.name='Clamshell lid';origin.add(lid);
    put(lid,shellGeometry(true),nacre,'Upper shell',0,.035,0);
    const pearl=put(origin,ball,mat(0xffebcd,{emissive:0x927282,emissiveIntensity:.27}), 'Pearl',0,.07,.56,.105);
    const start=creature.position.clone();
    group.attach(hit);
    const closedPosition=origin.position.clone().add(new T.Vector3(0,.17,.46));
    hit.scale.set(.74,.46,.66);hit.position.copy(closedPosition);
    return (age,t)=>{
      const open=smooth(age,0,.74)*(1-smooth(age,4.8,5.85));
      const rise=smooth(age,.42,1.45)*(1-smooth(age,4.28,5.42));
      lid.rotation.x=-1.18*open;
      pearl.position.y=.07+.095*open;
      creature.visible=rise>.035;
      creature.position.y=-.21 + (start.y+.49+.10*Math.sin(t*2.7))*rise;
      creature.position.z=start.z+rise*.22;
      arm.rotation.z=1.68*rise+.31*Math.sin(age*7 || 0)*rise;
      otherArm.rotation.z=-.67*rise;
      creature.updateWorldMatrix(true,false);
      hit.position.copy(closedPosition);
      if(rise>.07)hit.position.lerp(creature.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,1.03,.08)),rise);
      return age>=.58&&age<.90?'pearl':null;
    };
  }

  if(id==='witches'){
    const wand=put(arm,new T.CylinderGeometry(.016,.036,.53,7),mat(0x653b45),
      'Queen Cackle’s wand',.23,-.40,.11);
    wand.rotation.z=1.04;
    const tip=put(arm,crystal,mat(0xfc89ad,{emissive:0xe6377a,emissiveIntensity:.7}),
      'Wand tip',.46,-.27,.12,.058,.078,.058);
    const sparks=Array.from({length:19},()=>put(group,crystal,mat(0xf997b4,{emissive:0xff588a,emissiveIntensity:.7}),'Spell spark',0,0,0,.042));
    let castPoint;
    return (age)=>{
      const active=smooth(age,0,.42)*(1-smooth(age,2.9,4.9));
      const sweep=smooth(age,.45,1.18);
      arm.rotation.z=active*(2.21-sweep*.93+Math.sin(age*7 || 0)*.19);
      arm.rotation.x=-.56*active;
      otherArm.rotation.z=-.83*active;
      if(age<.66)castPoint=undefined;
      if(age>=.66&&age<4&&!castPoint){
        castPoint=tip.getWorldPosition(new T.Vector3());
      }
      const flare=smooth(age,.62,1.05)*(1-smooth(age,2.7,4));
      sparks.forEach((spark,i)=>{
        spark.visible=flare>.015;
        if(!spark.visible||!castPoint)return;
        const theta=i*2.399, r=.10+(age-.66)*(.58+.044*(i%8));
        spark.position.set(castPoint.x+Math.cos(theta)*r+.46*(age-.66),
          castPoint.y+Math.sin(theta)*r*.58+(age-.66)*.32,castPoint.z-.12+(i%6)*.09);
        spark.scale.setScalar(.048*flare*(1+i%3*.34));
      });
      return age>=.66&&age<1.05?'cast':null;
    };
  }

  if(id==='giants'){
    const center=worldBase.clone().add(new T.Vector3(.63,.29,1.02));
    const rock=mat(0x8b839d), chips=[mat(0xa69db3),mat(0x756982)];
    const boulder=put(group,flake,rock,'Strongheart’s boulder',...center.toArray(),.52,.44,.43);
    boulder.rotation.set(.18,.21,.23);
    const shards=Array.from({length:12},(_,i)=>put(group,flake,chips[i%2],'Broken boulder fragment',
      ...center.toArray(),.105+i%3*.032,.095+i%4*.019,.10));
    const bootHeight=boot.position.y;
    const bootDepth=boot.position.z;
    const start=creature.position.clone();
    return age=>{
      const raise=smooth(age,0,.55)*(1-smooth(age,.56,.82));
      const lean=smooth(age,0,.35)*(1-smooth(age,1,1.76));
      arm.rotation.z=.92*lean;
      otherArm.rotation.z=-1.11*lean;
      boot.position.y=bootHeight+.67*raise;
      boot.position.z=bootDepth+.66*lean;
      boot.rotation.x=-.86*raise;
      creature.position.x=start.x+.14*lean;
      creature.position.z=start.z+.30*lean;
      creature.position.y=start.y-.13*smooth(age,.68,.82)*(1-smooth(age,.85,1.34));
      creature.rotation.x=.23*lean;
      const impact=age>=.82;
      boulder.visible=!impact;
      for(let i=0;i<shards.length;i++){
        const chip=shards[i],theta=i*2.399,r=Math.min(1.35,Math.max(0,age-.82))*(.40+i*.066);
        const time=Math.min(.88,Math.max(0,age-.82));
        chip.visible=impact;
        chip.position.set(center.x+Math.cos(theta)*r,Math.max(.09,center.y+time*(1.8+i%3*.52)-3.8*time*time),center.z+Math.sin(theta)*r);
        chip.rotation.set(theta+time*4,theta*.6,time*5);
      }
      return age>=.82&&age<1.18?'stomp':null;
    };
  }

  return (age,t)=>{
    const move=smooth(age,0,.35)*(1-smooth(age,4,4.85));
    if(id==='pixies'){
      arm.rotation.z=move*(1.72+Math.sin(t*8.2)*.51);otherArm.rotation.z=move*(-1.43+Math.cos(t*8.2)*.58);
      creature.rotation.z=move*Math.sin(t*8.2)*.16;
    }else if(id==='gnomes'){
      arm.rotation.z=move*(.93+.39*Math.sin(t*5.5));otherArm.rotation.z=move*(-1.32+.37*Math.cos(t*5.5));
      creature.rotation.x=move*.29;
    }else if(id==='fairies'){
      otherArm.rotation.z=move*(-.87+Math.sin(t*5.6)*.28);
      arm.rotation.z=move*1.15;
      creature.rotation.x=move*.24;
      for(const side of [-1,1]){
        const wing=creature.getObjectByName(side>0?'Right wing':'Left wing');
        wing.rotation.y=side*Math.sin(t*12)*.45*move;
      }
    }
    return age>=.24&&age<.70?id:null;
  };
}
