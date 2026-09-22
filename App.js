import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import MapScreen from "./src/screens/MapScreen";
import IndoorScreen from "./src/screens/IndoorScreen";

export default function App() {
  const [arrivedBuilding, setArrivedBuilding] = useState(null);

  return (
    <>
      <StatusBar style="dark" />
      {arrivedBuilding ? (
        <IndoorScreen
          building={arrivedBuilding}
          onBack={() => setArrivedBuilding(null)}
        />
      ) : (
        <MapScreen onArrive={(building) => setArrivedBuilding(building)} />
      )}
    </>
  );
}
