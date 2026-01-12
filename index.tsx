import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerRootComponent } from 'expo';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { onAuthStateChanged } from 'firebase/auth';
import { Calendar, Home, Map as MapIcon, PlusCircle, User, Workflow } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Platform, StyleSheet, Text, View } from 'react-native';

// Importação das telas

// Telas sem autenticação
import { LoginScreen } from './screens/out/LoginScreen';

// Telas com autenticação
import { AssessorScreen } from './screens/AssessorScreen';
import { EleitorCadastroScreen } from './screens/EleitoresScreen';
import { MapScreen } from './screens/MapScreen';
import { PerfilScreen } from './screens/PerfilScreen';
import { PoliticoScreen } from './screens/PoliticoScreen';
import { TarefasScreen } from './screens/TarefasScreen';
// SubPages
import { AniversarianteScreen } from './screens/subpages/AniversarianteScreen';
import { AssessorEditScreen } from './screens/subpages/AssessorEditScreen';
import { AssessorFormScreen } from './screens/subpages/AssessorFormScreen';
import { EleitorEditScreen } from './screens/subpages/EleitorEditScreen';
import { EleitorFormScreen } from './screens/subpages/EleitorFormScreen';
import { NotificacoesScreen } from './screens/subpages/NotificacoesScreen';
import { TarefasEditScreen } from './screens/subpages/TarefasEditScreen';
import { TarefasFormScreen } from './screens/subpages/TarefasFormScreen';
// ConfigPages
import { API_BASE_URL, auth } from './ApiConfig';
import { EditProfileScreen } from './screens/configPages/EditProfileScreen';
import { HelpScreen } from './screens/configPages/HelpScreen';
import { NotificationSettingsScreen } from './screens/configPages/NotificationSettingsScreen';
import { SecurityScreen } from './screens/configPages/SecurityScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Configuração do Handler de Notificações (Define como elas aparecem com o app aberto)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// --- Componente de Placeholder para Mapa ---
const MapPlaceholder = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
    <Workflow size={64} color="#cbd5e1" />
    <Text style={{ marginTop: 16, color: '#64748b', fontWeight: 'bold' }}>Página em Desenvolvimento</Text>
  </View>
);

// Placeholder para a tela de Eleitor (evita erro de variável não definida)
const EleitorScreen = MapPlaceholder;

// --- Componente de Ícone Animado ---
const AnimatedTabBarIcon = ({ focused, color, size, icon: Icon }) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Icon size={size} color={color} strokeWidth={focused ? 3 : 2} />
    </Animated.View>
  );
};

// --- Configuração das Abas (Dashboard) ---
function DashboardTabs({ route, navigation }) {
  // Define qual tela inicial renderizar baseado no parâmetro da rota (role)
  const slideAnim = React.useRef(new Animated.Value(150)).current; // Inicia deslocado para baixo (fora da tela)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Anima a barra para a posição final com um efeito de mola suave
      Animated.spring(slideAnim, {
        toValue: 0, // Volta para a posição original (translateY: 0)
        friction: 8,
        useNativeDriver: true, // Agora compatível com driver nativo usando transform
      }).start();
    }, 500); // Atraso de 500ms

    return () => clearTimeout(timer); // Limpa o timer se o componente for desmontado
  }, []);

  const { role } = route.params || { role: 'POLITICO' };
  
  let MainScreen;
  if (role === 'POLITICO') MainScreen = PoliticoScreen;
  else if (role === 'ASSESSOR') MainScreen = AssessorScreen;
  else MainScreen = EleitorScreen;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [ // Convertido para array para aceitar estilos animados
          {
            position: 'absolute',
            bottom: 0, // Define a posição base fixa
            left: 10,
            right: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderTopWidth: 0,
            height: 90,
            borderRadius: 40,
            paddingTop: 10,
            paddingBottom: Platform.OS === 'ios' ? 0 : 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
          },
          { transform: [{ translateY: slideAnim }] }, // Anima a translação vertical
        ],
        tabBarBackground: () => (
          <View style={{ flex: 1, borderRadius: 40, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <BlurView tint="light" intensity={Platform.OS === 'ios' ? 30 : 80} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),
        tabBarActiveTintColor: '#6EE794',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 10,
          marginBottom: 5,
        },
      }}
    >
      <Tab.Screen 
        name="Início" 
        component={MainScreen} 
        options={{
          tabBarIcon: ({ focused, color, size }) => <AnimatedTabBarIcon focused={focused} color={color} size={size} icon={Home} />
        }}
      />
      <Tab.Screen 
        name="Mapa" 
        component={MapScreen} 
        options={{
          tabBarIcon: ({ focused, color, size }) => <AnimatedTabBarIcon focused={focused} color={color} size={size} icon={MapIcon} />
        }}
      />
      <Tab.Screen 
        name="Novo" 
        component={EleitorCadastroScreen} 
        options={{
          tabBarIcon: ({ focused, color, size }) => <AnimatedTabBarIcon focused={focused} color={color} size={size} icon={PlusCircle} />
        }}
      />
      <Tab.Screen 
        name="Agenda" 
        component={TarefasScreen} 
        options={{
          tabBarIcon: ({ focused, color, size }) => <AnimatedTabBarIcon focused={focused} color={color} size={size} icon={Calendar} />
        }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={PerfilScreen} 
        options={{
          tabBarIcon: ({ focused, color, size }) => <AnimatedTabBarIcon focused={focused} color={color} size={size} icon={User} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [initialRoute, setInitialRoute] = useState("Login");
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = React.useRef();
  const responseListener = React.useRef();

  useEffect(() => {
    // Registrar para notificações Push
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    // Listeners para notificações
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Notificação recebida com app aberto
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Usuário tocou na notificação
    });

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Se tiver token e usuário, salva no Firebase
        if (expoPushToken) {
          fetch(`${API_BASE_URL}/users/${u.uid}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pushToken: expoPushToken })
          }).catch(err => console.log("Erro ao salvar token:", err));
        }

        try {
          const response = await fetch(`${API_BASE_URL}/users/${u.uid}.json`);
          const userData = await response.json();
          if (userData && userData.tipoUser === 'assessor') {
            setInitialRoute("Assessor");
          } else {
            setInitialRoute("Painel");
          }
        } catch (error) {
          setInitialRoute("Painel");
        }
      }
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [expoPushToken]); // Adicionado dependência do token para salvar assim que disponível

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101422' }}>
        <ActivityIndicator size="large" color="#6EE794" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Painel" component={DashboardTabs} initialParams={{ role: 'POLITICO' }} />
        <Stack.Screen name="Assessor" component={DashboardTabs} initialParams={{ role: 'ASSESSOR' }} />
        <Stack.Screen name="Eleitor" component={DashboardTabs} initialParams={{ role: 'ELEITOR' }} />
        <Stack.Screen name="EleitorForm" component={EleitorFormScreen} />
        <Stack.Screen name="EleitorEdit" component={EleitorEditScreen} />
        <Stack.Screen name="AssessorForm" component={AssessorFormScreen} />
        <Stack.Screen name="AssessorEdit" component={AssessorEditScreen} />
        <Stack.Screen name="Aniversariante" component={AniversarianteScreen} />
        <Stack.Screen name="TarefasForm" component={TarefasFormScreen} />
        <Stack.Screen name="TarefasEdit" component={TarefasEditScreen} />
        <Stack.Screen name="Notificacoes" component={NotificacoesScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Security" component={SecurityScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

async function registerForPushNotificationsAsync() {
  // Verificação para evitar erro no Expo Go (Android SDK 53+)
  if (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient') {
    console.log('Aviso: Notificações Push não são suportadas no Expo Go para Android. Use uma Development Build.');
    return;
  }

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      // alert('Falha ao obter permissão para notificações push!');
      return;
    }
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } else {
    // alert('Must use physical device for Push Notifications');
  }

  return token;
}

registerRootComponent(App);
