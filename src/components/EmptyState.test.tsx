import { render, screen } from '@testing-library/react-native';
import { EmptyState } from './EmptyState';

describe('EmptyState (T8)', () => {
  it('renders an empty list message', async () => {
    await render(<EmptyState />);
    expect(screen.getByText('No tasks yet.')).toBeTruthy();
  });
});
