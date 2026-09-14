/**
 * Whether a failed read is believed straight away or asked again first.
 *
 * `onoff` goes false the moment a read fails, so a printer switched off at the
 * wall dims at once. That was right, and it had a cost nobody saw until a
 * device log was posted: every single missed poll writes two entries, "stopped
 * answering" and, five minutes later, "answered". A Brother on Wi-Fi that drops
 * the odd UDP reply filled Mike1233's log with nineteen of them in one evening,
 * for a printer that was on the whole time.
 *
 * So the first miss of an outage is not believed on its own. The printer is
 * asked once more a short while later, and only a second silence reaches the
 * tile. A printer that really is off still dims, half a minute later instead of
 * at once; a lost packet no longer writes anything at all.
 *
 * Once an outage is under way nothing is asked twice: the follow-up is what
 * started counting it, and every later miss is a miss.
 */

/** How long after a missed read the printer is asked again. */
export const RECHECK_DELAY_SECONDS = 30;

export interface MissedReadState {
  /** Misses already counted in this outage. Zero means the last read succeeded. */
  consecutiveFailures: number;
  /** Whether this miss is itself the follow-up to an earlier one. */
  recheckPending: boolean;
  /** The device's poll interval, in seconds. */
  pollIntervalSeconds: number;
}

/**
 * `recheck`: say nothing yet, ask again in {@link RECHECK_DELAY_SECONDS}.
 * `record`: count the miss and let the device react to it.
 */
export function missedReadAction(state: MissedReadState): 'recheck' | 'record' {
  if (state.consecutiveFailures > 0 || state.recheckPending) return 'record';

  // A follow-up that lands on top of the next regular poll is no second
  // opinion, only a second request in the same breath. A user who polls this
  // often has already chosen to hear about a miss quickly.
  if (state.pollIntervalSeconds <= RECHECK_DELAY_SECONDS * 2) return 'record';

  return 'recheck';
}
