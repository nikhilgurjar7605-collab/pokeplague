'use strict';
const SPECIES = [
  {name:'Bulbasaur',type:'Grass/Poison',hp:45,attack:49,aliases:['bulbasaur','bulba']},
  {name:'Ivysaur',type:'Grass/Poison',hp:60,attack:62,aliases:['ivysaur']},
  {name:'Venusaur',type:'Grass/Poison',hp:80,attack:82,aliases:['venusaur']},
  {name:'Charmander',type:'Fire',hp:39,attack:52,aliases:['charmander','charm']},
  {name:'Charmeleon',type:'Fire',hp:58,attack:64,aliases:['charmeleon']},
  {name:'Charizard',type:'Fire/Flying',hp:78,attack:84,aliases:['charizard']},
  {name:'Squirtle',type:'Water',hp:44,attack:48,aliases:['squirtle','squirt']},
  {name:'Wartortle',type:'Water',hp:59,attack:63,aliases:['wartortle']},
  {name:'Blastoise',type:'Water',hp:79,attack:83,aliases:['blastoise']},
  {name:'Pikachu',type:'Electric',hp:35,attack:55,aliases:['pikachu','pika']},
  {name:'Raichu',type:'Electric',hp:60,attack:90,aliases:['raichu']},
  {name:'Eevee',type:'Normal',hp:55,attack:55,aliases:['eevee']},
  {name:'Vaporeon',type:'Water',hp:130,attack:65,aliases:['vaporeon']},
  {name:'Jolteon',type:'Electric',hp:65,attack:110,aliases:['jolteon']},
  {name:'Flareon',type:'Fire',hp:65,attack:130,aliases:['flareon']},
  {name:'Snorlax',type:'Normal',hp:160,attack:110,aliases:['snorlax']},
  {name:'Gastly',type:'Ghost/Poison',hp:30,attack:35,aliases:['gastly']},
  {name:'Gengar',type:'Ghost/Poison',hp:60,attack:65,aliases:['gengar']},
  {name:'Dratini',type:'Dragon',hp:41,attack:64,aliases:['dratini']},
  {name:'Dragonite',type:'Dragon/Flying',hp:91,attack:134,aliases:['dragonite']},
  {name:'Psyduck',type:'Water',hp:50,attack:52,aliases:['psyduck']},
  {name:'Machop',type:'Fighting',hp:70,attack:80,aliases:['machop']},
  {name:'Mew',type:'Psychic',hp:100,attack:100,aliases:['mew']},
  {name:'Mewtwo',type:'Psychic',hp:106,attack:110,aliases:['mewtwo']}
];
const STARTERS = ['Bulbasaur','Charmander','Squirtle'];
function normalizeName(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]/g,''); }
function findSpecies(value) {
  const key = normalizeName(value);
  return SPECIES.find(p => normalizeName(p.name) === key || p.aliases.some(a => normalizeName(a) === key)) || null;
}
function randomSpecies(rng = Math.random) { return SPECIES[Math.floor(rng() * SPECIES.length)]; }
module.exports = {SPECIES,STARTERS,findSpecies,normalizeName,randomSpecies};
