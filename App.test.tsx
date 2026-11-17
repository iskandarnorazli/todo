import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import App from './App';

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View: MockView } = require('react-native');
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
    SafeAreaView: ({ children }: { children: ReactNode }) =>
      React.createElement(MockView, { testID: 'safe-area-view' }, children),
  };
});

jest.mock('./src/todos/useTodos', () => ({
  useTodos: () => ({
    state: { kind: 'loading' },
    retry: jest.fn(),
    reload: jest.fn(),
    add: jest.fn().mockReturnValue(null),
    dismissAddError: jest.fn(),
    toggle: jest.fn(),
    remove: jest.fn(),
  }),
}));

describe('App (safe areas)', () => {
  it('wraps the screen in SafeAreaView', async () => {
    await render(<App />);
    expect(screen.getByTestId('safe-area-view')).toBeTruthy();
    expect(screen.getByText('Tasks')).toBeTruthy();
  });
});
