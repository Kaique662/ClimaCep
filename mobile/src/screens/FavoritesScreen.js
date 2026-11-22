import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../app/AuthContext';
import { apiRequest } from '../app/api';
import { colors, Field, Message, PrimaryButton, ScreenTitle, ui } from '../app/ui';
import { onlyDigits, formatCep } from '../utils/format';

export default function FavoritesScreen({ navigation }) {
  const { token } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false);
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [cep, setCep] = useState(''); const [nickname, setNickname] = useState('');
  const [editing, setEditing] = useState(null); const [editName, setEditName] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { setList(await apiRequest('/api/favorites', { token })); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [token]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const create = async () => {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) { setError('Digite um CEP com 8 números.'); return; }
    if (!nickname.trim()) { setError('Dê um nome para identificar esta região.'); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      await apiRequest('/api/favorites', { method: 'POST', token, data: { cep: digits, nickname: nickname.trim() } });
      setCep(''); setNickname(''); setMessage('Região adicionada aos favoritos.'); await refresh();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  const rename = async (item) => {
    if (!editName.trim()) { setError('O apelido não pode ficar vazio.'); return; }
    setSaving(true); setError('');
    try {
      await apiRequest(`/api/favorites/${item.id}`, { method: 'PUT', token, data: {
        nickname: editName.trim(), neighborhood: item.neighborhood || null,
        city: item.city || null, state: item.state || null,
      } });
      setEditing(null); setMessage('Nome da região atualizado.'); await refresh();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  const remove = (item) => Alert.alert('Excluir favorito?', `Remover ${item.nickname}?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: async () => {
      try { await apiRequest(`/api/favorites/${item.id}`, { method: 'DELETE', token }); await refresh(); }
      catch (e) { setError(e.message); }
    } },
  ]);
  const openRegion = (item) => navigation.navigate('Início', { cep: item.cep, requestNonce: Date.now() });

  return <SafeAreaView style={ui.page} edges={['top', 'left', 'right']}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.container}>
      <ScreenTitle eyebrow="MINHAS LOCALIZAÇÕES" title="Regiões favoritas" description="Salve CEPs importantes e volte à previsão com um toque." />
      <View style={ui.card}>
        <Text style={[ui.itemTitle, { marginBottom: 13 }]}>Adicionar uma região</Text>
        <Field label="CEP" icon="location-outline" keyboardType="number-pad" maxLength={9} value={cep}
          onChangeText={(v) => setCep(formatCep(v))} placeholder="00000-000" />
        <Field label="Apelido" icon="bookmark-outline" value={nickname} onChangeText={setNickname}
          placeholder="Ex.: Casa, Trabalho, Faculdade" maxLength={80} autoCapitalize="sentences" />
        <PrimaryButton title="Salvar região" icon="add-circle-outline" onPress={create} loading={saving}/>
      </View>
      <Message text={error}/><Message text={message} success/>
      <View style={[ui.row, { marginBottom: 12, marginTop: 9 }]}>
        <Text style={[ui.itemTitle, { flex: 1 }]}>Minhas regiões ({list.length})</Text>
        <TouchableOpacity accessibilityRole="button" onPress={refresh}><Ionicons name="refresh" size={21} color={colors.blue}/></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator size="large" color={colors.blue}/> : null}
      {!loading && list.length === 0 ? <View style={ui.card}>
        <Text style={ui.itemSub}>Nenhum favorito ainda. Você também pode salvar uma região diretamente na tela de previsão.</Text>
      </View> : null}
      {list.map((item) => <View key={item.id} style={ui.card}>
        <View style={ui.row}>
          <View style={{ backgroundColor: colors.light, padding: 10, borderRadius: 12 }}><Ionicons name="location" size={20} color={colors.blue}/></View>
          <View style={{ flex: 1 }}>
            <Text style={ui.itemTitle}>{item.nickname}</Text>
            <Text style={ui.itemSub}>{formatCep(item.cep)}{item.city ? ` · ${item.city}/${item.state || ''}` : ''}</Text>
          </View>
        </View>
        {editing === item.id ? <View style={{ marginTop: 15 }}>
          <Field label="Novo apelido" value={editName} onChangeText={setEditName} autoCapitalize="sentences" maxLength={80}/>
          <PrimaryButton title="Salvar alteração" onPress={() => rename(item)} loading={saving}/>
          <PrimaryButton title="Cancelar" onPress={() => setEditing(null)} secondary/>
        </View> : <View style={[ui.row, { marginTop: 15 }] }>
          <TouchableOpacity onPress={() => openRegion(item)} style={[ui.row, { flex: 1, paddingVertical: 8 }]}>
            <Ionicons name="cloud-outline" size={17} color={colors.blue}/><Text style={ui.link}>Ver clima</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Editar região" onPress={() => { setEditing(item.id); setEditName(item.nickname); }} style={{ padding: 8 }}>
            <Ionicons name="pencil-outline" size={20} color={colors.sub}/>
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Excluir região" onPress={() => remove(item)} style={{ padding: 8 }}>
            <Ionicons name="trash-outline" size={20} color={colors.error}/>
          </TouchableOpacity>
        </View>}
      </View>)}
    </ScrollView>
  </SafeAreaView>;
}
