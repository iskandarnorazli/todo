import { MAX_TITLE_LENGTH, validateTitle } from './validateTitle';

describe('validateTitle (T9, D6)', () => {
  it.each(['', ' ', '\t\n  '])('rejects the blank title %j', (input) => {
    expect(validateTitle(input)).toEqual({ ok: false, message: 'Enter a task title.' });
  });

  it('trims the title it accepts', () => {
    expect(validateTitle('  Buy milk ')).toEqual({ ok: true, title: 'Buy milk' });
  });

  it('accepts exactly the maximum length and rejects one more', () => {
    expect(validateTitle('a'.repeat(MAX_TITLE_LENGTH)).ok).toBe(true);
    expect(validateTitle('a'.repeat(MAX_TITLE_LENGTH + 1)).ok).toBe(false);
  });
});
