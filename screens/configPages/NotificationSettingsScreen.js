import { ArrowLeft, Bell } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export const NotificationSettingsScreen = ({ navigation }) => {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [taskAlerts, setTaskAlerts] = useState(true);
    const [eventReminders, setEventReminders] = useState(true);
    const [newsUpdates, setNewsUpdates] = useState(false);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 20 }}>
                            <ArrowLeft size={20} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.logoText}>
                                <Text style={styles.textGreen}>Configurar </Text>
                                <Text style={styles.textWhite}>Notificações</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.iconBox}>
                        <Bell size={28} color="#6EE794" />
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Canais de Recebimento</Text>
                    
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Notificações Push</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#6EE794" }}
                            thumbColor={pushEnabled ? "#f4f3f4" : "#f4f3f4"}
                            onValueChange={setPushEnabled}
                            value={pushEnabled}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Email</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#6EE794" }}
                            thumbColor={emailEnabled ? "#f4f3f4" : "#f4f3f4"}
                            onValueChange={setEmailEnabled}
                            value={emailEnabled}
                        />
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Tipos de Alerta</Text>

                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Novas Tarefas</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#6EE794" }}
                            thumbColor={taskAlerts ? "#f4f3f4" : "#f4f3f4"}
                            onValueChange={setTaskAlerts}
                            value={taskAlerts}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Lembretes de Eventos</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#6EE794" }}
                            thumbColor={eventReminders ? "#f4f3f4" : "#f4f3f4"}
                            onValueChange={setEventReminders}
                            value={eventReminders}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Novidades e Atualizações</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#6EE794" }}
                            thumbColor={newsUpdates ? "#f4f3f4" : "#f4f3f4"}
                            onValueChange={setNewsUpdates}
                            value={newsUpdates}
                        />
                    </View>
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
    logoText: { fontSize: 22, fontWeight: 'bold' },
    textGreen: { color: colors.primaryGreen, fontWeight: 'bold' },
    textWhite: { color: colors.white },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark, marginBottom: 16 },
    settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingVertical: 4 },
    settingLabel: { fontSize: 16, color: '#334155', fontWeight: '500' },
});