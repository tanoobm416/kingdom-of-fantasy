import {createSoundscape} from './audio.js';

const enter=document.querySelector('#enter');
const entrance=document.querySelector('#entrance');
const reset=document.querySelector('#reset');
const loading=document.querySelector('#loading');
const stage=document.querySelector('#stage');
const caption=document.querySelector('#caption');
const discover=document.querySelector('#discover');
const gesture=document.querySelector('#gesture');
const soundButton=document.querySelector('#sound');
const sound=createSoundscape(soundButton);
const gateButton=document.querySelector('#gate-action');
const returnButton=document.querySelector('#return');
const mapTitle=document.querySelector('#map-title');
const mapChoices=document.querySelector('#map-choices');
let promise;

function showCaption(title,body){
  const heading=document.createElement('strong');
  heading.textContent=title;
  const detail=document.createElement('small');
  detail.textContent=body;
  caption.replaceChildren(heading,detail);
  caption.hidden=false;
}

function load(){
  if(!promise)promise=import('./world.js').then(({createWorld})=>createWorld({stage,discover,caption,gesture,showCaption,sound,gateButton,returnButton,mapTitle,mapChoices}));
  return promise;
}

enter.addEventListener('click',async()=>{
  sound.unlock();
  enter.disabled=true;
  loading.hidden=false;
  loading.textContent='Opening the gateway…';
  try{
    const world=await load();
    entrance.hidden=true;
    reset.hidden=false;
    soundButton.hidden=false;
    world.enter();
  }catch(error){
    console.error(error);
    promise=null;
    stage.replaceChildren();
    enter.disabled=false;
    loading.textContent=error.message.includes('WebGL')?error.message:'The world could not load. Try entering again.';
  }
});
reset.addEventListener('click',()=>{promise?.then(world=>world.resetView());});
// Begin downloading the world while the entrance is visible.
if('requestIdleCallback' in window)requestIdleCallback(()=>load().catch(()=>{}),{timeout:500});
else setTimeout(()=>load().catch(()=>{}),100);
