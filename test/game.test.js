'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {findSpecies,STARTERS}=require('../src/species');
const {chooseStarter,makePokemon,setTeam,getTeam}=require('../src/game');
const {useAntidote,curePokemon}=require('../src/zombie');
function trainer(){return{id:'1',name:'Test',coins:100,xp:0,level:1,items:{supplies:4,antidotes:1,potions:0},infection:60,team:[],pokemon:[]};}
test('species lookup handles aliases',()=>{assert.equal(findSpecies('PIKA').name,'Pikachu');assert.equal(findSpecies('Mewtwo').name,'Mewtwo');assert.equal(findSpecies('not-a-pokemon'),null);});
test('starter can be selected only once',()=>{const t=trainer();assert.equal(chooseStarter(t,'bulbasaur').ok,true);assert.equal(getTeam(t).length,1);assert.equal(chooseStarter(t,'squirtle').ok,false);assert.equal(STARTERS.length,3);});
test('team rejects unowned Pokémon and accepts owned Pokémon',()=>{const t=trainer();t.pokemon.push(makePokemon(findSpecies('Pikachu')));assert.equal(setTeam(t,['Eevee']).ok,false);assert.equal(setTeam(t,['Pikachu']).ok,true);});
test('antidote reduces infection and consumes one item',()=>{const t=trainer();const r=useAntidote(t);assert.equal(r.ok,true);assert.equal(t.infection,10);assert.equal(t.items.antidotes,0);});
test('cure Pokémon consumes two supplies',()=>{const t=trainer();const p=makePokemon(findSpecies('Pikachu'));p.infected=true;t.pokemon.push(p);const r=curePokemon(t,'Pikachu');assert.equal(r.ok,true);assert.equal(p.infected,false);assert.equal(t.items.supplies,2);});
