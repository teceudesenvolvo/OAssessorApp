import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { ArrowLeft, Lock, Shield } from 'lucide-react-native';
import { useState } from 'react';
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
import { auth } from '../../ApiConfig';

export const SecurityScreen = ({ navigation }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const reauthenticate = async (currentPassword) => {
        const user = auth.currentUser;
        const cred = EmailAuthProvider.credential(user.email, currentPassword);
        return reauthenticateWithCredential(user, cred);
    };

    const handleSave = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Erro', 'A nova senha e a confirmação não coincidem.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            await reauthenticate(currentPassword);
            await updatePassword(auth.currentUser, newPassword);
            Alert.alert('Sucesso', 'Sua senha foi atualizada com sucesso!');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            let msg = 'Não foi possível atualizar a senha.';
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = 'Senha atual incorreta.';
            if (error.code === 'auth/weak-password') msg = 'A nova senha é muito fraca.';
            if (error.code === 'auth/requires-recent-login') msg = 'Por favor, faça login novamente antes de alterar a senha.';
            Alert.alert('Erro', msg);
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
                                <Text style={styles.textGreen}>Segu</Text>
                                <Text style={styles.textWhite}>rança</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.iconBox}>
                        <Shield size={28} color="#6EE794" />
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
                        <Text style={styles.sectionTitle}>Alterar Senha</Text>

                        <Text style={styles.label}>Senha Atual</Text>
                        <TextInput
                            style={styles.input}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                            placeholderTextColor="#64748b"
                        />

                        <Text style={styles.label}>Nova Senha</Text>
                        <TextInput
                            style={styles.input}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            placeholderTextColor="#64748b"
                        />

                        <Text style={styles.label}>Confirmar Nova Senha</Text>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            placeholderTextColor="#64748b"
                        />

                        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Lock size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>Atualizar Senha</Text>
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