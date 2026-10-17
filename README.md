# PokePlague — PokePlay Zombie Apocalypse

PokePlague is intended to extend the existing PokePlay Pokémon Telegram game with a zombie-apocalypse survival layer. The preservation rule is strict: existing Pokémon data, catching, moves, evolutions, battles, and player progression should remain unchanged unless a later, tested feature explicitly integrates with them.

## Current repository status

This repository currently contains the initial project setup and isolated zombie feature modules. **The complete PokePlay source tree has not yet been imported into this GitHub repository**, so this repository is not a runnable full bot yet. Do not deploy it as a live Telegram bot until the original source files are added and the complete test/startup checks pass.

## Zombie feature slice

The initial isolated mechanics include:

- `/infection` — display infection, supplies, and antidote usage.
- `/scavenge` — find 1–4 supplies; an encounter can raise infection. Cooldown: 30 minutes.
- `/antidote` — spend 3 supplies to reduce infection by 35 points.

The feature stores its own state under `zombieApocalypse` in the existing user record and is designed to be registered by the project's existing command loader.

## Requirements and setup

- Node.js 18+ (Node.js 20 LTS recommended).
- A Telegram bot token created or rotated through [BotFather](https://t.me/BotFather).
- Native build prerequisites for the existing `canvas` dependency on your operating system.

Once the complete PokePlay source has been imported:

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env`.
3. Set `BOT_TOKEN` to a newly generated token.
4. Start with `npm start`.
5. Run `npm test` and the project's syntax checks before deploying.

Never commit `.env`, bot tokens, database credentials, sessions, local player databases, or user backups. If a token was exposed in an earlier ZIP or commit, revoke it and generate a replacement before running the bot.

## Development policy

- Keep existing PokePlay gameplay intact.
- Add new systems as isolated modules first.
- Test both new behavior and regression cases before merging.
- Keep the repository private until the source and secrets have been reviewed.
