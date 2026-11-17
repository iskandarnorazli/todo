import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LIST_ERROR_MESSAGE } from '../api/messages';
import { AddTodoForm } from '../components/AddTodoForm';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { ReloadConfirm } from '../components/ReloadConfirm';
import { TodoList } from '../components/TodoList';
import { useTodos } from '../todos/useTodos';

export function TodosScreen() {
  const { state, retry, add, dismissAddError, reload, toggle, remove } = useTodos();
  const [confirmReload, setConfirmReload] = useState(false);
  const isReady = state.kind === 'ready';
  const doneCount = isReady ? state.tasks.filter((t) => t.completed).length : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks</Text>
          {isReady && state.tasks.length > 0 ? (
            <Text style={styles.subtitle}>
              {doneCount} / {state.tasks.length} completed
            </Text>
          ) : null}
        </View>
        {isReady ? (
          <Pressable
            style={styles.reloadBtn}
            onPress={() => setConfirmReload(true)}
            accessibilityRole="button"
            accessibilityLabel="Reload"
          >
            <Text style={styles.reloadText}>Reload</Text>
          </Pressable>
        ) : null}
      </View>

      {isReady ? (
        <AddTodoForm status={state.add} add={add} onDismissError={dismissAddError} />
      ) : null}

      {state.kind === 'hydrating' || state.kind === 'loading' ? <LoadingState /> : null}

      {state.kind === 'failed' ? (
        <ErrorState message={LIST_ERROR_MESSAGE[state.error.kind]} onRetry={retry} />
      ) : null}

      {isReady && state.tasks.length === 0 ? <EmptyState /> : null}

      {isReady && state.tasks.length > 0 ? (
        <TodoList tasks={state.tasks} onToggle={toggle} onDelete={remove} />
      ) : null}

      <ReloadConfirm
        visible={confirmReload}
        onCancel={() => setConfirmReload(false)}
        onConfirm={() => {
          setConfirmReload(false);
          reload();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  reloadBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadText: { fontSize: 14, fontWeight: '600', color: '#334155' },
});
