'use strict';
const {findSpecies,STARTERS} = require('./species');
function makePokemon(species,source) {
  return {uid:Date.now().toString(36)+Math.random().toString(36).slice(2,7),name:species.name,type:species.type,
    maxHp:species.hp,hp:species.hp,attack:species.attack,infected:false,source:source || 'wild',caughtAt:new Date().toISOString()};
}
function chooseStarter(t,requested) {
  const p = findSpecies(requested);
  if (!p || !STARTERS.includes(p.name)) return {ok:false,message:'Choose Bulbasaur, Charmander, or Squirtle. Example: /starter charmander'};
  if (t.pokemon.length) return {ok:false,message:'You already chose a starter.'};
  const owned = makePokemon(p,'starter'); t.pokemon.push(owned); t.team=[owned.uid]; t.coins+=50; t.xp+=10;
  return {ok:true,pokemon:owned};
}
function addXp(t,amount) {
  t.xp += amount; let leveled = false;
  while (t.xp >= t.level * 100) { t.xp -= t.level * 100; t.level += 1; t.coins += 25; leveled = true; }
  return leveled;
}
function getTeam(t) { return t.team.map(uid => t.pokemon.find(p => p.uid === uid)).filter(Boolean); }
function setTeam(t,names) {
  const chosen=[];
  for (const name of names) {
    const p=t.pokemon.find(x=>x.name.toLowerCase()===name.toLowerCase());
    if (!p) return {ok:false,message:'You do not own '+name+'.'};
    if (!chosen.includes(p.uid)) chosen.push(p.uid);
  }
  if (!chosen.length || chosen.length>3) return {ok:false,message:'Choose 1-3 owned Pokémon. Example: /team Pikachu, Eevee'};
  t.team=chosen; return {ok:true,team:getTeam(t)};
}
function fightWild(t,wild) {
  const active=getTeam(t).find(p=>p.hp>0 && !p.infected);
  if (!active) return {ok:false,message:'Your team has no healthy, uninfected Pokémon. Use /heal or /curepokemon.'};
  let wildHp=wild.hp; const rounds=[];
  while(active.hp>0 && wildHp>0 && rounds.length<12) {
    const hit=Math.max(1,active.attack+Math.floor(Math.random()*8)-3); wildHp=Math.max(0,wildHp-hit); rounds.push(active.name+' dealt '+hit+' damage.');
    if(wildHp>0) { const counter=Math.max(1,wild.attack+Math.floor(Math.random()*5)-2); active.hp=Math.max(0,active.hp-counter); rounds.push(wild.name+' dealt '+counter+' damage.'); }
  }
  if(wildHp===0) { t.coins+=20; const leveled=addXp(t,30); return {ok:true,won:true,active,wild,rounds,leveled}; }
  return {ok:true,won:false,active,wild,rounds};
}
module.exports={makePokemon,chooseStarter,addXp,getTeam,setTeam,fightWild};
