import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { FileText, Filter, MapPin, Phone, Plus, Search, UserPlus } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export const EleitorCadastroScreen = ({ navigation }) => {
    const [searchText, setSearchText] = useState('');

    // Dados fictícios para a lista
    const eleitoresList = [
        { id: '1', nome: 'Maria Silva', bairro: 'Centro', telefone: '(47) 99999-9999', status: 'Apoiador' },
        { id: '2', nome: 'João Santos', bairro: 'Velha', telefone: '(47) 98888-8888', status: 'Indeciso' },
        { id: '3', nome: 'Ana Costa', bairro: 'Garcia', telefone: '(47) 97777-7777', status: 'Pendente' },
        { id: '4', nome: 'Pedro Oliveira', bairro: 'Itoupava', telefone: '(47) 96666-6666', status: 'Apoiador' },
    ];

    const handleExportPDF = async () => {
        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
                        h1 { color: #101422; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #6EE794; color: white; }
                        tr:nth-child(even) { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>Relatório de Eleitores</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Bairro</th>
                                <th>Telefone</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${eleitoresList.map(item => `
                                <tr>
                                    <td>${item.nome}</td>
                                    <td>${item.bairro}</td>
                                    <td>${item.telefone}</td>
                                    <td>${item.status}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.log('Erro ao gerar PDF:', error);
        }
    };

    const filteredList = eleitoresList.filter(e => 
        e.nome.toLowerCase().includes(searchText.toLowerCase()) ||
        e.bairro.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View>
                        <Text style={styles.headerSubtitle}>Gerenciamento</Text>
                        <Text style={styles.logoText}>
                            <Text style={styles.textGreen}>Meus </Text>
                            <Text style={styles.textWhite}>Eleitores</Text>
                        </Text>
                    </View>
                    <View style={styles.iconBox}>
                        <UserPlus size={28} color="#6EE794" />
                    </View>
                </View>
                    
                {/* Barra de Pesquisa */}
                <View style={styles.searchContainer}>
                    <Search size={20} color="#94a3b8" style={{ marginRight: 10 }} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Buscar por nome ou bairro..."
                        placeholderTextColor="#94a3b8"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    <TouchableOpacity style={styles.filterButton}>
                        <Filter size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}>
                {filteredList.map(item => (
                    <View key={item.id} style={styles.eleitorCard}>
                        <View style={styles.eleitorInfo}>
                            <Text style={styles.eleitorName}>{item.nome}</Text>
                            <View style={styles.eleitorMeta}>
                                <MapPin size={14} color="#94a3b8" style={{ marginRight: 4 }} />
                                <Text style={styles.eleitorText}>{item.bairro}</Text>
                            </View>
                            <View style={styles.eleitorMeta}>
                                <Phone size={14} color="#94a3b8" style={{ marginRight: 4 }} />
                                <Text style={styles.eleitorText}>{item.telefone}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Apoiador' ? '#dcfce7' : '#f1f5f9' }]}>
                            <Text style={[styles.statusText, { color: item.status === 'Apoiador' ? '#166534' : '#64748b' }]}>{item.status}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity style={[styles.fab, { bottom: 180, backgroundColor: 'white' }]} onPress={handleExportPDF}>
                <FileText size={24} color="#6EE794" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('EleitorForm')}>
                <Plus size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
};

const colors = {
    backgroundDark: '#101422',
    primaryGreen: '#6EE794',
    white: '#FFFFFF',
    inputBackground: '#f1f5f9', // Levemente mais claro para o formulário interno
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
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20 },
    headerSubtitle: { color: '#94a3b8', fontSize: 14, fontWeight: '600', letterSpacing: 1 },
    headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold', marginTop: 4 },
    iconBox: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 },
    content: { flex: 1, marginTop: 0, paddingHorizontal: 20 },
    logoText: {
        fontSize: 25,
        fontWeight: 'bold',
    },
    textGreen: {
        color: colors.primaryGreen,
        fontWeight: 'bold',
    },
    textWhite: {
        color: colors.white,
    },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 50, marginTop: 20 },
    searchInput: { flex: 1, height: 50, color: colors.textDark },
    filterButton: { backgroundColor: colors.primaryGreen, padding: 8, borderRadius: 8, marginLeft: 8 },
    eleitorCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    eleitorInfo: { flex: 1 },
    eleitorName: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, marginBottom: 4 },
    eleitorMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    eleitorText: { color: '#64748b', fontSize: 12 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 110, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryGreen, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primaryGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});