'use strict';

const { scavenge, useAntidote, infectionLabel, normalizeState } = require('../../zombie/engine');

function formatDuration(ms) {
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

module.exports = function registerApocalypseCommands(bot, deps) {
  const getUserData = deps.getUserData;
  const saveUserData2 = deps.saveUserData2;
  if (typeof getUserData !== 'function' || typeof saveUserData2 !== 'function') {
    console.warn('[zombie] Commands not registered: user persistence functions are unavailable.');
    return;
  }

  async function loadState(userId) {
    const data = await getUserData(userId);
    if (!data.zombieApocalypse) data.zombieApocalypse = {};
    data.zombieApocalypse = normalizeState(data.zombieApocalypse);
    return { data, state: data.zombieApocalypse };
  }

  bot.command('infection', async (ctx) => {
    if (!ctx.from) return;
    const { state } = await loadState(ctx.from.id);
    await ctx.reply(
      `☣️ <b>OUTBREAK STATUS</b>\n\nInfection: <b>${state.infection}/100 — ${infectionLabel(state.infection)}</b>\nSupplies: <b>${state.supplies}</b>\nAntidotes used: <b>${state.antidotesUsed}</b>\n\nUse /scavenge to search for supplies or /antidote to reduce infection.`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('scavenge', async (ctx) => {
    if (!ctx.from) return;
    const { data, state } = await loadState(ctx.from.id);
    const result = scavenge(state);
    if (!result.ok) {
      await ctx.reply(`The area is too dangerous to search again. Try in ${formatDuration(result.retryAfterMs)}.`);
      return;
    }
    data.zombieApocalypse = result.state;
    await saveUserData2(ctx.from.id, data);
    const danger = result.infectedEncounter
      ? '\n☣️ An infected Pokémon attacked you. Infection increased by 10.'
      : '\nYou escaped without being exposed.';
    await ctx.reply(`🔦 <b>SCAVENGE COMPLETE</b>\n\nYou found <b>${result.suppliesFound}</b> supply units.${danger}\n\nUse /infection to check your status.`, { parse_mode: 'HTML' });
  });

  bot.command('antidote', async (ctx) => {
    if (!ctx.from) return;
    const { data, state } = await loadState(ctx.from.id);
    const result = useAntidote(state);
    if (!result.ok) {
      const message = result.reason === 'not_enough_supplies'
        ? `You need ${result.cost} supply units for an antidote. Use /scavenge to search.`
        : 'Your infection level is already zero. Save your supplies for later.';
      await ctx.reply(message);
      return;
    }
    data.zombieApocalypse = result.state;
    await saveUserData2(ctx.from.id, data);
    await ctx.reply(`🧪 <b>ANTIDOTE USED</b>\n\nInfection reduced by ${result.infectionReduced}.\nCurrent infection: <b>${result.state.infection}/100 — ${infectionLabel(result.state.infection)}</b>\nSupplies remaining: <b>${result.state.supplies}</b>`, { parse_mode: 'HTML' });
  });
};
