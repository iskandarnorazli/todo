// https://docs.expo.dev/guides/using-eslint/
// The rules after expoConfig enforce the module rules in docs/ARCHITECTURE.md (D14).
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const determinism = [
  { selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']", message: 'No wall-clock time in src (D12).' },
  { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: 'No wall-clock time in src (D12).' },
  { selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']", message: 'No randomness in src; ids are counters (D3, D12).' },
];

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', '.expo/*'] },
  {
    files: ['src/**/*.{ts,tsx}', 'App.tsx'],
    ignores: ['**/*.test.{ts,tsx}', 'src/testing/**'],
    rules: {
      'no-restricted-syntax': ['error', ...determinism],
      'no-restricted-globals': ['error', { name: 'fetch', message: 'Only src/api/todosApi.ts calls fetch (D4).' }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@react-native-async-storage/async-storage',
              message: 'Only src/todos/storage.ts touches AsyncStorage (D5).',
            },
          ],
        },
      ],
    },
  },
  { files: ['src/api/todosApi.ts'], rules: { 'no-restricted-globals': 'off' } },
  { files: ['src/todos/storage.ts'], rules: { 'no-restricted-imports': 'off' } },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/api/todosApi*', '**/todos/storage*', '**/todos/useTodos*', '**/todos/todosReducer*'],
              message: 'Components take props and call callbacks; the screen wires useTodos (D2).',
            },
          ],
        },
      ],
    },
  },
]);
