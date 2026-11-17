import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export type ErrorStateProps = {
  message: string;
  onRetry(): void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        style={styles.button}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry"
      >
        <Text style={styles.buttonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  message: { fontSize: 16, color: colors.danger, textAlign: 'center' },
  button: {
    minWidth: 44,
    minHeight: 44,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.accentText, fontWeight: '600', fontSize: 15 },
});
