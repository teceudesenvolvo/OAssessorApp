import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import { signOut } from 'firebase/auth';
import { ChevronRight, HelpCircle, LogOut, Radio, Shield, UserCog } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { API_BASE_URL, auth } from '../ApiConfig';

export const PerfilScreen = ({ navigation }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE_URL}/users/${user.uid}.json?auth=${token}`);
            const data = await response.json();
            setUserData(data);
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        fetchData();
    }, []));

    const handleLogout = () => {
        Alert.alert(
            'Sair da Conta',
            'Tem certeza que deseja sair?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Sair', 
                    style: 'destructive', 
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível sair da conta.');
                        }
                    } 
                }
            ]
        );
    };

    const handleShareLink = () => {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Erro', 'Você precisa estar logado para gerar o link.');
            return;
        }

        const link = `https://oassessor.vercel.app?email=${encodeURIComponent(user.email)}&userId=${user.uid}`;

        Alert.alert(
            'Link de Acesso Web',
            `Use o link abaixo para acessar o painel web:\n\n${link}`,
            [
                {
                    text: 'Copiar Link',
                    onPress: async () => {
                        await Clipboard.setStringAsync(link);
                        Alert.alert('Copiado!', 'O link foi copiado para a área de transferência.');
                    }
                },
                {
                    text: 'Compartilhar',
                    onPress: async () => {
                        try {
                            await Share.share({ message: `Acesse o painel de O Assessor através deste link: ${link}` });
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível compartilhar o link.');
                        }
                    }
                },
                { text: 'Fechar', style: 'cancel' }
            ]
        );
    };

    const handleTestNotification = () => {
        Alert.alert(
            'Agendado',
            'A notificação chegará em 5 segundos.\n\nSaia do app agora (vá para a Home) para vê-la chegar em segundo plano.',
            [{
                text: 'OK',
                onPress: () => {
                    setTimeout(async () => {
                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: "Teste O Assessor 🔔",
                                body: "Esta notificação confirma que o sistema está funcionando!",
                                sound: 'default',
                            },
                            trigger: null,
                        });
                    }, 5000);
                }
            }]
        );
    };

    const handleRealPushTest = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const token = await user.getIdToken();
            await fetch(`${API_BASE_URL}/notificacoes.json?auth=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Teste de Push Remoto 🚀',
                    description: 'Se você recebeu isso, a Cloud Function está funcionando!',
                    type: 'system',
                    read: false,
                    createdAt: new Date().toISOString(),
                    userId: user.uid,
                    userEmail: user.email
                })
            });
            Alert.alert('Enviado', 'Notificação criada no banco de dados.\n\nAguarde alguns segundos pelo Push Notification.');
        } catch (error) {
            Alert.alert('Erro', 'Falha ao criar notificação de teste.');
        }
    };

    const menuItems = [
        { icon: UserCog, label: 'Editar Dados', route: 'EditProfile' },
        { icon: Shield, label: 'Segurança', route: 'Security' },
        { icon: HelpCircle, label: 'Ajuda e Suporte', route: 'Help' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}></Text>
            </View>

            <View style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                {loading ? (
                    <ActivityIndicator size="large" color="#6EE794" style={{ marginTop: 40 }} />
                ) : (
                    <>
                        <View style={styles.profileCard}>
                            <View style={styles.avatarContainer}>
                                <Text style={styles.avatarText}>
                                    {userData?.nome ? userData.nome.charAt(0).toUpperCase() : 'U'}
                                </Text>
                            </View>
                            <Text style={styles.userName}>{userData?.nome || 'Usuário'}</Text>
                            <Text style={styles.userRole}>{userData?.cargo || 'Cargo não definido'}</Text>
                            <Text style={styles.userEmail}>{auth.currentUser?.email}</Text>
                        </View>

                        <View style={styles.menuContainer}>
                            {menuItems.map((item, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={styles.menuItem} 
                                    onPress={() => navigation.navigate(item.route)}
                                >
                                    <View style={styles.menuItemLeft}>
                                        <View style={styles.iconContainer}>
                                            <item.icon size={20} color="#64748b" />
                                        </View>
                                        <Text style={styles.menuItemText}>{item.label}</Text>
                                    </View>
                                    <ChevronRight size={20} color="#cbd5e1" />
                                </TouchableOpacity>
                            ))}

                           

                            

                            <TouchableOpacity 
                                style={styles.menuItem} 
                                onPress={handleRealPushTest}
                            >
                                <View style={styles.menuItemLeft}>
                                    <View style={styles.iconContainer}>
                                        <Radio size={20} color="#64748b" />
                                    </View>
                                    <Text style={styles.menuItemText}>Testar Push (Via Banco)</Text>
                                </View>
                                <ChevronRight size={20} color="#cbd5e1" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                                <LogOut size={20} color="#ef4444" />
                                <Text style={styles.logoutText}>Sair da Conta</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
};

const colors = {
    backgroundDark: '#101422',
    primaryGreen: '#6EE794',
    textDark: '#0f172a',
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { backgroundColor: colors.backgroundDark, paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    content: { flex: 1, paddingHorizontal: 20, marginTop: -20 },
    profileCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4, marginBottom: 20 },
    avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#2563eb' },
    userName: { fontSize: 20, fontWeight: 'bold', color: colors.textDark, marginBottom: 4 },
    userRole: { fontSize: 14, color: colors.primaryGreen, fontWeight: '600', marginBottom: 4 },
    userEmail: { fontSize: 14, color: '#64748b' },
    menuContainer: { backgroundColor: 'white', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    menuItemText: { fontSize: 16, color: '#334155', fontWeight: '500' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 8 },
    logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
});