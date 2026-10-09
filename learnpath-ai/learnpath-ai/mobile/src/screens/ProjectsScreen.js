import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { useDebounced, useLoad } from '../hooks';
import { Chips, Empty, ErrorBox, Loading, Tag, s } from '../components';
import { colors, statusColor } from '../theme';

export default function ProjectsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const q = useDebounced(search);
  const { data, loading, refreshing, error, reload, refresh } = useLoad(() => api.projects({ search: q, status, limit: 100 }), [q, status]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12, gap: 10 }}>
        <TextInput placeholder="Search projects…" placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} style={s.input} />
        <Chips options={['Not Started', 'In Progress', 'Completed']} value={status} onChange={setStatus} allLabel="All" />
      </View>
      <ErrorBox message={error} onRetry={reload} />
      {loading ? <Loading /> : (
        <FlatList data={data?.data || []} keyExtractor={(p) => p.id} contentContainerStyle={{ padding: 12, paddingTop: 0, gap: 10, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
          ListEmptyComponent={!error && <Empty title="No projects found" hint="Create projects on the web app, then pull down to refresh." />}
          renderItem={({ item: p }) => {
            const pct = p.taskCount ? Math.round((p.completedTaskCount / p.taskCount) * 100) : 0;
            return (
              <Pressable onPress={() => navigation.navigate('ProjectTasks', { projectId: p.id, name: p.name })}
                style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', flex: 1 }}>{p.name}</Text><Tag text={p.status} color={statusColor[p.status]} />
                </View>
                {!!p.description && <Text numberOfLines={2} style={{ color: colors.muted, marginTop: 4 }}>{p.description}</Text>}
                <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 9, marginTop: 10, overflow: 'hidden' }}>
                  <View style={{ width: `${pct}%`, height: 6, backgroundColor: colors.primary }} /></View>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{p.completedTaskCount}/{p.taskCount} tasks · {pct}%</Text>
              </Pressable>
            );
          }} />
      )}
    </View>
  );
}
