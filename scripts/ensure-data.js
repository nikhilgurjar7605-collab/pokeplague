const fs = require('node:fs');
const path = require('node:path');

const destination = path.join(__dirname, '..', 'data', 'moveset_data_updated2.json');
const source = 'https://raw.githubusercontent.com/Yashwant2005/pokeplay/862223c8667ee6486ba6e15b65f3a1578765b7ff/data/moveset_data_updated2.json';

async function ensureMovesetData() {
  if (fs.existsSync(destination)) {
    try { JSON.parse(fs.readFileSync(destination, 'utf8')); return; }
    catch { fs.renameSync(destination, destination + '.invalid-' + Date.now()); }
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  console.log('Downloading original Pokémon moveset dataset…');
  const response = await fetch(source, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error('Moveset dataset download failed: HTTP ' + response.status);
  const text = await response.text();
  JSON.parse(text); // refuse to save truncated or invalid JSON
  fs.writeFileSync(destination + '.tmp', text, 'utf8');
  fs.renameSync(destination + '.tmp', destination);
  console.log('Original moveset dataset ready.');
}

ensureMovesetData().catch(error => { console.error(error.message); process.exit(1); });
