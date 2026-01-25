import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, Save, Settings, User } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_BASE_URL, auth, GENERATE_TOKEN_URL } from '../../ApiConfig';

export const EditProfileScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [cargo, setCargo] = useState('');
    const [cpf, setCpf] = useState('');
    const [createdAt, setCreatedAt] = useState('');
    const [tipoUser, setTipoUser] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const fetchData = async () => {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Erro', 'Usuário não autenticado.');
            setInitialLoading(false);
            navigation.goBack();
            return;
        }

        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE_URL}/users/${user.uid}.json?auth=${token}`);
            const data = await response.json();

            if (data) {
                setName(data.nome || '');
                setEmail(data.email || user.email);
                setPhone(data.telefone || '');
                setCargo(data.cargo || '');
                setCpf(data.cpf || '');
                setCreatedAt(data.createdAt ? new Date(data.createdAt).toLocaleDateString('pt-BR') : '');
                setTipoUser(data.tipoUser || '');
            }
        } catch (error) {
            console.error('Erro ao buscar dados do perfil:', error);
            Alert.alert('Erro', 'Não foi possível carregar seus dados.');
        } finally {
            setInitialLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Atenção', 'O nome não pode ficar em branco.');
            return;
        }
        setLoading(true);
        try {
            const user = auth.currentUser;
            const token = user ? await user.getIdToken() : '';
            const payload = { nome: name, telefone: phone, updatedAt: new Date().toISOString() };
            await fetch(`${API_BASE_URL}/users/${user.uid}.json?auth=${token}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            Alert.alert('Sucesso', 'Seus dados foram atualizados!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível salvar as alterações.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdvancedSettings = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) return;

            // 1. Obtém o ID Token do usuário logado
            const idToken = await user.getIdToken();

            // 2. Solicita um Custom Token para a Cloud Function
            const response = await fetch(GENERATE_TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Falha ao gerar autenticação (${response.status}): ${errorText}`);
            }

            const { token } = await response.json();

            // 3. Abre a URL passando o token e o email
            await WebBrowser.openBrowserAsync(`https://oassessor.vercel.app/dashboard/profile?token=${token}&email=${user.email}`);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível acessar o painel web.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 20 }}>
                            <ArrowLeft size={20} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.logoText}>
                                <Text style={styles.textGreen}>Meus </Text>
                                <Text style={styles.textWhite}>Dados</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.iconBox}>
                        <User size={28} color="#6EE794" />
                    </View>
                </View>
            </View>

            {initialLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#6EE794" />
                </View>
            ) : (

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Informações Pessoais</Text>

                        <Text style={styles.label}>Nome Completo</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor="#64748b"
                        />
                         <Text style={styles.label}>Telefone</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholderTextColor="#64748b"
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#e2e8f0', color: '#94a3b8' }]}
                            value={email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={false}
                            placeholderTextColor="#64748b"
                        />

                        <Text style={styles.label}>CPF</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#e2e8f0', color: '#94a3b8' }]}
                            value={cpf}
                            editable={false}
                            placeholderTextColor="#64748b"
                        />

                       

                        <Text style={styles.label}>Cargo</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#e2e8f0', color: '#94a3b8' }]}
                            value={cargo}
                            editable={false}
                            placeholderTextColor="#64748b"
                        />

                        <Text style={styles.label}>Tipo de Usuário</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#e2e8f0', color: '#94a3b8' }]}
                            value={tipoUser}
                            editable={false}
                            placeholderTextColor="#64748b"
                        />

                        <Text style={styles.label}>Data de Criação</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#e2e8f0', color: '#94a3b8' }]}
                            value={createdAt}
                            editable={false}
                            placeholderTextColor="#64748b"
                        />


                        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Save size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>Salvar Alterações</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.button, { backgroundColor: '#334155', marginTop: 16 }]} onPress={handleOpenAdvancedSettings}>
                            <Settings size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.buttonText}>Configurações Avançadas</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            )}
        </View>
    );
};

const colors = {
    backgroundDark: '#101422',
    primaryGreen: '#6EE794',
    white: '#FFFFFF',
    inputBackground: '#f1f5f9',
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
        elevation: 8,
        zIndex: 10,
    },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 0 },
    iconBox: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 },
    content: { flex: 1, marginTop: -20, paddingHorizontal: 20 },
    formCard: { borderRadius: 24, padding: 24, marginTop: 30, backgroundColor: 'white', elevation: 4 },
    logoText: { fontSize: 25, fontWeight: 'bold' },
    textGreen: { color: colors.primaryGreen, fontWeight: 'bold' },
    textWhite: { color: colors.white },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark, marginBottom: 16, marginTop: 8 },
    label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
    input: { height: 55, backgroundColor: colors.inputBackground, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 16, color: colors.textDark, borderWidth: 1, borderColor: '#e2e8f0' },
    button: { height: 56, backgroundColor: colors.primaryGreen, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, elevation: 4 },
    buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});