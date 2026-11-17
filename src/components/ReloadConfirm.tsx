import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type ReloadConfirmProps = {
  visible: boolean;
  onConfirm(): void;
  onCancel(): void;
};

export function ReloadConfirm({ visible, onConfirm, onCancel }: ReloadConfirmProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View
          style={styles.card}
          accessibilityViewIsModal
          accessibilityLabel="Reload confirmation"
        >
          <Text style={styles.title}>Reload from server?</Text>
          <Text style={styles.body}>
            This replaces your local list with the 10 tasks from the server.
          </Text>
          <View style={styles.actions}>
            <Pressable
              style={styles.cancelBtn}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.confirmBtn}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Confirm reload"
            >
              <Text style={styles.confirmText}>Reload</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  body: { fontSize: 14, color: '#475569' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: '#475569', fontWeight: '600' },
  confirmBtn: {
    minWidth: 44,
    minHeight: 44,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { color: '#ffffff', fontWeight: '600' },
});
