import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../app/AuthContext';
import { API_BASE_URL } from '../app/api';
import { colors, Field, Message, PrimaryButton, ui } from '../app/ui';

function AuthLayout({ children, subtitle }) {
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.container}>
        <LinearGradient colors={['#257DED','#0B4EB6']} style={s.brandIcon}>
          <MaterialCommunityIcons name="weather-partly-cloudy" color="white" size={44}/>
        </LinearGradient>
        <Text style={s.brand}>clima<Text style={{ color: colors.blue }}>.cep</Text></Text>
        <Text style={s.tagline}>Sua região. Sua previsão.</Text>
        <Text style={s.title}>{subtitle}</Text>
        <View style={s.formCard}>{children}</View>
        <Text style={s.apiHint}>Backend: {API_BASE_URL || 'Configure mobile/.env'}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submit = async () => {
    if (!email.trim() || !password) { setError('Informe e-mail e senha.'); return; }
    setBusy(true); setError('');
    try { await login(email.trim(), password); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <AuthLayout subtitle="Bem-vindo de volta">
    <Text style={s.formSubtitle}>Entre para salvar suas regiões e acompanhar o clima.</Text>
    <Field label="E-mail" icon="mail-outline" value={email} onChangeText={setEmail} autoComplete="email" keyboardType="email-address" placeholder="seuemail@exemplo.com" />
    <Field label="Senha" icon="lock-closed-outline" value={password} onChangeText={setPassword} secureTextEntry placeholder="Sua senha" />
    <Message text={error}/>
    <PrimaryButton title="Entrar na minha conta" icon="log-in-outline" onPress={submit} loading={busy}/>
    <TouchableOpacity style={s.bottomLink} onPress={() => navigation.navigate('Cadastro')}>
      <Text style={s.bottomText}>Ainda não tem conta? <Text style={ui.link}>Cadastre-se</Text></Text>
    </TouchableOpacity>
  </AuthLayout>;
}
export function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submit = async () => {
    if (name.trim().length < 2) { setError('Digite seu nome.'); return; }
    if (password.length < 8) { setError('A senha precisa ter pelo menos 8 caracteres.'); return; }
    if (password !== confirmation) { setError('As senhas não conferem.'); return; }
    setError(''); setBusy(true);
    try { await register(name.trim(), email.trim(), password); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <AuthLayout subtitle="Crie sua conta">
    <Text style={s.formSubtitle}>Salve CEPs favoritos e consulte seu histórico.</Text>
    <Field label="Nome completo" icon="person-outline" autoCapitalize="words" value={name} onChangeText={setName} placeholder="Seu nome" />
    <Field label="E-mail" icon="mail-outline" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="seuemail@exemplo.com" />
    <Field label="Senha (mínimo 8 caracteres)" icon="lock-closed-outline" secureTextEntry value={password} onChangeText={setPassword} placeholder="Crie uma senha" />
    <Field label="Confirmar senha" icon="lock-closed-outline" secureTextEntry value={confirmation} onChangeText={setConfirmation} placeholder="Digite novamente" />
    <Message text={error}/>
    <PrimaryButton title="Criar conta gratuita" icon="person-add-outline" onPress={submit} loading={busy}/>
    <TouchableOpacity style={s.bottomLink} onPress={() => navigation.navigate('Login')}>
      <Text style={s.bottomText}>Já tem conta? <Text style={ui.link}>Fazer login</Text></Text>
    </TouchableOpacity>
  </AuthLayout>;
}
const s=StyleSheet.create({
  container: { flexGrow: 1, padding: 23, paddingTop: 35, paddingBottom: 44, alignItems: 'center' },
  brandIcon: { width: 78, height: 78, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  brand: { fontSize: 37, fontWeight: '900', color: colors.ink, letterSpacing: -1.5 },
  tagline: { fontSize: 12, color: colors.sub, fontWeight: '700', marginTop: 2 },
  title: { color: colors.ink, fontSize: 24, fontWeight: '900', marginTop: 30, marginBottom: 14 },
  formCard: { width: '100%', maxWidth: 460, backgroundColor: colors.white, padding: 22, borderRadius: 23, borderColor: colors.border, borderWidth: 1 },
  formSubtitle: { fontSize: 13, lineHeight: 20, color: colors.sub, marginBottom: 20 },
  bottomLink: { paddingTop: 25, alignItems: 'center' }, bottomText: { color: colors.sub, fontSize: 13 },
  apiHint: { color: colors.sub, fontSize: 10, marginTop: 28, textAlign: 'center' },
});
