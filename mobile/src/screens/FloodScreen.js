import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Keyboard, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../app/AuthContext';
import { apiRequest } from '../app/api';
import { colors, KeyboardAwareScrollView, Message, PrimaryButton, ScreenTitle, ui } from '../app/ui';
import { getAddressByCep } from '../services/cepAddress';
import { onlyDigits, formatCep } from '../utils/format';

const FLOODED = 'FLOODED';
const CLEAR = 'CLEAR';

const situations = {
  NO_REPORTS: { color: '#657891', bg: '#EDF2F8', icon: 'information-circle-outline', title: 'Sem relatos recentes', detail: 'Ninguém informou a condição desse CEP nas últimas 24 horas. Isso não significa ausência de risco.' },
  REPORTED_FLOOD: { color: '#AD4C12', bg: '#FFF1DC', icon: 'warning-outline', title: 'Há relatos de alagamento', detail: 'Usuários informaram alagamento neste CEP nas últimas 24 horas. Os relatos não foram verificados.' },
  REPORTED_CLEAR: { color: '#187D65', bg: '#E7F8F2', icon: 'checkmark-circle-outline', title: 'Relatos sem alagamento', detail: 'Usuários informaram ausência de alagamento. As condições podem mudar rapidamente.' },
  CONFLICTING: { color: '#9B6318', bg: '#FFF3D9', icon: 'alert-circle-outline', title: 'Relatos divergentes', detail: 'Alguns usuários relatam alagamento e outros não. Considere a situação incerta.' },
};

function dateTime(value) {
  if (!value) return 'Horário indisponível';
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? 'Horário indisponível' : dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function ReportChoice({ selected, onPress, icon, title, description, tint }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected }}
    activeOpacity={0.8} onPress={onPress}
    style={[styles.choice, selected && { borderColor: tint, backgroundColor: tint === '#B95720' ? '#FFF6EC' : '#ECFAF4' }]}>
    <Ionicons name={icon} size={24} color={tint}/>
    <Text style={styles.choiceTitle}>{title}</Text>
    <Text style={styles.choiceSub}>{description}</Text>
    <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} color={selected ? tint : '#A4B2C5'} size={21}/>
  </TouchableOpacity>;
}

export default function FloodScreen({ route }) {
  const { token, user } = useAuth();
  const [cepInput, setCepInput] = useState('');
  const [selectedCep, setSelectedCep] = useState('');
  const [location, setLocation] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selection, setSelection] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const requestSequence = useRef(0);

  const load = useCallback(async (rawCep) => {
    const clean = onlyDigits(rawCep);
    if (clean.length !== 8) { setError('Digite um CEP com 8 números.'); return; }
    const request = ++requestSequence.current;
    Keyboard.dismiss();
    setCepInput(formatCep(clean));
    setSelectedCep('');
    setSummary(null); setLocation(null); setSelection(null); setNote('');
    setError(''); setSuccess(''); setLoading(true);
    try {
      // O relatório vem do PostgreSQL; o endereço só identifica a região do CEP.
      const [reports, address] = await Promise.allSettled([
        apiRequest(`/api/flood-reports?cep=${clean}`, { token }),
        getAddressByCep(clean),
      ]);
      if (request !== requestSequence.current) return;
      if (reports.status !== 'fulfilled') throw reports.reason;
      setSummary(reports.value);
      setSelectedCep(clean);
      if (reports.value.myReport) {
        setSelection(reports.value.myReport.status);
        setNote(reports.value.myReport.note || '');
      }
      if (address.status === 'fulfilled') setLocation(address.value);
      else setError(address.reason?.message || 'Não foi possível localizar o endereço.');
    } catch (e) {
      if (request === requestSequence.current) setError(e.message || 'Falha ao buscar relatos.');
    } finally {
      if (request === requestSequence.current) setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const requested = onlyDigits(route.params?.cep || '');
      if (requested.length === 8) { load(requested); return; }
      try {
        const saved = await AsyncStorage.getItem(`@climacep:lastCep:${user.id}`);
        if (active && onlyDigits(saved).length === 8) load(saved);
      } catch (e) { console.info('CEP local:', e.message); }
    })();
    return () => { active = false; ++requestSequence.current; };
  }, [load, route.params?.cep, route.params?.requestNonce, user.id]));

  const onChangeCep = (value) => {
    ++requestSequence.current;
    setCepInput(formatCep(value));
    setSelectedCep(''); setLocation(null); setSummary(null);
    setSelection(null); setNote(''); setError(''); setSuccess(''); setLoading(false);
  };

  const save = async () => {
    if (!location || !summary || selectedCep !== onlyDigits(cepInput)) {
      setError('Consulte e confirme o CEP antes de enviar o relato.'); return;
    }
    if (selection !== FLOODED && selection !== CLEAR) { setError('Escolha a condição observada.'); return; }
    setError(''); setSuccess(''); setSaving(true);
    try {
      await apiRequest(`/api/flood-reports/my/${selectedCep}`, { method: 'PUT', token, data: {
        status: selection, note: note.trim() || null,
        neighborhood: location.neighborhood || null,
        city: location.city, state: location.state,
      }});
      await load(selectedCep);
      setSuccess('Seu relato foi salvo. Você poderá atualizá-lo se a situação mudar.');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = () => Alert.alert('Apagar seu relato?', 'Seu relato deixará de aparecer no CEP consultado.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: async () => {
      setSaving(true); setError('');
      try {
        await apiRequest(`/api/flood-reports/my/${selectedCep}`, { method: 'DELETE', token });
        await load(selectedCep);
        setSuccess('Seu relato foi excluído.');
      } catch (e) { setError(e.message); } finally { setSaving(false); }
    } },
  ]);

  const matched = summary && selectedCep === onlyDigits(cepInput);
  const presentation = situations[summary?.situation] || situations.NO_REPORTS;

  return <SafeAreaView style={ui.page} edges={['top', 'left', 'right']}>
    <KeyboardAwareScrollView contentContainerStyle={ui.container}>
      <ScreenTitle eyebrow="COMUNIDADE CLIMACEP" title="Alertas de enchente" description="Veja relatos recentes por CEP e informe se você observou alagamento na região."/>

      <View style={styles.notice}>
        <Ionicons name="shield-checkmark-outline" color="#5C6C82" size={21}/>
        <Text style={styles.noticeText}>Informações enviadas por usuários e não verificadas. Não são alertas oficiais. Em perigo, procure um local seguro e acione a Defesa Civil (199) ou os Bombeiros (193).</Text>
      </View>

      <View style={ui.card}>
        <Text style={ui.itemTitle}>Onde você quer consultar?</Text>
        <View style={styles.cepRow}>
          <View style={styles.cepInputWrap}>
            <Ionicons name="location-outline" size={19} color={colors.blue}/>
            <TextInput value={cepInput} onChangeText={onChangeCep} placeholder="00000-000"
              placeholderTextColor="#9EABBD" keyboardType="number-pad" maxLength={9}
              style={styles.cepField} accessibilityLabel="CEP da região"/>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={() => load(cepInput)}
            disabled={loading || saving || onlyDigits(cepInput).length !== 8}
            style={[styles.searchButton, (loading || saving || onlyDigits(cepInput).length !== 8) && { opacity: .5 }]}>
            <Ionicons name="search" color="#FFFFFF" size={21}/>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Pesquise o CEP para ver os relatos daquela área.</Text>
      </View>
      {loading ? <ActivityIndicator size="large" color={colors.blue} style={{ marginVertical: 16 }}/>: null}
      <Message text={error}/><Message text={success} success/>

      {matched ? <>
        <View style={styles.regionCard}>
          <View style={ui.row}>
            <Ionicons name="pin-outline" size={22} color={colors.blue}/>
            <View style={{ flex: 1 }}>
              <Text style={styles.regionTitle}>{location?.neighborhood || location?.city || `CEP ${formatCep(selectedCep)}`}</Text>
              <Text style={ui.itemSub}>{location ? `${location.city}/${location.state} · ` : ''}CEP {formatCep(selectedCep)}</Text>
              {location?.street ? <Text style={ui.itemSub}>{location.street}</Text> : null}
            </View>
          </View>
        </View>
        <View style={[styles.situation, { backgroundColor: presentation.bg, borderColor: presentation.color + '33' }]}>
          <View style={ui.row}>
            <Ionicons name={presentation.icon} size={25} color={presentation.color}/>
            <Text style={[styles.situationTitle, { color: presentation.color }]}>{presentation.title}</Text>
          </View>
          <Text style={styles.situationNote}>{presentation.detail}</Text>
          <View style={styles.counts}>
            <View style={styles.countBox}><Text style={[styles.countNumber, { color: '#B95622' }]}>{summary.floodedCount}</Text><Text style={styles.countLabel}>Com alagamento</Text></View>
            <View style={styles.countBox}><Text style={[styles.countNumber, { color: '#1A8A6B' }]}>{summary.clearCount}</Text><Text style={styles.countLabel}>Sem alagamento</Text></View>
          </View>
          <Text style={styles.windowText}>Relatos das últimas {summary.windowHours}h · um por usuário e CEP</Text>
        </View>

        <View style={ui.card}>
          <Text style={ui.itemTitle}>Informar condição observada</Text>
          <Text style={[ui.itemSub, { marginBottom: 15 }]}>Selecione o que você observou agora. Um novo envio atualiza seu relato anterior.</Text>
          <View style={styles.choiceRow}>
            <ReportChoice selected={selection === FLOODED} onPress={() => setSelection(FLOODED)} icon="water-outline"
              title="Há alagamento" description="Vi água acumulada" tint="#B95720"/>
            <ReportChoice selected={selection === CLEAR} onPress={() => setSelection(CLEAR)} icon="checkmark-circle-outline"
              title="Sem alagamento" description="Não observei água" tint="#188366"/>
          </View>
          <Text style={[ui.label, { marginTop: 15 }]}>Observação opcional (até 280 caracteres)</Text>
          <TextInput multiline numberOfLines={3} maxLength={280} value={note} onChangeText={setNote}
            textAlignVertical="top" style={styles.noteField} placeholder="Ex.: água cobrindo parte da via. Não inclua dados pessoais."
            placeholderTextColor="#96A6B8" accessibilityLabel="Descrição do relato"/>
          <Text style={styles.remaining}>{note.length}/280</Text>
          {!location ? <Text style={styles.warningText}>O endereço não foi confirmado. Consulte um CEP válido para enviar um relato.</Text> : null}
          <PrimaryButton title={summary.myReport ? 'Atualizar meu relato' : 'Enviar relato'}
            icon="send-outline" onPress={save} loading={saving} disabled={!location || !selection || loading}/>
          {summary.myReport ? <TouchableOpacity accessibilityRole="button" style={styles.delete} onPress={remove} disabled={saving}>
            <Ionicons name="trash-outline" size={17} color={colors.error}/><Text style={styles.deleteText}>Excluir meu relato</Text>
          </TouchableOpacity> : null}
        </View>

        <Text style={[ui.itemTitle, { marginBottom: 11 }]}>Relatos recentes ({summary.reports.length}{summary.floodedCount + summary.clearCount > 30 ? '+': ''})</Text>
        {summary.reports.length === 0 ? <View style={ui.card}>
          <Text style={ui.itemSub}>Não há relatos recentes para este CEP. Você pode ser a primeira pessoa a informar a condição.</Text>
        </View> : summary.reports.map((item) => <View style={ui.card} key={item.id}>
          <View style={ui.row}>
            <Ionicons name={item.status === FLOODED ? 'warning-outline' : 'checkmark-circle-outline'}
              color={item.status === FLOODED ? '#B95720' : '#188366'} size={20}/>
            <Text style={[ui.itemTitle, { flex: 1 }]}>{item.status === FLOODED ? 'Relato de alagamento' : 'Relato sem alagamento'}</Text>
            {item.mine ? <Text style={styles.me}>MEU</Text> : null}
          </View>
          <Text style={ui.itemSub}>Enviado por usuário · {dateTime(item.updatedAt)}</Text>
          {item.note ? <Text style={styles.reportNote}>{item.note}</Text> : null}
        </View>)}
      </> : !loading && !error ? <View style={ui.card}>
        <Ionicons name="people-outline" color={colors.blue} size={36}/>
        <Text style={[ui.itemTitle, { marginTop: 10 }]}>A comunidade ajuda a informar</Text>
        <Text style={ui.itemSub}>Digite um CEP para consultar relatos de alagamento e registrar sua observação.</Text>
      </View> : null}
    </KeyboardAwareScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  notice: { borderRadius: 14, padding: 14, backgroundColor: '#EDF2F7', borderColor: '#DDE4EE', borderWidth: 1, flexDirection: 'row', gap: 10, marginBottom: 16 },
  noticeText: { flex: 1, fontSize: 11.5, color: '#52637A', lineHeight: 18 },
  cepRow: { flexDirection: 'row', gap: 9, marginTop: 15 },
  cepInputWrap: { flex: 1, backgroundColor: '#F8FAFE', borderRadius: 12, borderWidth: 1, borderColor: '#DCE7F5', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  cepField: { flex: 1, minHeight: 50, color: colors.ink, fontSize: 16, fontWeight: '700' },
  searchButton: { backgroundColor: colors.blue, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  hint: { color: colors.sub, fontSize: 11, marginTop: 9 },
  regionCard: { borderRadius: 17, backgroundColor: '#EAF3FF', borderColor: '#CFDFF5', borderWidth: 1, padding: 15, marginBottom: 13 },
  regionTitle: { color: colors.ink, fontWeight: '900', fontSize: 17 },
  situation: { borderRadius: 18, borderWidth: 1, padding: 17, marginBottom: 15 },
  situationTitle: { fontSize: 16, fontWeight: '900', flex: 1 },
  situationNote: { color: '#52637A', fontSize: 12, lineHeight: 19, marginTop: 9 },
  counts: { flexDirection: 'row', gap: 10, marginTop: 15 },
  countBox: { backgroundColor: 'rgba(255,255,255,0.80)', borderRadius: 12, padding: 12, flex: 1 },
  countNumber: { fontSize: 24, fontWeight: '900' },
  countLabel: { fontSize: 11, color: '#6A798D', marginTop: 3 },
  windowText: { color: '#6F7C8D', fontSize: 10, marginTop: 11 },
  choiceRow: { flexDirection: 'row', gap: 10 },
  choice: { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#FBFCFE', minHeight: 149, padding: 12, alignItems: 'flex-start', gap: 8 },
  choiceTitle: { color: colors.ink, fontWeight: '900', fontSize: 12.5 },
  choiceSub: { color: colors.sub, fontSize: 10.5, lineHeight: 15, flex: 1 },
  noteField: { minHeight: 86, backgroundColor: '#F8FAFE', borderWidth: 1, borderColor: '#DCE7F5', borderRadius: 12, padding: 12, color: colors.ink, fontSize: 13, marginTop: 9 },
  remaining: { textAlign: 'right', marginTop: 5, color: colors.sub, fontSize: 10 },
  warningText: { color: colors.error, fontSize: 11, marginTop: 10 },
  delete: { marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  me: { fontSize: 10, fontWeight: '900', color: colors.blue },
  reportNote: { marginTop: 11, fontSize: 12, lineHeight: 18, color: colors.ink },
});
