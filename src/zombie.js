'use strict';
function infectTrainer(t) {
  if(t.infection>=100) return 'Your infection is critical (100%). Use an antidote immediately.';
  const amount=8+Math.floor(Math.random()*13); t.infection=Math.min(100,t.infection+amount);
  return 'Infection increased by '+amount+'%. Current infection: '+t.infection+'%.';
}
function scavenge(t) {
  const now=Date.now();
  if(t.lastScavenge && now-t.lastScavenge<1800000) {
    const mins=Math.ceil((1800000-(now-t.lastScavenge))/60000);
    return {ok:false,message:'The area is too dangerous. Try again in '+mins+' minute(s).'};
  }
  t.lastScavenge=now; const roll=Math.random();
  if(roll<0.12) { const dmg=5+Math.floor(Math.random()*16); t.infection=Math.min(100,t.infection+dmg); return {ok:true,message:'You found supplies, but a zombie scratched you. Infection +'+dmg+'%.',supplies:false}; }
  if(roll<0.28) { t.items.antidotes+=1; return {ok:true,message:'You found an antidote!',supplies:false}; }
  t.items.supplies+=1+Math.floor(Math.random()*3); t.coins+=5+Math.floor(Math.random()*16);
  return {ok:true,message:'Scavenge successful! You found supplies and coins.',supplies:true};
}
function useAntidote(t) {
  if(t.items.antidotes<1) return {ok:false,message:'You have no antidotes. Try /scavenge.'};
  if(t.infection===0) return {ok:false,message:'You are not infected.'};
  t.items.antidotes-=1; t.infection=Math.max(0,t.infection-50);
  return {ok:true,message:'Antidote used. Infection is now '+t.infection+'%.'};
}
function curePokemon(t,name) {
  const p=t.pokemon.find(x=>x.name.toLowerCase()===String(name||'').toLowerCase() && x.infected);
  if(!p) return {ok:false,message:'No infected Pokémon found. Usage: /curepokemon Pikachu'};
  if(t.items.supplies<2) return {ok:false,message:'You need 2 supplies. Find them with /scavenge.'};
  t.items.supplies-=2; p.infected=false; p.hp=Math.max(1,p.hp);
  return {ok:true,message:p.name+' has been cured.'};
}
module.exports={infectTrainer,scavenge,useAntidote,curePokemon};
