'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeState, scavenge, useAntidote, infectionLabel, SCAVENGE_COOLDOWN_MS } = require('../zombie/engine');

test('normalizes malformed state safely', () => {
  assert.deepEqual(normalizeState({ infection: 140, supplies: -5 }), {
    infection: 100, supplies: 0, antidotesUsed: 0, lastScavengeAt: 0, survivorsRescued: 0
  });
});

test('scavenge awards supplies and can raise infection', () => {
  const result = scavenge({ infection: 0 }, 1000, () => 0.5);
  assert.equal(result.ok, true);
  assert.equal(result.suppliesFound, 3);
  assert.equal(result.infectedEncounter, false);
  assert.equal(result.state.supplies, 3);
});

test('scavenge cooldown prevents repeated farming', () => {
  const result = scavenge({ lastScavengeAt: 1000 }, 2000, () => 0);
  assert.equal(result.ok, false);
  assert.equal(result.retryAfterMs, SCAVENGE_COOLDOWN_MS - 1000);
});

test('antidote consumes supplies and reduces infection', () => {
  const result = useAntidote({ infection: 50, supplies: 3 });
  assert.equal(result.ok, true);
  assert.equal(result.state.infection, 15);
  assert.equal(result.state.supplies, 0);
});

test('antidote refuses insufficient supplies and clean users', () => {
  assert.equal(useAntidote({ infection: 40, supplies: 2 }).reason, 'not_enough_supplies');
  assert.equal(useAntidote({ infection: 0, supplies: 10 }).reason, 'not_infected');
});

test('infection labels map across thresholds', () => {
  assert.equal(infectionLabel(0), 'Clean');
  assert.equal(infectionLabel(10), 'Exposed');
  assert.equal(infectionLabel(30), 'Infected');
  assert.equal(infectionLabel(60), 'Critical');
  assert.equal(infectionLabel(90), 'Near Turn');
});
