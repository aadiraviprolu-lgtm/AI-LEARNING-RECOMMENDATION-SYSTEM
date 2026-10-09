import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../auth';
import { Button, ErrorBox, Input } from '../components';
import { colors } from '../theme';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen({ mode, navigation }) {
  const isRegister = mode === 'register';
  const { login, register, notice } = useAuth();
  const [f, setF] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF({ ...f, [k]: v });

  const submit = async () => {
    const e = {};
    if (isRegister && f.fullName.trim().length < 2) e.fullName = 'Full name must be at least 2 characters';
    if (!EMAIL.test(f.email.trim())) e.email = 'Enter a valid email address';
    if (isRegister ? (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) : !f.password)
      e.password = isRegister ? 'Min 8 characters with a letter and a number' : 'Password is required';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true); setApiError('');
    try {
      if (isRegister) await register({ fullName: f.fullName.trim(), email: f.email.trim(), password: f.password });
      else await login({ email: f.email.trim(), password: f.password });
    } catch (err) { setApiError(err.message); setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.primary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 20 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', textAlign: 'center' }}>🎓 LearnPath <Text style={{ color: colors.primary }}>AI</Text></Text>
          <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 12, marginBottom: 12 }}>{isRegister ? 'Create account' : 'Welcome back'}</Text>
          {!isRegister && notice ? <View style={{ backgroundColor: '#fff4d6', padding: 10, borderRadius: 10, marginBottom: 12 }}><Text style={{ color: '#7a5200' }}>{notice}</Text></View> : null}
          <ErrorBox message={apiError} />
          {isRegister && <Input label="Full name" value={f.fullName} onChangeText={set('fullName')} error={errors.fullName} />}
          <Input label="Email" value={f.email} onChangeText={set('email')} error={errors.email} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Password" value={f.password} onChangeText={set('password')} error={errors.password} secureTextEntry />
          <Button title={isRegister ? 'Sign up' : 'Log in'} onPress={submit} loading={busy} />
          <Button kind="ghost" title={isRegister ? 'I already have an account' : 'Create an account'} onPress={() => navigation.navigate(isRegister ? 'Login' : 'Register')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
