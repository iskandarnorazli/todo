import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ErrorState } from './ErrorState';

describe('ErrorState (T7)', () => {
  it('renders the error message and calls onRetry when Retry is pressed', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState message="Couldn't load tasks. Check your connection." onRetry={onRetry} />);

    expect(screen.getByText("Couldn't load tasks. Check your connection.")).toBeTruthy();
    const button = screen.getByRole('button', { name: 'Retry' });
    const style = StyleSheet.flatten(button.props.style);
    expect(style.minWidth).toBeGreaterThanOrEqual(44);
    expect(style.minHeight).toBeGreaterThanOrEqual(44);

    await fireEvent.press(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
