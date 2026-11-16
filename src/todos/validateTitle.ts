// D6: titles are trimmed and must be 1 to 200 characters after trimming (T9).
export const MAX_TITLE_LENGTH = 200;

export type TitleCheck = { ok: true; title: string } | { ok: false; message: string };

export function validateTitle(input: string): TitleCheck {
  const title = input.trim();
  if (title.length === 0) return { ok: false, message: 'Enter a task title.' };
  if (title.length > MAX_TITLE_LENGTH) {
    return { ok: false, message: `Use at most ${MAX_TITLE_LENGTH} characters.` };
  }
  return { ok: true, title };
}
