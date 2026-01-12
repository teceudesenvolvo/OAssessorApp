import { ChevronRight, Edit3, HelpCircle, LogOut, Shield, User } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const PerfilScreen = ({ navigation }) => {
  // Dados fictícios do usuário
  const user = {
    name: 'Candidato Exemplo',
    email: 'candidato@exemplo.com',
    role: 'Político',
    initials: 'CE'
  };

  const menuItems = [
    { id: '1', icon: User, label: 'Meus Dados', description: 'Gerenciar informações pessoais', route: 'EditProfile' },
    { id: '3', icon: Shield, label: 'Segurança', description: 'Senha e autenticação', route: 'Security' },
    { id: '4', icon: HelpCircle, label: 'Ajuda e Suporte', description: 'Fale conosco', route: 'Help' },
  ];

  const handleLogout = () => {
    // Reseta a navegação e volta para o Login
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerSubtitle}>Configurações</Text>
            <Text style={styles.headerTitle}>
              <Text style={styles.textGreen}>Meu </Text>
              <Text style={styles.textWhite}>Perfil</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Edit3 size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Profile Card (Sobreposto) */}
        <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{user.initials}</Text>
            </View>
            <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{user.role}</Text>
                </View>
            </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 70 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
            {menuItems.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.menuItem}
                  onPress={() => item.route && navigation.navigate(item.route)}
                >
                    <View style={styles.menuIconBox}>
                        <item.icon size={24} color="#64748b" />
                    </View>
                    <View style={styles.menuContent}>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        <Text style={styles.menuDescription}>{item.description}</Text>
                    </View>
                    <ChevronRight size={20} color="#cbd5e1" />
                </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleLogout}>
                <View style={[styles.menuIconBox, styles.logoutIconBox]}>
                    <LogOut size={24} color="#ef4444" />
                </View>
                <View style={styles.menuContent}>
                    <Text style={[styles.menuLabel, styles.logoutText]}>Sair do Aplicativo</Text>
                    <Text style={styles.menuDescription}>Desconectar sua conta</Text>
                </View>
            </TouchableOpacity>
        </View>
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
    paddingBottom: 80, // Espaço extra para o card sobreposto
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
    position: 'relative',
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 30 },
  headerSubtitle: { color: '#94a3b8', fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  headerTitle: { fontSize: 25, fontWeight: 'bold', marginTop: 4 },
  textWhite: { color: colors.white },
  textGreen: { color: colors.primaryGreen },
  editButton: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 },
  
  profileCard: {
    position: 'absolute',
    bottom: -50, // Faz o card "flutuar" entre o header e o conteúdo
    left: 24,
    right: 24,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 3, borderColor: '#f8fafc' },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: colors.backgroundDark },
  profileInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: 'bold', color: colors.textDark },
  userEmail: { fontSize: 14, color: '#64748b', marginBottom: 6 },
  roleBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  roleText: { color: '#166534', fontSize: 12, fontWeight: 'bold' },

  content: { flex: 1, marginTop: -20 }, // Margem negativa para compensar o header
  menuContainer: { paddingHorizontal: 24, gap: 16, paddingTop: 16 },
  menuItem: { backgroundColor: 'white', padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  menuIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, marginBottom: 2 },
  menuDescription: { fontSize: 12, color: '#94a3b8' },
  
  logoutButton: { marginTop: 16, borderWidth: 1, borderColor: '#fee2e2' },
  logoutIconBox: { backgroundColor: '#fee2e2' },
  logoutText: { color: '#ef4444' },
});