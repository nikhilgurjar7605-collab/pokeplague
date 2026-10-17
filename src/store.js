'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const dataPath = path.resolve(process.env.DATA_FILE || './data/state.json');
const trainers = new Map();
let loaded = false;
let saveQueue = Promise.resolve();
function freshTrainer(id,name) {
  return {id:String(id),name:String(name || 'Trainer').slice(0,80),coins:100,xp:0,level:1,
    items:{supplies:0,antidotes:0,potions:2},infection:0,team:[],pokemon:[],createdAt:new Date().toISOString()};
}
async function load() {
  if (loaded) return;
  try {
    const parsed = JSON.parse(await fs.readFile(dataPath,'utf8'));
    for (const [id,value] of Object.entries(parsed.trainers || {})) trainers.set(id,value);
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Could not read save file: ' + error.message);
  }
  loaded = true;
}
async function save() {
  await load();
  saveQueue = saveQueue.then(async () => {
    await fs.mkdir(path.dirname(dataPath),{recursive:true});
    const tmp = dataPath + '.tmp';
    await fs.writeFile(tmp,JSON.stringify({version:1,trainers:Object.fromEntries(trainers)},null,2),'utf8');
    await fs.rename(tmp,dataPath);
  });
  return saveQueue;
}
async function getTrainer(id,name) {
  await load();
  const key = String(id);
  let t = trainers.get(key);
  if (!t) { t = freshTrainer(key,name); trainers.set(key,t); await save(); }
  else if (name && t.name === 'Trainer') t.name = String(name).slice(0,80);
  return t;
}
async function allTrainers() { await load(); return Array.from(trainers.values()); }
module.exports = {getTrainer,allTrainers,save};
