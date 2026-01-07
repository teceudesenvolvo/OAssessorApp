// Tela de Político
import { AlertTriangle, BarChart3, Bell, ChevronRight, Gift, Plus, Users } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const PoliticoScreen = ({ navigation }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { width, height } = Dimensions.get('window');

  const assessores = [
    { id: '1', nome: 'Roberto Almeida', cargo: 'Coord. Geral', qtdCadastros: 34 },
    { id: '2', nome: 'Ana Paula Souza', cargo: 'Comunicação', qtdCadastros: 120 },
    { id: '3', nome: 'Carlos Mendes', cargo: 'Líder Comunitário', qtdCadastros: 80 },
  ];

  const aniversariantes = [
    { id: '1', nome: 'Julia Silva', cargo: 'Eleitora', idade: 28 },
    { id: '2', nome: 'Marcos Oliveira', cargo: 'Cabo Eleitoral', idade: 45 },
    { id: '3', nome: 'Fernanda Costa', cargo: 'Voluntária', idade: 22 },
  ];

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
            <Text style={styles.welcomeText}>Bem-vindo, Candidato</Text>
            <Text style={styles.logoText}>
              <Text style={styles.textGreen}>Iníci</Text>
              <Text style={styles.textWhite}>o</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.bellButton} onPress={() => navigation.navigate('Notificacoes')}>
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


          <View style={{ marginTop: 70 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Minha Equipe</Text>
              <TouchableOpacity style={styles.addButtonSmall} onPress={() => navigation.navigate('AssessorForm')}>
                <Plus size={16} color="#fff" />
                <Text style={styles.addButtonText}>Novo</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -24 }}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 10 }}
            >
              {assessores.map((item) => (
                <TouchableOpacity key={item.id} style={styles.assessorCard}>
                  <View style={styles.avatarContainer}><Text style={styles.avatarText}>{item.nome.charAt(0)}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.assessorName}>{item.nome}</Text>
                    <Text style={styles.assessorRole}>{item.cargo}</Text>
                    <Text style={styles.assessorRole}>{item.qtdCadastros} Eleitores</Text>
                  </View>
                  <ChevronRight size={20} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Aniversariantes do Dia</Text>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -24 }}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 10 }}
            >
              {aniversariantes.map((item) => (
                <TouchableOpacity key={item.id} style={styles.assessorCard}>
                  <View style={[styles.avatarContainer, { backgroundColor: '#dbeafe' }]}>
                    <Text style={[styles.avatarText, { color: '#2563eb' }]}>{item.nome.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.assessorName}>{item.nome}</Text>
                    <Text style={styles.assessorRole}>{item.cargo}</Text>
                    <Text style={styles.assessorRole}>Completa {item.idade} anos</Text>
                  </View>
                  <Gift size={20} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  sectionTitle: { color: '#0f172a', fontWeight: 'bold', fontSize: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addButtonSmall: { flexDirection: 'row', backgroundColor: '#101422', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignItems: 'center', gap: 4 },
  addButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  assessorCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#64748b', fontWeight: 'bold', fontSize: 16 },
  assessorName: { color: '#0f172a', fontWeight: 'bold', fontSize: 14 },
  assessorRole: { color: '#64748b', fontSize: 12 },
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