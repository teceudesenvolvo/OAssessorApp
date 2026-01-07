import { ArrowLeft, ChevronDown, HelpCircle, Mail } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const HelpScreen = ({ navigation }) => {
    const faqs = [
        { id: 1, question: 'Como cadastrar um novo eleitor?', answer: 'Vá até a aba "Novo" no menu inferior ou clique no botão "+" na tela inicial.' },
        { id: 2, question: 'Como exportar relatórios?', answer: 'Na tela de lista de eleitores, clique no ícone de documento acima do botão de adicionar.' },
        { id: 3, question: 'Posso alterar minha senha?', answer: 'Sim, acesse Perfil > Segurança para alterar sua senha de acesso.' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 20 }}>
                            <ArrowLeft size={20} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.logoText}>
                                <Text style={styles.textGreen}>Ajuda e </Text>
                                <Text style={styles.textWhite}>Suporte</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.iconBox}>
                        <HelpCircle size={28} color="#6EE794" />
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>
                    {faqs.map((faq) => (
                        <View key={faq.id} style={styles.faqItem}>
                            <View style={styles.faqHeader}>
                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                <ChevronDown size={20} color="#94a3b8" />
                            </View>
                            <Text style={styles.faqAnswer}>{faq.answer}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Ainda precisa de ajuda?</Text>
                    <Text style={styles.supportText}>Entre em contato com nossa equipe de suporte técnico.</Text>
                    
                    <TouchableOpacity style={styles.button}>
                        <Mail size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.buttonText}>Fale Conosco</Text>
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
        elevation: 8,
        zIndex: 10,
    },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 0 },
    iconBox: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 },
    content: { flex: 1, marginTop: -20, paddingHorizontal: 20 },
    card: { borderRadius: 24, padding: 24, marginTop: 20, backgroundColor: 'white', elevation: 2 },
    logoText: { fontSize: 25, fontWeight: 'bold' },
    textGreen: { color: colors.primaryGreen, fontWeight: 'bold' },
    textWhite: { color: colors.white },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark, marginBottom: 16 },
    faqItem: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 16 },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    faqQuestion: { fontSize: 16, fontWeight: '600', color: '#334155', flex: 1, marginRight: 8 },
    faqAnswer: { fontSize: 14, color: '#64748b', lineHeight: 20 },
    supportText: { fontSize: 14, color: '#64748b', marginBottom: 16 },
    button: { height: 56, backgroundColor: colors.primaryGreen, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4 },
    buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});