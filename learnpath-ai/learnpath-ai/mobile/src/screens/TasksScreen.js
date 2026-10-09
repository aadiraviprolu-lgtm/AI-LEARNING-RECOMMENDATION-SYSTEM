import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useDebounced, useLoad } from '../hooks';
import { Chips, Empty, ErrorBox, Loading, Tag, s } from '../components';
import { colors, priorityColor } from '../theme';

/** Used both as the "Tasks" tab (all tasks) and inside a project (route.params.projectId). */
export default function TasksScreen({ navigation, route }) {
  const projectId = route?.params?.projectId;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [actionError, setActionError] = useState('');
  const q = useDebounced(search);
  const { data, loading, refreshing, error, reload, refresh } = useLoad(
    () => api.tasks({ projectId, search: q, status, priority, sortBy: 'dueDate', limit: 100 }), [projectId, q, status, priority]);

  // Reload when returning from the create/edit form
  useFocusEffect(useCallback(() => { if (data) refresh(); }, [])); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (t) => {
    setActionError('');
    try { await api.updateTask(t.id, { status: t.status === 'Completed' ? 'Pending' : 'Completed' }); refresh(); }
    catch (e) { setActionError(e.message); }
  };
  const remove = (t) => Alert.alert('Delete task?', t.name, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.deleteTask(t.id); refresh(); } catch (e) { setActionError(e.message); } } },
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12, gap: 8 }}>
        <TextInput placeholder="Search tasks…" placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} style={s.input} />
        <Chips options={['Pending', 'In Progress', 'Completed']} value={status} onChange={setStatus} allLabel="Any status" />
        <Chips options={['High', 'Medium', 'Low']} value={priority} onChange={setPriority} allLabel="Any priority" />
      </View>
      <ErrorBox message={actionError || error} onRetry={error ? reload : undefined} />
      {loading ? <Loading /> : (
        <FlatList data={data?.data || []} keyExtractor={(t) => t.id} contentContainerStyle={{ padding: 12, paddingTop: 0, paddingBottom: 90, gap: 8, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
          ListEmptyComponent={!error && <Empty title="No tasks found" hint="Tap + to add a task, or change your filters." />}
          renderItem={({ item: t }) => {
            const done = t.status === 'Completed';
            return (
              <Pressable onPress={() => navigation.navigate('TaskForm', { taskId: t.id, projectId: t.projectId })} onLongPress={() => remove(t)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
                <Pressable onPress={() => toggle(t)} hitSlop={10}
                  style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: done ? colors.ok : colors.border, backgroundColor: done ? colors.ok : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {done && <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text>}
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', textDecorationLine: done ? 'line-through' : 'none', color: done ? colors.muted : colors.text }}>{t.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{!projectId ? `${t.projectName} · ` : ''}{t.status}{t.dueDate ? ` · due ${t.dueDate}` : ''}</Text>
                  {!done && t.dueDate && t.dueDate < today && <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>Overdue</Text>}
                </View>
                <Tag text={t.priority} color={priorityColor[t.priority]} />
              </Pressable>
            );
          }} />
      )}
      <Pressable onPress={() => navigation.navigate('TaskForm', { projectId })}
        style={{ position: 'absolute', right: 18, bottom: 22, backgroundColor: colors.primary, width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', elevation: 5 }}>
        <Text style={{ color: '#fff', fontSize: 30, marginTop: -2 }}>+</Text>
      </Pressable>
    </View>
  );
}
