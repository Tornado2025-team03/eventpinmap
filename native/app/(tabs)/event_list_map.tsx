import React, { useRef } from "react";
import { View, StyleSheet } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import pointsGeojson from "../../assets/geojson/points.json";

const BASIC_BG_STYLE = {
  version: 8,
  name: "bg-only",
  sources: {},
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#ffffff" } },
  ],
} as const;

export default function MapScreen() {
  const cameraRef = useRef<MapLibreGL.CameraRef>(null);

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={BASIC_BG_STYLE}
        logoEnabled={false}
        compassEnabled
        zoomEnabled={true}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [139.7671, 35.6812], // Tokyo
            zoomLevel: 5,
          }}
          minZoomLevel={4}
          maxZoomLevel={14}
        />

        <MapLibreGL.RasterSource
          id="gsi-pale"
          tileUrlTemplates={["http://tile.openstreetmap.org/{z}/{x}/{y}.png"]}
          minZoomLevel={4}
          maxZoomLevel={14}
        >
          <MapLibreGL.RasterLayer id="gsi-pale-layer" sourceID="gsi-pale" />
        </MapLibreGL.RasterSource>

        <MapLibreGL.ShapeSource id="points" shape={pointsGeojson}>
          <MapLibreGL.CircleLayer
            id="pointSymbols"
            style={{
              circleColor: "#FF0000",
              circleRadius: 6,
              circleStrokeWidth: 2,
              circleStrokeColor: "#fff",
            }}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  // (rest same as your code)
});
