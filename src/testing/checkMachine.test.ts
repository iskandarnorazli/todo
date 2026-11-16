import type { Transition } from '../lib/machine';
import { checkMachine } from './checkMachine';

type S = { kind: 'off' } | { kind: 'on' };
type E = { type: 'PRESS' } | { type: 'NOISE' };
const table: readonly Transition<S['kind'], E['type']>[] = [
  { from: 'off', event: 'PRESS', to: 'on' },
  { from: 'on', event: 'PRESS', to: 'off' },
];
const base = {
  table,
  kinds: ['off', 'on'] as const,
  eventTypes: ['PRESS', 'NOISE'] as const,
  states: [{ kind: 'off' }, { kind: 'on' }] as S[],
  events: [{ type: 'PRESS' }, { type: 'NOISE' }] as E[],
  kindOf: (s: S) => s.kind,
};
const toggle = (s: S, e: E): S => (e.type === 'PRESS' ? { kind: s.kind === 'off' ? 'on' : 'off' } : s);

describe('checkMachine', () => {
  it('passes a reducer that follows its table', () => {
    expect(() => checkMachine({ ...base, reducer: toggle })).not.toThrow();
  });

  it('fails a reducer that changes state on an undrawn pair (negative control)', () => {
    const reducer = (s: S, e: E): S => (e.type === 'NOISE' ? { ...s } : toggle(s, e));
    expect(() => checkMachine({ ...base, reducer })).toThrow(/undrawn pair/);
  });

  it('fails a reducer that goes to the wrong state (negative control)', () => {
    const reducer = (s: S, e: E): S => (e.type === 'PRESS' ? { kind: 'on' } : s);
    expect(() => checkMachine({ ...base, reducer })).toThrow(/on \+ PRESS: expected off, got on/);
  });
});
