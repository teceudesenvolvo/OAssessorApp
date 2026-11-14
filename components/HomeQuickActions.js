import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarDays, MapPinned, Plus, Vote, UsersRound, Sparkles } from 'lucide-react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { Fonts } from '../constants/theme';

const actions = [
  { label: 'Eleitores', detail: 'Ver cadastros', tab: 'Novo', Icon: UsersRound },
  { label: 'Mapa', detail: 'Explorar regiões', tab: 'Mapa', Icon: MapPinned },
  { label: 'Apuração', detail: 'Resultados eleitorais', route: 'Apuracao', Icon: Vote },
  { label: 'Estratégia', detail: 'Análise política e territorial', route: 'EstrategiaPolitica', Icon: Sparkles },
  { label: 'Agenda', detail: 'Tarefas e eventos', route: 'Agenda', Icon: CalendarDays },
];

export function HomeQuickActions({ navigation, onAddVoter }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Acesso rápido</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>O que você precisa fazer hoje</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cadastrar eleitor" onPress={onAddVoter} style={[styles.addButton, { backgroundColor: colors.primarySoft }]}>
          <Plus size={18} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {actions.map(({ label, detail, route, Icon }) => (
          <TouchableOpacity key={route || label} accessibilityRole="button" onPress={() => navigation.navigate(route || 'Novo')} activeOpacity={0.78} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}><Icon size={20} color={colors.primary} strokeWidth={2} /></View>
            <View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.text }]}>{label}</Text><Text style={[styles.detail, { color: colors.muted }]}>{detail}</Text></View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: Fonts.family, fontSize: 20, fontWeight: '700', letterSpacing: -0.25 },
  subtitle: { fontFamily: Fonts.family, marginTop: 3, fontSize: 13, lineHeight: 18 },
  addButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '48%', minHeight: 94, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  cardTitle: { fontFamily: Fonts.family, fontSize: 14, fontWeight: '700' },
  detail: { fontFamily: Fonts.family, fontSize: 11, lineHeight: 15, marginTop: 3 },
});
