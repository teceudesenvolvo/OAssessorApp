import {
    AlertTriangle,
    BarChart3,
    Bell,
    Camera,
    CheckCircle2,
    Home,
    LogOut,
    Map as MapIcon,
    MapPin,
    Newspaper,
    Plus,
    Users,
    Vote
} from 'lucide-react-native';
import { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// --- Tipos ---
type UserRole = 'POLITICO' | 'ASSESSOR' | 'ELEITOR' | null;

// --- Componente Principal ---
export default function App() {
  const [role, setRole] = useState<UserRole>(null);
  const [activeTab, setActiveTab] = useState('home');

  // --- Tela de Seleção de Perfil (Login) ---
  if (!role) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center px-6">
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        
        <View className="mb-12 items-center w-full">
          <View className="w-24 h-24 bg-blue-600 rounded-3xl items-center justify-center mb-6 shadow-lg shadow-blue-900">
            <Vote size={48} color="white" />
          </View>
          <Text className="text-4xl font-extrabold text-white text-center">VotoDigital</Text>
          <Text className="text-slate-400 mt-2 font-medium text-lg">Gestão & Engajamento</Text>
        </View>
        
        <View className="w-full space-y-4">
          <TouchableOpacity 
            onPress={() => setRole('POLITICO')}
            className="w-full bg-blue-600 py-4 rounded-2xl items-center shadow-md active:opacity-90"
          >
            <Text className="text-white font-bold text-lg">Acesso Político (ADM)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setRole('ASSESSOR')}
            className="w-full bg-emerald-600 py-4 rounded-2xl items-center shadow-md active:opacity-90"
          >
            <Text className="text-white font-bold text-lg">Acesso Assessor (Campo)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setRole('ELEITOR')}
            className="w-full bg-slate-800 py-4 rounded-2xl items-center border border-slate-700 active:opacity-90"
          >
            <Text className="text-white font-bold text-lg">Sou Eleitor / Apoiador</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- RENDERS POR PERFIL ---

  const renderPolitico = () => (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <View className="bg-blue-700 pt-6 pb-12 px-6 rounded-b-[40px] shadow-xl">
        <View className="flex-row justify-between items-start mb-6 mt-4">
          <View>
            <Text className="text-blue-200 text-sm font-medium">Bem-vindo, Candidato</Text>
            <Text className="text-white text-3xl font-extrabold">Dashboard</Text>
          </View>
          <TouchableOpacity className="bg-white/20 p-2 rounded-full">
            <Bell size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Main Card */}
        <View className="bg-white p-6 rounded-3xl shadow-lg flex-row items-center justify-between">
          <View>
            <Text className="text-slate-400 text-xs uppercase font-bold tracking-wider">Total de Eleitores</Text>
            <Text className="text-4xl font-black text-slate-900 mt-1">12.450</Text>
            <Text className="text-emerald-500 text-xs font-bold mt-1">
              +12.5% este mês
            </Text>
          </View>
          <View className="bg-blue-100 p-4 rounded-2xl">
            <Users size={32} color="#1d4ed8" />
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="px-6 -mt-6 space-y-4">
        <View className="flex-row justify-between">
          <View className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 w-[48%]">
            <BarChart3 color="#10b981" size={28} style={{ marginBottom: 8 }} />
            <Text className="text-slate-400 text-[10px] font-bold uppercase">Engajamento</Text>
            <Text className="text-xl font-black text-slate-800">78.4%</Text>
          </View>
          <View className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 w-[48%]">
            <AlertTriangle color="#f43f5e" size={28} style={{ marginBottom: 8 }} />
            <Text className="text-slate-400 text-[10px] font-bold uppercase">Ocorrências</Text>
            <Text className="text-xl font-black text-slate-800">23</Text>
          </View>
        </View>

        <View className="mt-4">
          <Text className="text-slate-900 font-bold text-xl mb-3">Intensidade por Região</Text>
          <View className="bg-slate-200 h-64 rounded-[32px] overflow-hidden items-center justify-center border-4 border-white shadow-sm">
             <View className="absolute top-10 left-20 w-32 h-32 bg-blue-500 rounded-full opacity-30" />
             <View className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-500 rounded-full opacity-30" />
             <View className="bg-white/80 px-4 py-2 rounded-full">
                <Text className="text-slate-500 font-bold text-xs">VISUALIZAÇÃO GIS</Text>
             </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderAssessor = () => (
    <ScrollView className="flex-1 bg-slate-50 p-6" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header Assessor */}
      <View className="flex-row justify-between items-center mt-6 mb-6">
        <View>
          <Text className="text-3xl font-black text-slate-900">Campo</Text>
          <View className="flex-row items-center mt-1">
            <MapPin size={14} color="#64748b" />
            <Text className="text-slate-500 text-sm ml-1">Zona 04 - Centro Norte</Text>
          </View>
        </View>
        <View className="bg-emerald-100 p-3 rounded-2xl">
          <CheckCircle2 size={24} color="#047857" />
        </View>
      </View>

      {/* Main Action Button */}
      <TouchableOpacity 
        onPress={() => Alert.alert("Ação", "Abrir Câmera/GPS")}
        className="w-full bg-emerald-600 p-6 rounded-[32px] flex-row items-center shadow-lg active:opacity-95 mb-6"
      >
        <View className="bg-white/20 p-4 rounded-2xl mr-4">
          <Plus size={32} color="white" />
        </View>
        <View>
          <Text className="text-white font-black text-xl">Novo Eleitor</Text>
          <Text className="text-emerald-100 text-sm opacity-80">Capturar GPS agora</Text>
        </View>
      </TouchableOpacity>

      {/* Grid Actions */}
      <View className="flex-row justify-between mb-6">
        <TouchableOpacity className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 w-[48%]">
          <Camera color="#3b82f6" size={28} style={{ marginBottom: 12 }} />
          <Text className="font-bold text-slate-800 text-lg">Reportar</Text>
          <Text className="text-[10px] text-slate-400 font-bold uppercase">Foto + Local</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 w-[48%]">
          <MapIcon color="#8b5cf6" size={28} style={{ marginBottom: 12 }} />
          <Text className="font-bold text-slate-800 text-lg">Meu Mapa</Text>
          <Text className="text-[10px] text-slate-400 font-bold uppercase">Áreas Vazias</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Card */}
      <View className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <View className="flex-row justify-between items-end mb-4">
           <View>
              <Text className="text-slate-400 text-xs font-bold uppercase">Meta Semanal</Text>
              <Text className="text-2xl font-black text-slate-900">85 / 120</Text>
           </View>
           <Text className="text-blue-600 font-black text-lg">70%</Text>
        </View>
        <View className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
           <View className="h-full bg-blue-600 rounded-full w-[70%]" />
        </View>
      </View>
    </ScrollView>
  );

  const renderEleitor = () => (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="p-8 pb-4 pt-12">
        <Text className="text-4xl font-black text-blue-900 tracking-tight">Meu Portal</Text>
        <Text className="text-slate-500 font-medium text-lg">Informações do Candidato</Text>
      </View>

      <View className="px-6 space-y-6">
        {/* Voting Info Card */}
        <View className="bg-blue-800 p-8 rounded-[40px] shadow-xl relative overflow-hidden">
          <View className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <View className="flex-row items-center mb-6">
            <MapPin size={24} color="white" />
            <Text className="text-white text-xl font-black ml-2">Local de Votação</Text>
          </View>
          <Text className="text-blue-100 font-bold text-lg leading-tight mb-6">Escola Municipal José de Alencar</Text>
          <View className="flex-row gap-4">
            <View className="bg-white/10 px-5 py-3 rounded-2xl border border-white/20">
              <Text className="text-[10px] uppercase font-bold text-blue-200">Zona</Text>
              <Text className="text-2xl font-black text-white">03</Text>
            </View>
            <View className="bg-white/10 px-5 py-3 rounded-2xl border border-white/20">
              <Text className="text-[10px] uppercase font-bold text-blue-200">Seção</Text>
              <Text className="text-2xl font-black text-white">123</Text>
            </View>
          </View>
        </View>

        {/* News Section */}
        <View>
          <View className="flex-row justify-between items-center mb-4 px-2">
            <Text className="text-xl font-black text-slate-900">Notícias</Text>
            <TouchableOpacity>
              <Text className="text-blue-600 font-bold text-sm">Ver todas</Text>
            </TouchableOpacity>
          </View>
          <View className="space-y-4">
            {[1, 2].map(i => (
              <View key={i} className="flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <View className="w-20 h-20 bg-slate-100 rounded-2xl items-center justify-center">
                  <Newspaper color="#94a3b8" size={30} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-blue-600 uppercase mb-1">Candidatura • 2h atrás</Text>
                  <Text className="text-slate-900 font-bold leading-tight text-sm">Plano de expansão da iluminação pública.</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity className="w-full bg-slate-900 py-5 rounded-[32px] flex-row items-center justify-center shadow-xl active:scale-95">
          <Vote size={24} color="white" style={{ marginRight: 12 }} />
          <Text className="text-white font-black text-lg">Responder Enquete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Área de Conteúdo */}
      <View className="flex-1">
        {role === 'POLITICO' && renderPolitico()}
        {role === 'ASSESSOR' && renderAssessor()}
        {role === 'ELEITOR' && renderEleitor()}
      </View>

      {/* Navegação Inferior (Tab Bar) */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 pt-3 pb-8 px-8 flex-row justify-between items-center rounded-t-[32px] shadow-2xl">
        <TouchableOpacity 
          onPress={() => setActiveTab('home')}
          className="items-center"
        >
          <Home size={28} color={activeTab === 'home' ? "#2563eb" : "#94a3b8"} strokeWidth={activeTab === 'home' ? 3 : 2} />
          <Text className={`text-[10px] font-bold uppercase mt-1 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}>Início</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setActiveTab('map')}
          className="items-center"
        >
          <MapIcon size={28} color={activeTab === 'map' ? "#2563eb" : "#94a3b8"} strokeWidth={activeTab === 'map' ? 3 : 2} />
          <Text className={`text-[10px] font-bold uppercase mt-1 ${activeTab === 'map' ? 'text-blue-600' : 'text-slate-400'}`}>Mapa</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setRole(null)}
          className="items-center"
        >
          <LogOut size={28} color="#94a3b8" />
          <Text className="text-[10px] font-bold uppercase mt-1 text-slate-400">Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}