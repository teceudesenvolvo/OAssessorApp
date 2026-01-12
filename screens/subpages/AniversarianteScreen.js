import { ArrowLeft, Cake, Gift, MessageCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_BASE_URL, auth } from '../../ApiConfig';
import ImageAniversario from '../../assets/images/aniversario.png';

export const AniversarianteScreen = ({ navigation, route }) => {
    const { person } = route.params;
    const [senderName, setSenderName] = useState('Sua Equipe');

    useEffect(() => {
        const fetchSenderName = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const response = await fetch(`${API_BASE_URL}/users/${user.uid}.json`);
                    const data = await response.json();
                    if (data && data.nome) {
                        setSenderName(data.nome);
                    }
                } catch (error) {
                    console.log('Erro ao buscar nome do remetente');
                }
            }
        };
        fetchSenderName();
    }, []);

    const handleWhatsApp = () => {
        let phone = person.telefone || '';
        // Remove tudo que não é dígito
        phone = phone.replace(/\D/g, '');

        if (!phone) {
            Alert.alert('Erro', 'Este eleitor não possui telefone cadastrado.');
            return;
        }

        // Adiciona o código do país (55) se não tiver e o número parecer ser um celular BR (10 ou 11 dígitos)
        if (phone.length >= 10 && phone.length <= 11) {
            phone = '55' + phone;
        } else if (!phone.startsWith('55')) {
            // Fallback genérico: se não começa com 55, adiciona.
            phone = '55' + phone;
        }

        // Mensagem elaborada
        const message = `🎉🎂 *Feliz Aniversário, ${person.nome}!* 🎂🎉\n\n` +
            `Passando para desejar um dia repleto de alegria, saúde e muitas conquistas. Que este novo ciclo traga grandes realizações!\n\n` +
            `Conte sempre conosco!\n\n`;

        // Utiliza o link universal https://wa.me/ que é mais robusto e não requer configurações de scheme no app
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        
        Linking.openURL(url).catch(() => {
            Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 20 }}>
                            <ArrowLeft size={20} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.logoText}>
                                <Text style={styles.textGreen}>Feliz</Text>
                                <Text style={styles.textWhite}> Aniversário</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.iconBox}>
                        <Gift size={28} color="#6EE794" />
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    {/* Imagem Festiva Decorativa */}
                    <Image 
                        source={ImageAniversario} 
                        style={styles.cardImage}
                        resizeMode="cover"
                    />

                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{person.nome.charAt(0)}</Text>
                    </View>
                    
                    <Text style={styles.name}>{person.nome}</Text>
                    <Text style={styles.role}>{person.cargo || 'Eleitor'}</Text>
                    
                    <View style={styles.ageBadge}>
                        <Cake size={16} color="#2563eb" style={{ marginRight: 6 }} />
                        <Text style={styles.ageText}>Completando {person.idade} anos hoje!</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.description}>
                        Envie uma mensagem especial para fortalecer o vínculo com seu eleitor neste dia importante.
                    </Text>

                    <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
                        <MessageCircle size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.buttonText}>Enviar Mensagem</Text>
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
    content: { flex: 1, marginTop: -20, paddingHorizontal: 20 },
    card: {
        backgroundColor: 'white',
        borderRadius: 24, 
        padding: 24,
        paddingTop: 0, // Remove padding top para a imagem colar na borda
        alignItems: 'center',
        marginTop: 30,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4,
        overflow: 'hidden' // Garante que a imagem respeite o border radius
    },
    cardImage: {
        width: '120%', // Um pouco maior para garantir cobertura
        height: 120,
        marginBottom: -50, // Faz o avatar subir na imagem
        opacity: 1
    },
    avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 4, borderColor: 'white' },
    avatarText: { fontSize: 40, fontWeight: 'bold', color: '#2563eb' },
    name: { fontSize: 24, fontWeight: 'bold', color: colors.textDark, textAlign: 'center', marginBottom: 4 },
    role: { fontSize: 16, color: '#64748b', marginBottom: 16 },
    ageBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    ageText: { color: '#2563eb', fontWeight: 'bold', fontSize: 14 },
    divider: { height: 1, backgroundColor: '#e2e8f0', width: '100%', marginVertical: 24 },
    description: { textAlign: 'center', color: '#64748b', marginBottom: 24, lineHeight: 20 },
    whatsappButton: { width: '100%', height: 56, backgroundColor: '#25D366', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});