import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, Calendar, Save } from 'lucide-react-native';
import { useState } from 'react';
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

export const TarefasFormScreen = ({ navigation }) => {
    const [titulo, setTitulo] = useState('');
    const [date, setDate] = useState(new Date());
    const [show, setShow] = useState(false);
    const [mode, setMode] = useState('date');
    const [tipo, setTipo] = useState('meeting'); // meeting, visit, content, event
    const [descricao, setDescricao] = useState('');

    const taskTypes = [
        { id: 'meeting', label: 'Reunião' },
        { id: 'visit', label: 'Visita' },
        { id: 'content', label: 'Mídia' },
        { id: 'event', label: 'Evento' },
    ];

    const onChangeAndroid = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShow(false);
        setDate(currentDate);
    };

    const showModeAndroid = (currentMode) => {
        setShow(true);
        setMode(currentMode);
    };

    const handleSave = () => {
        // Lógica de salvamento aqui
        navigation.goBack();
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
                                <Text style={styles.textGreen}>Nova</Text>
                                <Text style={styles.textWhite}> Tarefa</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.iconBox}>
                        <Calendar size={28} color="#6EE794" />
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
                        <Text style={styles.sectionTitle}>Detalhes da Atividade</Text>

                        <Text style={styles.label}>Título da Tarefa</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Reunião com Lideranças"
                            placeholderTextColor="#64748b"
                            value={titulo}
                            onChangeText={setTitulo}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.label}>Data</Text>
                                {Platform.OS === 'android' ? (
                                    <TouchableOpacity
                                        style={[styles.input, { justifyContent: 'center' }]}
                                        onPress={() => showModeAndroid('date')}
                                    >
                                        <Text style={{ fontSize: 16, color: colors.textDark }}>
                                            {date.toLocaleDateString('pt-BR')}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={[styles.input, { justifyContent: 'center', alignItems: 'flex-start', paddingVertical: 8 }]}>
                                        <DateTimePicker
                                            value={date}
                                            mode="date"
                                            display="default"
                                            onChange={(e, d) => setDate(d || date)}
                                        />
                                    </View>
                                )}
                            </View>
                            <View style={{ flex: 0.6, marginLeft: 8 }}>
                                <Text style={styles.label}>Hora</Text>
                                {Platform.OS === 'android' ? (
                                    <TouchableOpacity
                                        style={[styles.input, { justifyContent: 'center' }]}
                                        onPress={() => showModeAndroid('time')}
                                    >
                                        <Text style={{ fontSize: 16, color: colors.textDark }}>
                                            {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={[styles.input, { justifyContent: 'center', alignItems: 'flex-start', paddingVertical: 8 }]}>
                                        <DateTimePicker
                                            value={date}
                                            mode="time"
                                            display="default"
                                            onChange={(e, d) => setDate(d || date)}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>

                        <Text style={styles.label}>Tipo de Atividade</Text>
                        <View style={styles.typeContainer}>
                            {taskTypes.map((t) => (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[styles.typeButton, tipo === t.id && styles.typeButtonActive]}
                                    onPress={() => setTipo(t.id)}
                                >
                                    <Text style={[styles.typeText, tipo === t.id && styles.typeTextActive]}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {Platform.OS === 'android' && show && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={date}
                                mode={mode}
                                is24Hour={true}
                                display="default"
                                onChange={onChangeAndroid}
                            />
                        )}

                        <Text style={styles.label}>Descrição / Observações</Text>
                        <TextInput
                            style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                            placeholder="Detalhes adicionais sobre a tarefa..."
                            placeholderTextColor="#64748b"
                            multiline
                            numberOfLines={4}
                            value={descricao}
                            onChangeText={setDescricao}
                        />

                        <TouchableOpacity style={styles.button} onPress={handleSave}>
                            <Save size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.buttonText}>Agendar Tarefa</Text>
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
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    typeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    typeButton: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
    },
    typeButtonActive: {
        backgroundColor: '#dcfce7', borderColor: colors.primaryGreen,
    },
    typeText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    typeTextActive: { color: '#166534' },
    button: {
        height: 56, backgroundColor: colors.primaryGreen, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: colors.primaryGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});