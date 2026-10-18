# Render startup configuration

The current main entry point is `pokeplay2.js`; the existing package start script already points to it. For a Telegram polling bot, use a **Background Worker**, not a web service that expects an HTTP listener.

- Build command: `npm install --no-audit --no-fund`
- Start command: `node pokeplay2.js` (or `npm start` if the package start script remains unchanged)
- Required secret environment variable: `BOT_TOKEN`
- Runtime: Node.js 20 or newer

The legacy implementation stores player records and battle state in `data/db` and `data/battle`. A worker with an ephemeral filesystem can lose those files on redeploy. Use a persistent disk and make those runtime directories point to the disk, or migrate persistence to a database before treating the deployment as production-ready. Do not commit the generated JSON records or session file to Git.

A Render Blueprint file could not be applied through the current repository write interface, and the live Render dashboard was not accessible from this session. Therefore the live service type, start command, environment values, and persistence mount remain unverified. Background Workers and persistent disks are paid Render resources.
