import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Task } from '../todos/types';

export type TodoItemProps = {
  task: Task;
  onToggle(localId: string): void;
  onDelete(localId: string): void;
};

export function TodoItem({ task, onToggle, onDelete }: TodoItemProps) {
  return (
    <View style={styles.card}>
      <Pressable
        style={styles.cardMain}
        onPress={() => onToggle(task.localId)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
      >
        <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
          {task.completed ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={[styles.title, task.completed && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
      </Pressable>
      <Pressable
        style={styles.deleteBtn}
        onPress={() => onDelete(task.localId)}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${task.title}`}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  cardMain: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkmark: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  title: { flex: 1, fontSize: 16, color: '#0f172a' },
  titleDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  deleteBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
});
