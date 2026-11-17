import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import type { Task } from '../todos/types';
import { TodoList } from './TodoList';

const tasks: Task[] = [
  { localId: 'server-1', serverId: 1, title: 'First', completed: false },
  { localId: 'local-1', serverId: 201, title: 'Second', completed: true },
];

describe('TodoList (T1, D3, D17)', () => {
  it('renders header and all tasks and forwards toggle/delete callbacks', async () => {
    const onToggle = jest.fn();
    const onDelete = jest.fn();

    await render(
      <TodoList
        tasks={tasks}
        onToggle={onToggle}
        onDelete={onDelete}
        header={<Text>List Header</Text>}
      />,
    );

    expect(screen.getByText('List Header')).toBeTruthy();
    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Delete Second'));
    expect(onDelete).toHaveBeenCalledWith('local-1');
  });
});
