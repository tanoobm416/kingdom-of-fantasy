export const soundProfiles={
  island:{beat:.69,notes:[60,67,64,72,69,65,62,67,64,74,72,67],type:'sine',length:1.8,bass:48,air:670},
  map:{beat:.87,notes:[64,71,76,78,71,74,69,76],type:'sine',length:2.3,bass:45,air:1090},
  witches:{beat:.76,notes:[48,55,51,54,46,51,58,54],type:'triangle',length:1.46,bass:36,air:260},
  mermaids:{beat:.83,notes:[57,64,67,72,74,67,64,62],type:'sine',length:2.15,bass:45,air:410},
  dragons:{beat:.305,notes:[33,33,36,34,33,38,36,34],type:'triangle',length:.37,bass:33,air:180},
  pixies:{beat:.34,notes:[79,76,84,81,76,83,79,74,76,79,81,86],type:'sine',length:.67,bass:55,air:1550},
  gnomes:{beat:.49,notes:[55,62,59,67,64,59,57,62],type:'triangle',length:.77,bass:43,air:490},
  giants:{beat:1.05,notes:[38,45,48,43,36,43,47,45],type:'triangle',length:2.2,bass:31,air:145},
  fairies:{beat:.65,notes:[72,76,79,83,81,76,74,78,81,84,83,79],type:'sine',length:2.26,bass:48,air:1760}
};
const hz=midi=>440*Math.pow(2,(midi-69)/12);

export function createSoundscape(button){
  let context,master,wind;
  const buses=new Map();
  let realm=null,muted=false,timer,cursor=0,next=0;
  try{muted=localStorage.getItem('kingdom-muted')==='1';}catch{}
  function label(){
    button.textContent=muted?'Sound off':'Sound on';
    button.setAttribute('aria-pressed',String(!muted));
  }
  function bus(id){
    if(!buses.has(id)){
      const track=context.createGain();track.gain.value=0;
      if(id==='dragons'){
        const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=560;
        track.connect(filter).connect(master);
      }else track.connect(master);
      buses.set(id,track);
    }
    return buses.get(id);
  }
  function note(out,frequency,at,length,volume,type='sine',end=frequency){
    const oscillator=context.createOscillator(),envelope=context.createGain();
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(frequency,at);
    oscillator.frequency.exponentialRampToValueAtTime(end,at+length);
    envelope.gain.setValueAtTime(.0001,at);
    envelope.gain.exponentialRampToValueAtTime(volume,at+Math.min(.19,length*.20));
    envelope.gain.exponentialRampToValueAtTime(.0001,at+length);
    oscillator.connect(envelope).connect(out);
    oscillator.start(at);oscillator.stop(at+length+.015);
  }
  function noise(out,frequency,at,length,volume,rate=1){
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),envelope=context.createGain();
    source.buffer=wind;source.loop=true;source.playbackRate.value=rate;
    filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.89;
    envelope.gain.setValueAtTime(.0001,at);
    envelope.gain.linearRampToValueAtTime(volume,at+length*.28);
    envelope.gain.exponentialRampToValueAtTime(.0001,at+length);
    source.connect(filter).connect(envelope).connect(out);
    source.start(at);source.stop(at+length+.01);
  }
  function score(){
    if(!realm||context.state!=='running'||muted)return;
    const now=context.currentTime,profile=soundProfiles[realm],out=bus(realm);
    if(next<now)next=now+.025;
    while(next<now+.17){
      const f=hz(profile.notes[cursor%profile.notes.length]);
      const first=cursor%4===0;
      if(realm==='dragons'){
        note(out,f,next,first?1.38:.37,.079,'triangle',f*.97);
        note(out,first?129:91,next,.21,.068,'sine',27);
        if(first){note(out,f*2,next,1.25,.031,'sawtooth');note(out,f*3,next+.12,1.12,.021,'triangle');}
      }else if(realm==='giants'){
        note(out,f,next,2.2,.055,'triangle',f*.986);
        if(first)note(out,89,next,1.09,.077,'sine',28);
      }else{
        const detune=realm==='witches'?f*.965:realm==='mermaids'?f*1.055:f;
        note(out,f,next,profile.length,realm==='pixies'?.031:.044,profile.type,detune);
        const color=realm==='pixies'?3:realm==='witches'?1.498:2;
        note(out,f*color,next+.045,profile.length*.61,realm==='fairies'?.020:.012,'sine');
        if(realm==='mermaids')note(out,244+cursor%8*34,next+.33,.24,.016,'sine',714+cursor%7*32);
        if(realm==='gnomes'&&cursor%2===0)noise(out,522,next,.15,.079,1.22);
      }
      if(first){
        note(out,hz(profile.bass),next,profile.beat*3.7,.028,'triangle');
        noise(out,profile.air,next,Math.max(.43,profile.beat*1.95),realm==='giants'?.115:.064);
      }
      cursor++;next+=profile.beat;
    }
  }
  function unlock(){
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    try{
      if(!context){
        context=new Audio();
        master=context.createGain();master.gain.value=muted?0:.72;master.connect(context.destination);
        wind=context.createBuffer(1,Math.ceil(context.sampleRate*.43),context.sampleRate);
        const samples=wind.getChannelData(0);
        let seed=547,previous=0;
        for(let i=0;i<samples.length;i++){
          seed=(Math.imul(seed,1664525)+1013904223)>>>0;
          previous=previous*.66+(seed/4294967296*2-1)*.34;
          samples[i]=previous;
        }
        if(realm)bus(realm).gain.value=1;
        timer=setInterval(score,90);
      }
      context.resume().catch(()=>{});
    }catch{
      if(timer)clearInterval(timer);
      button.hidden=true;
    }
  }
  function switchTo(id){
    if(realm===id||!soundProfiles[id])return;
    realm=id;
    if(!context||!master)return;
    next=context.currentTime+.03;cursor=0;
    bus(realm);
    for(const [key,track] of buses)track.gain.setTargetAtTime(key===realm?1:0,context.currentTime,.22);
    if(realm==='dragons'&&!muted)note(bus(realm),115,next,1.12,.121,'triangle',32);
  }
  function flutter(seconds=4.15){
    if(!wind||muted||context.state!=='running')return;
    const start=context.currentTime+.025;
    for(let i=0;i<seconds/.26-1;i++)noise(bus('island'),660+i*33,start+i*.26,.18,.13,1.1+(i%3)*.14);
  }
  function greet(id){
    if(!context||muted||context.state!=='running'||!soundProfiles[id])return;
    const profile=soundProfiles[id],out=bus(id),start=context.currentTime+.02;
    profile.notes.slice(0,id==='giants'?2:4).forEach((tone,i)=>{
      note(out,hz(tone+(id==='witches'||id==='dragons'?0:12)),start+i*.136,.58,.039,profile.type);
    });
    if(id==='giants'||id==='dragons')noise(out,profile.air,start,.61,.11);
  }
  function perform(cue){
    if(!context||!realm||muted||context.state!=='running')return;
    const start=context.currentTime+.01,out=bus(realm);
    if(cue==='stomp'){
      note(out,111,start,.48,.135,'sine',29);
      noise(out,540,start+.036,.43,.22,.66);
    }else if(cue==='cast'){
      noise(out,1250,start,.34,.12,1.22);
      for(let i=0;i<4;i++)note(out,520*1.215**i,start+i*.069,.31,.034);
    }else if(cue==='pearl'){
      for(let i=0;i<6;i++)note(out,250+i*69,start+i*.095,.22,.035,'sine',490+i*106);
    }else greet(realm);
  }
  label();
  button.addEventListener('click',()=>{
    muted=!muted;
    try{localStorage.setItem('kingdom-muted',muted?'1':'0');}catch{}
    unlock();
    if(master)master.gain.setTargetAtTime(muted?0:.72,context.currentTime,.08);
    label();
  });
  return {unlock,switchTo,flutter,greet,perform};
}
