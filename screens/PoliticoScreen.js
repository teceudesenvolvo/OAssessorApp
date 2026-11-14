// Tela de Político
import { useFocusEffect } from '@react-navigation/native';
import { Bell, Calendar, ChevronRight, Gift, Moon, Plus, Sun, Users } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useThemedStyles } from '../components/use-themed-styles';
import { collection, getDocs, or, query, where } from 'firebase/firestore';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../ApiConfig';
import { addDocument, getCollection, getDocument } from '../services/firestoreData';
import { useAppTheme } from '../contexts/ThemeContext';
import { HomeQuickActions } from '../components/HomeQuickActions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const PoliticoScreen = ({ navigation }) => {
    const styles = useThemedStyles(baseStyles);
  const { colors, mode, toggleTheme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [totalEleitores, setTotalEleitores] = useState(0);
  const [assessoresList, setAssessoresList] = useState([]);
  const [aniversariantesList, setAniversariantesList] = useState([]);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [voterGrowth, setVoterGrowth] = useState(0);
  const [tipoUser, setTipoUser] = useState('');

  const calculateAge = (birthDateString) => {
    if (!birthDateString) return 0;
    const parts = birthDateString.split('/');
    if (parts.length !== 3) return 0;
    const birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const fetchData = async () => {
    let dashboardStep = 'perfil do usuário';
    try {
        const user = auth.currentUser;
        if (!user) return;
        const dataUser = await getDocument('users', user.uid);
        setTipoUser(dataUser?.tipoUser || '');

        // 1. Buscar Eleitores
        dashboardStep = 'lista de eleitores';
        const eleitoresQuery = query(
            collection(db, 'eleitores'),
            or(
                where('creatorId', '==', user.uid),
                where('adminId', '==', user.uid)
            )
        );
        const eleitoresSnapshot = await getDocs(eleitoresQuery);
        const myEleitores = eleitoresSnapshot.docs.map(document => ({
            id: document.id,
            ...document.data(),
        }));
        setTotalEleitores(myEleitores.length);

        // Calcular crescimento (Novos eleitores este mês / Total anterior)
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
            growth = 100;
        }
        setVoterGrowth(growth);

        // 2. Filtrar Aniversariantes
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonthBirthday = today.getMonth() + 1;

        const birthdays = myEleitores.filter(e => {
            if (!e.nascimento) return false;
            const parts = e.nascimento.split('/');
            if (parts.length !== 3) return false;
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            return day === currentDay && month === currentMonthBirthday;
        }).map(e => ({
            id: e.id,
            nome: e.nome,
            cargo: 'Eleitor',
            idade: calculateAge(e.nascimento),
            telefone: e.telefone
        }));
        setAniversariantesList(birthdays);

        // 3. Buscar Assessores
        dashboardStep = 'equipe de assessores';
        const dataAssessores = await getCollection('assessores', [['adminId', user.uid]]);
        let myAssessores = [];

        if (dataAssessores) {
            myAssessores = dataAssessores;
        }
        setAssessoresList(myAssessores);

        // 4. Buscar Tarefas (Atividades Pendentes)
        dashboardStep = 'tarefas';
        const dataTarefas = await getCollection('tarefas', [['creatorId', user.uid]]);
        let countTarefas = 0;
        let overdueTasks = [];
        if (dataTarefas) {
            countTarefas = dataTarefas.filter(
                item => item.status === 'pending'
            ).length;
            
            // Identificar tarefas atrasadas
            const now = new Date();
            overdueTasks = dataTarefas.filter(item => {
                if (item.status !== 'pending' || !item.fullDate) return false;
                return new Date(item.fullDate) < now;
            });
        }
        setPendingTasksCount(countTarefas);

        // 5. Buscar Notificações (Contar não lidas)
        dashboardStep = 'notificações';
        const [personalNotifications, adminNotifications] = await Promise.all([
            getCollection('notificacoes', [['userId', user.uid]]),
            getCollection('notificacoes', [['adminId', user.uid]]),
        ]);
        const notificationsList = Array.from(new Map(
            [...personalNotifications, ...adminNotifications].map(item => [item.id, item])
        ).values());
        let countNotificacoes = 0;
        if (notificationsList.length) {
            const userEmail = user.email;
            countNotificacoes = notificationsList.filter(n => {
                const isPersonal = n.userEmail && n.userEmail !== "" && n.userEmail === userEmail;
                const isGlobal = !n.userEmail || n.userEmail === "";
                return (isPersonal || isGlobal) && !n.read;
            }).length;
        }
        setUnreadNotificationsCount(countNotificacoes);

        // --- GERAÇÃO AUTOMÁTICA DE NOTIFICAÇÕES ---
        const todayStr = new Date().toDateString();

        // 1. Notificar Aniversariantes (se ainda não notificado hoje)
        dashboardStep = 'criação de notificações de aniversário';
        for (const person of birthdays) {
            const alreadyNotified = notificationsList.some(n => 
                n.type === 'birthday' && 
                n.description.includes(person.nome) && 
                new Date(n.createdAt).toDateString() === todayStr
            );

            if (!alreadyNotified) {
                await addDocument('notificacoes', {
                        title: 'Aniversariante do Dia',
                        description: `Hoje é o aniversário de ${person.nome}. Envie uma mensagem!`,
                        type: 'birthday',
                        read: false,
                        createdAt: new Date().toISOString(),
                        userId: user.uid,
                        creatorId: user.uid,
                        adminId: user.uid,
                        userEmail: user.email
                });
            }
        }

        // 2. Notificar Tarefas Atrasadas (se ainda não notificado hoje)
        dashboardStep = 'criação de notificações de tarefas';
        for (const task of overdueTasks) {
            const alreadyNotified = notificationsList.some(n => 
                n.type === 'alert' && 
                n.description.includes(task.titulo) && 
                new Date(n.createdAt).toDateString() === todayStr
            );

            if (!alreadyNotified) {
                await addDocument('notificacoes', {
                        title: 'Tarefa Atrasada',
                        description: `A tarefa "${task.titulo}" está pendente e atrasada.`,
                        type: 'alert', // Usando um tipo de alerta (pode mapear ícone depois)
                        read: false,
                        createdAt: new Date().toISOString(),
                        userId: user.uid,
                        creatorId: user.uid,
                        adminId: user.uid,
                        userEmail: user.email
                });
            }
        }

    } catch (error) {
        console.error(`Erro ao carregar dashboard em "${dashboardStep}":`, error?.code, error?.message, error);
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
            <Text style={styles.welcomeText}>Olá, Candidato</Text>
            <Text style={[styles.dashboardTitle, { color: colors.headerText }]}>Visão geral</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} style={styles.bellButton} onPress={toggleTheme}>
              {mode === 'dark' ? <Sun size={21} color={colors.headerText} /> : <Moon size={21} color={colors.headerText} />}
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notificações" style={styles.bellButton} onPress={() => navigation.navigate('Notificacoes')}>
              <Bell size={21} color={colors.headerText} />
              {unreadNotificationsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.surface }]}>
          <View>
            <Text style={[styles.cardLabel, { color: colors.muted }]}>Total de Eleitores</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{totalEleitores}</Text>
            <Text style={[styles.cardTrend, { color: colors.primary }]}>
              {voterGrowth > 0 ? '+' : ''}{voterGrowth.toFixed(1)}% este mês
            </Text>
          </View>
          <View style={[styles.iconBoxBlue, { backgroundColor: colors.primarySoft }]}>
            <Users size={32} color={colors.primary} />
          </View>



        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, tipoUser !== 'admin' && { width: '100%' }]}>
            <Calendar color="#f59e0b" size={28} style={{ marginBottom: 8 }} />
            <Text style={[styles.statLabel, { color: colors.muted }]}>Atividades Pendentes</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{pendingTasksCount}</Text>
          </View>
          {tipoUser === 'admin' && (
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Users color="#3b82f6" size={28} style={{ marginBottom: 8 }} />
              <Text style={[styles.statLabel, { color: colors.muted }]}>Minha Equipe</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{assessoresList.length} de 10</Text>
            </View>
          )}
        </View>

      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 124 }}>
        {/* Content */}
        <View style={styles.contentContainer}>

          <HomeQuickActions navigation={navigation} onAddVoter={() => navigation.navigate('Novo')} />


          {tipoUser === 'admin' && (
            <View>
              <View style={[styles.sectionHeader, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.sectionTitle, { color: colors.text, backgroundColor: 'transparent' }]}>Minha Equipe</Text>
                <TouchableOpacity style={[styles.addButtonSmall, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AssessorForm')}>
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
                {assessoresList.length === 0 ? (
                    <Text style={{ color: colors.muted, fontStyle: 'italic' }}>Nenhum assessor cadastrado.</Text>
                ) : (
                  assessoresList.map((item) => (
                    <TouchableOpacity key={item.id} style={[styles.assessorCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('AssessorEdit', { assessor: item })}>
                      <View style={styles.avatarContainer}><Text style={styles.avatarText}>{item.nome.charAt(0)}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.assessorName, { color: colors.text }]}>{item.nome}</Text>
                        <Text style={[styles.assessorRole, { color: colors.muted }]}>{item.cargo}</Text>
                        <Text style={[styles.assessorRole, { color: colors.muted }]}>{item.qtdCadastros || 0} Eleitores</Text>
                      </View>
                      <ChevronRight size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          <View>
            <View style={[styles.sectionHeader, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, backgroundColor: 'transparent' }]}>Aniversariantes do Dia</Text>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -24 }}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 10 }}
            >
              {aniversariantesList.length === 0 ? (
                    <Text style={{ color: colors.muted, fontStyle: 'italic' }}>Nenhum aniversariante hoje.</Text>
              ) : (
                aniversariantesList.map((item) => (
                  <TouchableOpacity key={item.id} style={[styles.assessorCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Aniversariante', { person: item })}>
                    <View style={[styles.avatarContainer, { backgroundColor: '#dbeafe' }]}>
                      <Text style={[styles.avatarText, { color: '#2563eb' }]}>{item.nome.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.assessorName, { color: colors.text }]}>{item.nome}</Text>
                      <Text style={[styles.assessorRole, { color: colors.muted }]}>{item.cargo}</Text>
                      <Text style={[styles.assessorRole, { color: colors.muted }]}>Completa {item.idade} anos</Text>
                    </View>
                    <Gift size={20} color="#cbd5e1" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

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
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#101422',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
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
  contentContainer: { paddingHorizontal: 24, paddingTop: 20, gap: 18 },
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
  sectionTitle: { color: '#0f172a', fontWeight: 'bold', fontSize: 20, backgroundColor: 'transparent' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: 'transparent' },
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
});

const styles = baseStyles;
