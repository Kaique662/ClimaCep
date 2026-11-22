import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import WeatherIcon from './src/components/WeatherIcon';
import { getWeatherByCep } from './src/services/weatherApi';
import { C, cardShadow } from './src/styles/theme';
import { dateLabel, dayLabel, decimal, formatCep, hourLabel, onlyDigits, rounded, timeLabel } from './src/utils/format';
import { weatherInfo, weatherMessage } from './src/utils/weather';

function SectionHeading({ title, eyebrow, right }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {right ? <Text style={styles.sectionRight}>{right}</Text> : null}
    </View>
  );
}

function BrandHeader({ onRefresh, disabled }) {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandLeft}>
        <LinearGradient colors={['#287CEB', '#1054C8']} style={styles.brandMark}>
          <MaterialCommunityIcons name="weather-partly-cloudy" color="#FFFFFF" size={27} />
        </LinearGradient>
        <View>
          <Text style={styles.brandName}>clima<Text style={styles.brandDot}>.</Text>cep</Text>
          <Text style={styles.brandSubtitle}>Previsão na sua região</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={disabled} accessibilityLabel="Atualizar previsão" accessibilityRole="button">
        <Ionicons name="refresh-outline" size={21} color={C.ink} />
      </TouchableOpacity>
    </View>
  );
}

function SearchBox({ cep, onChange, onSearch, busy }) {
  const valid = onlyDigits(cep).length === 8;
  return (
    <View style={styles.searchPanel}>
      <View style={styles.searchTextRow}>
        <View>
          <Text style={styles.searchHeadline}>Como está o tempo por aí?</Text>
          <Text style={styles.searchSub}>Consulte qualquer CEP do Brasil.</Text>
        </View>
        <View style={styles.searchBadge}>
          <Ionicons name="location-outline" color={C.blue} size={21} />
        </View>
      </View>
      <View style={styles.searchInputWrap}>
        <Ionicons name="search-outline" size={21} color={C.inkMuted} />
        <TextInput
          value={cep}
          onChangeText={(value) => onChange(formatCep(value))}
          style={styles.searchInput}
          keyboardType="number-pad"
          placeholder="Digite o CEP (00000-000)"
          placeholderTextColor="#98A6B6"
          maxLength={9}
          returnKeyType="search"
          onSubmitEditing={() => valid && !busy && onSearch()}
          accessibilityLabel="CEP para consulta"
        />
        {cep.length > 0 ? (
          <TouchableOpacity onPress={() => onChange('')} accessibilityLabel="Limpar CEP" accessibilityRole="button">
            <Ionicons name="close-circle" size={19} color="#BBC4D0" />
          </TouchableOpacity>
        ) : null}
      </View>
      <TouchableOpacity onPress={onSearch} disabled={busy || !valid} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Consultar previsão do tempo">
        <LinearGradient colors={busy || !valid ? ['#A6B8D1', '#A0B0C7'] : ['#2478ED', '#0754C8']} style={styles.searchSubmit}>
          {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Ionicons name="arrow-forward-circle-outline" color="#FFFFFF" size={22} />}
          <Text style={styles.searchSubmitText}>{busy ? 'Consultando previsão...' : 'Ver previsão do tempo'}</Text>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={styles.searchHint}>Sem CEP fixo • Consulta por rua, bairro e cidade</Text>
    </View>
  );
}

function ErrorBanner({ message, onDismiss }) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle-outline" size={21} color="#C9484B" />
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={onDismiss} accessibilityLabel="Fechar mensagem de erro" accessibilityRole="button">
        <Ionicons name="close" size={18} color="#B84F58" />
      </TouchableOpacity>
    </View>
  );
}

function HeroWeather({ data }) {
  const { current } = data;
  const info = weatherInfo(current.code, current.isDay);
  const today = data.days[0] || {};
  return (
    <View style={styles.heroOuter}>
      <LinearGradient colors={current.isDay ? ['#155CB4', '#123A82', '#0A285F'] : ['#17365F', '#0B244B', '#06152E']} style={styles.hero}>
        <View style={styles.orbitBig} />
        <View style={styles.orbitSmall} />
        <View style={styles.heroTop}>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>CONDIÇÕES ATUAIS</Text>
          </View>
          <Text style={styles.heroUpdated}>{timeLabel(current.time)}</Text>
        </View>

        <View style={styles.heroLocation}>
          <Ionicons name="location-sharp" size={18} color="#C7DBFF" />
          <Text style={styles.heroCity} numberOfLines={2}>{data.neighborhood || data.city}</Text>
        </View>
        <Text style={styles.heroRegion}>{data.city}, {data.state}</Text>
        {data.street ? <Text style={styles.heroStreet} numberOfLines={2}>{data.street}</Text> : null}
        <Text style={styles.heroDate}>{dateLabel(current.time?.split('T')[0])} · CEP {formatCep(data.cep)}</Text>

        <View style={styles.heroMain}>
          <View style={styles.heroTemperatureWrap}>
            <Text style={styles.heroTemperature}>{rounded(current.temperature)}</Text>
            <Text style={styles.heroDegree}>°</Text>
          </View>
          <View style={styles.heroIconWrap}>
            <WeatherIcon code={current.code} isDay={current.isDay} size={105} />
          </View>
        </View>
        <Text style={styles.heroCondition}>{info.label}</Text>
        <Text style={styles.heroFeels}>Sensação térmica de {rounded(current.feelsLike, '°C')}</Text>

        <View style={styles.heroDivider} />
        <View style={styles.heroBottom}>
          <View style={styles.heroMini}>
            <Ionicons name="arrow-up" color="#FFD58C" size={16} />
            <Text style={styles.heroMiniText}>Máx. {rounded(today.max, '°')}</Text>
          </View>
          <View style={styles.heroMini}>
            <Ionicons name="arrow-down" color="#B1D8FF" size={16} />
            <Text style={styles.heroMiniText}>Mín. {rounded(today.min, '°')}</Text>
          </View>
          <View style={styles.heroMini}>
            <Ionicons name="water-outline" color="#B1D8FF" size={17} />
            <Text style={styles.heroMiniText}>Chuva {rounded(current.chanceRain, '%')}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// Deixa visível a localização geográfica que realmente alimentou a previsão.
// Dois bairros podem ter a mesma previsão se o modelo usar o mesmo quadrante.
function ForecastLocation({ data }) {
  const sourceLabels = {
    brasilapi: 'Coordenadas do CEP • BrasilAPI',
    awesomeapi: 'Coordenadas do CEP • AwesomeAPI',
  };
  const point = (lat, lon) => (
    Number.isFinite(lat) && Number.isFinite(lon)
      ? `${lat.toFixed(4)}, ${lon.toFixed(4)}`
      : 'Não informado'
  );
  return (
    <View style={styles.locationCard}>
      <View style={styles.locationCardTop}>
        <Ionicons name="navigate-circle-outline" size={20} color={C.blue} />
        <Text style={styles.locationCardTitle}>Localização usada na previsão</Text>
      </View>
      <Text style={styles.locationCardSource}>{sourceLabels[data.coordinateSource] || 'Coordenadas obtidas por CEP'}</Text>
      <Text style={styles.locationCardCoordinate}>Coordenadas fornecidas para o CEP: {point(data.latitude, data.longitude)}</Text>
      <Text style={styles.locationCardCoordinate}>Ponto meteorológico: {point(data.gridLatitude, data.gridLongitude)}</Text>
      {Number.isFinite(data.gridDistanceKm) ? (
        <Text style={styles.locationCardCoordinate}>Distância até o ponto de previsão: {decimal(data.gridDistanceKm, ' km')}</Text>
      ) : null}
      <Text style={styles.locationCardNote}>
        {'Todas as seções usam esta mesma consulta Open-Meteo. CEPs próximos podem cair na mesma célula da grade e mostrar valores iguais; não são medições feitas na rua.'}
      </Text>
    </View>
  );
}

function HourlyForecast({ data }) {
  const hours = data.hours;
  return (
    <View style={styles.sectionSpace}>
      <SectionHeading title="Próximas horas" right={`CEP ${formatCep(data.cep)}`} eyebrow="ACOMPANHE O TEMPO" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hoursContainer}>
        {hours.map((hour, index) => (
          <View key={`${hour.time}-${index}`} style={[styles.hourCard, index === 0 && styles.hourCardActive]}>
            <Text style={[styles.hourTitle, index === 0 && styles.hourTitleActive]}>{index === 0 ? 'Agora' : hourLabel(hour.time)}</Text>
            <View style={styles.hourIcon}><WeatherIcon code={hour.weatherCode} isDay={hour.isDay} size={34} color={index === 0 ? '#FFFFFF' : '#3775CF'} /></View>
            <Text style={[styles.hourTemp, index === 0 && styles.hourTempActive]}>{rounded(hour.temperature, '°')}</Text>
            <View style={styles.hourRainRow}>
              <Ionicons name="water" color={index === 0 ? '#A4D4FF' : '#348BE4'} size={13} />
              <Text style={[styles.hourRainText, index === 0 && styles.hourRainTextActive]}>{rounded(hour.chanceRain, '%')}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function MetricTile({ icon, label, value, footnote, fill, color }) {
  return (
    <View style={styles.metricTile}>
      <View style={[styles.metricIcon, { backgroundColor: fill }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricFootnote}>{footnote}</Text>
    </View>
  );
}

function Metrics({ data }) {
  const today = data.days[0] || {};
  return (
    <View style={styles.sectionSpace}>
      <SectionHeading title="Detalhes do clima" right={`CEP ${formatCep(data.cep)}`} eyebrow="INDICADORES" />
      <View style={styles.metricsGrid}>
        <MetricTile icon="water-percent" label="Umidade" value={rounded(data.current.humidity, '%')} footnote="Umidade do ar" fill="#E8F1FF" color="#2872DD" />
        <MetricTile icon="weather-windy" label="Vento" value={rounded(data.current.wind, ' km/h')} footnote="Velocidade atual" fill="#E6F8F6" color="#0B9E91" />
        <MetricTile icon="weather-rainy" label="Chance de chuva" value={rounded(data.current.chanceRain, '%')} footnote="Na hora atual" fill="#EBF3FF" color="#4586EA" />
        <MetricTile icon="white-balance-sunny" label="Índice UV" value={rounded(data.current.uv)} footnote="Radiação UV atual" fill="#FFF3E3" color="#DA8D31" />
      </View>
      <View style={styles.sunTimesCard}>
        <View style={styles.sunTimeItem}>
          <MaterialCommunityIcons name="weather-sunset-up" size={27} color="#E9A242" />
          <View>
            <Text style={styles.sunTimeLabel}>Nascer do sol</Text>
            <Text style={styles.sunTimeText}>{timeLabel(today.sunrise)}</Text>
          </View>
        </View>
        <View style={styles.sunTimesDivider} />
        <View style={styles.sunTimeItem}>
          <MaterialCommunityIcons name="weather-sunset-down" size={27} color="#DF885D" />
          <View>
            <Text style={styles.sunTimeLabel}>Pôr do sol</Text>
            <Text style={styles.sunTimeText}>{timeLabel(today.sunset)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function WeekForecast({ data }) {
  const days = data.days;
  return (
    <View style={styles.sectionSpace}>
      <SectionHeading title="Próximos 7 dias" right={`CEP ${formatCep(data.cep)}`} eyebrow="PLANEJE SUA SEMANA" />
      <View style={styles.weekCard}>
        {days.map((day, i) => (
          <View key={day.date} style={[styles.dayRow, i !== days.length - 1 && styles.dayBorder]}>
            <View style={styles.dayNameWrap}>
              <Text style={[styles.dayName, i === 0 && styles.dayNameToday]}>{dayLabel(day.date, i)}</Text>
              <Text style={styles.dayStatus}>{weatherInfo(day.weatherCode, true).short}</Text>
            </View>
            <View style={styles.dayIconWrap}><WeatherIcon code={day.weatherCode} size={29} color="#427BC6" /></View>
            <View style={styles.dayRain}>
              <Ionicons name="water" size={12} color="#4295E8" />
              <Text style={styles.dayRainText}>{rounded(day.chanceRain, '%')}</Text>
            </View>
            <View style={styles.dayTemps}>
              <Text style={styles.dayMax}>{rounded(day.max, '°')}</Text>
              <Text style={styles.dayMin}>{rounded(day.min, '°')}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function TipCard({ data }) {
  return (
    <View style={styles.tipCard}>
      <View style={styles.tipIcon}><Ionicons name="bulb-outline" size={23} color={C.blueDark} /></View>
      <View style={styles.tipContent}>
        <Text style={styles.tipTitle}>Dica para o seu dia · CEP {formatCep(data.cep)}</Text>
        <Text style={styles.tipText}>{weatherMessage(data.current.code, data.current.chanceRain)}</Text>
      </View>
    </View>
  );
}

function Attribution() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerTop}>Previsões são estimativas e podem variar.</Text>
      <Text style={styles.footerText}>Dados climáticos: <Text style={styles.footerLink} onPress={() => Linking.openURL('https://open-meteo.com/')}>Open-Meteo</Text>  ·  CEP: <Text style={styles.footerLink} onPress={() => Linking.openURL('https://brasilapi.com.br/')}>BrasilAPI</Text> e <Text style={styles.footerLink} onPress={() => Linking.openURL('https://docs.awesomeapi.com.br/api-cep')}>AwesomeAPI</Text></Text>
      <Text style={styles.footerBrand}>CLIMACEP  •  FEITO COM EXPO</Text>
    </View>
  );
}

function MainScreen({ requestedCep, requestNonce, onWeatherLoaded, onSaveFavorite, onFloodReport }) {
  const [cep, setCep] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const forecastCepRef = useRef(null);

  const load = useCallback(async (rawCep, refresh = false) => {
    const request = ++requestId.current;
    setError('');
    setSavedMessage('');
    const searchedCep = onlyDigits(rawCep);
    // Ao pesquisar outra região, remova o clima antigo antes de carregar.
    // Assim, uma falha nunca é confundida com uma previsão atualizada.
    const isSameRegion = forecastCepRef.current === searchedCep;
    if (refresh && isSameRegion) {
      setRefreshing(true);
    } else {
      setForecast(null);
      setLoading(true);
    }
    try {
      const result = await getWeatherByCep(rawCep);
      if (request !== requestId.current) return;
      forecastCepRef.current = result.cep;
      setForecast({ ...result, renderId: `${result.cep}-${request}` });
      if (onWeatherLoaded) Promise.resolve(onWeatherLoaded(result)).catch((e) => console.info('Não foi possível registrar a pesquisa:', e.message));
    } catch (err) {
      if (request !== requestId.current) return;
      setForecast(null);
      forecastCepRef.current = null;
      setError(err.message || 'Não foi possível carregar a previsão.');
    } finally {
      if (request === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [onWeatherLoaded]);

  useEffect(() => {
    if (requestedCep && onlyDigits(requestedCep).length === 8) {
      setCep(formatCep(requestedCep));
      load(requestedCep);
    }
  }, [requestedCep, requestNonce, load]);

  const saveCurrent = async () => {
    if (!visibleForecast || !onSaveFavorite) return;
    setSavedMessage('');
    try {
      await onSaveFavorite(visibleForecast);
      setSavedMessage('Região salva nos favoritos.');
    } catch (e) {
      setSavedMessage(e.message || 'Não foi possível salvar esta região.');
    }
  };

  const search = () => {
    if (onlyDigits(cep).length !== 8 || loading || refreshing) return;
    Keyboard.dismiss();
    load(cep);
  };
  const refresh = () => {
    if (loading || refreshing || onlyDigits(cep).length !== 8) return;
    // Atualiza somente a região cujo CEP está no campo.
    load(cep, true);
  };
  const enteredCep = onlyDigits(cep);
  const changedCep = Boolean(forecast && enteredCep !== forecast.cep);
  const visibleForecast = !changedCep ? forecast : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} colors={[C.blue]} />}
      >
        <BrandHeader onRefresh={refresh} disabled={loading || refreshing || enteredCep.length !== 8} />
        <View style={styles.headlineRow}>
          <Text style={styles.headline}>O clima da sua{ '\n' }região, <Text style={styles.headlineHighlight}>num toque.</Text></Text>
          <Text style={styles.headlineSubtitle}>Saiba se vai chover, fazer sol e muito mais.</Text>
        </View>

        <SearchBox cep={cep} onChange={setCep} onSearch={search} busy={loading || refreshing} />
        {changedCep && !loading && !refreshing ? (
          <View style={styles.pendingCepBanner}>
            <Ionicons name="information-circle-outline" size={19} color={C.blue} />
            <Text style={styles.pendingCepText}>CEP alterado. Toque em “Ver previsão do tempo” para consultar a nova região.</Text>
          </View>
        ) : null}
        {error ? <ErrorBanner message={error} onDismiss={() => setError('')} /> : null}

        {loading && !visibleForecast ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.blue} />
            <Text style={styles.loadingHeading}>Consultando o tempo...</Text>
            <Text style={styles.loadingSub}>Buscando informações da sua região.</Text>
          </View>
        ) : null}

        {visibleForecast ? (
          <>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>SUA PREVISÃO</Text>
                <Text style={styles.resultTitle}>Clima da região consultada</Text>
              </View>
              <View style={styles.resultStatus}><View style={styles.resultStatusDot} /><Text style={styles.resultStatusText}>Atualizado</Text></View>
            </View>
            <View key={visibleForecast.renderId}>
              <HeroWeather data={visibleForecast} />
              <ForecastLocation data={visibleForecast} />
              <View style={styles.sourceBanner}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#1967C9" />
                <Text style={styles.sourceBannerText}>
                  Informações por hora, indicadores e 7 dias carregados juntos para o CEP {formatCep(visibleForecast.cep)}.
                </Text>
              </View>
              {onSaveFavorite ? (
                <TouchableOpacity style={styles.saveFavoriteButton} onPress={saveCurrent} accessibilityRole="button">
                  <Ionicons name="bookmark-outline" size={19} color="#FFFFFF" />
                  <Text style={styles.saveFavoriteText}>Salvar região nos favoritos</Text>
                </TouchableOpacity>
              ) : null}
              {savedMessage ? <Text style={styles.saveFavoriteMessage}>{savedMessage}</Text> : null}
              {onFloodReport ? (
                <TouchableOpacity style={styles.reportFloodButton} onPress={() => onFloodReport(visibleForecast)} accessibilityRole="button">
                  <Ionicons name="warning-outline" color="#B75E20" size={20}/>
                  <Text style={styles.reportFloodText}>Ver ou informar alagamento neste CEP</Text>
                  <Ionicons name="arrow-forward" color="#B75E20" size={18}/>
                </TouchableOpacity>
              ) : null}
              <HourlyForecast data={visibleForecast} />
              <Metrics data={visibleForecast} />
              <WeekForecast data={visibleForecast} />
              <TipCard data={visibleForecast} />
            </View>
          </>
        ) : null}
        {!loading && !visibleForecast && !changedCep ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="weather-partly-cloudy" size={50} color={C.blue} />
            <Text style={styles.emptyTitle}>Sua previsão começa por aqui</Text>
            <Text style={styles.emptyText}>Digite um CEP brasileiro e toque em “Ver previsão do tempo”. A previsão será exibida somente se houver coordenadas ligadas ao CEP.</Text>
          </View>
        ) : null}
        <Attribution />
      </ScrollView>
    </SafeAreaView>
  );
}

export default MainScreen;

const styles = StyleSheet.create({
  reportFloodButton: { marginTop: 10, backgroundColor: '#FFF2E5', borderColor: '#F3D6BD', borderWidth: 1, padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  reportFloodText: { flex: 1, color: '#9C4D1A', fontWeight: '800', fontSize: 12.5 },
  saveFavoriteButton: { marginTop: 14, backgroundColor: '#1C67CD', borderRadius: 14, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 9 },
  saveFavoriteText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  saveFavoriteMessage: { marginTop: 7, color: '#225F9E', textAlign: 'center', fontSize: 12 },
  safe: { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 30, maxWidth: 640, width: '100%', alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 13, paddingBottom: 18 },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  brandName: { color: C.ink, fontSize: 24, fontWeight: '900', letterSpacing: -0.9, lineHeight: 27 },
  brandDot: { color: C.blue },
  brandSubtitle: { color: C.inkMuted, fontSize: 11, marginTop: 2, letterSpacing: 0.15 },
  refreshButton: { width: 43, height: 43, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headlineRow: { marginTop: 3, marginBottom: 23 },
  headline: { fontSize: 30, fontWeight: '900', lineHeight: 37, color: C.ink, letterSpacing: -1.25 },
  headlineHighlight: { color: C.blue },
  headlineSubtitle: { fontSize: 13, lineHeight: 20, color: C.inkMuted, marginTop: 5 },
  searchPanel: { backgroundColor: C.white, padding: 17, borderRadius: 23, ...cardShadow, marginBottom: 23 },
  searchTextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  searchHeadline: { color: C.ink, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  searchSub: { color: C.inkMuted, fontSize: 12, marginTop: 4 },
  searchBadge: { width: 37, height: 37, borderRadius: 13, backgroundColor: C.lightBlue, alignItems: 'center', justifyContent: 'center' },
  searchInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderColor: '#E1E9F4', borderWidth: 1.5, backgroundColor: '#F8FAFD', borderRadius: 13, height: 55, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 15, color: C.ink, fontWeight: '600', height: '100%' },
  searchSubmit: { height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 12 },
  searchSubmitText: { color: C.white, fontWeight: '800', fontSize: 14 },
  searchHint: { fontSize: 10, textAlign: 'center', color: '#A0ACBC', marginTop: 11 },
  pendingCepBanner: { flexDirection: 'row', gap: 9, alignItems: 'center', backgroundColor: '#EAF3FF', borderColor: '#C8DFFF', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 19 },
  pendingCepText: { color: '#20558F', fontSize: 12, lineHeight: 18, flex: 1 },
  errorBanner: { flexDirection: 'row', gap: 9, alignItems: 'center', backgroundColor: '#FFF1F1', borderColor: '#FFD4D8', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 19 },
  errorText: { color: '#AA3A43', fontSize: 12, lineHeight: 18, flex: 1 },
  loadingContainer: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  loadingHeading: { marginTop: 10, fontWeight: '800', color: C.ink, fontSize: 16 },
  loadingSub: { color: C.inkMuted, fontSize: 12 },
  resultHeader: { marginTop: 1, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  resultTitle: { color: C.ink, fontWeight: '900', fontSize: 19, letterSpacing: -0.5, marginTop: 4 },
  resultStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E9F7F0', borderRadius: 99, gap: 5, paddingHorizontal: 10, paddingVertical: 6 },
  resultStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#28AE77' },
  resultStatusText: { color: '#268563', fontSize: 10, fontWeight: '700' },
  heroOuter: { borderRadius: 24, overflow: 'hidden', shadowColor: '#0B3E82', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 19, elevation: 7 },
  hero: { borderRadius: 24, paddingHorizontal: 23, paddingTop: 24, paddingBottom: 23, overflow: 'hidden' },
  orbitBig: { position: 'absolute', top: 35, right: -65, width: 250, height: 250, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 140 },
  orbitSmall: { position: 'absolute', top: 69, right: -32, width: 185, height: 185, borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)', borderRadius: 100 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveTag: { flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 50 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#73E7D1' },
  liveText: { color: '#E8F0FF', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  heroUpdated: { color: '#C7D8F2', fontSize: 11, fontWeight: '500' },
  heroLocation: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 29, maxWidth: '100%' },
  heroCity: { color: C.white, fontWeight: '800', fontSize: 20, letterSpacing: -0.5, flexShrink: 1 },
  heroRegion: { color: '#E1ECFF', fontSize: 13, fontWeight: '700', marginTop: 5 },
  heroStreet: { color: '#C7D8F1', fontSize: 11, marginTop: 4, lineHeight: 15 },
  heroDate: { color: '#BED1ED', fontSize: 11, marginTop: 8 },
  heroMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, minHeight: 124 },
  heroTemperatureWrap: { flexDirection: 'row', alignItems: 'flex-start' },
  heroTemperature: { color: C.white, fontWeight: '300', fontSize: 85, lineHeight: 108, letterSpacing: -5 },
  heroDegree: { color: C.white, fontWeight: '500', fontSize: 45, marginTop: 9 },
  heroIconWrap: { marginRight: 1, flexShrink: 1 },
  heroCondition: { color: C.white, fontWeight: '800', fontSize: 18, marginTop: -3, letterSpacing: -0.3 },
  heroFeels: { color: '#C9D9F1', fontSize: 12, marginTop: 6 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 26, marginBottom: 17 },
  heroBottom: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  heroMini: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  heroMiniText: { color: '#EDF4FF', fontSize: 12, fontWeight: '600' },
  locationCard: { marginTop: 14, paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#EFF6FF', borderRadius: 16, borderWidth: 1, borderColor: '#D7E7FA' },
  locationCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  locationCardTitle: { color: '#174F90', fontSize: 13, fontWeight: '800', flex: 1 },
  locationCardSource: { color: '#2B639B', fontSize: 12, fontWeight: '700', marginBottom: 7 },
  locationCardCoordinate: { color: '#315E8F', fontSize: 11, marginTop: 2 },
  locationCardNote: { color: '#567997', fontSize: 11, lineHeight: 17, marginTop: 9 },
  sourceBanner: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 15, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: '#EAF3FF', borderRadius: 12 },
  sourceBannerText: { flex: 1, color: '#2466AB', fontSize: 11, lineHeight: 17, fontWeight: '600' },
  approxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: 4, marginTop: 10 },
  approxText: { color: C.inkMuted, fontSize: 10.5, flex: 1, lineHeight: 15 },
  sectionSpace: { marginTop: 29 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  sectionEyebrow: { fontSize: 10, color: '#748DAE', fontWeight: '800', letterSpacing: 1.5 },
  sectionTitle: { color: C.ink, fontSize: 19, fontWeight: '900', letterSpacing: -0.5, marginTop: 5 },
  sectionRight: { fontSize: 12, color: C.blue, fontWeight: '700' },
  hoursContainer: { paddingRight: 10, paddingBottom: 8, gap: 10 },
  hourCard: { backgroundColor: C.white, borderRadius: 17, borderColor: C.border, borderWidth: 1, alignItems: 'center', paddingVertical: 15, width: 91 },
  hourCardActive: { backgroundColor: '#1967D9', borderColor: '#1967D9' },
  hourTitle: { fontSize: 12, fontWeight: '700', color: C.inkMuted },
  hourTitleActive: { color: '#FFFFFF' },
  hourIcon: { height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 3 },
  hourTemp: { color: C.ink, fontWeight: '900', fontSize: 19 },
  hourTempActive: { color: '#FFFFFF' },
  hourRainRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 7 },
  hourRainText: { color: '#4B87CC', fontSize: 10, fontWeight: '700' },
  hourRainTextActive: { color: '#D5E7FF' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  metricTile: { width: '48.2%', borderRadius: 18, backgroundColor: C.white, padding: 16, borderWidth: 1, borderColor: C.border, minHeight: 170 },
  metricIcon: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  metricLabel: { color: C.inkMuted, fontSize: 11, fontWeight: '700' },
  metricValue: { color: C.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },
  metricFootnote: { color: '#9CA9BA', fontSize: 10, marginTop: 2 },
  sunTimesCard: { marginTop: 12, flexDirection: 'row', backgroundColor: C.white, borderWidth: 1, borderColor: C.border, paddingVertical: 17, borderRadius: 17, alignItems: 'center', justifyContent: 'space-evenly' },
  sunTimeItem: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sunTimeLabel: { color: C.inkMuted, fontSize: 10 },
  sunTimeText: { color: C.ink, fontSize: 17, fontWeight: '900', marginTop: 2 },
  sunTimesDivider: { height: 34, width: 1, backgroundColor: C.border },
  weekCard: { backgroundColor: C.white, borderRadius: 19, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 3 },
  dayRow: { flexDirection: 'row', alignItems: 'center', minHeight: 72, gap: 5 },
  dayBorder: { borderBottomWidth: 1, borderColor: '#F0F3F8' },
  dayNameWrap: { flex: 1.25 },
  dayName: { color: C.ink, fontSize: 13, fontWeight: '800' },
  dayNameToday: { color: C.blue },
  dayStatus: { color: '#9CA8B8', fontSize: 10, marginTop: 4 },
  dayIconWrap: { width: 36, alignItems: 'center' },
  dayRain: { width: 51, flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'center' },
  dayRainText: { fontSize: 11, color: '#4A8FCF', fontWeight: '700' },
  dayTemps: { width: 65, flexDirection: 'row', justifyContent: 'space-between' },
  dayMax: { color: C.ink, fontSize: 13, fontWeight: '900' },
  dayMin: { color: C.inkMuted, fontSize: 13, fontWeight: '600' },
  tipCard: { flexDirection: 'row', gap: 13, backgroundColor: '#E8F2FF', borderColor: '#D9EAFB', borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 24 },
  tipIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: '#D4E8FF', alignItems: 'center', justifyContent: 'center' },
  tipContent: { flex: 1 },
  tipTitle: { color: '#204A85', fontSize: 13, fontWeight: '900' },
  tipText: { color: '#557499', fontSize: 12, lineHeight: 18, marginTop: 4 },
  footer: { alignItems: 'center', paddingTop: 29, gap: 5 },
  footerTop: { color: C.inkMuted, fontSize: 10, textAlign: 'center' },
  footerText: { color: '#9AA9BA', fontSize: 10, textAlign: 'center' },
  footerLink: { color: C.blue, textDecorationLine: 'underline' },
  footerBrand: { color: '#B1BECD', fontWeight: '800', letterSpacing: 1.8, fontSize: 9, marginTop: 12 },
  emptyCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 20, alignItems: 'center', padding: 30, marginTop: 6 },
  emptyTitle: { color: C.ink, fontSize: 15, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  emptyText: { color: C.inkMuted, fontSize: 12, textAlign: 'center', lineHeight: 19, marginTop: 7 },
});
