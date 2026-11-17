import { colors } from './theme';

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('theme contrast (WCAG AA)', () => {
  it('meets at least 4.5:1 contrast for primary, secondary, completed, and danger text', () => {
    expect(contrastRatio(colors.textPrimary, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.textPrimary, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.textSecondary, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.textSecondary, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.textCompleted, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.danger, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.danger, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.accentText, colors.accent)).toBeGreaterThanOrEqual(4.5);
  });
});
