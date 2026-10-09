import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { useLoad } from '../hooks';
import { Empty, ErrorBox, Loading, Tag } from '../components';
import { colors, priorityColor } from '../theme';

const STATS = [['totalProjects', 'Projects', '📁'], ['totalTasks', 'Tasks', '📝'], ['completedTasks', 'Completed', '✅'], ['pendingTasks', 'Pending', '⏳'], ['projectsInProgress', 'Projects active', '🚀']];

export default function DashboardScreen() {
  const stats = useLoad(() => api.dashboard(), []);
  const recs = useLoad(() => api.recommendations(), []);
  const refreshing = stats.refreshing || recs.refreshing;
  const onRefresh = () => { stats.refresh(); recs.refresh(); };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
      <ErrorBox message={stats.error} onRetry={stats.reload} />
      {stats.loading ? <Loading /> : stats.data && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {STATS.map(([k, label, icon]) => (
            <View key={k} style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 22 }}>{icon}</Text>
              <Text style={{ fontSize: 28, fontWeight: '800' }}>{stats.data.data[k]}</Text>
              <Text style={{ color: colors.muted }}>{label}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={{ fontSize: 18, fontWeight: '800', marginTop: 20 }}>🤖 Recommended next</Text>
      <ErrorBox message={recs.error} onRetry={recs.reload} />
      {recs.loading ? <Loading /> : recs.data?.data.length === 0 ? <Empty title="Nothing to recommend" hint="Add tasks on web or mobile to get suggestions." /> :
        recs.data?.data.map((t) => (
          <View key={t.id} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontWeight: '700', flex: 1 }}>{t.name}</Text><Tag text={t.priority} color={priorityColor[t.priority]} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{t.projectName} · {t.reason}</Text>
          </View>
        ))}
    </ScrollView>
  );
}
