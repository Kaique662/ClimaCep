import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export const colors = {
  bg: '#F5F7FC', white: '#FFFFFF', blue: '#1464CF', darkBlue: '#11437E',
  ink: '#142744', sub: '#6A7D98', border: '#E2EAF4', light: '#EAF3FF', error: '#B33346',
};
export function Field({ label, icon, ...inputProps }) {
  return <View style={ui.fieldGroup}>
    <Text style={ui.label}>{label}</Text>
    <View style={ui.fieldRow}>
      {icon ? <Ionicons name={icon} size={19} color={colors.sub} /> : null}
      <TextInput style={ui.field} placeholderTextColor="#9CA9BB" autoCapitalize="none" {...inputProps} />
    </View>
  </View>;
}
export function PrimaryButton({ title, onPress, loading, icon, disabled, secondary }) {
  return <TouchableOpacity accessibilityRole="button" disabled={disabled || loading}
      activeOpacity={0.82} onPress={onPress} style={[ui.button, secondary && ui.buttonSecondary, (disabled || loading) && { opacity: 0.55 }]}>
    {loading ? <ActivityIndicator color={secondary ? colors.blue : '#FFFFFF'} /> : <>
      {icon ? <Ionicons name={icon} color={secondary ? colors.blue : '#FFFFFF'} size={19} /> : null}
      <Text style={[ui.buttonText, secondary && { color: colors.blue }]}>{title}</Text>
    </>}
  </TouchableOpacity>;
}
export function Message({ text, success }) {
  if (!text) return null;
  return <View style={[ui.message, success && { backgroundColor: '#E9F8F0', borderColor: '#BEEAD4' }]}>
    <Ionicons name={success ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={19} color={success ? '#16835D' : colors.error} />
    <Text style={[ui.messageText, success && { color: '#16835D' }]}>{text}</Text>
  </View>;
}
export function ScreenTitle({ eyebrow, title, description }) {
  return <View style={ui.titleBlock}>
    <Text style={ui.eyebrow}>{eyebrow}</Text>
    <Text style={ui.title}>{title}</Text>
    {description ? <Text style={ui.description}>{description}</Text> : null}
  </View>;
}
export function KeyboardAwareScrollView({ children, ...props }) {
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  </KeyboardAvoidingView>;
}
export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  container: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40 },
  titleBlock: { marginBottom: 23 },
  eyebrow: { color: colors.blue, fontWeight: '900', fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -1 },
  description: { color: colors.sub, fontSize: 13, lineHeight: 20, marginTop: 7 },
  card: { backgroundColor: colors.white, borderRadius: 21, padding: 18, marginBottom: 13, borderWidth: 1, borderColor: colors.border },
  fieldGroup: { marginBottom: 13 }, label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 8 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFE', borderRadius: 13, borderWidth: 1, borderColor: '#DCE7F5', paddingHorizontal: 13, gap: 8 },
  field: { flex: 1, minHeight: 50, fontSize: 14, color: colors.ink },
  button: { backgroundColor: colors.blue, minHeight: 51, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, marginTop: 6 },
  buttonSecondary: { backgroundColor: colors.light, borderWidth: 1, borderColor: '#C8DFFF' },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  message: { backgroundColor: '#FFF0F1', borderColor: '#FFC7CE', borderWidth: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 12, padding: 12, marginVertical: 10 },
  messageText: { flex: 1, color: colors.error, fontSize: 12, lineHeight: 17 },
  itemTitle: { fontSize: 15, color: colors.ink, fontWeight: '800' },
  itemSub: { fontSize: 12, color: colors.sub, lineHeight: 18, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  spacer: { flex: 1 },
  link: { color: colors.blue, fontWeight: '800' },
});
