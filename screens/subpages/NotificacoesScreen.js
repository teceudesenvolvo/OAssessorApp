import { ArrowLeft, Bell, Check, Clock, MessageSquare } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const NotificacoesScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Nova tarefa atribuída', description: 'Você tem uma nova reunião agendada para amanhã.', time: 'Há 2 horas', read: false, type: 'task' },
    { id: '2', title: 'Meta atingida!', description: 'Parabéns! A meta de cadastros da semana foi alcançada.', time: 'Há 5 horas', read: false, type: 'success' },
    { id: '3', title: 'Lembrete de Aniversário', description: 'Hoje é aniversário do eleitor Marcos Oliveira.', time: 'Há 1 dia', read: true, type: 'birthday' },
    { id: '4', title: 'Atualização do Sistema', description: 'O aplicativo passará por manutenção no domingo.', time: 'Há 2 dias', read: true, type: 'system' },
  ]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'task': return <Clock size={24} color="#3b82f6" />;
      case 'success': return <Check size={24} color="#10b981" />;
      case 'birthday': return <MessageSquare size={24} color="#f59e0b" />;
      default: return <Bell size={24} color="#64748b" />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 20 }}>
                <ArrowLeft size={20} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.logoText}>
                    <Text style={styles.textGreen}>Minhas </Text>
                    <Text style={styles.textWhite}>Notificações</Text>
                </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.iconBox}>
            <Bell size={28} color="#6EE794" />
          </View>
        </View>
        
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Marcar todas como lidas</Text>
            <Check size={16} color="#6EE794" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {notifications.map((item) => (
            <TouchableOpacity 
                key={item.id} 
                style={[styles.notificationCard, !item.read && styles.unreadCard]}
                onPress={() => markAsRead(item.id)}
            >
                <View style={[styles.iconContainer, !item.read && styles.unreadIconContainer]}>
                    {getIcon(item.type)}
                </View>
                <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, !item.read && styles.unreadTitle]}>{item.title}</Text>
                        {!item.read && <View style={styles.dot} />}
                    </View>
                    <Text style={styles.description}>{item.description}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                </View>
            </TouchableOpacity>
        ))}
        
        {notifications.length === 0 && (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Nenhuma notificação no momento.</Text>
            </View>
        )}
      </ScrollView>
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
    paddingTop: 60,
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
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 0 },
  iconBox: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 },
  logoText: { fontSize: 25, fontWeight: 'bold' },
  textGreen: { color: colors.primaryGreen, fontWeight: 'bold' },
  textWhite: { color: colors.white },
  markAllButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  markAllText: { color: '#6EE794', fontSize: 12, fontWeight: '600', marginRight: 6 },
  
  content: { flex: 1, padding: 20 },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  unreadCard: { borderLeftColor: colors.primaryGreen, backgroundColor: '#f0fdf4' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  unreadIconContainer: { backgroundColor: 'white' },
  textContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  unreadTitle: { color: colors.textDark, fontWeight: 'bold' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryGreen },
  description: { fontSize: 14, color: '#64748b', marginBottom: 8, lineHeight: 20 },
  time: { fontSize: 12, color: '#94a3b8' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', fontSize: 16 },
});