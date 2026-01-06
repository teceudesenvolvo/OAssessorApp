import { Calendar, CheckCircle, Circle, Clock, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const TarefasScreen = () => {
  const [filter, setFilter] = useState('pending'); // 'pending' | 'done'

  const [tasks, setTasks] = useState([
    { id: '1', title: 'Reunião com Lideranças', time: '14:00', date: 'Hoje', status: 'pending', type: 'meeting' },
    { id: '2', title: 'Visita ao Bairro Centro', time: '16:30', date: 'Hoje', status: 'pending', type: 'visit' },
    { id: '3', title: 'Alinhamento Marketing', time: '09:00', date: 'Ontem', status: 'done', type: 'meeting' },
    { id: '4', title: 'Gravação de Conteúdo', time: '10:00', date: 'Amanhã', status: 'pending', type: 'content' },
    { id: '5', title: 'Jantar Beneficente', time: '20:00', date: 'Amanhã', status: 'pending', type: 'event' },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'pending' ? 'done' : 'pending' } : t));
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
              <Text style={styles.textWhite}>Tarefas</Text>
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
            {filteredTasks.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Nenhuma tarefa encontrada.</Text>
                </View>
            )}
          {filteredTasks.map((item) => (
            <TouchableOpacity key={item.id} style={styles.taskCard} onPress={() => toggleTask(item.id)}>
              <View style={styles.taskIcon}>
                {item.status === 'done' ? (
                  <CheckCircle size={24} color="#10b981" />
                ) : (
                  <Circle size={24} color="#cbd5e1" />
                )}
              </View>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, item.status === 'done' && styles.taskTitleDone]}>{item.title}</Text>
                <View style={styles.metaRow}>
                    <Clock size={14} color="#94a3b8" style={{ marginRight: 4 }} />
                    <Text style={styles.taskMeta}>{item.date} • {item.time}</Text>
                </View>
              </View>
              <View style={[styles.typeTag, { backgroundColor: item.type === 'meeting' ? '#dbeafe' : '#f1f5f9' }]}>
                  <Text style={[styles.typeText, { color: item.type === 'meeting' ? '#2563eb' : '#64748b' }]}>
                      {getTypeLabel(item.type)}
                  </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* FAB Add Button */}
      <TouchableOpacity style={styles.fab}>
        <Plus size={24} color="white" />
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
  
  fab: { position: 'absolute', bottom: 110, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryGreen, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primaryGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});