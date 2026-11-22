import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../app/AuthContext';
import { apiRequest } from '../app/api';
import { colors, Field, Message, PrimaryButton, ScreenTitle, ui } from '../app/ui';

export default function ProfileScreen() {
  const { user, token, logout, updateName } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState(''); const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const changeName = async () => {
    if (!name.trim()) { setError('Digite um nome válido.'); return; }
    setBusy(true); setError(''); setSuccess('');
    try { await updateName(name.trim()); setSuccess('Nome atualizado com sucesso.'); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const changePassword = async () => {
    if (newPassword.length < 8) { setError('A nova senha precisa ter pelo menos 8 caracteres.'); return; }
    setBusy(true); setError(''); setSuccess('');
    try {
      await apiRequest('/api/users/me/password', { method: 'PUT', token, data: { currentPassword, newPassword } });
      setCurrentPassword(''); setNewPassword(''); setSuccess('Senha atualizada.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <SafeAreaView style={ui.page} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={ui.container} keyboardShouldPersistTaps="handled">
      <ScreenTitle eyebrow="MINHA CONTA" title="Meu perfil" description="Atualize seus dados e gerencie a segurança da sua conta."/>
      <View style={[ui.card, ui.row, { gap: 14 }] }>
        <View style={{ backgroundColor: colors.light, borderRadius: 18, padding: 15 }}><Ionicons name="person" color={colors.blue} size={29}/></View>
        <View style={{ flex: 1 }}><Text style={ui.itemTitle}>{user?.name}</Text><Text style={ui.itemSub}>{user?.email}</Text></View>
      </View>
      <Message text={error}/><Message text={success} success/>
      <View style={ui.card}>
        <Text style={[ui.itemTitle, { marginBottom: 15 }]}>Informações pessoais</Text>
        <Field label="Nome" value={name} onChangeText={setName} icon="person-outline" autoCapitalize="words" maxLength={120}/>
        <Field label="E-mail cadastrado" value={user?.email} editable={false} icon="mail-outline"/>
        <PrimaryButton title="Salvar nome" onPress={changeName} loading={busy}/>
      </View>
      <View style={ui.card}>
        <Text style={[ui.itemTitle, { marginBottom: 15 }]}>Alterar senha</Text>
        <Field label="Senha atual" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} icon="lock-closed-outline"/>
        <Field label="Nova senha" secureTextEntry value={newPassword} onChangeText={setNewPassword} icon="key-outline" placeholder="Pelo menos 8 caracteres"/>
        <PrimaryButton title="Atualizar senha" onPress={changePassword} loading={busy} secondary/>
      </View>
      <View style={ui.card}>
        <Text style={ui.itemSub}>Suas regiões favoritas e pesquisas são armazenadas no PostgreSQL. O token JWT é guardado no SecureStore.</Text>
        <PrimaryButton title="Sair da conta" icon="log-out-outline" secondary onPress={() => Alert.alert('Sair do ClimaCEP?', 'Você precisará entrar novamente.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sair', style: 'destructive', onPress: () => logout().catch((e) => setError(e.message)) },
        ])}/>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
