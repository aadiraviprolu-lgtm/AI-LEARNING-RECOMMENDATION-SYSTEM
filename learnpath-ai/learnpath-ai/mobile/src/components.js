import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { colors } from './theme';

export const Loading = () => <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

export const ErrorBox = ({ message, onRetry }) => !message ? null : (
  <View style={s.error}><Text style={s.errorText}>{message}</Text>
    {onRetry && <Pressable onPress={onRetry}><Text style={s.retry}>Retry</Text></Pressable>}</View>
);

export const Button = ({ title, onPress, kind = 'primary', disabled, loading }) => (
  <Pressable onPress={onPress} disabled={disabled || loading}
    style={({ pressed }) => [s.btn, kind === 'danger' ? s.btnDanger : kind === 'ghost' ? s.btnGhost : s.btnPrimary, (pressed || disabled || loading) && { opacity: 0.6 }]}>
    {loading ? <ActivityIndicator color={kind === 'primary' ? '#fff' : colors.primary} /> :
      <Text style={[s.btnText, kind !== 'primary' && { color: kind === 'danger' ? colors.danger : colors.primary }]}>{title}</Text>}
  </Pressable>
);

export const Input = ({ label, error, ...props }) => (
  <View style={{ marginBottom: 12 }}>
    {label && <Text style={s.label}>{label}</Text>}
    <TextInput placeholderTextColor={colors.muted} {...props} style={[s.input, error && { borderColor: colors.danger }, props.multiline && { height: 90, textAlignVertical: 'top' }]} />
    {error && <Text style={s.fieldError}>{error}</Text>}
  </View>
);

export function Chips({ options, value, onChange, allLabel, labels }) {
  const items = allLabel ? ['', ...options] : options;
  return (
    <View style={s.chips}>
      {items.map((o) => (
        <Pressable key={o || 'all'} onPress={() => onChange(o)} style={[s.chip, value === o && s.chipActive]}>
          <Text style={[s.chipText, value === o && { color: '#fff' }]}>{o ? (labels?.[o] ?? o) : allLabel}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const Tag = ({ text, color }) => <View style={[s.tag, { backgroundColor: `${color}22` }]}><Text style={[s.tagText, { color }]}>{text}</Text></View>;

/** Shows a persistent banner while the device is offline. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => NetInfo.addEventListener((st) => setOffline(st.isConnected === false || st.isInternetReachable === false)), []);
  return offline ? <View style={s.offline}><Text style={s.offlineText}>You're offline. Showing what's loaded; changes need a connection.</Text></View> : null;
}

export const Empty = ({ title, hint }) => (
  <View style={s.center}><Text style={{ fontSize: 34 }}>🧭</Text><Text style={s.emptyTitle}>{title}</Text><Text style={{ color: colors.muted, textAlign: 'center' }}>{hint}</Text></View>
);

export const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 6 },
  error: { backgroundColor: '#fde8e8', padding: 12, borderRadius: 10, margin: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  errorText: { color: '#9b1c1c', flex: 1 }, retry: { color: colors.primary, fontWeight: '700' },
  btn: { paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  btnPrimary: { backgroundColor: colors.primary }, btnGhost: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  btnDanger: { borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.surface }, btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  label: { fontWeight: '600', marginBottom: 4, color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: colors.surface, color: colors.text },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: 3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary }, chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }, tagText: { fontSize: 11, fontWeight: '700' },
  offline: { backgroundColor: '#b7791f', padding: 8 }, offlineText: { color: '#fff', textAlign: 'center', fontSize: 13 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
});
