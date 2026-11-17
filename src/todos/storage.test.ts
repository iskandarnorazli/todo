import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY, loadTasks, saveTasks, type StoredTasks } from './storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('storage (D5, T12)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('saveTasks then loadTasks gives back the same tasks and nextLocalId', async () => {
    const value: StoredTasks = {
      tasks: [
        { localId: 'server-1', serverId: 1, title: 'Buy milk', completed: false },
        { localId: 'local-1', serverId: 201, title: 'Walk dog', completed: true },
      ],
      nextLocalId: 2,
    };

    const saved = await saveTasks(value);
    expect(saved).toBe(true);

    const loaded = await loadTasks();
    expect(loaded).toEqual(value);
  });

  it('returns null when nothing is stored', async () => {
    await expect(loadTasks()).resolves.toBeNull();
  });

  it('returns null on invalid JSON without throwing', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, '{not valid json');
    await expect(loadTasks()).resolves.toBeNull();
  });

  it.each([
    ['object without tasks', { nextLocalId: 1 }],
    ['object with non-array tasks', { tasks: 'oops', nextLocalId: 1 }],
    ['object with invalid task item', { tasks: [{ localId: 123 }], nextLocalId: 1 }],
    ['object without nextLocalId', { tasks: [] }],
    ['null', null],
  ])('returns null when stored value is %s', async (_label, badValue) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(badValue));
    await expect(loadTasks()).resolves.toBeNull();
  });

  it('returns null when AsyncStorage.getItem rejects', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Disk read error'));
    await expect(loadTasks()).resolves.toBeNull();
  });

  it('saveTasks resolves false instead of throwing when AsyncStorage.setItem rejects', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));

    const result = await saveTasks({ tasks: [], nextLocalId: 1 });
    expect(result).toBe(false);
  });

  it('returns null when stored tasks have duplicate localIds (D16)', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tasks: [
          { localId: 'local-1', serverId: 201, title: 'One', completed: false },
          { localId: 'local-1', serverId: 201, title: 'Two', completed: true },
        ],
        nextLocalId: 2,
      }),
    );
    await expect(loadTasks()).resolves.toBeNull();
  });

  it('raises nextLocalId above the highest local-N while keeping tasks unchanged (D16)', async () => {
    const tasks = [{ localId: 'local-5', serverId: 201, title: 'Five', completed: false }];
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tasks, nextLocalId: 3 }),
    );

    const loaded = await loadTasks();
    expect(loaded).toEqual({ tasks, nextLocalId: 6 });
  });

  it('guarantees unique localIds and nextLocalId above every local-N for any stored list (D16)', async () => {
    const taskArb = fc.record({
      localId: fc.oneof(
        fc.integer({ min: 1, max: 20 }).map((n) => `local-${n}`),
        fc.integer({ min: 1, max: 20 }).map((n) => `server-${n}`),
      ),
      serverId: fc.integer({ min: 1, max: 201 }),
      title: fc.string({ minLength: 1, maxLength: 20 }),
      completed: fc.boolean(),
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(taskArb, { maxLength: 10 }),
        fc.integer({ min: 1, max: 25 }),
        async (tasks, nextLocalId) => {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, nextLocalId }));
          const loaded = await loadTasks();
          const hasDuplicates = new Set(tasks.map((t) => t.localId)).size !== tasks.length;

          if (hasDuplicates) {
            expect(loaded).toBeNull();
          } else {
            expect(loaded).not.toBeNull();
            if (!loaded) return;
            expect(loaded.tasks).toEqual(tasks);
            const ids = loaded.tasks.map((t) => t.localId);
            expect(new Set(ids).size).toBe(ids.length);
            for (const id of ids) {
              if (id.startsWith('local-')) {
                const n = Number(id.slice('local-'.length));
                if (Number.isInteger(n) && n >= 0) {
                  expect(loaded.nextLocalId).toBeGreaterThan(n);
                }
              }
            }
          }
        },
      ),
      { seed: 42, numRuns: 100 },
    );
  });
});
