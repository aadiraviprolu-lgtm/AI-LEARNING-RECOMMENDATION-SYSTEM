import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { api } from '../api';
import { Button, Chips, ErrorBox, Input, Loading } from '../components';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function TaskFormScreen({ navigation, route }) {
  const { taskId, projectId: initialProjectId } = route.params || {};
  const editing = !!taskId;
  const [f, setF] = useState({ name: '', description: '', priority: 'Medium', status: 'Pending', dueDate: '' });
  const [projectId, setProjectId] = useState(initialProjectId);
  const [projects, setProjects] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setF({ ...f, [k]: v });

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Edit task' : 'New task' });
    (async () => {
      try {
        if (editing) {
          const t = (await api.task(taskId)).data;
          setF({ name: t.name, description: t.description, priority: t.priority, status: t.status, dueDate: t.dueDate || '' });
        } else if (!initialProjectId) {
          const list = (await api.projects({ limit: 100 })).data;
          setProjects(list); if (list[0]) setProjectId(list[0].id);
        }
      } catch (e) { setApiError(e.message); } finally { setLoading(false); }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Task name is required';
    if (f.dueDate && (!DATE.test(f.dueDate) || Number.isNaN(Date.parse(f.dueDate)))) e.dueDate = 'Use format YYYY-MM-DD';
    if (!editing && !projectId) e.project = 'Create a project on the web app first';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true); setApiError('');
    try {
      const body = { name: f.name.trim(), description: f.description, priority: f.priority, status: f.status, dueDate: f.dueDate };
      if (editing) await api.updateTask(taskId, body); else await api.createTask({ ...body, projectId });
      navigation.goBack();
    } catch (err) { setApiError(err.message); setSaving(false); }
  };

  const remove = () => Alert.alert('Delete task?', 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.deleteTask(taskId); navigation.goBack(); } catch (e) { setApiError(e.message); } } },
  ]);

  if (loading) return <Loading />;
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <ErrorBox message={apiError} />
      {!editing && !initialProjectId && (<>
        <Text style={{ fontWeight: '600', marginBottom: 6 }}>Project</Text>
        <Chips options={projects.map((p) => p.id)} labels={Object.fromEntries(projects.map((p) => [p.id, p.name]))} value={projectId} onChange={setProjectId} />
        <Text style={{ marginBottom: 8 }} />
        {errors.project && <Text style={{ color: '#e5484d' }}>{errors.project}</Text>}
      </>)}
      <Input label="Task name *" value={f.name} onChangeText={set('name')} error={errors.name} maxLength={150} />
      <Input label="Description" value={f.description} onChangeText={set('description')} multiline maxLength={2000} />
      <Text style={{ fontWeight: '600', marginBottom: 6 }}>Priority</Text>
      <Chips options={['Low', 'Medium', 'High']} value={f.priority} onChange={set('priority')} />
      <Text style={{ fontWeight: '600', marginVertical: 6 }}>Status</Text>
      <Chips options={['Pending', 'In Progress', 'Completed']} value={f.status} onChange={set('status')} />
      <Input label="Due date (YYYY-MM-DD)" value={f.dueDate} onChangeText={set('dueDate')} error={errors.dueDate} placeholder="2026-12-31" keyboardType="numbers-and-punctuation" />
      <Button title="Save task" onPress={save} loading={saving} />
      {editing && <Button kind="danger" title="Delete task" onPress={remove} />}
    </ScrollView>
  );
}
