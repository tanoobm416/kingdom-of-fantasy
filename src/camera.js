import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

export function openingView(aspect){
  if(aspect<.86)return {eye:new T.Vector3(.07,2.76,7.15), target:new T.Vector3(.08,1.45,-.13)};
  return {eye:new T.Vector3(.22,2.48,5.80), target:new T.Vector3(.05,1.60,-.28)};
}

export function createCameraNavigation(canvas,camera){
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;
  controls.dampingFactor=.10;
  controls.rotateSpeed=.65;
  controls.zoomSpeed=.9;
  controls.panSpeed=.65;
  controls.minDistance=1.24;
  controls.maxDistance=14;
  controls.minPolarAngle=.25;
  controls.maxPolarAngle=1.675;
  controls.screenSpacePanning=false;
  controls.touches.ONE=T.TOUCH.ROTATE;
  controls.touches.TWO=T.TOUCH.DOLLY_PAN;
  let move=null;
  let active=false;
  controls.enabled=false;
  controls.addEventListener('start',()=>{move=null;});
  function travel(eye,target,duration=.85){
    const from=camera.position.clone(), focus=controls.target.clone();
    controls.enableDamping=false;
    controls.update();
    camera.position.copy(from);
    controls.target.copy(focus);
    controls.update();
    controls.enableDamping=true;
    move={from,to:eye.clone(),focus,target:target.clone(),time:0,duration};
  }
  function snap(eye,target){
    move=null;
    controls.enableDamping=false;
    controls.update();
    camera.position.copy(eye);
    controls.target.copy(target);
    controls.update();
    controls.enableDamping=true;
  }
  function reset(duration=.8){
    const view=openingView(camera.aspect);
    travel(view.eye,view.target,duration);
  }
  function setActive(ready){
    active=ready;
    controls.enabled=ready;
  }
  function resize(w,h){
    camera.aspect=w/h;
    camera.fov=w/h<.86?59:50;
    camera.updateProjectionMatrix();
  }
  function advance(dt){
    if(move){
      const step=move;
      step.time+=dt;
      const f=T.MathUtils.smoothstep(step.time,0,step.duration);
      camera.position.lerpVectors(step.from,step.to,f);
      controls.target.lerpVectors(step.focus,step.target,f);
      if(f===1)move=null;
    }
    const current=controls.target;
    current.x=T.MathUtils.clamp(current.x,-2.8,2.8);
    current.z=T.MathUtils.clamp(current.z,-2,2);
    current.y=T.MathUtils.clamp(current.y,.40,3.05);
    controls.update();
  }
  canvas.addEventListener('keydown',event=>{
    if(!active || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(event.key))return;
    event.preventDefault();
    move=null;
    const offset=camera.position.clone().sub(controls.target);
    const orbit=new T.Spherical().setFromVector3(offset);
    if(event.key==='ArrowLeft')orbit.theta-=.15;
    if(event.key==='ArrowRight')orbit.theta+=.15;
    if(event.key==='ArrowUp')orbit.phi=Math.max(.25,orbit.phi-.10);
    if(event.key==='ArrowDown')orbit.phi=Math.min(1.675,orbit.phi+.10);
    if(event.key==='+'||event.key==='=')orbit.radius=Math.max(1.24,orbit.radius*.86);
    if(event.key==='-')orbit.radius=Math.min(14,orbit.radius*1.16);
    camera.position.copy(controls.target).add(offset.setFromSpherical(orbit));
    controls.update();
  });
  return {controls,advance,resize,setActive,reset,travel,snap};
}
