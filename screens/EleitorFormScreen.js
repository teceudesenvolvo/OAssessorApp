import { ArrowLeft, ArrowRight, Save, UserPlus } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Funções de Máscara
const maskCPF = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const maskDate = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{4})\d+?$/, '$1');
};

const maskPhone = (value) => {
    let v = value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d)(\d{4})$/, '$1-$2');
    return v;
};

const maskCEP = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
};

const maskTitulo = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{4})(\d)/, '$1 $2')
        .replace(/(\d{4})(\d)/, '$1 $2')
        .replace(/(\d{4})\d+?$/, '$1');
};

const maskZonaSecao = (value) => {
    let v = value.replace(/\D/g, '');
    if (v.length > 7) v = v.slice(0, 7);
    if (v.length > 3) {
        return v.replace(/^(\d{3})(\d)/, '$1 / $2');
    }
    return v;
};

export const EleitorFormScreen = ({ onBack, onSave }) => {
    const [step, setStep] = useState(1);

    // Etapa 1: Dados Pessoais
    const [nome, setNome] = useState('');
    const [cpf, setCpf] = useState('');
    const [nascimento, setNascimento] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');

    // Etapa 2: Endereço e Dados Eleitorais
    const [cep, setCep] = useState('');
    const [endereco, setEndereco] = useState('');
    const [numero, setNumero] = useState('');
    const [bairro, setBairro] = useState('');
    const [titulo, setTitulo] = useState('');
    const [zonaSecao, setZonaSecao] = useState('');

    const handleCepChange = async (text) => {
        const maskedCep = maskCEP(text);
        setCep(maskedCep);

        const cleanCep = maskedCep.replace(/\D/g, '');
        if (cleanCep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();
                
                if (!data.erro) {
                    setEndereco(data.logradouro || '');
                    setBairro(data.bairro || '');
                }
            } catch (error) {
                console.log('Erro ao buscar CEP:', error);
            }
        }
    };

    const handleSaveInternal = () => {
        // Aqui você pode processar os dados antes de salvar
        if (onSave) onSave();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View>
                        <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <ArrowLeft size={16} color="#94a3b8" style={{ marginRight: 4 }} />
                            <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>Voltar</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerSubtitle}>Etapa {step} de 2</Text>
                        <Text style={styles.logoText}>
                            <Text style={styles.textWhite}>Novo</Text>
                            <Text style={styles.textGreen}> Eleitor</Text>
                        </Text>
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
                        {step === 1 ? (
                            <>
                                <Text style={styles.sectionTitle}>Dados Pessoais</Text>

                                <Text style={styles.label}>Nome Completo</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: João da Silva"
                                    placeholderTextColor="#64748b"
                                    value={nome}
                                    onChangeText={setNome}
                                />

                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
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
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={styles.label}>Nascimento</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="DD/MM/AAAA"
                                            placeholderTextColor="#64748b"
                                            keyboardType="numeric"
                                            maxLength={10}
                                            value={nascimento}
                                            onChangeText={(text) => setNascimento(maskDate(text))}
                                        />
                                    </View>
                                </View>

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
                                    placeholder="Ex: joao@email.com"
                                    placeholderTextColor="#64748b"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />

                                <TouchableOpacity style={styles.button} onPress={() => setStep(2)}>
                                    <Text style={styles.buttonText}>Próximo</Text>
                                    <ArrowRight size={20} color="white" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.sectionTitle}>Endereço e Título</Text>

                                <View style={styles.row}>
                                    <View style={{ flex: 0.4, marginRight: 8 }}>
                                        <Text style={styles.label}>CEP</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="00000-000"
                                            placeholderTextColor="#64748b"
                                            keyboardType="numeric"
                                            maxLength={9}
                                            value={cep}
                                            onChangeText={handleCepChange}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={styles.label}>Bairro</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Centro"
                                            placeholderTextColor="#64748b"
                                            value={bairro}
                                            onChangeText={setBairro}
                                        />
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={styles.label}>Logradouro</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Rua das Flores"
                                            placeholderTextColor="#64748b"
                                            value={endereco}
                                            onChangeText={setEndereco}
                                        />
                                    </View>
                                    <View style={{ flex: 0.3, marginLeft: 8 }}>
                                        <Text style={styles.label}>Nº</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="123"
                                            placeholderTextColor="#64748b"
                                            value={numero}
                                            onChangeText={setNumero}
                                        />
                                    </View>
                                </View>

                                <Text style={styles.sectionTitle}>Dados Eleitorais</Text>

                                <Text style={styles.label}>Título de Eleitor (Opcional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0000 0000 0000"
                                    placeholderTextColor="#64748b"
                                    keyboardType="numeric"
                                    maxLength={14}
                                    value={titulo}
                                    onChangeText={(text) => setTitulo(maskTitulo(text))}
                                />

                                <Text style={styles.label}>Zona / Seção</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: 054 / 0123"
                                    placeholderTextColor="#64748b"
                                    keyboardType="numeric"
                                    maxLength={10}
                                    value={zonaSecao}
                                    onChangeText={(text) => setZonaSecao(maskZonaSecao(text))}
                                />

                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                                        <ArrowLeft size={20} color="#64748b" />
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity style={[styles.button, { flex: 1, marginTop: 0, marginLeft: 12 }]} onPress={handleSaveInternal}>
                                        <Save size={20} color="white" style={{ marginRight: 8 }} />
                                        <Text style={styles.buttonText}>Salvar</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
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
    headerSubtitle: { color: '#94a3b8', fontSize: 14, fontWeight: '600', letterSpacing: 1 },
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
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    textGreen: {
        color: colors.primaryGreen,
        fontWeight: 'bold',
    },
    textWhite: {
        color: colors.white,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark, marginBottom: 16, marginTop: 8 },
    label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
    input: {
        height: 55, backgroundColor: colors.inputBackground, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 16, color: colors.textDark, borderWidth: 1, borderColor: '#e2e8f0',
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    button: {
        height: 56, backgroundColor: colors.primaryGreen, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: colors.primaryGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
    buttonRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
    backButton: {
        height: 56, width: 56, backgroundColor: '#f1f5f9', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0'
    },
});