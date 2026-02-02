import { ArrowLeft, Save, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_BASE_URL, auth, CLOUD_FUNCTION_URL } from '../../ApiConfig';

// Funções de Máscara
const maskCPF = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value) => {
    let v = value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d)(\d{4})$/, '$1-$2');
    return v;
};

export const AssessorEditScreen = ({ navigation, route }) => {
    const { assessor } = route.params;
    const [loading, setLoading] = useState(false);

    const [nome, setNome] = useState(assessor.nome || '');
    const [cargo, setCargo] = useState(assessor.cargo || '');
    const [cpf, setCpf] = useState(assessor.cpf || '');
    const [email, setEmail] = useState(assessor.email || '');
    const [telefone, setTelefone] = useState(assessor.telefone || '');

    const isConvidado = assessor.status === 'Convidado';

    const sendInviteEmail = async (name, emailAddress) => {
        try {
            const response = await fetch(CLOUD_FUNCTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailAddress,
                    nome: name
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Falha no envio (${response.status}): ${errorText}`);
            }
        } catch (error) {
            console.log('Erro ao enviar email via Cloud Function:', error);
            Alert.alert(
                'Erro no Envio',
                `Houve uma falha ao tentar enviar o email automaticamente.\n\nErro: ${error.message}\n\nDeseja abrir o app de email manualmente?`,
                [
                    { text: 'Não', style: 'cancel' },
                    { 
                        text: 'Sim', 
                        onPress: () => {
                            const subject = "Convite para O Assessor";
                            const body = `Olá ${name},\n\nVocê foi convidado para fazer parte da equipe no aplicativo O Assessor.\n\nPara concluir seu cadastro, clique no link abaixo:\n\nhttps://oassessor-app.com/cadastro?email=${emailAddress}\n\nAtenciosamente,\nEquipe O Assessor`;
                            const url = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                            Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o aplicativo de email.'));
                        }
                    }
                ]
            );
        }
    };

    const handleUpdate = async () => {
        if (!nome || !email) {
            Alert.alert('Atenção', 'Por favor, preencha os campos obrigatórios (Nome e Email).');
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            const token = user ? await user.getIdToken() : '';

            const payload = {
                nome,
                cargo,
                cpf,
                email,
                telefone,
                updatedAt: new Date().toISOString()
            };

            // Atualiza na coleção de assessores
            await fetch(`${API_BASE_URL}/assessores/${assessor.id}.json?auth=${token}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Atualiza na coleção de users (se o ID for o mesmo)
            await fetch(`${API_BASE_URL}/users/${assessor.id}.json?auth=${token}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (isConvidado && email !== assessor.email) {
                await sendInviteEmail(nome, email);
                Alert.alert('Sucesso', 'Dados atualizados e novo convite enviado!');
            } else {
                Alert.alert('Sucesso', 'Dados do assessor atualizados!');
            }
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível atualizar o assessor.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Excluir Assessor',
            'Tem certeza que deseja remover este membro da equipe? O acesso dele ao aplicativo será revogado.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const user = auth.currentUser;
                            const token = user ? await user.getIdToken() : '';

                            await fetch(`${API_BASE_URL}/assessores/${assessor.id}.json?auth=${token}`, { method: 'DELETE' });
                            await fetch(`${API_BASE_URL}/users/${assessor.id}.json?auth=${token}`, { method: 'DELETE' });
                            navigation.goBack();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Erro', 'Não foi possível excluir o assessor.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 20 }}>
                            <ArrowLeft size={20} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.logoText}>
                                <Text style={styles.textGreen}>Editar</Text>
                                <Text style={styles.textWhite}> Assessor</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={handleDelete}>
                        <Trash2 size={24} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Dados do Membro</Text>

                        <Text style={styles.label}>Nome Completo</Text>
                        <TextInput style={styles.input} placeholder="Ex: Roberto Almeida" placeholderTextColor="#64748b" value={nome} onChangeText={setNome} />

                        <Text style={styles.label}>Cargo / Função</Text>
                        <TextInput style={styles.input} placeholder="Ex: Coord. Geral" placeholderTextColor="#64748b" value={cargo} onChangeText={setCargo} />

                        <Text style={styles.label}>CPF</Text>
                        <TextInput style={[styles.input, { backgroundColor: '#e2e8f0', color: '#94a3b8' }]} placeholder="000.000.000-00" placeholderTextColor="#64748b" keyboardType="numeric" maxLength={14} value={cpf} editable={false} />

                        <Text style={styles.label}>Telefone / WhatsApp</Text>
                        <TextInput style={[styles.input, { backgroundColor: '#e2e8f0', color: '#94a3b8' }]} placeholder="Ex: (11) 99999-9999" placeholderTextColor="#64748b" keyboardType="phone-pad" maxLength={15} value={telefone} editable={false} />

                        <Text style={styles.label}>Email</Text>
                        <TextInput style={[styles.input, !isConvidado && { backgroundColor: '#e2e8f0', color: '#94a3b8' }]} placeholder="Ex: roberto@equipe.com" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" value={email} editable={isConvidado} onChangeText={setEmail} />

                        <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Save size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>Salvar Alterações</Text>
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
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark, marginBottom: 16, marginTop: 8 },
    label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
    input: { height: 55, backgroundColor: colors.inputBackground, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 16, color: colors.textDark, borderWidth: 1, borderColor: '#e2e8f0' },
    button: { height: 56, backgroundColor: colors.primaryGreen, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: colors.primaryGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});