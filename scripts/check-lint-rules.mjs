// The lint rules that enforce the module rules (docs/ARCHITECTURE.md, D14) are themselves
// tested: a "bad" case must be reported with the given message, an "ok" case must get no report
// from the restriction rules. Run: node scripts/check-lint-rules.mjs
import { ESLint } from 'eslint';

const RESTRICTIONS = new Set(['no-restricted-syntax', 'no-restricted-globals', 'no-restricted-imports']);

const cases = [
  ['bad', 'src/todos/case.ts', "export const r = fetch('https://example.com');\n", 'Only src/api/todosApi.ts calls fetch'],
  ['ok', 'src/api/todosApi.ts', "export const r = fetch('https://example.com');\n"],
  ['bad', 'src/todos/case.ts', "import AsyncStorage from '@react-native-async-storage/async-storage';\nexport const s = AsyncStorage;\n", 'Only src/todos/storage.ts touches AsyncStorage'],
  ['ok', 'src/todos/storage.ts', "import AsyncStorage from '@react-native-async-storage/async-storage';\nexport const s = AsyncStorage;\n"],
  ['bad', 'src/components/Case.tsx', "import { loadTasks } from '../todos/storage';\nexport const f = loadTasks;\n", 'Components take props'],
  ['bad', 'src/components/Case.tsx', "import AsyncStorage from '@react-native-async-storage/async-storage';\nexport const s = AsyncStorage;\n", 'Only src/todos/storage.ts touches AsyncStorage'],
  ['ok', 'src/components/Case.tsx', "import { validateTitle } from '../todos/validateTitle';\nexport const f = validateTitle;\n"],
  ['bad', 'src/todos/case.ts', 'export const t = Date.now();\n', 'No wall-clock time'],
  ['bad', 'src/todos/case.ts', 'export const d = new Date();\n', 'No wall-clock time'],
  ['bad', 'src/todos/case.ts', 'export const r = Math.random();\n', 'No randomness'],
];

const eslint = new ESLint();
let failures = 0;
for (const [kind, filePath, code, expected] of cases) {
  const [result] = await eslint.lintText(code, { filePath });
  const msgs = (result?.messages ?? []).filter((m) => m.ruleId && RESTRICTIONS.has(m.ruleId));
  const ok = kind === 'bad' ? msgs.some((m) => m.message.includes(expected)) : msgs.length === 0;
  if (!ok) {
    failures += 1;
    const got = msgs.map((m) => `${m.ruleId}: ${m.message}`).join(' | ') || 'no restriction reported';
    console.error(`FAIL ${kind} ${filePath}: expected ${kind === 'bad' ? `"${expected}"` : 'no report'}; got ${got}`);
  }
}
if (failures) process.exit(1);
console.log(`lint rules: ${cases.length} cases behave as D14 says`);
