import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WeatherDashboard from './WeatherDashboard';
import { AuthProvider, useAuth } from './src/app/AuthContext';
import { apiRequest } from './src/app/api';
import { colors } from './src/app/ui';
import { LoginScreen, RegisterScreen } from './src/screens/AuthScreens';
import FavoritesScreen from './src/screens/FavoritesScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FloodScreen from './src/screens/FloodScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function WeatherScreen({ route, navigation }) {
  const { token, user } = useAuth();
  const [initialCep, setInitialCep] = useState(null);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(`@climacep:lastCep:${user.id}`)
      .then((cep) => { if (alive && cep) setInitialCep(cep); })
      .catch((e) => console.info('CEP local indisponível:', e.message));
    return () => { alive = false; };
  }, [user.id]);

  const recordHistory = useCallback(async (result) => {
    await AsyncStorage.setItem(`@climacep:lastCep:${user.id}`, result.cep);
    await apiRequest('/api/history', { method: 'POST', token, data: {
      cep: result.cep, neighborhood: result.neighborhood || null,
      city: result.city || null, state: result.state || null,
      temperature: Number.isFinite(result.current?.temperature) ? result.current.temperature : null,
    } });
  }, [token, user.id]);

  const saveFavorite = useCallback((result) => apiRequest('/api/favorites', { method: 'POST', token, data: {
    cep: result.cep, nickname: result.neighborhood || result.city || result.cep,
    neighborhood: result.neighborhood || null, city: result.city || null, state: result.state || null,
  } }), [token]);

  const requestedCep = route.params?.cep || initialCep;
  return <WeatherDashboard requestedCep={requestedCep} requestNonce={route.params?.requestNonce}
    onWeatherLoaded={recordHistory} onSaveFavorite={saveFavorite}
    onFloodReport={(result) => navigation.navigate('Enchentes', { cep: result.cep, requestNonce: Date.now() })}/>;
}
function MainTabs() {
  const icons = { 'Início': 'cloud-outline', 'Enchentes': 'warning-outline', 'Favoritos': 'bookmark-outline', 'Histórico': 'time-outline', 'Perfil': 'person-circle-outline' };
  const selected = { 'Início': 'cloud', 'Enchentes': 'warning', 'Favoritos': 'bookmark', 'Histórico': 'time', 'Perfil': 'person-circle' };
  return <Tabs.Navigator screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: '#7C8CA4',
    tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: colors.border, height: 66, paddingTop: 6, paddingBottom: 7 },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
    tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? selected[route.name] : icons[route.name]} color={color} size={size}/>,
  })}>
    <Tabs.Screen name="Início" component={WeatherScreen}/>
    <Tabs.Screen name="Enchentes" component={FloodScreen}/>
    <Tabs.Screen name="Favoritos" component={FavoritesScreen}/>
    <Tabs.Screen name="Histórico" component={HistoryScreen}/>
    <Tabs.Screen name="Perfil" component={ProfileScreen}/>
  </Tabs.Navigator>;
}
function RootNavigation() {
  const { user, initializing } = useAuth();
  if (initializing) return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
    <ActivityIndicator color={colors.blue} size="large" />
  </View>;
  return <NavigationContainer>
    {user ? <MainTabs/> : <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Login" component={LoginScreen}/>
      <Stack.Screen name="Cadastro" component={RegisterScreen}/>
    </Stack.Navigator>}
  </NavigationContainer>;
}
export default function App() {
  return <SafeAreaProvider><AuthProvider><StatusBar style="dark"/><RootNavigation/></AuthProvider></SafeAreaProvider>;
}
