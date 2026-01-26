import { AlignLeft, ArrowLeft, Calendar, CheckCircle, Clock, Save } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
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
import { API_BASE_URL, auth } from '../../ApiConfig';

export const TarefasFormScreen = ({ navigation }) => {
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [data, setData] = useState('');
    const [time, setTime] = useState('');
    const [tipo, setTipo] = useState('general');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        
        setData(`${d}/${m}/${y}`);
        setTime(`${h}:${min}`);
    }, []);

    const handleSave = async () => {
        if (!titulo || !data || !time) {
            Alert.alert('Erro', 'Por favor, preencha o título, data e hora.');
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Erro', 'Usuário não autenticado.');
                return;
            }
            const token = await user.getIdToken();

            // Buscar dados do usuário para compor adminId e creatorName
            const userResp = await fetch(`${API_BASE_URL}/users/${user.uid}.json?auth=${token}`);
            const userData = await userResp.json();

            const creatorName = userData?.nome || 'Usuário';
            // Se o usuário tem adminId (é assessor), usa ele. Se não, usa o próprio UID (é o admin).
            let adminId;
            if (userData?.tipoUser === 'admin') {
                 adminId = user.uid;
            } else {
                 adminId = userData?.adminId;
            }
            

            // Construção do fullDate para ordenação
            const [day, month, year] = data.split('/');
            const [hour, minute] = time.split(':');
            // Nota: Mês em Date começa em 0
            const isoDate = new Date(year, month - 1, day, hour, minute).toISOString();

            const newTask = {
                adminId: adminId,
                createdAt: new Date().toISOString(),
                creatorEmail: user.email,
                creatorId: user.uid,
                creatorName: creatorName,
                data: data,
                descricao: descricao,
                fullDate: isoDate,
                status: "pending",
                time: time,
                tipo: tipo,
                titulo: titulo,
                updatedAt: new Date().toISOString()
            };

            await fetch(`${API_BASE_URL}/tarefas.json?auth=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTask)
            });

            Alert.alert('Sucesso', 'Tarefa criada com sucesso!');
            navigation.goBack();

        } catch (error) {
            console.error('Erro ao salvar tarefa:', error);
            Alert.alert('Erro', 'Não foi possível salvar a tarefa.');
        } finally {
            setLoading(false);
        }
    };

    const types = [
        { id: 'general', label: 'Geral' },
        { id: 'meeting', label: 'Reunião' },
        { id: 'visit', label: 'Visita' },
        { id: 'content', label: 'Mídia' },
        { id: 'event', label: 'Evento' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 20 }}>
                            <ArrowLeft size={20} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.logoText}>
                                <Text style={styles.textGreen}>Nova </Text>
                                <Text style={styles.textWhite}>Tarefa</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.iconBox}>
                        <CheckCircle size={28} color="#6EE794" />
                    </View>
                </View>
            </View>

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
                        <Text style={styles.label}>Título</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Reunião com Lideranças"
                            placeholderTextColor="#94a3b8"
                            value={titulo}
                            onChangeText={setTitulo}
                        />

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Data (DD/MM/AAAA)</Text>
                                <View style={styles.inputIconContainer}>
                                    <Calendar size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                                    <TextInput
                                        style={styles.inputFlex}
                                        placeholder="DD/MM/AAAA"
                                        placeholderTextColor="#94a3b8"
                                        value={data}
                                        onChangeText={setData}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Hora (HH:MM)</Text>
                                <View style={styles.inputIconContainer}>
                                    <Clock size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                                    <TextInput
                                        style={styles.inputFlex}
                                        placeholder="HH:MM"
                                        placeholderTextColor="#94a3b8"
                                        value={time}
                                        onChangeText={setTime}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>

                        <Text style={styles.label}>Tipo de Atividade</Text>
                        <View style={styles.typesContainer}>
                            {types.map((t) => (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[
                                        styles.typeButton,
                                        tipo === t.id && styles.typeButtonActive
                                    ]}
                                    onPress={() => setTipo(t.id)}
                                >
                                    <Text style={[
                                        styles.typeText,
                                        tipo === t.id && styles.typeTextActive
                                    ]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Descrição</Text>
                        <View style={[styles.inputIconContainer, { alignItems: 'flex-start', height: 100, paddingVertical: 12 }]}>
                            <AlignLeft size={20} color="#94a3b8" style={{ marginRight: 8, marginTop: 4 }} />
                            <TextInput
                                style={[styles.inputFlex, { height: '100%', textAlignVertical: 'top' }]}
                                placeholder="Detalhes da tarefa..."
                                placeholderTextColor="#94a3b8"
                                value={descricao}
                                onChangeText={setDescricao}
                                multiline
                            />
                        </View>

                        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Save size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>Salvar Tarefa</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10,
    },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 0 },
    iconBox: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 },
    content: { flex: 1, marginTop: -20, paddingHorizontal: 20 },
    formCard: {
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 30,
        backgroundColor: 'white',
    },
    logoText: { fontSize: 25, fontWeight: 'bold' },
    textGreen: { color: colors.primaryGreen, fontWeight: 'bold' },
    textWhite: { color: colors.white },
    label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8, marginTop: 16 },
    input: {
        height: 55, backgroundColor: colors.inputBackground, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: colors.textDark, borderWidth: 1, borderColor: '#e2e8f0',
    },
    inputIconContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBackground, borderRadius: 12, paddingHorizontal: 16, height: 55, borderWidth: 1, borderColor: '#e2e8f0',
    },
    inputFlex: { flex: 1, fontSize: 16, color: colors.textDark },
    typesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeButton: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
    },
    typeButtonActive: {
        backgroundColor: '#dbeafe', borderColor: '#3b82f6',
    },
    typeText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    typeTextActive: { color: '#2563eb', fontWeight: 'bold' },
    button: {
        height: 56, backgroundColor: colors.primaryGreen, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, shadowColor: colors.primaryGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});