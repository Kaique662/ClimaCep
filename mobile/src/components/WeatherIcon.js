import React from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { weatherInfo } from '../utils/weather';

export default function WeatherIcon({ code, isDay = true, size = 32, color }) {
  const info = weatherInfo(code, isDay);
  return <MaterialCommunityIcons name={info.icon} size={size} color={color || info.accent} />;
}
