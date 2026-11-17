import type { ReactNode } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { Task } from '../todos/types';
import { TodoItem } from './TodoItem';

export type TodoListProps = {
  tasks: Task[];
  onToggle(localId: string): void;
  onDelete(localId: string): void;
  header?: ReactNode;
};

export function TodoList({ tasks, onToggle, onDelete, header }: TodoListProps) {
  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.localId}
      ListHeaderComponent={header ? <>{header}</> : undefined}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <TodoItem task={item} onToggle={onToggle} onDelete={onDelete} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
});
