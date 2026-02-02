import { ArrowLeft, Save, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
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

// Funções de Máscara (reutilizando lógica simples)
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

export const AssessorFormScreen = ({ navigation }) => {
    const [nome, setNome] = useState('');
    const [cargo, setCargo] = useState('');
    const [cpf, setCpf] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [loading, setLoading] = useState(false);

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

            // Alert.alert('Enviado', 'O convite foi enviado por email com sucesso.'); // Removido para centralizar o feedback no final do cadastro
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

    const handleSave = async () => {
        if (!nome || !email) {
            Alert.alert('Atenção', 'Por favor, preencha os campos obrigatórios (Nome e Email).');
            return;
        }

        setLoading(true);
        // ID do usuário logado (Candidato) que está criando o assessor
        const creatorId = auth.currentUser?.uid;
        const adminId = creatorId; // O usuário logado é o admin

        const assessorData = {
            nome,
            cargo,
            cpf,
            email,
            telefone,
            tipoUser: "assessor",
            creatorId,
            adminId,
            createdAt: new Date().toISOString(),
            status: "Convidado",
        };

        try {
            const user = auth.currentUser;
            const token = user ? await user.getIdToken() : '';

            const response = await fetch(`${API_BASE_URL}/assessores.json?auth=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(assessorData),
            });

            if (!response.ok) throw new Error('Erro ao salvar');

            const data = await response.json();

            // Envia o convite por email
            await sendInviteEmail(nome, email);

            Alert.alert('Sucesso', 'Assessor cadastrado e convite enviado!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível cadastrar o assessor. Verifique sua conexão.');
            console.error(error);
        } finally {
            setLoading(false);
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
                                <Text style={styles.textGreen}>Novo</Text>
                                <Text style={styles.textWhite}> Assessor</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.iconBox}>
                        <UserPlus size={28} color="#6EE794" />
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
                        <Text style={styles.sectionTitle}>Dados do Membro</Text>

                        <Text style={styles.label}>Nome Completo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Roberto Almeida"
                            placeholderTextColor="#64748b"
                            value={nome}
                            onChangeText={setNome}
                        />

                        <Text style={styles.label}>Cargo / Função</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Coord. Geral"
                            placeholderTextColor="#64748b"
                            value={cargo}
                            onChangeText={setCargo}
                        />

                        <Text style={styles.label}>CPF</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="000.000.000-00"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                            maxLength={14}
                            value={cpf}
                            onChangeText={(text) => setCpf(maskCPF(text))}
                        />

                        <Text style={styles.label}>Telefone / WhatsApp</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: (11) 99999-9999"
                            placeholderTextColor="#64748b"
                            keyboardType="phone-pad"
                            maxLength={15}
                            value={telefone}
                            onChangeText={(text) => setTelefone(maskPhone(text))}
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: roberto@equipe.com"
                            placeholderTextColor="#64748b"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Save size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>Cadastrar</Text>
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
    input: {
        height: 55, backgroundColor: colors.inputBackground, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 16, color: colors.textDark, borderWidth: 1, borderColor: '#e2e8f0',
    },
    button: {
        height: 56, backgroundColor: colors.primaryGreen, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: colors.primaryGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});