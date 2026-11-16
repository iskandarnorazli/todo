// The pair-table test (D13). For every sample state and every sample event:
// - a drawn pair ends in the drawn state (or, for a guarded arrow, stays in `from`);
// - an undrawn pair returns the very same state object.
// It also fails when a state kind, an event type or a table row has no sample, so a new state
// or event cannot be added without a test. `kindOf` reads the machine's kind out of a larger
// state (the add machine lives inside `ready`).
import { findTransition, type Transition } from '../lib/machine';

export function checkMachine<S, Ev extends { type: E }, K extends string, E extends string>(m: {
  reducer: (s: S, e: Ev) => S;
  table: ReadonlyArray<Transition<K, E>>;
  kinds: readonly K[];
  eventTypes: readonly E[];
  states: readonly S[];
  events: readonly Ev[];
  kindOf: (s: S) => K;
}): void {
  for (const k of m.kinds) {
    if (!m.states.some((s) => m.kindOf(s) === k)) throw new Error(`no sample state of kind ${k}`);
  }
  for (const t of m.eventTypes) {
    if (!m.events.some((e) => e.type === t)) throw new Error(`no sample event ${t}`);
  }
  for (const row of m.table) {
    if (!m.kinds.includes(row.from) || !m.kinds.includes(row.to)) {
      throw new Error(`table row ${row.from} --${row.event}--> ${row.to} uses an unknown kind`);
    }
  }
  for (const s of m.states) {
    for (const e of m.events) {
      const from = m.kindOf(s);
      const label = `${from} + ${e.type}`;
      const next = m.reducer(s, e);
      const t = findTransition(m.table, from, e.type);
      if (!t) {
        if (next !== s) throw new Error(`${label}: undrawn pair must return the same object`);
      } else {
        const allowed = t.guard ? [t.to, t.from] : [t.to];
        if (!allowed.includes(m.kindOf(next))) {
          throw new Error(`${label}: expected ${allowed.join(' or ')}, got ${m.kindOf(next)}`);
        }
      }
    }
  }
}
