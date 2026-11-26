export function createEncounter(){
  let phase='waiting', elapsed=0, reveal=0, flight=0, clue=0, approach=0, message=0;
  return {
    get phase(){return phase;},
    get pose(){return [reveal,flight,clue,elapsed,approach];},
    get gateUnlocked(){return message>=2.65;},
    begin(){if(phase==='waiting')phase='reveal';},
    tap(target){
      if(phase==='waiting')return;
      if(target==='moth'&&phase==='moth')phase='approach';
      if(target==='stone'&&phase==='landed')phase='opening';
    },
    advance(dt){
      if(phase==='waiting')return;
      elapsed+=dt;
      if(phase==='reveal'){
        reveal=Math.min(1,reveal+dt/3);
        if(reveal===1)phase='moth';
      }else if(phase==='approach'){
        approach=Math.min(1,approach+dt/1.85);
        if(approach===1)phase='message';
      }else if(phase==='message'){
        message+=dt;
        if(message>=2.65)phase='flight';
      }else if(phase==='flight'){
        flight=Math.min(1,flight+dt/4.15);
        if(flight===1)phase='landed';
      }else if(phase==='opening'){
        clue=Math.min(1,clue+dt/1.85);
        if(clue===1)phase='opened';
      }
    }
  };
}
