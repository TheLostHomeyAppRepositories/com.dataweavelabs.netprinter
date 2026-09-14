import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { RECHECK_DELAY_SECONDS, missedReadAction } from '../lib/poll-recheck.mjs';

const healthy = { consecutiveFailures: 0, recheckPending: false, pollIntervalSeconds: 300 };

describe('missedReadAction', () => {
  it('asks again before believing the first miss after a good read', () => {
    assert.equal(missedReadAction(healthy), 'recheck');
  });

  it('believes the follow-up when it misses too', () => {
    assert.equal(missedReadAction({ ...healthy, recheckPending: true }), 'record');
  });

  it('never asks twice once an outage is being counted', () => {
    assert.equal(missedReadAction({ ...healthy, consecutiveFailures: 1 }), 'record');
    assert.equal(missedReadAction({ ...healthy, consecutiveFailures: 4 }), 'record');
  });

  it('does not recheck when the next regular poll is about as close', () => {
    assert.equal(missedReadAction({ ...healthy, pollIntervalSeconds: 30 }), 'record');
    assert.equal(missedReadAction({ ...healthy, pollIntervalSeconds: RECHECK_DELAY_SECONDS * 2 }), 'record');
    assert.equal(missedReadAction({ ...healthy, pollIntervalSeconds: RECHECK_DELAY_SECONDS * 2 + 1 }), 'recheck');
  });
});
