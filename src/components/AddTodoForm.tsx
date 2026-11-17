import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ADD_ERROR_MESSAGE } from '../api/messages';
import { colors } from '../theme';
import type { AddStatus } from '../todos/types';

export type AddTodoFormProps = {
  status: AddStatus;
  add(title: string): string | null;
  onDismissError(): void;
};

export function AddTodoForm({ status, add, onDismissError }: AddTodoFormProps) {
  const [draft, setDraft] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const prevKindRef = useRef(status.kind);

  useEffect(() => {
    if (prevKindRef.current === 'saving' && status.kind === 'idle') {
      setDraft('');
    }
    prevKindRef.current = status.kind;
  }, [status.kind]);

  const isSaving = status.kind === 'saving';
  const apiError = status.kind === 'error' ? ADD_ERROR_MESSAGE[status.error.kind] : null;

  const handleSubmit = () => {
    if (isSaving) return;
    const error = add(draft);
    setValidationError(error);
  };

  const handleChangeText = (text: string) => {
    setDraft(text);
    if (validationError) setValidationError(null);
    if (status.kind === 'error') onDismissError();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={handleChangeText}
          placeholder="Add a task..."
          placeholderTextColor={colors.placeholder}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          editable={!isSaving}
          accessibilityLabel="New task title"
        />
        <Pressable
          style={[styles.button, isSaving && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Add"
          accessibilityState={{ disabled: isSaving }}
        >
          <Text style={styles.buttonText}>{isSaving ? 'Adding...' : 'Add'}</Text>
        </Pressable>
      </View>
      {validationError ? <Text style={styles.error}>{validationError}</Text> : null}
      {apiError ? <Text style={styles.error}>{apiError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 10 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
  },
  button: {
    minWidth: 44,
    minHeight: 44,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: colors.accentDisabled },
  buttonText: { color: colors.accentText, fontWeight: '600', fontSize: 15 },
  error: { color: colors.danger, fontSize: 13, marginTop: 6 },
});
