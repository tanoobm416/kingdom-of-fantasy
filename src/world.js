import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildIsland} from './island.js';
import {dressLandscape} from './landscape.js';
import {createCameraNavigation,openingView} from './camera.js';
import {createEncounter} from './encounter.js';
import {createKingdomMap} from './kingdom-map.js';
import {kingdoms,createKingdom,realmView,allowsRealmTransition} from './kingdoms.js';

const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

export async function createWorld({stage,discover,caption,gesture,showCaption,sound,gateButton,returnButton,mapTitle,mapChoices}){
  let renderer;
  try{
    renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  }catch(error){
    throw new Error('This browser could not start WebGL. Open the link in Safari or another browser with WebGL enabled.',{cause:error});
  }
  const canvas=renderer.domElement;
  canvas.setAttribute('aria-label','Fantasy landscape. Arrow keys rotate the camera. Plus and minus zoom.');
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(50,1,.08,175);
  const landscape=dressLandscape(scene);
  const model=buildIsland();
  let castle;
  try{
    castle=(await new GLTFLoader().loadAsync('./assets/castle.glb')).scene;
  }catch(error){
    renderer.dispose();
    throw error;
  }
  model.portal.add(castle);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.45));
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.16;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;
  renderer.shadowMap.needsUpdate=true;
  const touchAreas=new Set([model.mothTouch,model.stoneTouch,model.gateTouch]);
  model.root.traverse(item=>{
    if(!item.isMesh||touchAreas.has(item))return;
    item.receiveShadow=true;
    item.castShadow=!item.material.transparent && !item.geometry.attributes.color && !item.isInstancedMesh;
  });
  // Only the foliage banks cast instanced shadows. Small moss and stone chips receive them.
  model.root.traverse(item=>{
    if(item.isInstancedMesh && item.count<700 && !item.geometry.index)item.castShadow=true;
  });
  scene.add(model.root);
  stage.appendChild(canvas);
  const nav=createCameraNavigation(canvas,camera);
  const state=createEncounter();
  let started=false,last=0,currentPhase='waiting',down=null,gestureTimer,captionTimer;
  let realm='island', atlas, realmTime=0, islandView, transitionTimer;
  const destinations=new Map(), pinButtons=new Map();
  for(const info of kingdoms){
    const button=document.createElement('button');
    button.type='button';button.className='map-pin';
    button.style.setProperty('--gem','#'+info.color.toString(16).padStart(6,'0'));
    const name=document.createElement('strong');
    name.textContent=info.name;
    button.append(name);
    if(info.gem){
      button.setAttribute('aria-label','Kingdom of the '+info.name+' · '+info.gem);
      const gem=document.createElement('span');
      gem.textContent=info.gem;
      button.append(gem);
    }
    button.addEventListener('click',()=>changeRealm(info.id));
    pinButtons.set(info.id,button);
    mapChoices.append(button);
  }
  const duration=seconds=>reducedMotion?.001:seconds;
  const pointer=new T.Vector2(), projected=new T.Vector3(), ray=new T.Raycaster();

  function resize(){
    const w=stage.clientWidth,h=stage.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false);
    nav.resize(w,h);
    if(realm==='map'){
      const view=atlas.setLayout(camera.aspect);
      applyView(view,true);
    }else if(realm!=='island'){
      camera.fov=realmView(realm,camera.aspect).fov;
      camera.updateProjectionMatrix();
    }
    if(!started){
      const view=openingView(camera.aspect);
      camera.position.copy(view.eye).add(new T.Vector3(-.29,.55,.22));
      nav.controls.target.copy(view.target).add(new T.Vector3(0,.55,0));
      nav.controls.update();
    }
  }
  resize();
  new ResizeObserver(resize).observe(stage);

  function canOpenGate(){
    return started && realm==='island' && state.gateUnlocked;
  }

  function flash(){
    clearTimeout(transitionTimer);
    stage.classList.remove('realm-transition');
    if(reducedMotion)return;
    requestAnimationFrame(()=>stage.classList.add('realm-transition'));
    transitionTimer=setTimeout(()=>stage.classList.remove('realm-transition'),740);
  }

  function applyView(view,snap=false){
    camera.fov=view.fov;
    camera.updateProjectionMatrix();
    if(snap)nav.snap(view.eye,view.target);
    else nav.travel(view.eye,view.target,duration(.75));
  }

  function changeRealm(next){
    if(!allowsRealmTransition(realm,next)||(realm==='island'&&!canOpenGate()))return;
    sound.unlock();
    caption.hidden=true;
    clearTimeout(captionTimer);
    if(realm==='island'){
      islandView={eye:camera.position.clone(),target:nav.controls.target.clone()};
      atlas??=createKingdomMap();
    }
    if(next==='island'){
      nav.snap(islandView.eye,islandView.target);
    }else if(next==='map'){
      applyView(atlas.setLayout(camera.aspect),true);
    }else{
      if(!destinations.has(next))destinations.set(next,createKingdom(next));
      destinations.get(next).encounter.reset?.();
      const info=kingdoms.find(entry=>entry.id===next);
      applyView(realmView(next,camera.aspect),true);
      showCaption(info.title,info.detail);
      captionTimer=setTimeout(()=>{caption.hidden=true;},6100);
    }
    realmTime=0;
    realm=next;
    stage.dataset.realm=realm;
    gateButton.hidden=true;
    discover.hidden=true;
    const creature=destinations.get(realm)?.encounter;
    discover.textContent=creature?.label||(state.phase==='landed'?'Open the stone':'Meet the moth');
    discover.classList.toggle('creature-action',Boolean(creature));
    gesture.hidden=true;
    mapChoices.hidden=realm!=='map';
    mapTitle.hidden=realm!=='map';
    returnButton.hidden=realm==='island'||realm==='map';
    nav.setActive(realm!=='map');
    if(!returnButton.hidden)returnButton.focus({preventScroll:true});
    else canvas.focus({preventScroll:true});
    resize();
    sound.switchTo(realm);
    renderer.shadowMap.needsUpdate=true;
    flash();
  }

  gateButton.addEventListener('click',()=>changeRealm('map'));
  returnButton.addEventListener('click',()=>changeRealm('map'));

  function hitTarget(){
    if(realm!=='island')return destinations.get(realm)?.encounter.hit||null;
    if(state.phase==='moth')return model.mothTouch;
    if(state.phase==='landed')return model.stoneTouch;
    return null;
  }

  function activate(){
    if(realm!=='island'){
      const creature=destinations.get(realm)?.encounter;
      if(!creature)return;
      creature.interact(realmTime);
      sound.unlock();sound.greet(realm);
      showCaption(creature.title,creature.line);
      clearTimeout(captionTimer);
      captionTimer=setTimeout(()=>{caption.hidden=true;},6200);
      return;
    }
    if(state.phase==='moth'){state.tap('moth');sound.unlock();sound.flutter(1.85);}
    else if(state.phase==='landed')state.tap('stone');
  }

  discover.addEventListener('click',activate);
  canvas.addEventListener('pointerdown',event=>{
    if(down && down.id!==event.pointerId){down=null;return;}
    down={id:event.pointerId,x:event.clientX,y:event.clientY};
  });
  canvas.addEventListener('pointercancel',()=>{down=null;});
  canvas.addEventListener('pointerup',event=>{
    const target=hitTarget();
    const tap=down;
    down=null;
    if((realm!=='map'&&!target&&!canOpenGate())||!tap||tap.id!==event.pointerId||Math.hypot(tap.x-event.clientX,tap.y-event.clientY)>10)return;
    const bounds=canvas.getBoundingClientRect();
    pointer.set((event.clientX-bounds.x)/bounds.width*2-1,1-(event.clientY-bounds.y)/bounds.height*2);
    ray.setFromCamera(pointer,camera);
    if(realm==='map'){
      const nearest=ray.intersectObjects(atlas.pins.map(pin=>pin.hit),false)[0];
      if(nearest)changeRealm(nearest.object.userData.destination);
      return;
    }
    const gate=canOpenGate()&&camera.position.z>model.gateTouch.getWorldPosition(projected).z;
    const hits=ray.intersectObjects([target,gate?model.gateTouch:null].filter(Boolean),false);
    if(hits[0]?.object===model.gateTouch)changeRealm('map');
    else if(hits.length)activate();
  });

  function syncPhase(phase){
    currentPhase=phase;
    stage.dataset.phase=phase;
    if(phase==='moth'){
      caption.hidden=true;
      discover.textContent='Meet the moth';
    }else if(phase==='approach'){
      nav.reset(duration(.84));
    }else if(phase==='message'){
      showCaption('Amber moth','“Geronimo, enter the golden gate. The seven kingdoms await!”');
      sound.greet('island');
      clearTimeout(captionTimer);
      captionTimer=setTimeout(()=>{caption.hidden=true;},6500);
    }else if(phase==='flight'){
      sound.flutter();
      const eye=camera.position.clone();
      // Keep the whole trail in view when the reader started the flight from a close-up.
      if(eye.distanceTo(nav.controls.target)<4)nav.reset(.95);
    }else if(phase==='landed'){
      discover.textContent='Open the stone';
    }else if(phase==='opening'&&!reducedMotion){
      nav.travel(new T.Vector3(3.74,2.42,4.45),new T.Vector3(1.48,.34,1.09),1.2);
    }else if(phase==='opened'){
      showCaption('Back to the golden stair.','Clue discovered');
      clearTimeout(captionTimer);
      captionTimer=setTimeout(()=>{caption.hidden=true;},6800);
    }
  }

  function positionButton(button,target,inset,showOffscreen=false){
    if(!target){button.hidden=true;button.classList.remove('offscreen-action');return;}
    target.getWorldPosition(projected).project(camera);
    if(projected.z>1||projected.z<-1||Math.abs(projected.x)>.98||Math.abs(projected.y)>.97){
      button.hidden=!showOffscreen;
      button.classList.toggle('offscreen-action',showOffscreen);
      return;
    }
    button.classList.remove('offscreen-action');
    button.hidden=false;
    const w=stage.clientWidth,h=stage.clientHeight;
    button.style.left=T.MathUtils.clamp(w*(.5+projected.x*.5),inset,w-inset)+'px';
    button.style.top=T.MathUtils.clamp(h*(.5-projected.y*.5),80,h-86)+'px';
  }

  function positionTargets(){
    if(realm==='map'){
      const w=stage.clientWidth,h=stage.clientHeight;
      for(const pin of atlas.pins){
        pin.anchor.getWorldPosition(projected).project(camera);
        const button=pinButtons.get(pin.info.id);
        button.style.left=(.5+projected.x*.5)*w+'px';
        button.style.top=(.5-projected.y*.5)*h+'px';
      }
    }
    positionButton(discover,hitTarget(),realm==='island'?78:120,realm!=='island'&&realm!=='map');
    const inFront=canOpenGate()&&camera.position.z>model.gateTouch.getWorldPosition(projected).z;
    positionButton(gateButton,inFront?model.gateTouch:null,85);
  }

  renderer.setAnimationLoop(now=>{
    const dt=last?Math.min(.22,(now-last)/1000):0;
    last=now;
    let display=scene;
    if(realm!=='island'){
      realmTime+=dt;
      const destination=realm==='map'?atlas:destinations.get(realm);
      destination.animate(realmTime);
      const cue=destination.encounter?.takeCue?.();
      if(cue)sound.perform(cue);
      display=destination.scene;
    }else if(started){
      state.advance(dt);
      if(currentPhase!==state.phase)syncPhase(state.phase);
      model.pose(...state.pose);
      landscape.drift(state.pose[3]);
      if(['reveal','opening'].includes(state.phase))renderer.shadowMap.needsUpdate=true;
    }else{
      // The entrance looks through the gateway before the encounter begins.
      model.pose(1,0,0,now/1000);
      landscape.drift(now/1000);
    }
    nav.advance(dt);
    renderer.render(display,camera);
    if(started)positionTargets();
  });
  return {
    enter(){
      if(started)return;
      started=true;
      state.begin();
      sound.switchTo('island');
      canvas.tabIndex=0;
      canvas.focus({preventScroll:true});
      nav.setActive(true);
      nav.reset(reducedMotion?.001:2.7);
      showCaption('Welcome to the Kingdom of Fantasy.','A magical journey awaits.');
      gesture.hidden=false;
      gestureTimer=setTimeout(()=>{gesture.hidden=true;},5400);
      nav.controls.addEventListener('start',()=>{gesture.hidden=true;clearTimeout(gestureTimer);});
    },
    resetView(){
      if(realm==='island')nav.reset(duration(.82));
      else if(realm==='map')applyView(atlas.setLayout(camera.aspect),true);
      else applyView(realmView(realm,camera.aspect));
    }
  };
}
