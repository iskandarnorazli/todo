import { render, screen } from '@testing-library/react-native';
import { LoadingState } from './LoadingState';

describe('LoadingState (T6)', () => {
  it('renders a loading message and indicator', async () => {
    await render(<LoadingState />);
    expect(screen.getByText('Loading tasks...')).toBeTruthy();
  });
});
