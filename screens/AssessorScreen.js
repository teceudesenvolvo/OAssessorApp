// Tela de Político
import { AlertTriangle, BarChart3, Bell, Users } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const AssessorScreen = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    // Calcula a escala inicial para cobrir a tela (diagonal total)
    const maxRadius = Math.hypot(width, height);
    const startScale = maxRadius / 50;

    scaleAnim.setValue(startScale);

    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.politicoHeader}>
        <View style={styles.headerTopRow}>
          <View style={styles.welcomeView}>
            <Text style={styles.welcomeText}>Bem-vindo, Assessor</Text>
            <Text style={styles.logoText}>
              <Text style={styles.textWhite}>Iníci</Text>
              <Text style={styles.textGreen}>o</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.bellButton}>
            <Bell size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          <View>
            <Text style={styles.cardLabel}>Total de Eleitores</Text>
            <Text style={styles.cardValue}>12.450</Text>
            <Text style={styles.cardTrend}>
              +12.5% este mês
            </Text>
          </View>
          <View style={styles.iconBoxBlue}>
            <Users size={32} color="#101422" />
          </View>



        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <BarChart3 color="#10b981" size={28} style={{ marginBottom: 8 }} />
            <Text style={styles.statLabel}>Engajamento</Text>
            <Text style={styles.statValue}>78.4%</Text>
          </View>
          <View style={styles.statCard}>
            <AlertTriangle color="#f43f5e" size={28} style={{ marginBottom: 8 }} />
            <Text style={styles.statLabel}>Ocorrências</Text>
            <Text style={styles.statValue}>23</Text>
          </View>
        </View>

      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Content */}
        <View style={styles.contentContainer}>


          <View style={{ marginTop: 70, }}>
            <Text style={styles.sectionTitle}>Intensidade por Região</Text>
            <View style={styles.mapContainer}>
              <View style={styles.mapCircle1} />
              <View style={styles.mapCircle2} />
              <View style={styles.mapLabel}>
                <Text style={styles.mapLabelText}>VISUALIZAÇÃO GIS</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Círculo de Transição (Reveal) */}
      <Animated.View
        style={[
          styles.transitionCircle,
          { transform: [{ scale: scaleAnim }] }
        ]}
        pointerEvents="none"
      />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  politicoHeader: {
    backgroundColor: '#101422',
    paddingTop: 24,
    paddingBottom: 100,
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
    marginBottom: 24,
    marginTop: 60,
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
  contentContainer: { paddingHorizontal: 24, marginTop: -24, gap: 16 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: -29,
    left: 24,
    right: 24,
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
    width: '48%',
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
  transitionCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    marginTop: -50,
    marginLeft: -50,
    borderRadius: 50,
    backgroundColor: '#6EE794',
    zIndex: 9999,
    elevation: 100,
  },
});