const STATS = ["hp", "attack", "defense", "special_attack", "special_defense", "speed"];
const INCUBATION_MS = 30 * 60 * 1000;
const GENDERLESS = new Set([
  "magnemite", "magneton", "voltorb", "electrode", "staryu", "starmie",
  "porygon", "porygon2", "porygon-z", "unown", "baltoy", "claydol",
  "beldum", "metang", "metagross", "bronzor", "bronzong", " rotom",
  "golett", "golurk", "honedge", "doublade", "aegislash", "carbink",
  "klefki", "diancie", "cosmog", "cosmoem", "solgaleo", "lunala",
  "necrozma", "magearna", "zeraora", "meltan", "melmetal"
]);
const NATURES = [
  "Adamant", "Bashful", "Bold", "Brave", "Calm", "Careful", "Docile",
  "Gentle", "Hardy", "Hasty", "Impish", "Jolly", "Lax", "Lonely",
  "Mild", "Modest", "Naive", "Naughty", "Quiet", "Quirky", "Rash",
  "Relaxed", "Sassy", "Serious", "Timid"
];

function randomNature() {
  return NATURES[Math.floor(Math.random() * NATURES.length)];
}
function randomPass(existing) {
  let pass;
  do { pass = String(Math.floor(100000 + Math.random() * 900000)); }
  while (existing.has(pass));
  existing.add(pass);
  return pass;
}
function chooseInheritedIVs(male, female, count) {
  const result = {};
  for (const stat of STATS) result[stat] = null;
  const chosen = [...STATS].sort(() => Math.random() - 0.5).slice(0, count);
  for (const stat of chosen) {
    const source = Math.random() < 0.5 ? male : female;
    const value = Number(source.ivs && source.ivs[stat]);
    result[stat] = Number.isFinite(value) ? Math.max(0, Math.min(31, value)) : Math.floor(Math.random() * 32);
  }
  for (const stat of STATS) {
    if (result[stat] === null) result[stat] = Math.floor(Math.random() * 32);
  }
  return result;
}
function validParent(poke) {
  return poke && typeof poke.name === "string" && poke.ivs &&
    STATS.every(stat => Number.isFinite(Number(poke.ivs[stat])));
}

function registerBreedingCommands(bot, deps) {
  const { getUserData, saveUserData2, c, calculateTotal } = deps;

  bot.command("breed", async ctx => {
    try {
      const data = await getUserData(ctx.from.id);
      if (!data || !Array.isArray(data.pokes) || !data.pokes.length) {
        return ctx.reply("Start your journey and catch Pokémon before using the Nursery.");
      }
      const args = String(ctx.message.text || "").trim().split(/\s+/).slice(1);
      if (args.length < 2) {
        const lines = data.pokes.filter(validParent).slice(0, 40).map(p => {
          if (!p.gender && !GENDERLESS.has(String(p.name).toLowerCase())) {
            p.gender = Math.random() < 0.5 ? "male" : "female";
          }
          const gender = GENDERLESS.has(String(p.name).toLowerCase()) ? "Genderless" :
            p.gender === "male" ? "♂ Male" : "♀ Female";
          return `• ${c(p.name)} — ${gender} — ID: ${p.pass} — IV: ${calculateTotal ? calculateTotal(p.ivs) : STATS.reduce((n,s)=>n+Number(p.ivs[s]||0),0)}/186`;
        });
        await saveUserData2(ctx.from.id, data);
        return ctx.reply(
          "🥚 *BREEDING NURSERY*\n\nChoose a compatible male and female Pokémon.\n\n" +
          (lines.join("\n") || "No eligible Pokémon found.") +
          "\n\nUse: /breed MALE_ID FEMALE_ID\nExample: /breed 123456 654321\n\n" +
          "For this first release, parents must be the same species or one parent must be Ditto. Legendary, mythical and genderless Pokémon cannot breed.",
          { parse_mode: "Markdown" }
        );
      }

      const maleId = args[0];
      const femaleId = args[1];
      if (maleId === femaleId) return ctx.reply("A Pokémon cannot be paired with itself.");
      const male = data.pokes.find(p => String(p.pass) === maleId);
      const female = data.pokes.find(p => String(p.pass) === femaleId);
      if (!male || !female) return ctx.reply("I couldn't find one or both Pokémon IDs. Use /breed to view your list.");
      for (const parent of [male, female]) {
        const key = String(parent.name).toLowerCase();
        if (GENDERLESS.has(key)) return ctx.reply("Genderless Pokémon cannot enter the Nursery in this release.");
        if (!parent.gender) parent.gender = Math.random() < 0.5 ? "male" : "female";
      }
      if (male.gender !== "male" || female.gender !== "female") {
        await saveUserData2(ctx.from.id, data);
        return ctx.reply("Please select a male Pokémon first and a female Pokémon second. Use /breed to check their genders.");
      }
      if (!validParent(male) || !validParent(female)) return ctx.reply("One parent is missing valid IV data and cannot breed.");
      const a = String(male.name).toLowerCase();
      const b = String(female.name).toLowerCase();
      if (a !== "ditto" && b !== "ditto" && a !== b) {
        return ctx.reply("These Pokémon are not confirmed compatible yet. For now, pair the same species or use Ditto.");
      }
      if (data.eggs && data.eggs.some(egg => !egg.hatchedAt)) {
        return ctx.reply("You already have an egg incubating. Use /eggs to check it.");
      }
      const species = a === "ditto" ? female.name : b === "ditto" ? male.name : female.name;
      const hasKnot = data.inv && Number(data.inv.destiny_knot) > 0;
      const inheritedCount = hasKnot ? 5 : 3;
      const ivs = chooseInheritedIVs(male, female, inheritedCount);
      const nature = Math.random() < 0.5
        ? (Math.random() < 0.5 ? male.nature : female.nature)
        : randomNature();
      if (hasKnot) data.inv.destiny_knot -= 1;
      data.eggs = Array.isArray(data.eggs) ? data.eggs : [];
      const eggId = randomPass(new Set(data.eggs.map(e => String(e.id))));
      data.eggs.push({
        id: eggId, species, nature, ivs,
        parents: { male: String(male.pass), female: String(female.pass) },
        createdAt: Date.now(), hatchAt: Date.now() + INCUBATION_MS,
        hatchedAt: null
      });
      await saveUserData2(ctx.from.id, data);
      return ctx.reply(
        `🥚 *An egg is on its way!*\n\nSpecies: *${c(species)}*\nNature: *${nature}*\nInherited IVs: *${inheritedCount}/6*\nEgg ID: \`${eggId}\`\n\nIncubation: *30 minutes*\nUse /eggs to check progress and /hatch ${eggId} when ready.`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Breeding command failed:", error);
      return ctx.reply("The Nursery had a problem. Please try again later.");
    }
  });

  bot.command("eggs", async ctx => {
    const data = await getUserData(ctx.from.id);
    const eggs = Array.isArray(data.eggs) ? data.eggs.filter(e => !e.hatchedAt) : [];
    if (!eggs.length) return ctx.reply("You have no eggs in the Nursery. Use /breed to pair Pokémon.");
    const now = Date.now();
    const text = eggs.map(e => {
      const remaining = Math.max(0, e.hatchAt - now);
      const minutes = Math.ceil(remaining / 60000);
      return `🥚 *${c(e.species)}* — ID: \`${e.id}\`\nNature: ${e.nature} | ${minutes ? minutes + " min left" : "Ready to hatch"}`;
    }).join("\n\n");
    return ctx.reply("🌿 *YOUR NURSERY*\n\n" + text + "\n\nUse /hatch EGG_ID when ready.", { parse_mode: "Markdown" });
  });

  bot.command("hatch", async ctx => {
    try {
      const id = String(ctx.message.text || "").trim().split(/\s+/)[1];
      if (!id) return ctx.reply("Usage: /hatch EGG_ID");
      const data = await getUserData(ctx.from.id);
      const egg = Array.isArray(data.eggs) ? data.eggs.find(e => String(e.id) === id && !e.hatchedAt) : null;
      if (!egg) return ctx.reply("Egg not found. Use /eggs to see your Nursery.");
      if (Date.now() < egg.hatchAt) {
        const minutes = Math.ceil((egg.hatchAt - Date.now()) / 60000);
        return ctx.reply(`This egg needs about ${minutes} more minute(s) to hatch.`);
      }
      data.pokes = Array.isArray(data.pokes) ? data.pokes : [];
      const existing = new Set(data.pokes.map(p => String(p.pass)));
      const baby = {
        name: egg.species,
        pass: randomPass(existing),
        exp: 0,
        nature: egg.nature,
        ivs: { ...egg.ivs },
        evs: Object.fromEntries(STATS.map(stat => [stat, 0])),
        symbol: ""
      };
      egg.hatchedAt = Date.now();
      egg.babyPass = baby.pass;
      data.pokes.push(baby);
      await saveUserData2(ctx.from.id, data);
      const total = STATS.reduce((sum, stat) => sum + Number(baby.ivs[stat] || 0), 0);
      return ctx.reply(
        `🎉 *Your egg hatched!*\n\nWelcome *${c(baby.name)}*!\nNature: *${baby.nature}*\nIV total: *${total}/186*\nPokémon ID: \`${baby.pass}\`\n\nUse /stats ${baby.name} to inspect its stats.`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Hatching command failed:", error);
      return ctx.reply("The egg could not hatch right now. Please try again.");
    }
  });
}

module.exports = registerBreedingCommands;
