import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import MapScreen from "./src/screens/MapScreen";
import IndoorScreen from "./src/screens/IndoorScreen";

export default function App() {
  const [showIndoor, setShowIndoor] = useState(false);

  return (
    <>
      <StatusBar style="dark" />
      {showIndoor ? (
        <IndoorScreen onBack={() => setShowIndoor(false)} />
      ) : (
        <MapScreen onArrive={() => setShowIndoor(true)} />
      )}
    </>
  );
}
