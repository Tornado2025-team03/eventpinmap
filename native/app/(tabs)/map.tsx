import React from "react";
import { View, StyleSheet } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";

const BASIC_BG_STYLE = {
  version: 8,
  name: "bg-only",
  sources: {},
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#ffffff" } },
  ],
} as const;

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleJSON={BASIC_BG_STYLE} // simple background; no other layers to cover raster
        logoEnabled={false}
        compassEnabled
        onMapError={(e) => console.warn("onMapError:", e.nativeEvent)}
        onDidFailLoadingMap={(e) =>
          console.warn("onDidFailLoadingMap:", e.nativeEvent)
        }
        onDidFinishLoadingStyle={() => console.log("Style loaded")}
      >
        <MapLibreGL.Camera
          zoomLevel={5}
          centerCoordinate={[139.7671, 35.6812]} // Tokyo Station
        />

        {/* GSI Pale raster tiles */}
        <MapLibreGL.RasterSource
          id="gsi-pale"
          tileUrlTemplates={[
            "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
          ]}
          tileSize={256}
        >
          <MapLibreGL.RasterLayer id="gsi-pale-layer" sourceID="gsi-pale" />
        </MapLibreGL.RasterSource>
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, map: { flex: 1 } });
