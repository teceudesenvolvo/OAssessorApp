import { useFocusEffect } from '@react-navigation/native';
import { Calendar, CheckCircle, Circle, Clock, Plus } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL, auth } from '../ApiConfig';

export const TarefasScreen = ({ navigation }) => {
  const [filter, setFilter] = useState('pending'); // 'pending' | 'done'
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      // 1. Buscar dados do usuário para saber o tipo (Assessor ou Político)
      const userResp = await fetch(`${API_BASE_URL}/users/${user.uid}.json?auth=${token}`);
      const userData = await userResp.json();
      const isAssessor = userData?.tipoUser === 'assessor';

      // 2. Buscar todas as tarefas
      const tasksResp = await fetch(`${API_BASE_URL}/tarefas.json?auth=${token}`);
      const tasksData = await tasksResp.json();

      if (tasksData) {
        const loadedTasks = Object.keys(tasksData).map(key => ({
          id: key,
          ...tasksData[key]
        })).filter(task => {
          if (isAssessor) {
            // Assessor vê apenas o que criou (ou poderia ver o que foi atribuído a ele)
            return task.creatorId === user.uid;
          } else {
            // Político (Admin) vê tudo que está vinculado ao seu ID de admin
            return task.adminId === user.uid;
          }
        });
        // Ordenar por data (opcional, aqui invertendo para mostrar mais recentes primeiro se o ID for cronológico)
        setTasks(loadedTasks.reverse());
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar as tarefas.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchData();
  }, []));

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'pending' ? 'done' : 'pending';
    
    // Atualização Otimista (atualiza a UI antes da resposta)
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : '';
      await fetch(`${API_BASE_URL}/tarefas/${id}.json?auth=${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível atualizar a tarefa.');
      // Reverte em caso de erro
      setTasks(tasks.map(t => t.id === id ? { ...t, status: task.status } : t));
    }
  };

  const filteredTasks = tasks.filter(t => t.status === filter);

  const getTypeLabel = (type) => {
      switch(type) {
          case 'meeting': return 'Reunião';
          case 'visit': return 'Visita';
          case 'content': return 'Mídia';
          case 'event': return 'Evento';
          default: return 'Geral';
      }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerSubtitle}>Organização</Text>
            <Text style={styles.headerTitle}>
              <Text style={styles.textGreen}>Minhas </Text>
              <Text style={styles.textWhite}>Atividades</Text>
            </Text>
          </View>
          <View style={styles.iconBox}>
            <Calendar size={28} color="#6EE794" />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, filter === 'pending' && styles.activeTab]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.tabText, filter === 'pending' && styles.activeTabText]}>Pendentes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'done' && styles.activeTab]}
            onPress={() => setFilter('done')}
          >
            <Text style={[styles.tabText, filter === 'done' && styles.activeTabText]}>Concluídas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.taskList}>
          {loading ? (
            <ActivityIndicator size="large" color="#6EE794" style={{ marginTop: 40 }} />
          ) : filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhuma tarefa encontrada.</Text>
            </View>
          ) : (
            filteredTasks.map((item) => (
              <TouchableOpacity key={item.id} style={styles.taskCard} onPress={() => navigation.navigate('TarefasEdit', { task: item })}>
                <TouchableOpacity 
                  style={styles.taskIcon} 
                  onPress={() => toggleTask(item.id)}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  {item.status === 'done' ? (
                    <CheckCircle size={24} color="#10b981" />
                  ) : (
                    <Circle size={24} color="#cbd5e1" />
                  )}
                </TouchableOpacity>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, item.status === 'done' && styles.taskTitleDone]}>{item.titulo}</Text>
                  <View style={styles.metaRow}>
                      <Clock size={14} color="#94a3b8" style={{ marginRight: 4 }} />
                      {/* Usando item.data e item.tipo conforme salvo no formulário */}
                      <Text style={styles.taskMeta}>{item.data} • {item.time}</Text>
                  </View>
                </View>
                <View style={[styles.typeTag, { backgroundColor: item.tipo === 'meeting' ? '#dbeafe' : '#f1f5f9' }]}>
                    <Text style={[styles.typeText, { color: item.tipo === 'meeting' ? '#2563eb' : '#64748b' }]}>
                        {getTypeLabel(item.tipo)}
                    </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('TarefasForm')}>
        <View pointerEvents="none">
            <Plus size={24} color="white" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const colors = {
  backgroundDark: '#101422',
  primaryGreen: '#6EE794',
  white: '#FFFFFF',
  textDark: '#0f172a',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: colors.backgroundDark,
    paddingTop: 85,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerSubtitle: { color: '#94a3b8', fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  headerTitle: { fontSize: 25, fontWeight: 'bold', marginTop: 0 },
  textWhite: { color: colors.white },
  textGreen: { color: colors.primaryGreen },
  iconBox: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabText: { color: '#94a3b8', fontWeight: '600' },
  activeTabText: { color: 'white', fontWeight: 'bold' },

  content: { flex: 1, paddingHorizontal: 20 },
  taskList: { gap: 12 },
  taskCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  taskIcon: { marginRight: 12 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, marginBottom: 4 },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  taskMeta: { fontSize: 12, color: '#94a3b8' },
  typeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', fontSize: 16 },
  
  fab: { position: 'absolute', bottom: 110, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryGreen, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primaryGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, zIndex: 999 },
});