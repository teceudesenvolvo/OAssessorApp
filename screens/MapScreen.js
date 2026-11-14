import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemedStyles } from '../components/use-themed-styles';
import { useAppTheme } from '../contexts/ThemeContext';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../ApiConfig';

export const MapScreen = () => {
    const styles = useThemedStyles(baseStyles);
  const { mode, colors } = useAppTheme();
  const mapRef = useRef(null);
  // Coordenadas iniciais (Exemplo: Centro de uma cidade)
  const [region, setRegion] = useState({
    latitude: -3.7319,
    longitude: -38.5267,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  });
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const isCoordinate = value => value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value));
    const validCoordinates = (latitude, longitude) => isCoordinate(latitude) && isCoordinate(longitude)
      && Math.abs(Number(latitude)) <= 90 && Math.abs(Number(longitude)) <= 180;
    const addressValue = value => String(value ?? '').trim();
    const geocodeAddress = eleitor => {
      const street = [addressValue(eleitor.endereco || eleitor.logradouro || eleitor.rua), addressValue(eleitor.numero || eleitor.numeroEndereco)].filter(Boolean).join(', ');
      const neighborhood = addressValue(eleitor.bairro);
      const city = addressValue(eleitor.cidade || eleitor.municipio);
      const state = addressValue(eleitor.estado || eleitor.uf);
      const postalCode = addressValue(eleitor.cep);
      // A name is never part of an address. Require geographic context so we
      // don't send incomplete street fragments to the platform geocoder.
      if (!city || !state || (!street && !neighborhood && !postalCode)) return '';
      return [street, neighborhood, city, state, postalCode, 'Brasil'].filter(Boolean).join(', ');
    };

    const loadMap = async () => {
      let userRegion = null;
      let myEleitores = [];
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          userRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          };
          if (active) setRegion(userRegion);
        }
      } catch (error) {
        console.warn('[Mapa] Não foi possível obter a localização atual:', error?.code || error?.message || 'erro desconhecido');
      }

      try {
        const user = auth.currentUser;
        if (user) {
          const eleitoresQuery = query(collection(db, 'eleitores'), where('creatorId', '==', user.uid));
          const snapshot = await getDocs(eleitoresQuery);
          myEleitores = snapshot.docs.map(document => ({ id: document.id, ...document.data() }));
        }
      } catch (error) {
        console.error('[Mapa] Falha ao carregar eleitores:', error?.code || error?.message || error);
      }

      let coordinateCache = {};
      try { coordinateCache = JSON.parse((await AsyncStorage.getItem('@oassessor/map-coordinates-v1')) || '{}'); } catch {}
      const loadedMarkers = [];
      for (const eleitor of myEleitores) {
        if (!active) return;
        const storedLatitude = eleitor.lat ?? eleitor.latitude;
        const storedLongitude = eleitor.lng ?? eleitor.longitude;
        if (validCoordinates(storedLatitude, storedLongitude)) {
          loadedMarkers.push({ ...eleitor, lat: Number(storedLatitude), lng: Number(storedLongitude) });
          continue;
        }

        const fullAddress = geocodeAddress(eleitor);
        if (!fullAddress) continue;
        const cacheKey = `${eleitor.id}:${fullAddress.toLocaleLowerCase('pt-BR')}`;
        const cached = coordinateCache[cacheKey];
        if (cached && validCoordinates(cached.lat, cached.lng)) {
          loadedMarkers.push({ ...eleitor, lat: Number(cached.lat), lng: Number(cached.lng) });
          continue;
        }
        if (cached?.notFoundAt && Date.now() - cached.notFoundAt < 30 * 24 * 60 * 60 * 1000) continue;
        if (cached?.retryAt && Date.now() < cached.retryAt) continue;

        try {
          const geocoded = await Location.geocodeAsync(fullAddress);
          const point = geocoded.find(item => validCoordinates(item.latitude, item.longitude));
          if (!point) {
            coordinateCache[cacheKey] = { notFoundAt: Date.now() };
            continue;
          }
          const latitude = Number(point.latitude);
          const longitude = Number(point.longitude);
          loadedMarkers.push({ ...eleitor, lat: latitude, lng: longitude });
          coordinateCache[cacheKey] = { lat: latitude, lng: longitude };
          // Persist successful coordinates so future map visits don't repeat
          // geocoding. A permission/network failure here doesn't hide the pin.
          try { await updateDoc(doc(db, 'eleitores', eleitor.id), { lat: latitude, lng: longitude }); }
          catch (error) { console.warn('[Mapa] Coordenada exibida, mas não foi persistida:', error?.code || 'firestore-error'); }
        } catch (error) {
          // Avoid logging names or street addresses; geocoder errors can occur
          // for incomplete or unrecognized addresses and are not app crashes.
          console.warn('[Mapa] Endereço não localizado:', { eleitorId: eleitor.id, code: error?.code || 'geocode-error' });
          coordinateCache[cacheKey] = { retryAt: Date.now() + 5 * 60 * 1000 };
        }
      }
      try { await AsyncStorage.setItem('@oassessor/map-coordinates-v1', JSON.stringify(coordinateCache)); } catch {}
      if (!active) return;
      setMarkers(loadedMarkers);

      if (loadedMarkers.length) {
        const coordinates = loadedMarkers.map(item => ({ latitude: item.lat, longitude: item.lng }));
        if (coordinates.length === 1) {
          const point = coordinates[0];
          const markerRegion = { ...point, latitudeDelta: 0.025, longitudeDelta: 0.025 };
          setRegion(markerRegion);
          requestAnimationFrame(() => mapRef.current?.animateToRegion(markerRegion, 500));
        } else {
          requestAnimationFrame(() => mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: { top: 70, right: 50, bottom: 120, left: 50 }, animated: true,
          }));
        }
      } else if (userRegion) {
        requestAnimationFrame(() => mapRef.current?.animateToRegion(userRegion, 500));
      }
    };

    loadMap().catch(error => {
      console.error('[Mapa] Falha inesperada ao carregar mapa:', error?.code || error?.message || error);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

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
        userInterfaceStyle={mode}
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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const baseStyles = StyleSheet.create({
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

const styles = baseStyles;
