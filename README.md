# PokePlague

A clean, hand-written Telegram Pokémon survival bot. This branch is a new implementation, not a file-by-file copy of the original PokePlay source.

## Features
- Trainer profiles, starter selection, collection and team.
- One spawn announcement per chat; 30-second timer; first correct guess wins; the announcement is edited on claim/expiry.
- Basic wild battles, healing, coins and XP.
- Zombie infection, scavenging, antidotes, and Pokémon infection/cure mechanics.
- Atomic JSON saves.

## Run
1. Install Node.js 20 or newer.
2. Copy .env.example to .env and set BOT_TOKEN.
3. Run npm install, npm run check, npm test, and npm start.

Data is saved to data/state.json by default. Back it up. This JSON store is for a single bot process; use a database before running multiple instances. Never commit .env or a real token.

## Commands
/start, /help, /profile, /starter NAME, /pokemon, /team, /spawn, /battle, /heal, /infection, /scavenge, /antidote, /curepokemon NAME, /leaderboard.

Send the spawned Pokémon's name as a normal text message to claim it.
