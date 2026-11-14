// Tela de Político
import { useFocusEffect } from '@react-navigation/native';
import { AlertTriangle, BarChart3, Bell, Moon, Sun, Users } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useThemedStyles } from '../components/use-themed-styles';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../ApiConfig';
import { getCollection } from '../services/firestoreData';
import { useAppTheme } from '../contexts/ThemeContext';
import { HomeQuickActions } from '../components/HomeQuickActions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const AssessorScreen = ({ navigation }) => {
    const styles = useThemedStyles(baseStyles);
  const { colors, mode, toggleTheme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [totalEleitores, setTotalEleitores] = useState(0);
  const [voterGrowth, setVoterGrowth] = useState(0);
  const [engagement, setEngagement] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    let dashboardStep = 'lista de eleitores';
    try {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }
        
        // 1. Fetch voters created by the assessor
        const eleitoresQuery = query(
            collection(db, 'eleitores'),
            where('creatorId', '==', user.uid)
        );
        const eleitoresSnapshot = await getDocs(eleitoresQuery);
        const myEleitores = eleitoresSnapshot.docs.map(document => document.data());
        setTotalEleitores(myEleitores.length);

        // Calculate growth
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const currentMonthCount = myEleitores.filter(e => {
            if (!e.createdAt) return false;
            const d = new Date(e.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const previousTotal = myEleitores.length - currentMonthCount;
        let growth = 0;
        if (previousTotal > 0) {
            growth = (currentMonthCount / previousTotal) * 100;
        } else if (myEleitores.length > 0) {
            growth = 100; // All voters are new this month
        }
        setVoterGrowth(growth);

        // 2. Calculate Engagement (e.g., percentage of 'Apoiador')
        if (myEleitores.length > 0) {
            const apoiadores = myEleitores.filter(e => e.status === 'Apoiador').length;
            setEngagement((apoiadores / myEleitores.length) * 100);
        } else {
            setEngagement(0);
        }

        // 3. Fetch overdue tasks for the assessor
        dashboardStep = 'tarefas';
        const tarefasData = await getCollection('tarefas', [['creatorId', user.uid]]);
        let overdueCount = 0;
        if (tarefasData) {
            const now = new Date();
            overdueCount = tarefasData.filter(
                task => task.status === 'pending' && task.fullDate && new Date(task.fullDate) < now
            ).length;
        }
        setOverdueTasks(overdueCount);

    } catch (error) {
        console.error(`Erro ao carregar dashboard do assessor em "${dashboardStep}":`, error?.code, error?.message, error);
        Alert.alert('Erro', 'Não foi possível carregar os dados do dashboard.');
    } finally {
        setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchData();
  }, []));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.politicoHeader, { backgroundColor: colors.header, paddingTop: Math.max(insets.top, 12) + 12 }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.welcomeView}>
            <Text style={styles.welcomeText}>Olá, Assessor</Text>
            <Text style={[styles.dashboardTitle, { color: colors.headerText }]}>Visão geral</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} style={styles.bellButton} onPress={toggleTheme}>
              {mode === 'dark' ? <Sun size={21} color={colors.headerText} /> : <Moon size={21} color={colors.headerText} />}
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notificações" style={styles.bellButton} onPress={() => navigation.navigate('Notificacoes')}>
              <Bell size={21} color={colors.headerText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.surface }]}>
          <View>
            <Text style={[styles.cardLabel, { color: colors.muted }]}>Total de Eleitores</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{loading ? '...' : totalEleitores}</Text>
            <Text style={[styles.cardTrend, { color: colors.primary }]}>
              {loading ? '' : `${voterGrowth >= 0 ? '+' : ''}${voterGrowth.toFixed(1)}% este mês`}
            </Text>
          </View>
          <View style={[styles.iconBoxBlue, { backgroundColor: colors.primarySoft }]}>
            <Users size={32} color={colors.primary} />
          </View>



        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <BarChart3 color="#10b981" size={28} style={{ marginBottom: 8 }} />
            <Text style={[styles.statLabel, { color: colors.muted }]}>Engajamento (Apoiadores)</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{loading ? '...' : `${engagement.toFixed(1)}%`}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AlertTriangle color="#f43f5e" size={28} style={{ marginBottom: 8 }} />
            <Text style={[styles.statLabel, { color: colors.muted }]}>Tarefas Atrasadas</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{loading ? '...' : overdueTasks}</Text>
          </View>
        </View>

      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 20, paddingBottom: 124 }}>
          {/* Content */}
          <View style={styles.contentContainer}>
            <HomeQuickActions navigation={navigation} onAddVoter={() => navigation.navigate('Novo')} />
            <View style={{ marginTop: 0 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Intensidade por Região</Text>
              <View style={[styles.mapContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <View style={styles.mapCircle1} />
                <View style={styles.mapCircle2} />
                <View style={[styles.mapLabel, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.mapLabelText, { color: colors.muted }]}>VISUALIZAÇÃO GIS</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

    </View>
  );
};

// Cores extraídas da imagem
const colors = {
  backgroundDark: '#101422', // Azul bem escuro
  primaryGreen: '#6EE794',   // Verde claro vibrante
  white: '#FFFFFF',
  inputBackground: '#D9D9D9', // Cinza claro
  textDark: '#000000',
};

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  politicoHeader: {
    backgroundColor: '#101422',
    paddingBottom: 18,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    marginTop: 0,
  },
  welcomeView: {
    flex: 1,
    marginTop: 0,
  },
  welcomeText: { color: '#bfdbfe', fontSize: 14, fontWeight: '500' },
  dashboardTitle: { color: 'white', fontSize: 30, fontWeight: '800' },
  bellButton: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 9999 },
  mainCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 36, fontWeight: '900', color: '#0f172a', marginTop: 4 },
  cardTrend: { color: '#10b981', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  iconBoxBlue: { backgroundColor: '#dbeafe', padding: 16, borderRadius: 16 },
  contentContainer: { paddingHorizontal: 24, gap: 18 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  textGreen: {
    color: colors.primaryGreen,
    fontWeight: 'bold',
  },
  textWhite: {
    color: colors.white,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  sectionTitle: { color: '#0f172a', fontWeight: 'bold', fontSize: 20, marginBottom: 12 },
  mapContainer: {
    backgroundColor: '#e2e8f0',
    height: 256,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  mapCircle1: { position: 'absolute', top: 40, left: 80, width: 128, height: 128, backgroundColor: '#3b82f6', borderRadius: 9999, opacity: 0.3 },
  mapCircle2: { position: 'absolute', bottom: 40, right: 40, width: 160, height: 160, backgroundColor: '#10b981', borderRadius: 9999, opacity: 0.3 },
  mapLabel: { backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999 },
  mapLabelText: { color: '#64748b', fontWeight: 'bold', fontSize: 12 },
});

const styles = baseStyles;
