import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export const MapScreen = () => {
  const mapRef = useRef(null);
  // Coordenadas iniciais (Exemplo: Centro de uma cidade)
  const [region, setRegion] = useState({
    latitude: -26.9136, 
    longitude: -49.0691,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para exibir no mapa.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const userRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setRegion(userRegion);
      mapRef.current?.animateToRegion(userRegion, 1000);

      // Geocodificação dos endereços dos eleitores
      const loadedMarkers = [];
      for (const eleitor of eleitores) {
        try {
          // Tenta obter as coordenadas a partir do endereço
          const geocoded = await Location.geocodeAsync(eleitor.endereco);
          if (geocoded.length > 0) {
            loadedMarkers.push({
              ...eleitor,
              lat: geocoded[0].latitude,
              lng: geocoded[0].longitude,
            });
          }
        } catch (error) {
          console.log('Erro ao geocodificar:', eleitor.nome);
        }
      }
      setMarkers(loadedMarkers);
      setLoading(false);
    })();
  }, []);

  // Dados fictícios dos eleitores (Simulando dados vindos do formulário, apenas com endereço)
  const eleitores = [
    { id: 1, nome: 'João Silva', endereco: 'Rua XV de Novembro, 100, Blumenau - SC', status: 'Apoiador' },
    { id: 2, nome: 'Maria Oliveira', endereco: 'Rua 7 de Setembro, 500, Blumenau - SC', status: 'Indeciso' },
    { id: 3, nome: 'Carlos Souza', endereco: 'Rua das Palmeiras, 230, Blumenau - SC', status: 'Apoiador' },
    { id: 4, nome: 'Ana Costa', endereco: 'Rua Amazonas, 1200, Blumenau - SC', status: 'Pendente' },
    { id: 5, nome: 'Pedro Santos', endereco: 'Rua São Paulo, 45, Blumenau - SC', status: 'Apoiador' },
    { id: 6, nome: 'Lucia Ferreira', endereco: 'Rua Bahia, 80, Blumenau - SC', status: 'Indeciso' },
  ];

  // Função para definir a cor do pin baseada no status
  const getPinColor = (status) => {
    switch (status) {
      case 'Apoiador': return '#6EE794'; // Verde do app
      case 'Indeciso': return '#F59E0B'; // Amarelo/Laranja
      default: return '#94A3B8'; // Cinza
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true} // Mostra a localização atual do usuário (precisa de permissão)
        showsMyLocationButton={true}
        loadingEnabled={true}
      >
        {markers.map((eleitor) => (
          <Marker
            key={eleitor.id}
            coordinate={{ latitude: eleitor.lat, longitude: eleitor.lng }}
            title={eleitor.nome}
            description={eleitor.endereco}
            pinColor={getPinColor(eleitor.status)}
          />
        ))}
      </MapView>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6EE794" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height + 50, // +50 para garantir que cubra sob a TabBar transparente
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});