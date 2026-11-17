import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { Task } from '../todos/types';
import { TodoItem } from './TodoItem';

const sampleTask: Task = {
  localId: 'server-1',
  serverId: 1,
  title: 'Buy groceries',
  completed: false,
};

describe('TodoItem (T2, T5, T13, D17)', () => {
  it('renders title, checkbox state, and 44pt+ touch targets for toggle and delete', async () => {
    const onToggle = jest.fn();
    const onDelete = jest.fn();

    await render(<TodoItem task={sampleTask} onToggle={onToggle} onDelete={onDelete} />);

    expect(screen.getByText('Buy groceries')).toBeTruthy();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.props.accessibilityState).toEqual({ checked: false });
    const toggleStyle = StyleSheet.flatten(checkbox.props.style);
    expect(toggleStyle.minHeight).toBeGreaterThanOrEqual(44);

    const deleteBtn = screen.getByLabelText('Delete Buy groceries');
    const deleteStyle = StyleSheet.flatten(deleteBtn.props.style);
    expect(deleteStyle.minWidth).toBeGreaterThanOrEqual(44);
    expect(deleteStyle.minHeight).toBeGreaterThanOrEqual(44);

    await fireEvent.press(checkbox);
    expect(onToggle).toHaveBeenCalledWith('server-1');

    await fireEvent.press(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('server-1');
  });

  it('reflects completed state in accessibilityState', async () => {
    await render(
      <TodoItem
        task={{ ...sampleTask, completed: true }}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.props.accessibilityState).toEqual({ checked: true });
  });
});
