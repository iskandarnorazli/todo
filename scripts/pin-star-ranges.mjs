// Replaces each "*" range in package.json with the version package-lock.json resolved: "~x.y.z"
// for packages whose version the Expo SDK decides, "^x.y.z" for the rest. The lock's root entry
// gets the same ranges, so `npm ci` accepts the pair. Run by the lockfile workflow after
// `npx expo install --fix`, which leaves "*" on packages it considers compatible.
import { readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const sdkManaged = (name) =>
  /^(expo|expo-.*|@expo\/.*|react|react-dom|react-native|react-native-.*|@react-native-async-storage\/.*|jest-expo|eslint-config-expo|typescript|@types\/react)$/.test(name);
const changed = [];
for (const section of ['dependencies', 'devDependencies']) {
  for (const [name, range] of Object.entries(pkg[section] ?? {})) {
    if (range !== '*') continue;
    const version = lock.packages?.[`node_modules/${name}`]?.version;
    if (!version) throw new Error(`${name} is not in package-lock.json`);
    const pinned = `${sdkManaged(name) ? '~' : '^'}${version}`;
    pkg[section][name] = pinned;
    lock.packages[''][section][name] = pinned;
    changed.push(`${name} ${pinned}`);
  }
}
writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
writeFileSync('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`);
console.log(changed.length ? `pinned: ${changed.join(', ')}` : 'no "*" ranges');
