import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
import {PNG} from 'pngjs';
import jsQR from 'jsqr';
import * as T from 'three';
import {createEncounter} from '../src/encounter.js';
import {buildIsland} from '../src/island.js';
import {createCameraNavigation,openingView} from '../src/camera.js';

globalThis.document=Object.assign(new EventTarget(),{createElement:()=>createCanvas(1,1)});

test('printable code encodes the public entry URL',async()=>{
  const image=PNG.sync.read(await readFile('dist/downloads/kingdom-qr.png'));
  assert.equal(jsQR(new Uint8ClampedArray(image.data),image.width,image.height)?.data,
    'https://beyond-the-page-kingdom.knowinghull8.chatgpt.site/');
});

test('the castle is a binary GLTF asset with 3D geometry',async()=>{
  const file=await readFile('dist/assets/castle.glb');
  assert.equal(file.toString('ascii',0,4),'glTF');
  const json=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12)));
  assert.ok(json.meshes.length>20);
});

test('portrait and landscape perspective framing project the moth to its raycast target',()=>{
  const model=buildIsland();
  model.pose(1,0,0,0);
  model.root.updateMatrixWorld(true);
  for(const aspect of [.46,1.8]){
    const camera=new T.PerspectiveCamera(aspect<.86?59:50,aspect,.08,175);
    const view=openingView(aspect);
    camera.position.copy(view.eye);
    camera.lookAt(view.target);
    camera.updateMatrixWorld();
    const point=model.mothTouch.getWorldPosition(new T.Vector3()).project(camera);
    assert.ok(Math.abs(point.x)<.92&&Math.abs(point.y)<.92);
    const ray=new T.Raycaster();
    ray.setFromCamera(point,camera);
    assert.ok(ray.intersectObject(model.mothTouch).length);
  }
});

test('gate, moth, stone and compass transition in order',()=>{
  const model=buildIsland(), encounter=createEncounter();
  const gate=model.root.getObjectByName('Gateway');
  const needle=model.root.getObjectByName('Compass needle');
  const compass=model.root.getObjectByName('Compass');
  const hinge=model.root.getObjectByName('Loose stone hinge');
  const pose=()=>model.pose(...encounter.pose);
  encounter.tap('moth');assert.equal(encounter.phase,'waiting');
  encounter.begin();pose();
  assert.equal(gate.visible,false);
  encounter.advance(3);pose();
  assert.equal(encounter.phase,'moth');assert.equal(gate.position.y,1.09);
  const start=model.mothTouch.getWorldPosition(new T.Vector3());
  encounter.tap('stone');assert.equal(encounter.phase,'moth');
  assert.equal(encounter.gateUnlocked,false);
  encounter.tap('moth');assert.equal(encounter.phase,'approach');
  encounter.advance(1.85);pose();
  assert.equal(encounter.phase,'message');
  assert.ok(model.mothTouch.getWorldPosition(new T.Vector3()).distanceTo(start)>2);
  assert.equal(encounter.gateUnlocked,false);
  assert.ok(model.mothTouch.getWorldPosition(new T.Vector3()).distanceTo(new T.Vector3(-1.78,1.62,1.28))<.75);
  encounter.advance(1);assert.equal(encounter.gateUnlocked,false);
  encounter.advance(1.66);assert.equal(encounter.gateUnlocked,true);
  assert.equal(encounter.phase,'flight');
  encounter.advance(1.22);pose();
  assert.ok(model.root.children.some(o=>o.material?.emissiveIntensity>.05&&o.material.emissive?.getHex()===0xf8b950));
  encounter.tap('stone');assert.equal(encounter.phase,'flight');
  encounter.advance(3);pose();
  assert.equal(encounter.phase,'landed');assert.equal(compass.visible,false);
  encounter.tap('stone');assert.equal(encounter.phase,'opening');
  encounter.advance(.8);pose();
  assert.equal(compass.visible,true);
  assert.ok(hinge.rotation.x<-.65 && needle.rotation.y>1.18);
  encounter.advance(1.1);pose();
  assert.equal(encounter.phase,'opened');
  const direction=new T.Vector3(0,0,-1).applyQuaternion(needle.getWorldQuaternion(new T.Quaternion()));
  const stair=new T.Vector3(.05,0,-1.3).sub(needle.getWorldPosition(new T.Vector3()));
  stair.y=0;
  assert.ok(direction.dot(stair.normalize())>.995);
  encounter.advance(20);pose();
  assert.ok(hinge.rotation.x<-1.3&&compass.visible);
});

test('touch drag, two-finger zoom and reset move the perspective camera',()=>{
  class Surface extends EventTarget{
    style={};
    clientHeight=854;
    setPointerCapture(){}
    releasePointerCapture(){}
  }
  const surface=new Surface();
  const camera=new T.PerspectiveCamera();
  const nav=createCameraNavigation(surface,camera);
  nav.resize(393,854);
  nav.setActive(true);
  nav.reset(.01);nav.advance(.02);
  const home=camera.position.clone();
  function touch(type,id,x,y){
    const event=new Event(type,{cancelable:true});
    Object.assign(event,{pointerId:id,pointerType:'touch',pageX:x,pageY:y,clientX:x,clientY:y});
    surface.dispatchEvent(event);
  }
  touch('pointerdown',1,160,420);
  touch('pointermove',1,250,400);
  touch('pointerup',1,250,400);
  for(let i=0;i<30;i++)nav.advance(1/60);
  assert.ok(camera.position.distanceTo(home)>1);
  const distance=camera.position.distanceTo(nav.controls.target);
  touch('pointerdown',1,160,400);
  touch('pointerdown',2,240,400);
  touch('pointermove',2,305,400);
  touch('pointerup',2,305,400);
  touch('pointerup',1,160,400);
  assert.ok(camera.position.distanceTo(nav.controls.target)<distance-.3);
  nav.reset(.2);
  for(let i=0;i<30;i++)nav.advance(1/60);
  assert.ok(camera.position.distanceTo(home)<.04);
});

test('the gateway can be hit after rising and Dragonaire contains moving 3D dragons',async()=>{
  const {createDragonRealm,dragonView}=await import('../src/dragons.js');
  const island=buildIsland();
  island.pose(1,0,0,3);
  island.root.updateMatrixWorld(true);
  const camera=new T.PerspectiveCamera(59,.46,.08,175);
  const {eye,target}=openingView(.46);
  camera.position.copy(eye);camera.lookAt(target);camera.updateMatrixWorld();
  const gate=island.gateTouch.getWorldPosition(new T.Vector3()).project(camera);
  const ray=new T.Raycaster();
  ray.setFromCamera(gate,camera);
  assert.ok(ray.intersectObject(island.gateTouch).length);
  const realm=createDragonRealm();
  assert.ok(realm.scene.isScene && realm.scene.children.length>45);
  const rainbow=realm.scene.getObjectByName('Dragon of the Rainbow');
  assert.ok(rainbow);
  const mark=rainbow.position.clone();
  const view=dragonView(.46);
  camera.fov=view.fov;camera.position.copy(view.eye);camera.lookAt(view.target);
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
  const visible=mark.clone().project(camera);
  assert.ok(Math.abs(visible.x)<1&&Math.abs(visible.y)<1);
  realm.animate(2);
  assert.ok(mark.distanceTo(rainbow.position)>1);
});

test('all eight map pins fit and are individually tappable in portrait and landscape',async()=>{
  const {createKingdomMap}=await import('../src/kingdom-map.js');
  const atlas=createKingdomMap();
  const expected=['Ruby','Topaz','Citrine','Emerald','Sapphire','Amethyst','Diamond',''];
  assert.deepEqual(atlas.pins.map(door=>door.info.gem),expected);
  for(const aspect of [.40,.46,.9,1.33,1.8,2.2]){
    const view=atlas.setLayout(aspect);
    const camera=new T.PerspectiveCamera(view.fov,aspect,.08,175);
    camera.position.copy(view.eye);camera.lookAt(view.target);camera.updateMatrixWorld();
    for(const door of atlas.pins){
      const center=door.hit.getWorldPosition(new T.Vector3()).project(camera);
      const plaque=door.anchor.getWorldPosition(new T.Vector3()).project(camera);
      assert.ok(Math.abs(plaque.x)<.89&&Math.abs(plaque.y)<.96,door.info.id+' at '+aspect);
      const ray=new T.Raycaster();
      ray.setFromCamera(center,camera);
      assert.equal(ray.intersectObjects(atlas.pins.map(d=>d.hit))[0]?.object,door.hit);
    }
  }
});

test('every map pin opens a distinct world, with a route back through the map to the island',async()=>{
  const {kingdoms,createKingdom,allowsRealmTransition}=await import('../src/kingdoms.js');
  assert.ok(allowsRealmTransition('island','map'));
  const realms=kingdoms.filter(entry=>entry.gem);
  const seen=new Set();
  for(const {id} of realms){
    assert.ok(allowsRealmTransition('map',id));
    assert.ok(allowsRealmTransition(id,'map'));
    assert.ok(!allowsRealmTransition('island',id));
    const world=createKingdom(id);
    let meshes=0;
    world.scene.traverse(item=>{if(item.isMesh)meshes++;});
    assert.ok(meshes>=14);
    world.animate(1.7);
    seen.add(world.scene.background.getHex());
  }
  assert.equal(seen.size,7);
  assert.ok(allowsRealmTransition('map','island'));
  assert.ok(!allowsRealmTransition('map','missing'));
});

test('each kingdom has a tappable creature and a visible response',async()=>{
  const {kingdoms,createKingdom,realmView}=await import('../src/kingdoms.js');
  const labels=new Set();
  for(const {id,gem} of kingdoms){
    if(!gem)continue;
    const {scene,animate,encounter}=createKingdom(id);
    assert.ok(encounter.label&&encounter.title&&encounter.line);
    labels.add(encounter.label);
    scene.updateMatrixWorld(true);
    const view=realmView(id,.46),camera=new T.PerspectiveCamera(view.fov,.46,.08,175);
    camera.position.copy(view.eye);
    camera.lookAt(view.target);camera.updateMatrixWorld();
    const center=encounter.hit.getWorldPosition(new T.Vector3()).project(camera);
    const ray=new T.Raycaster();
    ray.setFromCamera(center,camera);
    assert.equal(ray.intersectObject(encounter.hit)[0]?.object,encounter.hit,id);
    const before=encounter.hit.getWorldPosition(new T.Vector3()).clone();
    encounter.interact(.1);
    animate(.83);
    const after=encounter.hit.getWorldPosition(new T.Vector3());
    assert.ok(after.distanceTo(before)>.009,id);
  }
  assert.equal(labels.size,7);
});

test('each realm has a separate audible score and sound can be muted',async()=>{
  const {createSoundscape,soundProfiles}=await import('../src/audio.js');
  const {kingdoms}=await import('../src/kingdoms.js');
  const played=[], fades=[];
  const parameter=(log=false)=>({value:0,setValueAtTime(v){if(log)played.push(v);},
    setTargetAtTime(v){fades.push(v);},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}});
  const node=()=>({gain:parameter(),frequency:parameter(),Q:parameter(),playbackRate:parameter(),
    connect(destination){return destination;},start(){},stop(){}});
  class AudioContext {
    state='running';currentTime=1;sampleRate=22050;destination=node();
    resume(){return Promise.resolve();}
    createGain(){return node();}
    createOscillator(){return {...node(),frequency:parameter(true)};}
    createBiquadFilter(){return node();}
    createBuffer(_,size){return {getChannelData:()=>new Float32Array(size)};}
    createBufferSource(){return node();}
  }
  const oldInterval=globalThis.setInterval,oldWindow=globalThis.window;
  let tick;
  globalThis.setInterval=handler=>{tick=handler;return 1;};
  globalThis.window={AudioContext};
  try{
    const button=Object.assign(new EventTarget(),{setAttribute(){}});
    const audio=createSoundscape(button);
    audio.unlock();
    const signatures=new Set();
    for(const {id} of kingdoms){
      assert.ok(soundProfiles[id]);
      audio.switchTo(id);
      const start=played.length;
      tick();
      assert.ok(played.length>start,id);
      signatures.add(played.slice(start).join(','));
    }
    assert.equal(signatures.size,8);
    assert.ok(fades.includes(0)&&fades.includes(1));
    button.dispatchEvent(new Event('click'));
    assert.equal(button.textContent,'Sound off');
    const start=played.length;
    tick();audio.greet('fairies');audio.flutter();
    assert.equal(played.length,start);
  }finally{
    globalThis.setInterval=oldInterval;
    globalThis.window=oldWindow;
  }
});

test('Aquafin emerges after the clamshell opens and goes back inside',async()=>{
  const {createKingdom}=await import('../src/kingdoms.js');
  const {scene,animate,encounter}=createKingdom('mermaids');
  const lid=scene.getObjectByName('Clamshell lid');
  assert.ok(Math.abs(lid.rotation.x)<.001);
  const closed=encounter.hit.position.clone();
  encounter.interact(0);
  animate(.7);
  assert.ok(lid.rotation.x<-.9);
  assert.equal(encounter.takeCue(),'pearl');
  animate(1.7);
  assert.ok(encounter.hit.position.y>closed.y+1);
  animate(6);
  assert.ok(Math.abs(lid.rotation.x)<.001);
  assert.ok(encounter.hit.position.distanceTo(closed)<.01);
});

test('Strongheart splits the boulder on impact and Cackle casts after raising her wand',async()=>{
  const {createKingdom}=await import('../src/kingdoms.js');
  const giants=createKingdom('giants');
  const boulder=giants.scene.getObjectByName('Strongheart’s boulder');
  const fragment=giants.scene.getObjectByName('Broken boulder fragment');
  assert.ok(boulder.visible&&!fragment.visible);
  giants.encounter.interact(0);
  giants.animate(.55);
  assert.ok(boulder.visible);
  giants.animate(1.02);
  assert.ok(!boulder.visible&&fragment.visible);
  assert.equal(giants.encounter.takeCue(),'stomp');
  giants.encounter.reset();
  assert.ok(boulder.visible&&!fragment.visible);

  const witches=createKingdom('witches');
  const wand=witches.scene.getObjectByName('Queen Cackle’s wand');
  const spark=witches.scene.getObjectByName('Spell spark');
  assert.equal(wand.parent.rotation.z,0);
  witches.encounter.interact(0);
  witches.animate(.4);
  assert.ok(wand.parent.rotation.z>1&&!spark.visible);
  witches.animate(.9);
  assert.ok(spark.visible);
  assert.equal(witches.encounter.takeCue(),'cast');
});
