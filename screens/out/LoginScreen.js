import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL, auth } from '../../ApiConfig';

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Configuração da animação
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const buttonRef = useRef(null);
  const [circleOrigin, setCircleOrigin] = useState({ x: 0, y: 0 });
  const { width, height } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  
  const handleLogin = async () => {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Por favor, preencha email e senha.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Buscar dados do usuário para verificar o tipo
      const response = await fetch(`${API_BASE_URL}/users/${user.uid}.json`);
      const userData = await response.json();

      // Lógica de Redirecionamento:
      // Se tipoUser for 'assessor' -> vai para AssessorScreen (rota 'Assessor')
      // Caso contrário (ex: politico) -> vai para PoliticoScreen (rota 'Painel')
      let targetRoute = 'Painel'; 
      if (userData && userData.tipoUser === 'assessor') {
        targetRoute = 'Assessor';
      }

      // Se o login for bem-sucedido, inicia a animação
      startAnimationAndNavigate(targetRoute);
    } catch (error) {
      console.error(error);
      let msg = 'Ocorreu um erro ao fazer login.';
      if (error.code === 'auth/invalid-email') msg = 'Email inválido.';
      if (error.code === 'auth/user-not-found') msg = 'Usuário não encontrado.';
      if (error.code === 'auth/wrong-password') msg = 'Senha incorreta.';
      if (error.code === 'auth/invalid-credential') msg = 'Credenciais inválidas.';
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage('');
    if (!email) {
      setErrorMessage('Por favor, digite seu email no campo acima para recuperar a senha.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Email Enviado', 'Verifique sua caixa de entrada (e spam) para redefinir sua senha.');
    } catch (error) {
      console.error(error);
      let msg = 'Não foi possível enviar o email de recuperação.';
      if (error.code === 'auth/invalid-email') msg = 'Email inválido.';
      if (error.code === 'auth/user-not-found') msg = 'Usuário não encontrado.';
      setErrorMessage(msg);
    }
  };

  const startAnimationAndNavigate = (targetRoute) => {
    if (buttonRef.current) {
      buttonRef.current.measure((fx, fy, w, h, px, py) => {
        // Calcula o centro do botão
        const centerX = px + w / 2;
        const centerY = py + h / 2;

        // Ajusta a origem considerando os insets da SafeAreaView
        setCircleOrigin({
          x: centerX - insets.left,
          y: centerY - insets.top
        });

        // Calcula a distância máxima até os cantos da tela para garantir cobertura total
        const dist1 = Math.hypot(centerX, centerY);
        const dist2 = Math.hypot(width - centerX, centerY);
        const dist3 = Math.hypot(centerX, height - centerY);
        const dist4 = Math.hypot(width - centerX, height - centerY);
        
        const maxRadius = Math.max(dist1, dist2, dist3, dist4);
        const endScale = maxRadius / 50; // 50 é o raio base do círculo (metade de 100)
    
        Animated.timing(scaleAnim, {
          toValue: endScale,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          navigation.replace(targetRoute);
          setLoading(false);
        });
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#101422" />
      
      {/* Comportamento para evitar que o teclado cubra os inputs */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        
        {/* Parte Superior (Azul Escuro + Logo) */}
        <View style={styles.headerContainer}>
          <View style={styles.logoRow}>
            {/* O Círculo do Logo */}
            
            {/* Texto do Logo */}
            <Text style={styles.logoText}>
              <Text style={styles.textGreen}>O Ass</Text>
              <Text style={styles.textWhite}>essor</Text>
            </Text>
          </View>
        </View>

        {/* Parte Inferior (Branca + Formulário) */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Entrar</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrorMessage('');
            }}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrorMessage('');
            }}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TouchableOpacity ref={buttonRef} style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>
              Esqueceu a senha? <Text style={styles.recoverText}>Recupere</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
      
      {/* Círculo de Transição */}
      <Animated.View 
        style={[
          styles.transitionCircle, 
          { 
            // Posiciona o círculo na origem calculada (centro do botão)
            top: circleOrigin.y - 50, 
            left: circleOrigin.x - 50,
            marginTop: 0, // Remove margens originais de centralização
            marginLeft: 0,
            transform: [{ scale: scaleAnim }] 
          }
        ]} 
      />
    </SafeAreaView>
  );
};

// Cores extraídas da imagem
const colors = {
  backgroundDark: '#101422', // Azul bem escuro
  primaryGreen: '#6EE794',   // Verde claro vibrante
  white: '#FFFFFF',
  inputBackground: '#D9D9D9', // Cinza claro
  textDark: '#000000',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  keyboardView: {
    flex: 1,
  },
  headerContainer: {
    flex: 1, // Ocupa a metade superior (ajustável)
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundDark,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15, // Faz virar um círculo
    borderWidth: 4,
    borderColor: colors.primaryGreen,
    marginRight: 4,
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
  formContainer: {
    flex: 1.2, // Ocupa um pouco mais que a metade inferior
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 100,
    marginTop: -50,
    marginBottom: -50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 20,
  },
  input: {
    height: 55,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    height: 55,
    backgroundColor: colors.primaryGreen,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.textDark,
  },
  recoverText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  transitionCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    marginTop: -50,
    marginLeft: -50,
    borderRadius: 50,
    backgroundColor: colors.primaryGreen,
    zIndex: 9999,
    elevation: 100, 
  },
});