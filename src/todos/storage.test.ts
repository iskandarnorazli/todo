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
});
