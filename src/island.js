import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export function buildIsland() {
 const root=new T.Group(), v=(x,y,z)=>new T.Vector3(x,y,z);
 let seed=613029;
 const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const range=(a,b)=>a+(b-a)*rand(), pick=a=>a[Math.floor(rand()*a.length)];
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.83,...extra});
 const gold=material(0xd9a54c,{metalness:.37,roughness:.47}), pale=material(0xffd184,{metalness:.24}), blue=material(0x164f72), red=material(0x98273a), bark=[0x483024,0x67422e,0x865636,0x9d6843].map(c=>material(c));
 const leaves=[0x263e2d,0x365039,0x4d6636,0x687d38,0x849342,0x9b9f4a].map(c=>material(c,{flatShading:true}));
 const rocks=[0x534439,0x836249,0x997052,0x6d6f69,0x424c50,0xb08761].map(c=>material(c,{flatShading:true}));
 const stone=material(0x80796b,{flatShading:true}), cream=material(0xffe0af), dark=material(0x302528), black=material(0x1c171e);
 const sphere=new T.SphereGeometry(1,18,12), ico=new T.IcosahedronGeometry(1,1), chip=new T.DodecahedronGeometry(1,0), boxGeo=new T.BoxGeometry(1,1,1);
 function put(p,g,m,x,y,z,sx=1,sy=1,sz=1){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);p.add(o);return o;}
 const oval=(p,m,x,y,z,a,b,c)=>put(p,sphere,m,x,y,z,a,b,c);
 const box=(p,m,x,y,z,a,b,c)=>put(p,boxGeo,m,x,y,z,a,b,c);
 const group=(p,x,y,z)=>{const g=new T.Group();g.position.set(x,y,z);p.add(g);return g;};
 function tube(p,m,pts,r){const curve=new T.CatmullRomCurve3(pts.map(a=>v(...a)));return put(p,new T.TubeGeometry(curve,Math.max(8,pts.length*4),r,7,false),m,0,0,0);}
 function limb(p,m,a,b,r1,r2){const d=v(...b).sub(v(...a)), q=v(...a).addScaledVector(d,.5);const o=put(p,new T.CylinderGeometry(r2,r1,d.length(),12),m,...q.toArray());o.quaternion.setFromUnitVectors(v(0,1,0),d.normalize());return o;}
 function ring(p,m,x,y,z,r,w){return put(p,new T.TorusGeometry(r,w,8,40),m,x,y,z);}
 function cut(p,m,points,depth,bevel=.02){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return put(p,new T.ExtrudeGeometry(shape,{depth,bevelEnabled:!!bevel,bevelSegments:1,steps:1,bevelSize:bevel,bevelThickness:bevel}),m,0,0,0);}
 function star(p,m,x,y,z,r,inner,n=8){const o=cut(p,m,Array.from({length:n*2},(_,i)=>{const a=i*Math.PI/n,d=i%2?inner:r;return [Math.sin(a)*d,Math.cos(a)*d];}),.018,.008);o.position.set(x,y,z);return o;}
 function batches(geo, rows, materials) {
   const matrix=new T.Matrix4(), dummy=new T.Object3D();
   materials.forEach((m,i)=>{const list=rows.filter(row=>row[0]===i);if(!list.length)return; const mesh=new T.InstancedMesh(geo,m,list.length);list.forEach(([,x,y,z,a,b,c,rx,ry,rz],j)=>{dummy.position.set(x,y,z);dummy.scale.set(a,b,c);dummy.rotation.set(rx,ry,rz);matrix.compose(dummy.position,dummy.quaternion,dummy.scale);mesh.setMatrixAt(j,matrix);});root.add(mesh);});
 }
 const outline=Array.from({length:42},(_,i)=>{const a=i/42*Math.PI*2,r=1+range(-.034,.045);return [3.56*Math.cos(a)*r,2.62*Math.sin(a)*r];});
 const layers=[[1,.03],[1.015,-.13],[.93,-.58],[.77,-.98],[.47,-1.18]];
 const vertices=[],indices=[],colors=[];
 const rings=layers.map(([s,y],j)=>outline.map(([x,z])=>[s*x,y+(j?range(-.16,.15):range(-.035,.03)),s*z]));
 const addFace=(a,b,c,color)=>{const start=vertices.length/3;vertices.push(...a,...b,...c);indices.push(start,start+1,start+2);for(let i=0;i<3;i++)colors.push(color.r,color.g,color.b);};
 outline.forEach((_,i)=>{const k=(i+1)%outline.length;
 addFace([0,.015,0],rings[0][k],rings[0][i],pick(leaves).color.clone().lerp(new T.Color(0x51642e),.62));
 for(let j=0;j<layers.length-1;j++){const a=rings[j][i],b=rings[j][k],c=rings[j+1][i],d=rings[j+1][k];addFace(a,b,c,pick(rocks).color);addFace(b,d,c,pick(rocks).color);}
 addFace([0,-1.23,0],rings[4][i],rings[4][k],pick(rocks).color);});
 const terrain=new T.BufferGeometry();terrain.setAttribute('position',new T.Float32BufferAttribute(vertices,3));terrain.setAttribute('color',new T.Float32BufferAttribute(colors,3));terrain.setIndex(indices);terrain.computeVertexNormals();put(root,terrain,material(0xffffff,{vertexColors:true,side:T.DoubleSide}),0,0,0);
 const rocksRows=[],mossRows=[];
 for(let i=0;i<300;i++){const a=range(0,Math.PI*2),r=range(.92,1.01),y=range(-.83,-.08), f=1+y*.22;
 rocksRows.push([Math.floor(range(0,rocks.length)),3.54*Math.cos(a)*r*f,y,2.61*Math.sin(a)*r*f,range(.07,.25),range(.10,.38),range(.08,.23),range(-.3,.3),a,range(-.42,.42)]);}
 for(let i=0;i<1600;i++){const a=range(0,Math.PI*2),r=Math.sqrt(rand()),x=3.53*Math.cos(a)*r,z=2.59*Math.sin(a)*r,s=range(.022,.105);mossRows.push([Math.floor(range(0,leaves.length)),x,.038,z,s*1.6,s*.65,s,rand(),a,rand()]);}
 for(let i=0;i<125;i++){const a=range(0,6.283),s=range(.038,.08);mossRows.push([Math.floor(range(2,6)),3.54*Math.cos(a),range(-.27,.05),2.59*Math.sin(a),s,s*2.2,s,rand(),a,rand()]);}
 batches(chip,rocksRows,rocks);
 const path=[[-1.8,1.84],[-.83,1.66],[-.22,1.36],[.26,.99],[.42,.60],[.29,.24],[.09,-.12]];
 const pathLights=[];
 path.forEach(([x,z],i)=>{const m=stone.clone();pathLights.push(m);const o=put(root,chip,m,x,.09,z,i===0?.54:.35,.115,i===0?.34:.26);o.rotation.y=range(-.6,.6);for(let j=0;j<4;j++){const o=box(root,rocks[1],x+range(-.25,.25),.192,z+range(-.13,.13),range(.03,.11),.006,.013);o.rotation.y=range(-1,1);}});
 // The trees share a mesh for fine leaf clusters, with individual crooked wood branches.
 function tree(x,z,h,lean,spread){
   const pts=[[x,.03,z],[x-lean*.20,h*.19,z+.07],[x+lean*.64,h*.45,z-.24],[x+lean*1.08,h*.67,z-.36],[x+lean*.80,h*.88,z-.35]];
   for(let i=0;i<pts.length-1;i++)limb(root,bark[1],pts[i],pts[i+1],.17-i*.032,.14-i*.031);
   for(let j=0;j<7;j++){const a=j*6.28/7; tube(root,bark[j%4],[[x+Math.cos(a)*.74,.025,z+Math.sin(a)*.58],[x+Math.cos(a)*.35,.12,z+Math.sin(a)*.28],pts[0],pts[1]],range(.025,.055));}
   for(let k=0;k<7;k++){
     const a=k*2.4, end=[x+lean+Math.cos(a)*spread*range(.4,1),h*range(.72,1.03),z-.3+Math.sin(a)*spread*.65];
     const base=pts[1+k%3], mid=[(base[0]+end[0])/2,end[1]*.77,(base[2]+end[2])/2];
     tube(root,bark[k%4],[base,mid,end],range(.025,.06));
     for(let j=0;j<4;j++){const tip=[end[0]+range(-.34,.34),end[1]+range(-.02,.18),end[2]+range(-.27,.27)];tube(root,bark[2],[mid,end,tip],.017);
        for(let i=0;i<18;i++){const a=range(0,6.28),r=Math.sqrt(rand())*.37,s=range(.066,.165);mossRows.push([Math.floor(range(0,6)),tip[0]+Math.cos(a)*r,tip[1]+range(-.07,.19),tip[2]+Math.sin(a)*r,s*1.28,s*.8,s,rand(),a,rand()]);}
     }
     if(k%2===0)for(let i=0;i<6;i++)oval(root,red,end[0]+range(-.21,.19),end[1]-.11+range(-.05,.05),end[2]+.14+range(-.07,.12),.057,.054,.053);
   }
   for(let k=0;k<7;k++){const a=k*6.28/7;const strands=pts.map(([x,y,z],i)=>[x+Math.cos(a+i*.49)*(.155-i*.029),y,z+Math.sin(a+i*.49)*(.155-i*.029)]);tube(root,bark[k%4],strands,.022);}
 }
 tree(-2.51,-.55,2.9,.42,.78);
 tree(1.13,-1.95,4.02,.59,.79);
 tree(2.17,.66,2.45,.57,.63);
 batches(ico,mossRows,leaves);
 const mushroom=material(0xb83742), dot=material(0xffe4cb);
 [[-2.8,.27,.34],[-2.85,1.36,.39],[-2.56,1.77,.21],[1.0,2.17,.28],[3.06,.63,.36],[3.16,1.05,.20],[-.99,-1.98,.23]].forEach(([x,z,s])=>{
   limb(root,cream,[x,.03,z],[x+.05,s,z],s*.23,s*.163);
   oval(root,cream,x+.052,s,z,s*.83,s*.14,s*.69);
   const cap=put(root,new T.SphereGeometry(1,20,9,0,Math.PI*2,0,Math.PI*.52),mushroom,x+.052,s,z,s*.83,s*.54,s*.69);
   for(let i=0;i<11;i++){const a=rand()*6.28,b=range(.2,1.51), d=range(.026,.053)*s/.35;const o=oval(root,dot,cap.position.x+Math.sin(b)*Math.cos(a)*s*.834,s+Math.cos(b)*s*.545,z+Math.sin(b)*Math.sin(a)*s*.696,d,.012,d*.85);o.quaternion.setFromUnitVectors(v(0,1,0),v(Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)).normalize());}
 });
 const petal=material(0xffead2), pollen=material(0xf2af3b);
 for(let i=0;i<28;i++){const a=range(0,6.28),r=range(.77,.97),x=3.6*r*Math.cos(a),z=2.6*r*Math.sin(a),y=range(.1,.19);limb(root,leaves[3],[x,0,z],[x,y,z],.011,.006);for(let j=0;j<5;j++){const b=j*6.28/5;oval(root,petal,x+.041*Math.cos(b),y,z+.041*Math.sin(b),.034,.013,.028);}oval(root,pollen,x,y+.013,z,.024,.016,.024);}
 // Staircase, arch, and inset.
 const stairBack=-1.63;
 const stairGeo=new RoundedBoxGeometry(1,1,1,2,.057);
 for(let i=0;i<6;i++){
   const y=.18+i*.16,z=-.26-i*.25;
   const step=put(root,stairGeo,gold,.05,y/2,z-.12,1.36-i*.033,y,.50);step.rotation.y=range(-.019,.019);
   box(root,pale,.05,y+.012,z+.114,1.38-i*.033,.040,.075);
   for(let j=0;j<8;j++)put(root,chip,j%3?pale:rocks[1],range(-.58,.66),y+range(-.065,-.02),z+.132,range(.016,.056),.013,.009).rotation.z=range(-.35,.35);
 }
 for(const sign of [-1,1]){const x=.05+sign*.72;tube(root,gold,[[x,.27,-.22],[x,.52,-.33],[x*.95,.73,-.77],[x*.92,.93,-1.18],[x*.9,1.18,-1.53]],.05);
 for(let i=0;i<4;i++){const z=-.38-i*.32;limb(root,gold,[x*.96,.21+i*.15,z],[x*.96,.52+i*.166,z],.026,.024);}
 }
 const gate=group(root,.05,1.09,stairBack);gate.name='Gateway';
 const archPoints=(r,y)=>[[-r,0],[r,0],...Array.from({length:25},(_,i)=>{const a=i*Math.PI/24;return [r*Math.cos(a),y+r*Math.sin(a)];})];
 cut(gate,gold,archPoints(.88,1.18),.26,.031);
 const enamel=cut(gate,blue,archPoints(.78,1.17),.065,.018);enamel.position.z=.27;
 const inner=cut(gate,gold,archPoints(.648,1.16),.04,.017);inner.position.z=.334;
 const art=document.createElement('canvas');art.width=512;art.height=768;const g=art.getContext('2d');
 function polygon(points,fill){g.fillStyle=fill;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
 const sky=g.createLinearGradient(0,0,0,768);sky.addColorStop(0,'#315d89');sky.addColorStop(.48,'#a4c7d5');sky.addColorStop(1,'#527f80');g.fillStyle=sky;g.fillRect(0,0,512,768);
 for(let i=0;i<35;i++){g.fillStyle='rgba(241,226,200,.29)';g.beginPath();g.ellipse(range(0,512),range(50,355),range(20,81),range(7,23),range(-.2,.2),0,6.29);g.fill();}
 polygon([[0,440],[87,318],[147,408],[237,343],[311,431],[437,336],[512,414],[512,768],[0,768]],'#71979a');
 polygon([[0,590],[101,456],[192,484],[284,423],[406,455],[512,410],[512,768],[0,768]],'#476e69');
 polygon([[337,478],[369,478],[340,565],[399,638],[345,768],[242,768],[325,641],[274,571]],'#a9d1d2');
 /* The painted vista is a backdrop for the physical castle. */

 g.strokeStyle='#ddb77a';g.lineWidth=18;g.beginPath();g.moveTo(49,692);g.quadraticCurveTo(108,597,300,606);g.stroke();
 for(let i=0;i<16000;i++){g.fillStyle=i%2?'rgba(255,225,165,.13)':'rgba(35,54,69,.14)';g.fillRect(range(0,512),range(0,768),range(1,3),range(1,4));}
 const artTex=new T.CanvasTexture(art);artTex.colorSpace=T.SRGBColorSpace;artTex.anisotropy=4;
 const inset=cut(gate,new T.MeshBasicMaterial({map:artTex}),archPoints(.60,1.145),.001,0);
 const uv=inset.geometry.attributes.uv,pos=inset.geometry.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+.6)/1.2,pos.getY(i)/1.76);inset.position.z=.396;
 const portal=group(gate,.01,.60,.56);
 portal.scale.setScalar(.98);
 const portalLight=new T.PointLight(0xffcf83,0,.9,2);
 portalLight.position.set(-.08,.5,.36);
 portal.add(portalLight);
 const shimmerCanvas=document.createElement('canvas');shimmerCanvas.width=128;shimmerCanvas.height=8;const sg=shimmerCanvas.getContext('2d'), gradient=sg.createLinearGradient(0,0,128,0);gradient.addColorStop(0,'transparent');gradient.addColorStop(.5,'rgba(255,239,186,.8)');gradient.addColorStop(1,'transparent');sg.fillStyle=gradient;sg.fillRect(0,0,128,8);
 const shimmer=cut(gate,new T.MeshBasicMaterial({map:new T.CanvasTexture(shimmerCanvas),transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}),archPoints(.598,1.145),.001,0);shimmer.position.z=.405;
 const suv=shimmer.geometry.attributes.uv,sp=shimmer.geometry.attributes.position;
 function sweep(t){for(let i=0;i<suv.count;i++)suv.setXY(i,((sp.getX(i)+.6)/1.2+sp.getY(i)*.17-t)/.40+.5,.5);suv.needsUpdate=true;}
 for(const s of [-1,1]){
   box(gate,gold,s*.775,.54,.35,.13,1.08,.15);
   for(const y of [.10,1.08,1.16])box(gate,pale,s*.775,y,.365,.23,.065,.16);
   limb(gate,gold,[s*.75,1.29,.39],[s*1.34,1.29,.39],.034,.034);
   oval(gate,pale,s*1.35,1.29,.39,.069,.065,.065);
   const banner=cut(gate,red,[[-.19,.02],[-.18,-.68],[0,-.55],[.18,-.68],[.19,.02]],.035,.012);banner.position.set(s*1.1,1.27,.40);banner.rotation.y=-s*.12;
   tube(banner,pale,[[-.17,-.025,.045],[-.16,-.63,.045],[0,-.52,.045],[.16,-.63,.045],[.17,-.025,.045]],.014);
   star(banner,pale,0,-.27,.049,.13,.032);
   const curl=Array.from({length:17},(_,i)=>{const a=i*.31,r=.145*(1-i/22);return [s*(.87+Math.cos(a)*r),1.48+Math.sin(a)*r,.41];});
   tube(gate,pale,curl,.036);
 }
 for(let i=0;i<13;i++){const a=i*Math.PI/12;star(gate,pale,.73*Math.cos(a),1.17+.73*Math.sin(a),.358,.027,.009,4);}
 const crest=put(gate,new T.CylinderGeometry(.265,.265,.095,30),blue,0,1.98,.39);crest.rotation.x=Math.PI/2;
 ring(gate,gold,0,1.98,.45,.268,.033);star(gate,pale,0,1.98,.46,.31,.094);
 // Geronimo, with an upright pose and a raised boot on the path.
 const mouse=group(root,-1.78,.02,1.28);mouse.rotation.y=.71;
 const suit=material(0x53684a), lapel=material(0x6e8057), shirt=material(0xfaf0d2), fur=material(0xcc7d43), muzzle=material(0xf1c28a), pink=material(0xdc9190), leather=material(0x6f4331), seam=material(0xa76743), paper=material(0xecce8d);
 tube(mouse,pink,[[-.16,.74,-.18],[-.43,.55,-.26],[-.76,.61,-.28],[-.89,.97,-.22],[-.80,1.14,-.15]],.044);
 [[-.21,.19,.20], [.23,.05,-.16]].forEach(([x,y,z],i)=>{
 const a=[x,.74,-.03],b=[x*1.12,y+.28,z+.06],c=[x,y+.06,z];
 limb(mouse,suit,a,b,.16,.135);limb(mouse,suit,b,c,.134,.1);
 oval(mouse,leather,x,y+.064,z+.09,.145,.102,.23);
 oval(mouse,dark,x,y+.015,z+.09,.15,.036,.232);
 for(let j=0;j<3;j++)limb(mouse,pale,[x-.055,y+.149,z+.028+j*.036],[x+.053,y+.148,z+.035+j*.036],.009,.009);
 });
 oval(mouse,suit,0,.99,-.023,.34,.425,.22);
 oval(mouse,shirt,0,1.14,.168,.185,.29,.061);
 cut(mouse,lapel,[[-.29,1.29],[-.12,1.38],[-.035,1.02],[-.18,1.11]],.029,.008).position.z=.188;
 cut(mouse,lapel,[[.29,1.29],[.12,1.38],[.035,1.02],[.18,1.11]],.029,.008).position.z=.188;
 cut(mouse,red,[[0,1.28],[.052,1.19],[.028,1.11],[.067,.96],[0,.92],[-.05,.97],[-.019,1.16]],.033,.008).position.z=.232;
 for(let i=0;i<3;i++)oval(mouse,gold,.14,.80+i*.086,.175,.023,.023,.014);
 const bag=group(mouse,-.34,.72,.018);bag.rotation.z=-.13;
 oval(bag,leather,-.05,0,0,.212,.228,.143);box(bag,leather,-.04,-.037,.021,.345,.305,.197);oval(bag,seam,-.05,.087,.112,.191,.092,.045);box(bag,gold,-.055,.032,.16,.083,.086,.024);box(bag,leather,-.055,.034,.175,.041,.042,.013);
 tube(mouse,seam,[[-.40,.83,.10],[-.26,1.09,.178],[-.115,1.36,.043],[-.08,1.27,-.20],[-.23,.98,-.21],[-.38,.78,-.09]],.037);
 for(const s of [-1,1]){limb(mouse,suit,[s*.255,1.22,.02],[s*.335,1.015,.19],.119,.108);limb(mouse,lapel,[s*.335,1.015,.19],[s*.19,1.04,.374],.107,.077);oval(mouse,shirt,s*.19,1.036,.373,.085,.08,.083);oval(mouse,fur,s*.16,1.035,.43,.084,.078,.077);}
 const notebook=group(mouse,.026,1.083,.434);notebook.rotation.set(-.23,-.10,-.09);box(notebook,leather,0,0,0,.278,.364,.032);box(notebook,paper,0,.002,.024,.253,.343,.029);
 for(let j=0;j<5;j++){box(notebook,seam,0,-.09+j*.038,.04,.163,.003,.002);const o=ring(notebook,dark,-.10+j*.049,.174,.018,.027,.005);o.rotation.y=Math.PI/2;}
 const head=group(mouse,0,1.58,.036);head.rotation.x=-.29;head.rotation.y=.21;
 oval(head,fur,0,.015,-.027,.285,.284,.263);
 oval(head,muzzle,0,-.091,.225,.193,.13,.211);
 const snout=oval(head,fur,0,.019,.244,.166,.123,.232);snout.rotation.x=-.12;
 oval(head,black,0,.042,.469,.071,.053,.053);
 oval(head,dark,.007,-.118,.347,.104,.054,.031);oval(head,pink,.009,-.144,.363,.059,.022,.024);box(head,shirt,.001,-.105,.376,.077,.031,.024);
 for(const s of [-1,1]){
 const ear=oval(head,fur,s*.263,.149,-.107,.212,.236,.105);ear.rotation.z=-s*.28;
 const inner=oval(head,pink,s*.273,.157,-.031,.164,.186,.050);inner.rotation.z=-s*.28;
 const eye=oval(head,shirt,s*.13,.122,.182,.091,.109,.049);eye.rotation.y=s*.25;
 oval(head,black,s*.108+.017,.144,.228,.039,.049,.021);oval(head,shirt,s*.108+.024,.162,.247,.013,.016,.007);
 const glasses=ring(head,leather,s*.126,.121,.225,.097,.014);glasses.rotation.y=s*.17;
 limb(head,leather,[s*.22,.122,.204],[s*.29,.137,.037],.011,.011);
 for(let i=0;i<3;i++)oval(head,seam,s*(.078+i*.029),-.03-i*.012,.424-i*.026,.009,.009,.009);
 }
 tube(head,leather,[[-.037,.116,.236],[0,.149,.249],[.037,.116,.236]],.012);
 // Frog, slightly forward of the first stair.
 const frog=group(root,-.77,.055,.91);frog.rotation.y=.23;
 const green=material(0x83ae42), lime=material(0xc0d672);
 oval(frog,green,0,.245,0,.169,.233,.137);oval(frog,lime,0,.235,.105,.125,.155,.047);
 oval(frog,green,0,.47,.006,.214,.143,.157);oval(frog,lime,0,.436,.108,.188,.093,.089);
 oval(frog,dark,0,.445,.187,.124,.048,.014);oval(frog,pink,0,.424,.2,.07,.017,.01);
 const scarf=ring(frog,red,0,.347,.017,.135,.029);scarf.rotation.x=Math.PI/2;
 const tail=cut(frog,red,[[-.083,.34],[-.148,.32],[-.247,.083],[-.156,.13],[-.129,.091]],.026,.008);tail.position.z=.095;
 for(const s of [-1,1]){oval(frog,green,s*.114,.571,.046,.077,.088,.074);oval(frog,shirt,s*.116,.586,.094,.056,.061,.034);oval(frog,black,s*.116+.01,.596,.124,.028,.038,.014);oval(frog,green,s*.147,.112,0,.092,.115,.102);oval(frog,green,s*.143,.036,.101,.111,.04,.075);}
 tube(frog,green,[[.127,.303,.017],[.238,.325,.015],[.292,.42,.034],[.326,.491,.062]],.028);
 for(let i=0;i<4;i++)limb(frog,green,[.322,.486,.061],[.306+i*.027,.527+i*.012,.087],.017,.011);
 // Compass compartment and hinged stone. The face lies parallel with the island top.
 const compartment=group(root,1.96,.06,1.36);compartment.rotation.y=-.3;
 const cylinder=(p,m,x,y,z,r,h,n=32)=>put(p,new T.CylinderGeometry(r,r,h,n),m,x,y,z);
 cylinder(compartment,dark,0,.012,0,.405,.118,11);
 const compass=group(compartment,-.045,.086,.035);compass.name='Compass';
 cylinder(compass,bark[2],0,.028,0,.231,.07);cylinder(compass,gold,0,.054,0,.228,.06);cylinder(compass,cream,0,.087,0,.193,.014);
 let cr=ring(compass,gold,0,.095,0,.196,.012);cr.rotation.x=-Math.PI/2;
 for(let j=0;j<24;j++){const a=j*Math.PI/12;box(compass,dark,Math.sin(a)*.171,.097,Math.cos(a)*.171,.008,.004,j%3?.02:.036).rotation.y=a;}
 const needle=group(compass,0,.108,0);needle.name='Compass needle';needle.rotation.y=1.18;
 const blade=cut(needle,red,[[0,.171],[.038,0],[0,-.03],[-.038,0]],.008,.002);blade.rotation.x=-Math.PI/2;
 const tailBlade=cut(needle,blue,[[0,-.161],[.039,0],[0,.032],[-.039,0]],.008,.002);tailBlade.rotation.x=-Math.PI/2;
 cylinder(compass,gold,0,.127,0,.028,.023);
 const signArt=document.createElement('canvas');signArt.width=768;signArt.height=256;const sc=signArt.getContext('2d');
 sc.fillStyle='#c49756';sc.fillRect(0,0,768,256);sc.strokeStyle='#66432c';sc.lineWidth=13;sc.strokeRect(14,14,740,228);sc.fillStyle='#39291e';sc.textAlign='center';sc.font='bold 82px Georgia';sc.fillText('Back to the',384,104);sc.fillText('golden stair.',384,198);
 const signTex=new T.CanvasTexture(signArt);signTex.colorSpace=T.SRGBColorSpace;signTex.anisotropy=4;
 const inscription=put(compartment,new T.PlaneGeometry(.65,.226),new T.MeshBasicMaterial({map:signTex}),.04,.085,.41);inscription.rotation.x=-1.31;
 const hinge=group(compartment,0,.155,-.27);hinge.name='Loose stone hinge';
 const lid=put(hinge,chip,stone,0,0,.27,.49,.115,.42);lid.rotation.y=.15;
 for(let j=0;j<10;j++)put(hinge,chip,rocks[j%rocks.length],range(-.29,.29),range(.072,.10),range(.09,.45),range(.04,.10),.025,.037).rotation.y=rand()*5;
 const lidMark=star(hinge,pale,0,.118,.29,.19,.046);lidMark.rotation.x=-Math.PI/2;
 const round=ring(hinge,gold,0,.12,.29,.138,.009);round.rotation.x=-Math.PI/2;
 // Amber moth and two independently animated pairs of wings.
 const moth=group(root,1.59,1.28,.66);const amber=material(0xea781b,{side:T.DoubleSide}), honey=material(0xffb951), ink=material(0xa86431);
 oval(moth,ink,0,-.054,0,.066,.134,.055);oval(moth,honey,0,.071,.014,.079,.081,.062);
 for(const s of [-1,1]){oval(moth,dark,s*.031,.088,.068,.014,.019,.013);tube(moth,pale,[[s*.025,.114,.018],[s*.08,.218,.001],[s*.121,.231,.014],[s*.132,.208,.028]],.009);}
 const wings=[];
 for(const s of [-1,1]){const wing=group(moth,s*.03,-.014,-.014);wings.push(wing);
  for(const [points,shade] of [
    [[[0,0],[s*.13,.134],[s*.27,.177],[s*.39,.144],[s*.36,.071],[s*.24,-.005],[s*.06,-.046]],amber],
    [[[0,-.022],[s*.19,-.027],[s*.31,-.114],[s*.30,-.197],[s*.16,-.173],[s*.054,-.075]],honey]
  ]){const w=cut(wing,shade,points,.013,.007);w.position.z=-.005;}
  for(const [x,y] of [[.34,.125],[.28,.065],[.25,-.148],[.165,-.118]]){tube(wing,pale,[[0,-.032,.015],[s*x*.53,y*.55,.019],[s*x,y,.016]],.006);ring(wing,pale,s*x,y,.018,.022,.005);}
 }
 const mothStart=moth.position.clone(), mothEnd=v(1.94,.35,1.36);
 const stopPoints=path.slice(1).reverse();
 const perch=v(-1.15,1.76,1.52);
 const approachCurve=new T.CatmullRomCurve3([mothStart,v(.76,1.78,.88),v(-.28,1.98,1.28),perch]);
 const flight=new T.CatmullRomCurve3([perch,...stopPoints.map(([x,z],i)=>v(x,.52+Math.sin(i*.8)*.11,z)),v(.58,.73,1.83),mothEnd]);
 const touchGeo=new T.SphereGeometry(1,12,8), touchMat=new T.MeshBasicMaterial({colorWrite:false,depthWrite:false});
 const gateTouch=put(gate,touchGeo,touchMat,0,1.03,.46,.76,1.14,.36);
 const mothTouch=put(moth,touchGeo,touchMat,0,0,0,.47,.45,.39), stoneTouch=put(compartment,touchGeo,touchMat,0,.16,.08,.63,.38,.56);
 const showClue=(open)=>{compass.visible=open;inscription.visible=open;};showClue(false);
 function pose(reveal,fly,open,time,approach=0){
   const lift=T.MathUtils.smoothstep(reveal,.06,.80);
   gate.position.y=1.09-(1-lift)*.85;gate.scale.y=.04+.96*lift;gate.visible=reveal>.06;
   const sh=T.MathUtils.clamp((reveal-.62)/.38,0,1);shimmer.material.opacity=Math.sin(Math.PI*sh)*.84;sweep(-.12+1.63*sh);
   portalLight.intensity = lift*(.16+Math.sin(Math.PI*sh)*2.8);
   portal.visible=reveal>.32;
   const spark=Math.sin(Math.PI*T.MathUtils.clamp((reveal-.77)/.23,0,1));
   amber.emissive.set(0xd06005);amber.emissiveIntensity=.19+spark*.65;
   moth.position.copy(approach<1?approachCurve.getPoint(approach):flight.getPoint(fly));
   moth.rotation.y=approach===1&&fly===0?-.88:0;
   const flap=(approach>0&&approach<1)||(fly>0&&fly<1) ? .15+Math.sin(time*33)*.96 : fly===1 ? .33 : .62+Math.sin(time*3)*.075;
   wings.forEach((wing,i)=>wing.rotation.y=(i?1:-1)*flap);
   stopPoints.forEach((_,i)=>{const t=(i+1)/8;const strength=Math.max(0,1-Math.abs(fly-t)/.072);pathLights[6-i].emissive.set(0xf8b950);pathLights[6-i].emissiveIntensity=strength*1.5;});
   hinge.rotation.x=-1.36*T.MathUtils.smoothstep(open,0,.74);
   showClue(open>.24);
   const worldHeading=Math.atan2(.05-1.96,-1.30-1.36);
   // The red tip points along local -Z. Account for the compartment's yaw.
   const compassHeading=worldHeading+Math.PI+.3;
   needle.rotation.y=1.18+(2*Math.PI+compassHeading-1.18)*T.MathUtils.smoothstep(open,.23,1);
 }
 // Bake static pieces by material to keep the camera render inexpensive.
 root.updateMatrixWorld(true);
 const moving=new Set([gate,moth,compartment,...pathLights]);
 const staticBatches=new Map();
 function collect(object) {
   if (moving.has(object) || moving.has(object.material) || object.isInstancedMesh) return;
   for (const child of [...object.children]) collect(child);
   if (!object.isMesh || object.geometry.attributes.color) return;
   const geo=(object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()).applyMatrix4(object.matrixWorld);
   if(!staticBatches.has(object.material))staticBatches.set(object.material,[]);
   staticBatches.get(object.material).push(geo);
   object.removeFromParent();
 }
 collect(root);
 for (const [mat,geometries] of staticBatches) {
   const mesh=new T.Mesh(mergeGeometries(geometries),mat);
   root.add(mesh);
   geometries.forEach(geometry=>geometry.dispose());
 }
 pose(0,0,0,0);
 return {root,pose,mothTouch,stoneTouch,portal,gateTouch};
}
