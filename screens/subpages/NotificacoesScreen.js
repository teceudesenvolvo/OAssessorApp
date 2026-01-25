import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Bell, Check, Clock, MessageSquare } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL, auth } from '../../ApiConfig';

export const NotificacoesScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/notificacoes.json?auth=${token}`);
      const data = await response.json();

      if (data) {
        const userEmail = user.email;
        const loadedNotifications = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(n => {
            // Filtra se userEmail não for vazio e for igual ao do usuário logado
            // OU se userEmail for vazio (global)
            const isPersonal = n.userEmail && n.userEmail !== "" && n.userEmail === userEmail;
            const isGlobal = !n.userEmail || n.userEmail === "";
            return isPersonal || isGlobal;
          })
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); // Ordena por data (mais recente primeiro)

        setNotifications(loadedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar as notificações.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchNotifications();
  }, []));

  const markAsRead = async (id) => {
    // Atualização otimista
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : '';
      await fetch(`${API_BASE_URL}/notificacoes/${id}.json?auth=${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      });
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    // Atualização otimista
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // Atualiza todas no backend (uma por uma, pois o Firebase RTDB REST API não suporta batch update simples em paths diferentes sem estruturar um objeto grande)
    notifications.forEach(n => {
      if (!n.read) markAsRead(n.id);
    });
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
        {loading ? (
          <ActivityIndicator size="large" color="#6EE794" style={{ marginTop: 40 }} />
        ) : (
          notifications.map((item) => (
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
                      <Text style={styles.time}>{item.time || 'Agora'}</Text>
                  </View>
              </TouchableOpacity>
          ))
        )}
        
        {!loading && notifications.length === 0 && (
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
  markAllButton: { display: 'none', Direction: 'row', alignItems: 'center', alignSelf: 'center', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
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