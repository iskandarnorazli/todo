import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ReloadConfirm } from './ReloadConfirm';

describe('ReloadConfirm (D5, D17)', () => {
  it('renders modal content with accessibilityViewIsModal and 44pt+ buttons when visible', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    await render(<ReloadConfirm visible onConfirm={onConfirm} onCancel={onCancel} />);

    expect(screen.getByText('Reload from server?')).toBeTruthy();
    const dialog = screen.getByLabelText('Reload confirmation');
    expect(dialog.props.accessibilityViewIsModal).toBe(true);

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    const cancelStyle = StyleSheet.flatten(cancelBtn.props.style);
    expect(cancelStyle.minWidth).toBeGreaterThanOrEqual(44);
    expect(cancelStyle.minHeight).toBeGreaterThanOrEqual(44);

    const confirmBtn = screen.getByRole('button', { name: 'Confirm reload' });
    const confirmStyle = StyleSheet.flatten(confirmBtn.props.style);
    expect(confirmStyle.minWidth).toBeGreaterThanOrEqual(44);
    expect(confirmStyle.minHeight).toBeGreaterThanOrEqual(44);

    await fireEvent.press(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    await fireEvent.press(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  }, 15_000);

  it('calls onCancel on Android back button (onRequestClose)', async () => {
    const onCancel = jest.fn();
    const { root } = await render(<ReloadConfirm visible onConfirm={jest.fn()} onCancel={onCancel} />);
    if (!root) throw new Error('expected root');
    await fireEvent(root, 'requestClose');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
