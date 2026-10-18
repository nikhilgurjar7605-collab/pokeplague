const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));

for (const file of [
  'pokeplay2.js',
  'func.js',
  'commands/index.js',
  'callbacks/index.js',
  'scripts/ensure-data.js',
  '.env.example'
]) {
  assert.ok(exists(file), 'Missing required file: ' + file);
}

const pkg = readJson('package.json');
assert.equal(pkg.main, 'pokeplay2.js');
assert.equal(pkg.scripts.start, 'node pokeplay2.js');

for (const file of ['data/pokemon_info2.json', 'data/moves_info.json', 'data/event.json']) {
  assert.doesNotThrow(() => readJson(file), 'Invalid JSON: ' + file);
}

for (const file of [
  'CabalBold-78yP.ttf',
  'ChrustyRock-ORLA.ttf',
  'ChunkFive-Regular.otf',
  'PlayfairDisplay-Regular.otf',
  'unicode.impact.ttf'
]) {
  assert.ok(exists(file), 'Missing core font: ' + file);
}

const tokenPattern = new RegExp('[0-9]{8,12}:[A-Za-z0-9_-]{30,}');
const mongoCredentialPattern = /mongodb(?:\+srv)?:\/\/[^/\s:@]+:[^@\s/]+@/i;
const skipDirs = new Set(['.git', 'node_modules', 'cimages', 'cimages2', 'fonts', 'images']);
const errors = [];

function scan(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    const relative = path.relative(root, full).split(path.sep).join('/');
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) scan(full);
      continue;
    }
    if (!/\.(js|cjs|mjs|json|yml|yaml|md)$/.test(entry.name) && entry.name !== '.env.example') continue;
    let text;
    try { text = fs.readFileSync(full, 'utf8'); } catch { continue; }
    if (tokenPattern.test(text)) errors.push(relative + ': hard-coded Telegram token pattern');
    if (mongoCredentialPattern.test(text)) errors.push(relative + ': hard-coded MongoDB credentials');
  }
}
scan(root);

if (exists('db.js')) {
  const db = fs.readFileSync(path.join(root, 'db.js'), 'utf8');
  if (/BOT_TOKEN\s*=\s*['"]process\.env\.BOT_TOKEN['"]/.test(db)) {
    errors.push('db.js: BOT_TOKEN is a string literal instead of an environment lookup');
  }
}

for (const file of [
  'data/hexa_session.json',
  'data/transfer_requests.json',
  'data/msg_data.json',
  'data/groups.json',
  'data/factions.json',
  'data/ban_list.json',
  'factions.json'
]) {
  if (exists(file)) errors.push(file + ': private/runtime state must not be committed');
}

for (const directory of ['data/db', 'data/battle']) {
  if (!exists(directory)) continue;
  const jsonFiles = fs.readdirSync(path.join(root, directory)).filter(name => name.endsWith('.json'));
  if (jsonFiles.length) errors.push(directory + ': player runtime JSON files must not be committed');
}

if (exists('images')) {
  const photos = fs.readdirSync(path.join(root, 'images')).filter(name => name.startsWith('modified_photo_'));
  if (photos.length) errors.push('images/: private modified player photos must not be committed');
}

if (errors.length) {
  console.error('Source integrity check failed:');
  for (const error of errors) console.error(' - ' + error);
  process.exitCode = 1;
} else {
  console.log('Source integrity checks passed.');
}
