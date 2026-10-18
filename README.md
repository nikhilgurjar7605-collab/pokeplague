# PokePlague — original PokePlay restoration

This branch restores the original PokePlay game structure as the baseline for PokePlague. New zombie-apocalypse mechanics are intentionally deferred until the original game is running.

## Runtime

- Node.js 20 or newer
- Install dependencies with `npm install` (or `yarn install`)
- Set `BOT_TOKEN` in the hosting provider's environment variables. Never commit a real bot token or `.env` file.
- Start with `npm start` or `node pokeplay2.js`.

The original large Pokémon moveset dataset is downloaded from the pinned public source revision at startup if it is missing. The download is JSON-validated before being saved. Keep outbound HTTPS access enabled in the host.

## Deployment note

The source uses local JSON files for game data and user state. User state/session files are runtime data and must not be committed. Use persistent storage or a database before relying on this deployment for long-term player progress.

## Scope

Restore and verify the existing Pokémon game systems first; add PokePlague-specific mechanics only after this baseline is running.
