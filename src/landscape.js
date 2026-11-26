import * as T from 'three';

let seed = 72139;
function random(){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  return seed/4294967296;
}
const range=(a,b)=>a+(b-a)*random();

export function dressLandscape(scene){
  scene.fog=new T.FogExp2('#879c83',.031);
  const sky=new T.Mesh(new T.SphereGeometry(170,32,20),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,
    uniforms:{
      zenith:{value:new T.Color('#183c4a')},
      horizon:{value:new T.Color('#b1bba0')},
      lightColor:{value:new T.Color('#ffd59a')},
      dawn:{value:new T.Color('#708f8a')}
    },
    vertexShader:`varying vec3 viewDirection;
      void main(){ viewDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader:`uniform vec3 zenith,horizon,lightColor,dawn; varying vec3 viewDirection;
      void main(){
        vec3 dir=normalize(viewDirection);
        vec3 sun=normalize(vec3(-.58,.32,-.73));
        float air=smoothstep(-.23,.17,dir.y);
        vec3 color=mix(dawn,horizon,air);
        color=mix(color,zenith,smoothstep(.035,.76,dir.y));
        float warmth=max(dot(dir,sun),0.);
        color=mix(color,lightColor,pow(warmth,10.)*.60);
        color+=lightColor*pow(warmth,240.)*.22;
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  }));
  scene.add(sky);

  // Layered silhouettes give the foreground path a horizon and visible parallax.
  const landGeo=new T.IcosahedronGeometry(1,1);
  const ranges=[{r:35,c:0x67847b,count:22},{r:57,c:0x86a393,count:22},{r:83,c:0x9bae9a,count:18}];
  for(const {r,c,count} of ranges){
    const material=new T.MeshLambertMaterial({color:c,flatShading:true});
    const hills=new T.InstancedMesh(landGeo,material,count*3);
    const part=new T.Object3D();
    let index=0;
    for(let i=0;i<count;i++){
      const a=(i+range(-.48,.48))/count*Math.PI*2;
      const distance=r+range(-5,5), x=Math.cos(a)*distance,z=Math.sin(a)*distance;
      for(let j=0;j<3;j++){
        part.position.set(x+range(-5,5),-8+range(-2,1),z+range(-5,5));
        part.scale.set(range(4,10),range(5,r*.213),range(4,11));
        part.rotation.set(range(-.22,.22),range(0,Math.PI),range(-.21,.21));
        part.updateMatrix();
        hills.setMatrixAt(index++,part.matrix);
      }
    }
    scene.add(hills);
  }
  const mistPlane=new T.Mesh(new T.PlaneGeometry(230,230),new T.MeshBasicMaterial({color:'#9ba994',fog:true}));
  mistPlane.position.y=-12;mistPlane.rotation.x=-Math.PI/2;scene.add(mistPlane);

  const grassGeo=new T.BufferGeometry();
  grassGeo.setAttribute('position',new T.Float32BufferAttribute([-.021,0,0,.021,0,0,.023,.18,.015, .021,0,0,.059,.095,0,.023,.18,.015],3));
  grassGeo.computeVertexNormals();
  const grass=new T.InstancedMesh(grassGeo,new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide}),620);
  const palette=[0x617d45,0x879548,0x9b9b53,0x3e6241,0x718847].map(c=>new T.Color(c));
  const stem=new T.Object3D();
  for(let i=0;i<grass.count;i++){
    let x,z;
    do {x=range(-3.49,3.49);z=range(-2.49,2.49);}
    while(x*x/12.1+z*z/6.03>.95 || (Math.abs(x)<.70 && z >-1.7));
    stem.position.set(x,.039,z);
    stem.rotation.y=range(0,6.28);
    stem.scale.set(range(.7,1.3),range(.45,1.36),1);
    stem.updateMatrix();grass.setMatrixAt(i,stem.matrix);
    grass.setColorAt(i,palette[i%palette.length]);
  }
  grass.receiveShadow=true;scene.add(grass);

  const lighting=new T.HemisphereLight(0xffefd4,0x637f78,2.0);
  const sun=new T.DirectionalLight(0xffd59a,3.0);
  sun.position.set(-5,8,5);
  sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);
  sun.shadow.camera.left=-5;sun.shadow.camera.right=5;
  sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;
  sun.shadow.camera.near=.2;sun.shadow.camera.far=21;
  sun.shadow.normalBias=.020;sun.shadow.bias=-.00012;sun.shadow.radius=2.7;
  scene.add(lighting,sun);
  const rim=new T.DirectionalLight(0xade0ee,1.28);
  rim.position.set(4,4,-6);
  scene.add(rim);

  const sparks=new Float32Array(112*3), starts=[];
  for(let i=0;i<sparks.length;i+=3)starts.push([range(-12,12),range(.12,6.8),range(-12,8),range(0,6.28)]);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(sparks,3));
  const particles=new T.Points(g,new T.ShaderMaterial({
    uniforms:{time:{value:0},density:{value:Math.min(devicePixelRatio,1.5)}},
    transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`uniform float time,density; varying float strength;
      void main(){
        vec4 p=modelViewMatrix*vec4(position,1.);
        strength=.24+.38*(sin(position.x*2.+position.z+time*1.5)*.5+.5);
        gl_PointSize=clamp(density*16./max(-p.z,1.),1.,6.);
        gl_Position=projectionMatrix*p;
      }`,
    fragmentShader:`varying float strength;void main(){float radius=length(gl_PointCoord-.5);gl_FragColor=vec4(1.,.75,.36,(1.-smoothstep(.05,.5,radius))*strength);}`
  }));
  particles.frustumCulled=false;scene.add(particles);
  return {
    drift(t){
      starts.forEach(([x,y,z,phase],i)=>{
        sparks[i*3]=x+Math.sin(t*.21+phase)*.4;
        sparks[i*3+1]=y+Math.cos(t*.39+phase)*.24;
        sparks[i*3+2]=z+Math.sin(t*.13+phase)*.4;
      });
      g.attributes.position.needsUpdate=true;particles.material.uniforms.time.value=t;
    }
  };
}
