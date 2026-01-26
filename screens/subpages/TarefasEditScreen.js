import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, MessageSquare, Save, Send, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
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

export const TarefasEditScreen = ({ navigation, route }) => {
    const { task } = route.params;
    
    // Estados do Formulário
    const [titulo, setTitulo] = useState(task.titulo || '');
    const [date, setDate] = useState(task.fullDate ? new Date(task.fullDate) : new Date());
    const [show, setShow] = useState(false);
    const [mode, setMode] = useState('date');
    const [tipo, setTipo] = useState(task.tipo || 'meeting');
    const [descricao, setDescricao] = useState(task.descricao || '');
    const [loading, setLoading] = useState(false);

    // Estados dos Comentários
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [userName, setUserName] = useState('Usuário');

    const taskTypes = [
        { id: 'meeting', label: 'Reunião' },
        { id: 'visit', label: 'Visita' },
        { id: 'content', label: 'Mídia' },
        { id: 'event', label: 'Evento' },
    ];

    useEffect(() => {
        fetchComments();
        fetchUserName();
    }, []);

    const fetchUserName = async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                const response = await fetch(`${API_BASE_URL}/users/${user.uid}.json`);
                const data = await response.json();
                if (data && data.nome) {
                    setUserName(data.nome);
                }
            } catch (error) {
                console.log('Erro ao buscar nome do usuário');
            }
        }
    };

    const fetchComments = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tarefas/${task.id}/comentarios.json`);
            const data = await response.json();
            if (data) {
                const loadedComments = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                setComments(loadedComments);
            } else {
                setComments([]);
            }
        } catch (error) {
            console.error('Erro ao buscar comentários:', error);
        }
    };

    const onChangeAndroid = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShow(false);
        setDate(currentDate);
    };

    const showModeAndroid = (currentMode) => {
        setShow(true);
        setMode(currentMode);
    };

    const handleUpdate = async () => {
        if (!titulo) {
            Alert.alert('Atenção', 'Por favor, preencha o título da tarefa.');
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            const token = user ? await user.getIdToken() : '';

            const payload = {
                titulo,
                data: date.toLocaleDateString('pt-BR'),
                time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                fullDate: date.toISOString(),
                tipo,
                descricao,
                updatedAt: new Date().toISOString()
            };

            await fetch(`${API_BASE_URL}/tarefas/${task.id}.json?auth=${token}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            Alert.alert('Sucesso', 'Tarefa atualizada com sucesso!');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível atualizar a tarefa.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setLoadingComments(true);
        const user = auth.currentUser;
        
        try {
            const token = user ? await user.getIdToken() : '';
            const commentPayload = {
                text: newComment,
                userId: user?.uid,
                userName: userName,
                createdAt: new Date().toISOString()
            };

            await fetch(`${API_BASE_URL}/tarefas/${task.id}/comentarios.json?auth=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commentPayload)
            });

            setNewComment('');
            fetchComments(); // Recarrega a lista
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível enviar o comentário.');
        } finally {
            setLoadingComments(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Excluir Tarefa',
            'Tem certeza que deseja excluir esta tarefa?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const user = auth.currentUser;
                            const token = user ? await user.getIdToken() : '';
                            await fetch(`${API_BASE_URL}/tarefas/${task.id}.json?auth=${token}`, { method: 'DELETE' });
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível excluir a tarefa.');
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
                                <Text style={styles.textWhite}> Tarefa</Text>
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
                    
                    {/* Formulário de Edição */}
                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Detalhes da Atividade</Text>

                        <Text style={styles.label}>Título da Tarefa</Text>
                        <TextInput style={styles.input} placeholder="Ex: Reunião com Lideranças" placeholderTextColor="#64748b" value={titulo} onChangeText={setTitulo} />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.label}>Data</Text>
                                {Platform.OS === 'android' ? (
                                    <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => showModeAndroid('date')}>
                                        <Text style={{ fontSize: 16, color: colors.textDark }}>{date.toLocaleDateString('pt-BR')}</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={[styles.input, { justifyContent: 'center', alignItems: 'flex-start', paddingVertical: 8 }]}>
                                        <DateTimePicker value={date} mode="date" display="default" onChange={(e, d) => setDate(d || date)} />
                                    </View>
                                )}
                            </View>
                            <View style={{ flex: 0.6, marginLeft: 8 }}>
                                <Text style={styles.label}>Hora</Text>
                                {Platform.OS === 'android' ? (
                                    <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => showModeAndroid('time')}>
                                        <Text style={{ fontSize: 16, color: colors.textDark }}>{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={[styles.input, { justifyContent: 'center', alignItems: 'flex-start', paddingVertical: 8 }]}>
                                        <DateTimePicker value={date} mode="time" display="default" onChange={(e, d) => setDate(d || date)} />
                                    </View>
                                )}
                            </View>
                        </View>

                        <Text style={styles.label}>Tipo de Atividade</Text>
                        <View style={styles.typeContainer}>
                            {taskTypes.map((t) => (
                                <TouchableOpacity key={t.id} style={[styles.typeButton, tipo === t.id && styles.typeButtonActive]} onPress={() => setTipo(t.id)}>
                                    <Text style={[styles.typeText, tipo === t.id && styles.typeTextActive]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {Platform.OS === 'android' && show && (
                            <DateTimePicker testID="dateTimePicker" value={date} mode={mode} is24Hour={true} display="default" onChange={onChangeAndroid} />
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

                        <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={loading}>
                            {loading ? <ActivityIndicator color="white" /> : (
                                <>
                                    <Save size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>Salvar Alterações</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Seção de Comentários */}
                    <View style={styles.commentsSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <MessageSquare size={20} color={colors.textDark} style={{ marginRight: 8 }} />
                            <Text style={styles.sectionTitle}>Comentários</Text>
                        </View>

                        {comments.length === 0 ? (
                            <Text style={styles.emptyComments}>Nenhum comentário ainda.</Text>
                        ) : (
                            comments.map((comment) => (
                                <View key={comment.id} style={styles.commentCard}>
                                    <View style={styles.commentHeader}>
                                        <Text style={styles.commentUser}>{comment.userName}</Text>
                                        <Text style={styles.commentTime}>
                                            {new Date(comment.createdAt).toLocaleDateString('pt-BR')} às {new Date(comment.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <Text style={styles.commentText}>{comment.text}</Text>
                                </View>
                            ))
                        )}

                        <View style={styles.addCommentContainer}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Adicionar comentário..."
                                placeholderTextColor="#94a3b8"
                                value={newComment}
                                onChangeText={setNewComment}
                                multiline
                            />
                            <TouchableOpacity style={styles.sendButton} onPress={handleAddComment} disabled={loadingComments}>
                                {loadingComments ? <ActivityIndicator size="small" color="white" /> : <Send size={20} color="white" />}
                            </TouchableOpacity>
                        </View>
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
        marginBottom: 20,
    },
    logoText: { fontSize: 25, fontWeight: 'bold' },
    textGreen: { color: colors.primaryGreen, fontWeight: 'bold' },
    textWhite: { color: colors.white },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark, marginBottom: 16, marginTop: 8 },
    label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
    input: { height: 55, backgroundColor: colors.inputBackground, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 16, color: colors.textDark, borderWidth: 1, borderColor: '#e2e8f0' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    typeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    typeButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
    typeButtonActive: { backgroundColor: '#dcfce7', borderColor: colors.primaryGreen },
    typeText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    typeTextActive: { color: '#166534' },
    button: { height: 56, backgroundColor: colors.primaryGreen, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: colors.primaryGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
    
    commentsSection: { backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4 },
    emptyComments: { color: '#94a3b8', fontStyle: 'italic', marginBottom: 16 },
    commentCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 12 },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    commentUser: { fontWeight: 'bold', color: colors.textDark, fontSize: 14 },
    commentTime: { fontSize: 10, color: '#94a3b8' },
    commentText: { color: '#475569', fontSize: 14 },
    addCommentContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    commentInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, maxHeight: 80, color: colors.textDark },
    sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryGreen, justifyContent: 'center', alignItems: 'center' },
});