import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
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
        aria-checked={task.completed}
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    borderColor: colors.checkboxBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: colors.accentText, fontSize: 13, fontWeight: '700' },
  title: { flex: 1, fontSize: 16, color: colors.textPrimary },
  titleDone: { textDecorationLine: 'line-through', color: colors.textCompleted },
  deleteBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
});
