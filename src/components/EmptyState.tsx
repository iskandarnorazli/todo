import { StyleSheet, Text, View } from 'react-native';

export function EmptyState() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>No tasks left. Add one above.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: 15, color: '#64748b', textAlign: 'center' },
});
