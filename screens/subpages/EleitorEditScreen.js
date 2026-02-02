import { ArrowLeft, ArrowRight, ChevronDown, Save, UserCog } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { API_BASE_URL, auth } from '../../ApiConfig';

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

export const EleitorEditScreen = ({ navigation, route }) => {
    const { eleitor } = route.params;
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Inicializa os estados com os dados do eleitor recebido
    const [nome, setNome] = useState(eleitor.nome || '');
    const [cpf, setCpf] = useState(eleitor.cpf || '');
    const [nascimento, setNascimento] = useState(eleitor.nascimento || '');
    const [email, setEmail] = useState(eleitor.email || '');
    const [telefone, setTelefone] = useState(eleitor.telefone || '');
    const [sexo, setSexo] = useState(eleitor.sexo || '');

    const [cep, setCep] = useState(eleitor.cep || '');
    const [endereco, setEndereco] = useState(eleitor.endereco || '');
    const [numero, setNumero] = useState(eleitor.numero || '');
    const [bairro, setBairro] = useState(eleitor.bairro || '');
    const [cidade, setCidade] = useState(eleitor.cidade || '');
    const [estado, setEstado] = useState(eleitor.estado || '');
    const [titulo, setTitulo] = useState(eleitor.titulo || '');
    const [zona, setZona] = useState(eleitor.zona || (eleitor.zonaSecao ? eleitor.zonaSecao.split(' / ')[0] : ''));
    const [secao, setSecao] = useState(eleitor.secao || (eleitor.zonaSecao ? eleitor.zonaSecao.split(' / ')[1] : ''));
    const [localVotacao, setLocalVotacao] = useState(eleitor.localVotacao || '');

    const [locaisList, setLocaisList] = useState([]);
    const [filteredLocais, setFilteredLocais] = useState([]);
    const [showSexoPicker, setShowSexoPicker] = useState(false);
    const [showLocalPicker, setShowLocalPicker] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE_URL}/localvotacao.json`)
            .then(res => res.json())
            .then(data => {
                const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
                setLocaisList(list);
            })
            .catch(err => console.log('Erro ao buscar locais:', err));
    }, []);

    useEffect(() => {
        if (zona && locaisList.length > 0) {
            const filtered = locaisList.filter(l => String(l.zona) === String(zona));
            setFilteredLocais(filtered);
        }
    }, [zona, locaisList]);

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
                    setCidade(data.localidade || '');
                    setEstado(data.uf || '');
                }
            } catch (error) {
                console.log('Erro ao buscar CEP:', error);
            }
        }
    };

    const handleUpdate = async () => {
        if (!nome || !cpf) {
            Alert.alert('Atenção', 'Por favor, preencha os campos obrigatórios (Nome e CPF).');
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            const token = user ? await user.getIdToken() : '';
            const creatorEmail = user?.email || '';

            const payload = {
                nome,
                cpf,
                nascimento,
                email,
                telefone,
                sexo,
                cep,
                endereco,
                numero,
                bairro,
                cidade,
                estado,
                lat: eleitor.lat || '',
                lng: eleitor.lng || '',
                titulo,
                zona,
                secao,
                zonaSecao: `${zona} / ${secao}`,
                localVotacao,
                updatedAt: new Date().toISOString(),
                creatorEmail: creatorEmail // Atualiza com o email do usuário logado conforme solicitado
            };

            // Usa PATCH para atualizar apenas os campos enviados, mantendo creatorId e createdAt originais
            const response = await fetch(`${API_BASE_URL}/eleitores/${eleitor.id}.json?auth=${token}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Falha ao atualizar');

            Alert.alert('Sucesso', 'Dados do eleitor atualizados com sucesso!');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível atualizar o eleitor. Verifique sua conexão.');
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
                                <Text style={styles.textGreen}>Editar</Text>
                                <Text style={styles.textWhite}> Eleitor</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.iconBox}>
                        <UserCog size={28} color="#6EE794" />
                    </View>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.formCard}>
                        {step === 1 ? (
                            <>
                                <Text style={styles.sectionTitle}>Dados Pessoais</Text>
                                <Text style={styles.label}>Nome Completo</Text>
                                <TextInput style={styles.input} placeholder="Ex: João da Silva" placeholderTextColor="#64748b" value={nome} onChangeText={setNome} />

                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={styles.label}>CPF</Text>
                                        <TextInput style={styles.input} placeholder="000.000.000-00" placeholderTextColor="#64748b" keyboardType="numeric" maxLength={14} value={cpf} onChangeText={(text) => setCpf(maskCPF(text))} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={styles.label}>Nascimento</Text>
                                        <TextInput style={styles.input} placeholder="DD/MM/AAAA" placeholderTextColor="#64748b" keyboardType="numeric" maxLength={10} value={nascimento} onChangeText={(text) => setNascimento(maskDate(text))} />
                                    </View>
                                </View>

                                <Text style={styles.label}>Telefone / WhatsApp</Text>
                                <TextInput style={styles.input} placeholder="Ex: (11) 99999-9999" placeholderTextColor="#64748b" keyboardType="phone-pad" maxLength={15} value={telefone} onChangeText={(text) => setTelefone(maskPhone(text))} />

                                <Text style={styles.label}>Email</Text>
                                <TextInput style={styles.input} placeholder="Ex: joao@email.com" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

                                <Text style={styles.label}>Sexo</Text>
                                <TouchableOpacity style={styles.selectButton} onPress={() => setShowSexoPicker(true)}>
                                    <Text style={{ color: sexo ? colors.textDark : '#64748b', fontSize: 16 }}>
                                        {sexo || 'Selecione o sexo'}
                                    </Text>
                                    <ChevronDown size={20} color="#64748b" />
                                </TouchableOpacity>

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
                                        <TextInput style={styles.input} placeholder="00000-000" placeholderTextColor="#64748b" keyboardType="numeric" maxLength={9} value={cep} onChangeText={handleCepChange} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={styles.label}>Bairro</Text>
                                        <TextInput style={styles.input} placeholder="Centro" placeholderTextColor="#64748b" value={bairro} onChangeText={setBairro} />
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={styles.label}>Logradouro</Text>
                                        <TextInput style={styles.input} placeholder="Rua das Flores" placeholderTextColor="#64748b" value={endereco} onChangeText={setEndereco} />
                                    </View>
                                    <View style={{ flex: 0.3, marginLeft: 8 }}>
                                        <Text style={styles.label}>Nº</Text>
                                        <TextInput style={styles.input} placeholder="123" placeholderTextColor="#64748b" value={numero} onChangeText={setNumero} />
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={styles.label}>Cidade</Text>
                                        <TextInput style={styles.input} placeholder="Cidade" placeholderTextColor="#64748b" value={cidade} onChangeText={setCidade} />
                                    </View>
                                    <View style={{ flex: 0.3, marginLeft: 8 }}>
                                        <Text style={styles.label}>UF</Text>
                                        <TextInput style={styles.input} placeholder="UF" placeholderTextColor="#64748b" maxLength={2} value={estado} onChangeText={setEstado} />
                                    </View>
                                </View>

                                <Text style={styles.sectionTitle}>Dados Eleitorais</Text>
                                <Text style={styles.label}>Título de Eleitor</Text>
                                <TextInput style={styles.input} placeholder="0000 0000 0000" placeholderTextColor="#64748b" keyboardType="numeric" maxLength={14} value={titulo} onChangeText={(text) => setTitulo(maskTitulo(text))} />

                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={styles.label}>Zona</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="000"
                                            placeholderTextColor="#64748b"
                                            keyboardType="numeric"
                                            maxLength={4}
                                            value={zona}
                                            onChangeText={setZona}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={styles.label}>Seção</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="0000"
                                            placeholderTextColor="#64748b"
                                            keyboardType="numeric"
                                            maxLength={4}
                                            value={secao}
                                            onChangeText={setSecao}
                                        />
                                    </View>
                                </View>

                                <Text style={styles.label}>Local de Votação</Text>
                                <TouchableOpacity 
                                    style={[styles.selectButton, { opacity: zona ? 1 : 0.5 }]} 
                                    onPress={() => zona && setShowLocalPicker(true)}
                                    disabled={!zona}
                                >
                                    <Text style={{ color: localVotacao ? colors.textDark : '#64748b', fontSize: 16, flex: 1 }} numberOfLines={1}>
                                        {localVotacao || (zona ? 'Selecione o local' : 'Preencha a Zona primeiro')}
                                    </Text>
                                    <ChevronDown size={20} color="#64748b" />
                                </TouchableOpacity>

                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                                        <ArrowLeft size={20} color="#64748b" />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.button, { flex: 1, marginTop: 0, marginLeft: 12 }]} onPress={handleUpdate} disabled={loading}>
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
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal Sexo */}
            <SimplePicker 
                visible={showSexoPicker}
                title="Selecione o Sexo"
                options={['Masculino', 'Feminino', 'Outro', 'Prefiro não informar']}
                onSelect={setSexo}
                onClose={() => setShowSexoPicker(false)}
            />

            {/* Modal Local de Votação */}
            <SimplePicker 
                visible={showLocalPicker}
                title={`Locais na Zona ${zona}`}
                options={filteredLocais}
                displayKey="local"
                onSelect={(item) => setLocalVotacao(item.local || item.nome || item.descricao || item)}
                onClose={() => setShowLocalPicker(false)}
            />
        </View>
    );
};

const SimplePicker = ({ visible, options, onSelect, onClose, title, displayKey }) => {
    if (!visible) return null;
    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <TouchableOpacity style={{flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', padding: 20}} onPress={onClose}>
                <View style={{backgroundColor:'white', borderRadius:10, maxHeight:'80%'}}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:15, borderBottomWidth:1, borderColor:'#eee'}}>
                        <Text style={{fontWeight:'bold', fontSize:16}}>{title}</Text>
                        <TouchableOpacity onPress={onClose}><Text style={{color:'#ef4444'}}>Fechar</Text></TouchableOpacity>
                    </View>
                    {options.length === 0 ? (
                        <Text style={{padding:20, textAlign:'center', color:'#64748b'}}>Nenhum local encontrado para esta zona.</Text>
                    ) : (
                        <FlatList
                            data={options}
                            keyExtractor={(item, i) => i.toString()}
                            renderItem={({item}) => (
                                <TouchableOpacity style={{padding:15, borderBottomWidth:1, borderColor:'#f0f0f0'}} onPress={() => { onSelect(item); onClose(); }}>
                                    <Text style={{fontSize:16, color:'#334155'}}>{displayKey ? (item[displayKey] || JSON.stringify(item)) : item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
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
    selectButton: {
        height: 55, backgroundColor: colors.inputBackground, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    button: { height: 56, backgroundColor: colors.primaryGreen, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: colors.primaryGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
    buttonRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
    backButton: { height: 56, width: 56, backgroundColor: '#f1f5f9', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
});