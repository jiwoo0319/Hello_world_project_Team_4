import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { BUILDINGS } from "../data/buildings";
import { fetchWalkingRoute } from "../lib/routing";

const CAMPUS_CENTER = {
  latitude: 37.4494431,
  longitude: 126.6534446,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function MapScreen({ onArrive }) {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const destination = BUILDINGS[0]; // 프로토타입: 5호관 고정

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "위치 권한 필요",
          "현재 위치를 가져올 수 없어 캠퍼스 중심을 시작점으로 사용합니다."
        );
        setUserLocation(CAMPUS_CENTER);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  const startNavigation = async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const route = await fetchWalkingRoute(userLocation, destination.coordinate);
      setRouteCoords(route.coordinates);
      setRouteInfo(route);
      mapRef.current?.fitToCoordinates(route.coordinates, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    } catch (e) {
      Alert.alert("경로 안내 실패", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={CAMPUS_CENTER}
        showsUserLocation
      >
        <Marker
          coordinate={destination.coordinate}
          title={destination.name}
          description={destination.description}
          pinColor="#0b5fff"
        />
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="#0b5fff" />
        )}
      </MapView>

      <View style={styles.panel}>
        <Text style={styles.title}>목적지: {destination.name}</Text>
        {routeInfo && (
          <Text style={styles.subtitle}>
            도보 약 {Math.round(routeInfo.durationSeconds / 60)}분 ·{" "}
            {Math.round(routeInfo.distanceMeters)}m
          </Text>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={startNavigation}
          disabled={loading || !userLocation}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>경로 안내 시작</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => onArrive(destination)}
        >
          <Text style={styles.secondaryButtonText}>건물 도착 (내부 안내 보기)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  panel: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 13, color: "#555", marginTop: 4 },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#0b5fff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryButton: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0b5fff",
  },
  secondaryButtonText: { color: "#0b5fff", fontWeight: "700", fontSize: 14 },
});
