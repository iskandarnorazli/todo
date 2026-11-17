// M2 Prototype B (#6): Sticky bottom Add footer + compact divider rows + header Reload confirm.
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ADD_ERROR_MESSAGE, LIST_ERROR_MESSAGE } from './src/api/messages';
import type { Task } from './src/todos/types';
import { useTodos } from './src/todos/useTodos';

function TaskRow({
  task,
  onToggle,
  onRemove,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.rowMain}
        onPress={() => onToggle(task.localId)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
      >
        <View style={[styles.circle, task.completed && styles.circleDone]}>
          {task.completed ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]} numberOfLines={2}>
          {task.title}
        </Text>
      </Pressable>
      <Pressable
        style={styles.deleteBtn}
        onPress={() => onRemove(task.localId)}
        accessibilityLabel={`Delete ${task.title}`}
      >
        <Text style={styles.deleteText}>✕</Text>
      </Pressable>
    </View>
  );
}

function TodosScreen() {
  const { state, retry, reload, add, dismissAddError, toggle, remove } = useTodos();
  const [draft, setDraft] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmReload, setConfirmReload] = useState(false);

  const isReady = state.kind === 'ready';
  const isSaving = isReady && state.add.kind === 'saving';
  const addError = isReady && state.add.kind === 'error' ? ADD_ERROR_MESSAGE[state.add.error.kind] : null;
  const remainingCount = isReady ? state.tasks.filter((t) => !t.completed).length : 0;

  const handleSubmit = () => {
    const err = add(draft);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setDraft('');
  };

  const handleChangeText = (text: string) => {
    setDraft(text);
    if (validationError) setValidationError(null);
    if (addError) dismissAddError();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Tasks</Text>
            {isReady ? <Text style={styles.subtitle}>{remainingCount} left</Text> : null}
          </View>
          {isReady ? (
            <Pressable style={styles.reloadBtn} onPress={() => setConfirmReload(true)}>
              <Text style={styles.reloadText}>Reload</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.body}>
          {state.kind === 'hydrating' || state.kind === 'loading' ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#0f766e" />
              <Text style={styles.muted}>Loading tasks...</Text>
            </View>
          ) : null}

          {state.kind === 'failed' ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{LIST_ERROR_MESSAGE[state.error.kind]}</Text>
              <Pressable style={styles.primaryBtn} onPress={retry}>
                <Text style={styles.primaryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {isReady && state.tasks.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.muted}>No tasks yet. Add one below.</Text>
            </View>
          ) : null}

          {isReady && state.tasks.length > 0 ? (
            <FlatList
              data={state.tasks}
              keyExtractor={(item) => item.localId}
              renderItem={({ item }) => (
                <TaskRow task={item} onToggle={toggle} onRemove={remove} />
              )}
            />
          ) : null}
        </View>

        {isReady ? (
          <View style={styles.footer}>
            {validationError ? <Text style={styles.inlineError}>{validationError}</Text> : null}
            {addError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.inlineError}>{addError}</Text>
                <Pressable onPress={dismissAddError}>
                  <Text style={styles.dismissText}>Dismiss</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.formRow}>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={handleChangeText}
                placeholder="New task..."
                placeholderTextColor="#94a3b8"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!isSaving}
              />
              <Pressable
                style={[styles.addBtn, isSaving && styles.addBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSaving}
              >
                <Text style={styles.addBtnText}>{isSaving ? '...' : 'Add'}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <Modal visible={confirmReload} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reload from server?</Text>
            <Text style={styles.modalBody}>
              This replaces your local list with the 10 tasks from the server.
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setConfirmReload(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirm}
                onPress={() => {
                  setConfirmReload(false);
                  reload();
                }}
              >
                <Text style={styles.modalConfirmText}>Reload</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TodosScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  reloadBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  reloadText: { fontSize: 14, fontWeight: '600', color: '#0f766e' },
  body: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  checkmark: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  taskTitle: { flex: 1, fontSize: 16, color: '#0f172a' },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  deleteBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  deleteText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  formRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
  },
  addBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 20,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#99f6e4' },
  addBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  inlineError: { color: '#dc2626', fontSize: 13 },
  errorBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dismissText: { color: '#0f766e', fontSize: 13, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  muted: { fontSize: 15, color: '#64748b', textAlign: 'center' },
  errorText: { fontSize: 16, color: '#dc2626', textAlign: 'center' },
  primaryBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    gap: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalBody: { fontSize: 14, color: '#475569' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancel: { paddingHorizontal: 14, paddingVertical: 8 },
  modalCancelText: { color: '#475569', fontWeight: '600' },
  modalConfirm: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalConfirmText: { color: '#ffffff', fontWeight: '600' },
});
