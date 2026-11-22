import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../app/AuthContext';
import { apiRequest } from '../app/api';
import { colors, Message, ScreenTitle, ui } from '../app/ui';
import { formatCep } from '../utils/format';

export default function HistoryScreen({ navigation }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await apiRequest('/api/history', { token })); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [token]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const remove = (id) => Alert.alert('Excluir pesquisa?', 'Esta consulta será removida do histórico.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: async () => {
      try { await apiRequest(`/api/history/${id}`, { method: 'DELETE', token }); await refresh(); }
      catch (e) { setError(e.message); }
    } },
  ]);
  const clear = () => Alert.alert('Limpar histórico?', 'Todas as suas consultas serão excluídas.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Limpar', style: 'destructive', onPress: async () => {
      try { await apiRequest('/api/history', { method: 'DELETE', token }); await refresh(); }
      catch (e) { setError(e.message); }
    } },
  ]);
  return <SafeAreaView style={ui.page} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={ui.container}>
      <ScreenTitle eyebrow="SUAS PESQUISAS" title="Histórico" description="Consulte novamente os CEPs pesquisados anteriormente." />
      <Message text={error}/>
      <View style={[ui.row, { marginBottom: 14 }]}>
        <Text style={[ui.itemTitle, { flex: 1 }]}>Últimas pesquisas ({items.length})</Text>
        {items.length ? <TouchableOpacity onPress={clear} style={ui.row}><Ionicons name="trash-outline" size={16} color={colors.error}/><Text style={{ color: colors.error, fontSize: 12 }}>Limpar tudo</Text></TouchableOpacity> : null}
      </View>
      {loading ? <ActivityIndicator color={colors.blue} size="large"/> : null}
      {!loading && items.length === 0 ? <View style={ui.card}><Text style={ui.itemSub}>Ainda não há consultas. Digite um CEP na tela Início para começar.</Text></View> : null}
      {items.map((item) => <View key={item.id} style={ui.card}>
        <View style={ui.row}>
          <View style={{ padding: 11, borderRadius: 12, backgroundColor: colors.light }}><Ionicons name="time-outline" color={colors.blue} size={20}/></View>
          <View style={{ flex: 1 }}>
            <Text style={ui.itemTitle}>{item.neighborhood || item.city || 'CEP consultado'}</Text>
            <Text style={ui.itemSub}>{formatCep(item.cep)}{item.city ? ` · ${item.city}/${item.state || ''}` : ''}</Text>
            <Text style={ui.itemSub}>{new Date(item.createdAt).toLocaleString('pt-BR')}{typeof item.temperature === 'number' ? ` · ${Math.round(item.temperature)}°C` : ''}</Text>
          </View>
          <TouchableOpacity onPress={() => remove(item.id)} accessibilityLabel="Excluir item do histórico" style={{ padding: 8 }}>
            <Ionicons name="trash-outline" color={colors.error} size={19}/>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[ui.row, { justifyContent: 'flex-end', marginTop: 12 }]} onPress={() => navigation.navigate('Início', { cep: item.cep, requestNonce: Date.now() })}>
          <Text style={ui.link}>Consultar novamente</Text><Ionicons name="arrow-forward" color={colors.blue} size={18}/>
        </TouchableOpacity>
      </View>)}
    </ScrollView>
  </SafeAreaView>;
}
