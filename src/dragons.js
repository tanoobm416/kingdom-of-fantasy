import {realmEncounters} from './realm-life.js';
import * as T from 'three';

const v=(x,y,z)=>new T.Vector3(x,y,z);
const dark=0x251923;

function createDragon(color,membrane,size,rainbow=false){
  const root=new T.Group();
  root.scale.setScalar(size);
  const scales=new T.MeshStandardMaterial({color,roughness:.66,flatShading:true});
  const plates=new T.MeshStandardMaterial({color:0x432433,roughness:.85});
  const ivory=new T.MeshStandardMaterial({color:0xeac798,roughness:.67});
  const skin=new T.MeshStandardMaterial({color:membrane,side:T.DoubleSide,roughness:.8});
  const eye=new T.MeshBasicMaterial({color:rainbow?0xffeee0:0xffdc77});
  const crests=[0x50a3c6,0x776ab5,0x4682b0,0x329286,0xdb9254].map(color=>new T.MeshStandardMaterial({color,roughness:.78}));
  const sphere=new T.IcosahedronGeometry(1,1);
  function ellipsoid(parent,material,x,y,z,sx,sy,sz){
    const o=new T.Mesh(sphere,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;
  }
  function bone(parent,material,a,b,base,tip){
    const d=b.clone().sub(a);
    const o=new T.Mesh(new T.CylinderGeometry(tip,base,d.length(),6),material);
    o.position.copy(a).lerp(b,.5);o.quaternion.setFromUnitVectors(v(0,1,0),d.normalize());parent.add(o);
    return o;
  }
  ellipsoid(root,scales,0,0,0,.46,.36,1);
  ellipsoid(root,rainbow?new T.MeshStandardMaterial({color:0xc6bdba}):ivory,0,-.18,.6,.29,.24,.56);
  const neck=[v(0,.04,.43),v(0,.26,.87),v(0,.60,1.21),v(0,.67,1.48)];
  neck.slice(1).forEach((p,i)=>bone(root,scales,neck[i],p,.3-i*.055,.25-i*.05));
  ellipsoid(root,scales,0,.69,1.52,.30,.25,.44);
  ellipsoid(root,scales,0,.60,1.85,.24,.15,.34);
  ellipsoid(root,plates,0,.515,1.81,.22,.064,.30);
  for(const sign of [-1,1]){
    ellipsoid(root,eye,sign*.247,.748,1.651,.052,.042,.080);
    ellipsoid(root,plates,sign*.280,.75,1.667,.019,.043,.020);
    bone(root,ivory,v(sign*.18,.85,1.48),v(sign*.30,1.12,1.19),.077,.007);
    if(rainbow){
      bone(root,crests[sign===1?0:2],v(sign*.185,.84,1.65),v(sign*.28,1.06,1.60),.058,.006);
      bone(root,crests[sign===1?3:1],v(sign*.13,.90,1.50),v(sign*.17,1.22,1.45),.057,.005);
    }
    ellipsoid(root,plates,sign*.15,.68,2.08,.026,.025,.027);
    for(const z of [-.55,.48]){
      bone(root,scales,v(sign*.32,-.06,z),v(sign*.49,-.30,z-.20),.146,.10);
      bone(root,scales,v(sign*.49,-.30,z-.20),v(sign*.41,-.46,z-.34),.104,.062);
      for(let i=0;i<3;i++)bone(root,ivory,v(sign*.40+(i-1)*.045,-.45,z-.31),v(sign*.39+(i-1)*.045,-.53,z-.18),.033,.004);
    }
  }
  if(rainbow)bone(root,crests[1],v(0,.91,1.51),v(0,1.27,1.49),.070,.007);
  const tail=new T.Group();tail.position.z=-.60;root.add(tail);
  const joints=[v(0,0,0),v(0,-.05,-.52),v(.14,-.19,-1.13),v(.38,-.05,-1.87),v(.54,.20,-2.41)];
  joints.slice(1).forEach((p,i)=>bone(tail,scales,joints[i],p,.23-i*.047,Math.max(.022,.18-i*.05)));
  bone(tail,ivory,v(.52,.17,-2.32),v(.56,.27,-2.60),.106,.008);
  for(let i=0;i<8;i++){
    const z=1.15-i*.275, y=z>.52?.50+(z-.52)*.42:.29;
    bone(root,rainbow?crests[i%crests.length]:plates,v(0,y,z),v(0,y+.24,z-.14),.095,.006);
  }
  const wings=[];
  for(const s of [-1,1]){
    const wing=new T.Group();wing.position.set(s*.30,.16,.24);root.add(wing);wings.push(wing);
    const shoulder=v(0,0,0),wrist=v(s*1.42,.12,.40);
    const edge=[v(s*3.02,-.04,-.33),v(s*2.24,-.075,-.43),v(s*2.34,-.12,-1.13),
      v(s*1.52,-.13,-.93),v(s*1.55,-.16,-1.53),v(s*.90,-.15,-1.18),v(s*.82,-.15,-1.47),v(0,-.08,-.91)];
    const outline=[wrist,...edge,shoulder];
    const geometry=new T.BufferGeometry();
    const vertices=outline.slice(1).flatMap((p,i)=>[...wrist.toArray(),...outline[i].toArray(),...p.toArray()]);
    geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    wing.add(new T.Mesh(geometry,skin));
    bone(wing,scales,shoulder,wrist,.12,.067);
    for(const i of [0,2,4,6])bone(wing,scales,wrist,edge[i],.050,.015);
    bone(wing,ivory,wrist,v(s*1.56,.22,.62),.052,.005);
  }
  return {root,flap(t,phase){
    wings.forEach((wing,i)=>{wing.rotation.z=(i?1:-1)*(.24+Math.sin(t*4.1+phase)*.52);});
    tail.rotation.y=Math.sin(t*2.0+phase)*.26;
    tail.rotation.x=Math.sin(t*2.0+phase+.8)*.12;
  }};
}

export function dragonView(aspect){
  return {eye:v(.05,3.2,10.6),target:v(0,2.38,-.70),fov:aspect<.86?64:53};
}

export function createDragonRealm(){
  const scene=new T.Scene();
  scene.background=new T.Color(0x382633);
  scene.fog=new T.FogExp2(0x6b3b46,.040);
  let seed=32556;
  const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  const range=(a,b)=>a+(b-a)*rnd();
  const rockGeo=new T.DodecahedronGeometry(1);
  const basalt=new T.MeshStandardMaterial({color:0xffffff,roughness:.93,flatShading:true});
  const terrain=new T.InstancedMesh(rockGeo,basalt,168);
  const transform=new T.Object3D();
  const rocks=[0x382830,0x54404a,0x49323b,0x705054,0x2e2533];
  for(let i=0;i<terrain.count;i++){
    const a=range(0,Math.PI*2),radius=range(5,38);
    const x=Math.cos(a)*radius,z=Math.sin(a)*radius;
    transform.position.set(x,-1.1+range(-.36,.15),z);
    transform.rotation.set(range(-.25,.25),a,range(-.28,.28));
    const h=i<36?range(3.1,8.9):range(.35,2.6);
    transform.scale.set(range(.45,2.6),h,range(.44,2.65));
    transform.updateMatrix();
    terrain.setMatrixAt(i,transform.matrix);
    terrain.setColorAt(i,new T.Color(rocks[i%rocks.length]));
  }
  scene.add(terrain);

  const floor=new T.Mesh(new T.PlaneGeometry(105,105),new T.MeshStandardMaterial({color:dark,roughness:1}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-1.96;scene.add(floor);
  const lava=new T.Mesh(new T.PlaneGeometry(1,1,1,96),new T.ShaderMaterial({
    side:T.DoubleSide,fog:false,
    uniforms:{time:{value:0}},
    vertexShader:`varying vec2 p;void main(){p=uv;vec3 pos=position;pos.x+=.83*sin(uv.y*14.)+.64*cos(uv.y*21.);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);}`,
    fragmentShader:`uniform float time;varying vec2 p;void main(){
      float waves=sin(28.*p.x+sin(p.y*41.+time*.34)*1.7+time*.6)*.5+.5;
      float current=pow(waves,3.)*sin(p.y*83.-time*.8)*.5+.5;
      float edge=smoothstep(0.,.16,p.x)*(1.-smoothstep(.84,1.,p.x));
      vec3 c=mix(vec3(.25,.025,.065),vec3(.98,.25,.035),edge*.8);
      c+=vec3(.67,.28,.055)*current*edge;
      gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
  }));
  lava.position.set(-.25,-1.72,-10);lava.rotation.x=-Math.PI/2;lava.scale.set(3.3,58,1);scene.add(lava);
  const fill=new T.HemisphereLight(0xefb0a2,0xae4850,2.35);
  const light=new T.DirectionalLight(0xffb176,3.1);light.position.set(-5,7,1);
  const rim=new T.DirectionalLight(0xaf9ef5,2.3);rim.position.set(4,2,-8);
  scene.add(fill,light,rim);
  const moon=new T.Mesh(new T.SphereGeometry(5,24,14),new T.MeshBasicMaterial({color:0xee845b,fog:false}));
  moon.position.set(-11,9,-38);scene.add(moon);

  // The palace is built into a smoking volcano above the flying dragons’ runway.
  const ash=new T.MeshStandardMaterial({color:0x47313b,roughness:1,flatShading:true});
  const brick=new T.MeshStandardMaterial({color:0x79474a,roughness:.86});
  const flare=new T.MeshBasicMaterial({color:0xff9a55});
  function mesh(geometry,material,x,y,z){
    const o=new T.Mesh(geometry,material);o.position.set(x,y,z);scene.add(o);return o;
  }
  const volcano=new T.CylinderGeometry(1.45,7.5,8.7,11,3);
  const vertices=volcano.getAttribute('position');
  for(let i=0;i<vertices.count;i++){
    const x=vertices.getX(i),z=vertices.getZ(i);
    const ridge=1+Math.sin(x*1.7+z*2)*.14;
    vertices.setX(i,x*ridge);vertices.setZ(i,z*ridge);
  }
  volcano.computeVertexNormals();
  mesh(volcano,ash,0,2.54,-15.0);
  mesh(new T.CylinderGeometry(1.48,1.48,.13,11),flare,0,6.91,-15);
  mesh(new T.CylinderGeometry(2.0,2.26,.45,11),brick,0,5.42,-14.35);
  for(const x of [-2.12,-1.35,-.64,.65,1.34,2.12]){
    mesh(new T.BoxGeometry(.38,.87,.39),brick,x,5.45,-12.95);
    if(Math.abs(x)>1)mesh(new T.ConeGeometry(.32,.55,6),ash,x,6.15,-12.95);
  }
  mesh(new T.BoxGeometry(.41,.59,.055),flare,0,5.1,-12.9);
  for(const [x,y,z,wide] of [[-11,1.4,-16,5.5],[-14,1.7,-21,6.6]]){
    mesh(new T.ConeGeometry(wide,10.2,7),ash,x,y,z);
  }
  const runway=new T.MeshStandardMaterial({color:0x493640,roughness:.94});
  mesh(new T.BoxGeometry(2.7,.13,18.2),runway,3.3,-1.49,-4.7);
  for(let i=0;i<10;i++){
    const z=3.35-i*1.64;
    mesh(new T.BoxGeometry(.091,.023,.65),brick,3.3,-1.41,z);
    for(const x of [2.13,4.47])mesh(new T.BoxGeometry(.073,.045,.072),flare,x,-1.40,z);
  }
  mesh(new T.BoxGeometry(.69,2.32,.64),brick,5.75,-.39,-6.8);
  mesh(new T.BoxGeometry(1.03,.37,.88),ash,5.75,.90,-6.8);
  mesh(new T.BoxGeometry(.61,.094,.034),flare,5.75,.945,-6.35);
  const smokeGeo=new T.IcosahedronGeometry(1,1);
  const smokeMaterial=new T.MeshLambertMaterial({color:0x9c7c80,transparent:true,opacity:.28,depthWrite:false});
  const smoke=Array.from({length:8},()=>mesh(smokeGeo,smokeMaterial,0,7,-15));
  const dragons=[
    createDragon(0xe2a03a,0xd57a29,1.05,true),
    createDragon(0x557053,0x777e52,.84),
    createDragon(0x85504e,0xa27273,.69)
  ];
  dragons[0].root.name='Dragon of the Rainbow';
  dragons.forEach(({root})=>scene.add(root));
  const positions=new Float32Array(132*3),emberSeeds=[];
  for(let i=0;i<132;i++)emberSeeds.push([range(-13,13),range(0,8),range(-23,8),range(0,6.28)]);
  const points=new T.BufferGeometry();
  points.setAttribute('position',new T.BufferAttribute(positions,3));
  const embers=new T.Points(points,new T.PointsMaterial({color:0xff9551,size:.055,opacity:.83,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
  embers.frustumCulled=false;scene.add(embers);
  const previous=v(0,0,0), rainbow=dragons[0].root;
  const hit=new T.Mesh(new T.SphereGeometry(1,10,8),new T.MeshBasicMaterial({colorWrite:false,depthWrite:false}));
  hit.position.set(0,.25,.25);hit.scale.set(1.35,.92,1.55);rainbow.add(hit);
  let called=-Infinity;
  const encounter={...realmEncounters.dragons,hit,interact(t){called=t;},reset(){called=-Infinity;}};
  const close=v(0,0,0);
  const puffs=[];
  const shimmer=new T.MeshBasicMaterial({color:0xffd279,transparent:true,opacity:.88});
  for(let i=0;i<17;i++){
    const spark=mesh(new T.OctahedronGeometry(.063),shimmer,0,0,0);
    puffs.push(spark);
  }
  function animate(t){
    lava.material.uniforms.time.value=t;
    const age=t-called;
    const flyingBy=age>=0&&age<5.8;
    const approach=flyingBy?Math.min(age*1.06,1,(5.8-age)*1.1):0;
    const sweep=flyingBy?age*.77:0;
    smoke.forEach((p,i)=>{
      const a=(t*.36+i*.49)%3.92;
      p.position.set(a*.77+Math.sin(a*1.9)*.35,6.93+a*.68,-15+a*.11);
      p.scale.setScalar(.54+a*.31);
    });
    dragons.forEach((dragon,i)=>{
      const a=t*(.27-i*.038)+i*2.37+.43;
      const radius=3.75+i*2;
      function path(angle){
        if(i===1){
          const y=-.9+Math.pow((1-Math.cos(angle))*.5,1.4)*4.25;
          return [3.29+Math.sin(angle)*Math.pow((1-Math.cos(angle))*.5,2)*2.6,y,-3.6+Math.sin(angle)*7.3];
        }
        return [Math.sin(angle)*radius,1.70+i*.86+Math.sin(angle*1.85)*(.52+i*.12),
          -1.25-i*2.42+Math.cos(angle)*(2.1+i*.45)];
      }
      dragon.root.position.set(...path(a));
      previous.set(...path(a+.05));
      if(i===0&&flyingBy){
        close.set(Math.sin(sweep)*2.15,2.44+Math.sin(sweep*1.65)*.45,2.9+Math.cos(sweep)*1.2);
        dragon.root.position.lerp(close,approach);
        previous.lerp(close.set(Math.sin(sweep+.07)*2.15,2.44+Math.sin(sweep*1.65+.11)*.45,2.9+Math.cos(sweep+.07)*1.2),approach);
      }
      dragon.root.lookAt(previous);
      dragon.root.rotateZ(.22+Math.sin(a)*.21);
      if(i===0&&flyingBy)dragon.root.rotateX(approach*Math.sin(age*3.4)*.23);
      dragon.flap(t,i*1.71);
    });
    puffs.forEach((spark,i)=>{
      const a=t*1.7+i*.56,r=.44+i*.11;
      spark.visible=flyingBy;
      spark.position.set(rainbow.position.x+Math.sin(a)*r,rainbow.position.y+Math.cos(a)*r*.42,rainbow.position.z-i*.145);
    });
    emberSeeds.forEach(([x,y,z,a],i)=>{
      positions[i*3]=x+Math.sin(t*.54+a)*.4;
      positions[i*3+1]=(y+t*(.31+.07*Math.sin(a)))%8-1.4;
      positions[i*3+2]=z+Math.sin(t*.22+a)*.7;
    });
    points.attributes.position.needsUpdate=true;
  }
  animate(0);
  return {scene,animate,encounter};
}
