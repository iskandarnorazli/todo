import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ADD_ERROR_MESSAGE } from '../api/messages';
import { ApiError } from '../api/types';
import { AddTodoForm } from './AddTodoForm';

describe('AddTodoForm (T3, T4, T9, T10, T11, D17)', () => {
  it('shows validation message when add returns an error and clears it on edit', async () => {
    const add = jest.fn().mockReturnValue('Enter a task title.');
    await render(<AddTodoForm status={{ kind: 'idle' }} add={add} onDismissError={jest.fn()} />);

    const addBtn = screen.getByRole('button', { name: 'Add' });
    const btnStyle = StyleSheet.flatten(addBtn.props.style);
    expect(btnStyle.minWidth).toBeGreaterThanOrEqual(44);
    expect(btnStyle.minHeight).toBeGreaterThanOrEqual(44);

    await fireEvent.press(addBtn);
    expect(add).toHaveBeenCalledWith('');
    expect(screen.getByText('Enter a task title.')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText('Add a task...'), 'Buy milk');
    expect(screen.queryByText('Enter a task title.')).toBeNull();
  });

  it('disables Add and ignores Enter while status is saving', async () => {
    const add = jest.fn().mockReturnValue(null);
    await render(<AddTodoForm status={{ kind: 'saving' }} add={add} onDismissError={jest.fn()} />);

    const addBtn = screen.getByRole('button', { name: 'Add' });
    expect(addBtn.props.accessibilityState).toEqual({ disabled: true });

    await fireEvent.press(addBtn);
    await fireEvent(screen.getByPlaceholderText('Add a task...'), 'submitEditing');
    expect(add).not.toHaveBeenCalled();
  });

  it('clears the input on saving -> idle and keeps it on saving -> error', async () => {
    const add = jest.fn().mockReturnValue(null);
    const { rerender } = await render(
      <AddTodoForm status={{ kind: 'idle' }} add={add} onDismissError={jest.fn()} />,
    );

    const input = screen.getByPlaceholderText('Add a task...');
    await fireEvent.changeText(input, 'Buy milk');
    await fireEvent.press(screen.getByRole('button', { name: 'Add' }));
    expect(add).toHaveBeenCalledWith('Buy milk');

    await rerender(<AddTodoForm status={{ kind: 'saving' }} add={add} onDismissError={jest.fn()} />);
    expect(screen.getByPlaceholderText('Add a task...').props.value).toBe('Buy milk');

    await rerender(
      <AddTodoForm
        status={{ kind: 'error', error: new ApiError('network', 'offline') }}
        add={add}
        onDismissError={jest.fn()}
      />,
    );
    expect(screen.getByPlaceholderText('Add a task...').props.value).toBe('Buy milk');
    expect(screen.getByText(ADD_ERROR_MESSAGE.network)).toBeTruthy();

    await rerender(<AddTodoForm status={{ kind: 'saving' }} add={add} onDismissError={jest.fn()} />);
    await rerender(<AddTodoForm status={{ kind: 'idle' }} add={add} onDismissError={jest.fn()} />);
    expect(screen.getByPlaceholderText('Add a task...').props.value).toBe('');
  });

  it('calls onDismissError once when typing while status is error', async () => {
    const onDismissError = jest.fn();
    await render(
      <AddTodoForm
        status={{ kind: 'error', error: new ApiError('timeout', 'timed out') }}
        add={jest.fn().mockReturnValue(null)}
        onDismissError={onDismissError}
      />,
    );

    expect(screen.getByText(ADD_ERROR_MESSAGE.timeout)).toBeTruthy();
    await fireEvent.changeText(screen.getByPlaceholderText('Add a task...'), 'Buy milk 2');
    expect(onDismissError).toHaveBeenCalledTimes(1);
  });
});
