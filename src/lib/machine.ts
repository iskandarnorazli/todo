// D13: a state machine is a discriminated union of states, a union of events, a transition
// table as data, and a pure reducer that follows the table. scripts/check-state-machines.mjs
// fails CI when a table and its chart in docs/STATE_MACHINES.md disagree; the pair-table test
// (src/testing/checkMachine.ts) fails when a reducer and its table disagree.

/** One drawn arrow. `guard` names the condition when the arrow is taken only sometimes; when it
 * is false the machine stays in `from`. */
export type Transition<K extends string, E extends string> = {
  readonly from: K;
  readonly event: E;
  readonly to: K;
  readonly guard?: string;
};

export function findTransition<K extends string, E extends string>(
  table: ReadonlyArray<Transition<K, E>>,
  from: K,
  event: E,
): Transition<K, E> | undefined {
  return table.find((t) => t.from === from && t.event === event);
}
