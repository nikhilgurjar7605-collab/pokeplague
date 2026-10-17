'use strict';

const DEFAULT_STATE = Object.freeze({
  infection: 0,
  supplies: 0,
  antidotesUsed: 0,
  lastScavengeAt: 0,
  survivorsRescued: 0
});

const MAX_INFECTION = 100;
const SCAVENGE_COOLDOWN_MS = 30 * 60 * 1000;
const ANTIDOTE_COST = 3;

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function normalizeState(input) {
  const state = input && typeof input === 'object' ? input : {};
  return {
    infection: clampInt(state.infection, 0, MAX_INFECTION),
    supplies: clampInt(state.supplies, 0, 999999),
    antidotesUsed: clampInt(state.antidotesUsed, 0, 999999),
    lastScavengeAt: clampInt(state.lastScavengeAt, 0, Number.MAX_SAFE_INTEGER),
    survivorsRescued: clampInt(state.survivorsRescued, 0, 999999)
  };
}

function scavenge(input, now = Date.now(), random = Math.random) {
  const state = normalizeState(input);
  const elapsed = now - state.lastScavengeAt;
  if (state.lastScavengeAt && elapsed < SCAVENGE_COOLDOWN_MS) {
    return { ok: false, state, retryAfterMs: SCAVENGE_COOLDOWN_MS - elapsed };
  }
  const suppliesFound = 1 + Math.floor(random() * 4);
  const infectedEncounter = random() < 0.25;
  state.supplies += suppliesFound;
  state.lastScavengeAt = now;
  if (infectedEncounter) state.infection = Math.min(MAX_INFECTION, state.infection + 10);
  return { ok: true, state, suppliesFound, infectedEncounter };
}

function useAntidote(input) {
  const state = normalizeState(input);
  if (state.supplies < ANTIDOTE_COST) {
    return { ok: false, reason: 'not_enough_supplies', state, cost: ANTIDOTE_COST };
  }
  if (state.infection === 0) {
    return { ok: false, reason: 'not_infected', state, cost: ANTIDOTE_COST };
  }
  state.supplies -= ANTIDOTE_COST;
  state.infection = Math.max(0, state.infection - 35);
  state.antidotesUsed += 1;
  return { ok: true, state, infectionReduced: 35, cost: ANTIDOTE_COST };
}

function infectionLabel(infection) {
  const value = clampInt(infection, 0, MAX_INFECTION);
  if (value === 0) return 'Clean';
  if (value < 25) return 'Exposed';
  if (value < 50) return 'Infected';
  if (value < 75) return 'Critical';
  return 'Near Turn';
}

module.exports = {
  DEFAULT_STATE, MAX_INFECTION, SCAVENGE_COOLDOWN_MS, ANTIDOTE_COST,
  normalizeState, scavenge, useAntidote, infectionLabel
};
