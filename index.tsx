import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { onAuthStateChanged } from 'firebase/auth';
import { Calendar, Home, Map as MapIcon, PlusCircle, User, Workflow } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { ApuracaoScreen } from './screens/ApuracaoScreen';
import { PoliticalStrategyScreen } from './screens/PoliticalStrategyScreen';
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
import { auth } from './ApiConfig';
import { getDocument, updateDocument } from './services/firestoreData';
import { EditProfileScreen } from './screens/configPages/EditProfileScreen';
import { HelpScreen } from './screens/configPages/HelpScreen';
import { SecurityScreen } from './screens/configPages/SecurityScreen';
import { ThemeProvider, useAppTheme } from './contexts/ThemeContext';

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
    <Animated.View style={{ transform: [{ scale }] }} pointerEvents="none">
      <Icon size={size} color={color} strokeWidth={focused ? 3 : 2} />
    </Animated.View>
  );
};

function LiquidGlassTabBar({ state, descriptors, navigation, mode, colors, bottom, slideAnim }) {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const translateX = React.useRef(new Animated.Value(0)).current;
  const stretchX = React.useRef(new Animated.Value(1)).current;
  const stretchY = React.useRef(new Animated.Value(1)).current;
  const itemWidth = state.routes.length ? trackWidth / state.routes.length : 0;

  React.useEffect(() => {
    if (!itemWidth) return;
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: state.index * itemWidth,
        duration: 360,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(stretchX, { toValue: 1.1, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(stretchX, { toValue: 1, damping: 12, stiffness: 250, mass: 0.6, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(stretchY, { toValue: 0.93, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(stretchY, { toValue: 1, damping: 12, stiffness: 250, mass: 0.6, useNativeDriver: true }),
      ]),
    ]).start();
  }, [itemWidth, state.index, stretchX, stretchY, translateX]);

  return (
    <Animated.View pointerEvents="box-none" style={[liquidBarStyles.position, { bottom, transform: [{ translateY: slideAnim }] }]}>
      <View style={[liquidBarStyles.glass, { backgroundColor: mode === 'dark' ? 'rgba(20,29,24,0.52)' : 'rgba(255,255,255,0.44)', borderColor: mode === 'dark' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.9)' }]}>
        <BlurView tint={mode} intensity={Platform.OS === 'ios' ? 88 : 96} style={StyleSheet.absoluteFill} />
        <LinearGradient
          pointerEvents="none"
          colors={mode === 'dark' ? ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.035)', 'rgba(255,255,255,0.08)'] : ['rgba(255,255,255,0.82)', 'rgba(255,255,255,0.24)', 'rgba(255,255,255,0.5)']}
          locations={[0, 0.52, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, liquidBarStyles.innerRim, { borderColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.48)' }]} />

        <View style={liquidBarStyles.track} onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
          {itemWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                liquidBarStyles.activePill,
                {
                  width: itemWidth,
                  borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.96)',
                  backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.66)',
                  transform: [{ translateX }, { scaleX: stretchX }, { scaleY: stretchY }],
                },
              ]}
            >
              <LinearGradient
                colors={mode === 'dark' ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.015)'] : ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.12)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}

          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const color = focused ? colors.primary : colors.muted;
            const label = options.tabBarLabel ?? options.title ?? route.name;
            const accessibilityLabel = options.tabBarAccessibilityLabel ?? (typeof label === 'string' ? label : route.name);

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={accessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                style={({ pressed }) => [liquidBarStyles.item, pressed && liquidBarStyles.pressed]}
              >
                {typeof options.tabBarIcon === 'function' && options.tabBarIcon({ focused, color, size: 21 })}
                <Text numberOfLines={1} style={[liquidBarStyles.label, { color }]}>{typeof label === 'string' ? label : route.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

const liquidBarStyles = StyleSheet.create({
  position: { position: 'absolute', left: 14, right: 14, zIndex: 10 },
  glass: { height: 76, padding: 5, borderRadius: 38, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 },
  innerRim: { margin: 1, borderRadius: 37, borderWidth: StyleSheet.hairlineWidth },
  track: { flex: 1, flexDirection: 'row', position: 'relative' },
  activePill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 32, borderWidth: 1, overflow: 'hidden' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1, gap: 2 },
  label: { fontSize: 10, fontWeight: '600' },
  pressed: { opacity: 0.72 },
});

// --- Configuração das Abas (Dashboard) ---
function DashboardTabs({ route, navigation }) {
  const { colors, mode } = useAppTheme();
  const insets = useSafeAreaInsets();
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

  const isTablet = Device.deviceType === Device.DeviceType.TABLET;

  const { role } = route.params || { role: 'POLITICO' };
  
  let MainScreen;
  if (role === 'POLITICO') MainScreen = PoliticoScreen;
  else if (role === 'ASSESSOR') MainScreen = AssessorScreen;
  else MainScreen = EleitorScreen;

  return (
    <Tab.Navigator
      tabBar={(props) => <LiquidGlassTabBar {...props} mode={mode} colors={colors} bottom={isTablet ? 32 : Math.max(insets.bottom, 10)} slideAnim={slideAnim} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
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

function AppContent() {
  const { colors, mode, loaded } = useAppTheme();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [initialRoute, setInitialRoute] = useState("Login");
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = React.useRef();
  const responseListener = React.useRef();

  useEffect(() => {
    // Registrar para notificações Push
    registerForPushNotificationsAsync().then(token => {
      console.log("Token Push Gerado:", token);
      setExpoPushToken(token);
    });

    // Listeners para notificações
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Notificação recebida com app aberto
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Usuário tocou na notificação
    });

    return () => {
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, []);

  // Novo useEffect dedicado apenas para salvar o token quando Usuário e Token existirem
  useEffect(() => {
    if (user && expoPushToken) {
      const saveToken = async () => {
        try {
          const userData = await getDocument('users', user.uid);
          if (userData) await updateDocument('users', user.uid, { pushToken: expoPushToken });
          console.log("SUCESSO: Token salvo/atualizado no Firebase para o usuário", user.uid);
        } catch (err) {
          console.error("ERRO ao salvar token no Firebase:", err);
        }
      };
      saveToken();
    }
  }, [user, expoPushToken]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userData = await getDocument('users', u.uid);
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
  }, []); 

  if (initializing || !loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
      </View>
    );
  }

  return (
    <>
    <StatusBar style={mode === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
    <NavigationContainer theme={{ ...(mode === 'dark' ? DarkTheme : DefaultTheme), colors: { ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors), primary: colors.primary, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, notification: colors.danger } }}>
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
        <Stack.Screen name="Apuracao" component={ApuracaoScreen} />
        <Stack.Screen name="EstrategiaPolitica" component={PoliticalStrategyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}

export default function App() {
  return <ThemeProvider><AppContent /></ThemeProvider>;
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

  // Permite execução em Dispositivo Físico ou Emulador Android (Simulador iOS não suporta Push)
  if (Device.isDevice || Platform.OS === 'android') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Falha: Permissão de notificações não concedida.');
      return;
    }
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    
    if (!projectId) {
      console.warn("AVISO: Project ID não encontrado. Verifique seu app.json ou eas.json.");
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.error("Erro ao obter Push Token:", e);
    }
  } else {
    console.log('Push Notifications não suportadas em Simulador iOS.');
  }

  return token;
}

registerRootComponent(App);
