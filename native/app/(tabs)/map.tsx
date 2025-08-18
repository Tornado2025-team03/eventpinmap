import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
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
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const [pin, setPin] = useState<[number, number] | null>(null);

  useEffect(() => {
    console.log("pin state updated:", pin);
  }, [pin]);

  const handleLongPress = (e: any) => {
    // 1) Dump the event so we see exactly what MapLibre sends on your device
    // rconsole.log('onLongPress raw event:', JSON.stringify(e?.nativeEvent ?? e));

    // 2) Extract coordinates robustly (MapLibre RN sometimes nests them differently)
    const coordsRaw =
      e?.nativeEvent?.geometry?.coordinates ??
      e?.geometry?.coordinates ??
      e?.coordinates;

    if (!Array.isArray(coordsRaw) || coordsRaw.length < 2) {
      console.warn("onLongPress: no coordinates found in event");
      return;
    }

    const lng = Number(coordsRaw[0]);
    const lat = Number(coordsRaw[1]);
    if (Number.isNaN(lng) || Number.isNaN(lat)) {
      // console.warn('onLongPress: invalid coordinates', coordsRaw);
      return;
    }
    console.log("onLongPress parsed coords ->", { lng, lat });

    // 3) Set pin and move camera (camera uses defaultSettings so it won’t reset)
    setPin([lng, lat]);
    cameraRef.current?.setCamera({
      // centerCoordinate: [lng, lat],
      // zoomLevel: 16,
      animationDuration: 500,
    });
  };

  // Build a GeoJSON feature for the CircleLayer path
  const pinFeature =
    pin &&
    ({
      type: "Feature",
      geometry: { type: "Point", coordinates: pin },
      properties: {},
    } as const);

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleJSON={BASIC_BG_STYLE}
        logoEnabled={false}
        compassEnabled
        onLongPress={handleLongPress}
        onMapError={(e) => console.warn("onMapError:", e.nativeEvent)}
        onDidFailLoadingMap={(e) =>
          console.warn("onDidFailLoadingMap:", e.nativeEvent)
        }
        onDidFinishLoadingStyle={() => console.log("Style loaded")}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [139.7671, 35.6812], // Tokyo Station
            zoomLevel: 5,
          }}
        />

        {/* GSI Pale raster */}
        <MapLibreGL.RasterSource
          id="gsi-pale"
          tileUrlTemplates={[
            "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
          ]}
          tileSize={256}
        >
          <MapLibreGL.RasterLayer id="gsi-pale-layer" sourceID="gsi-pale" />
        </MapLibreGL.RasterSource>

        {/* Render pin via PointAnnotation (view-based marker) */}
        {pin && (
          <MapLibreGL.PointAnnotation
            id="pin-annotation"
            coordinate={pin}
            onSelected={() => console.log("PointAnnotation selected at", pin)}
          >
            <View style={styles.pin} />
          </MapLibreGL.PointAnnotation>
        )}

        {/* Render pin via vector layer (CircleLayer) */}
        {pinFeature && (
          <MapLibreGL.ShapeSource id="pin-src" shape={pinFeature}>
            <MapLibreGL.CircleLayer
              id="pin-circle"
              style={{
                circleRadius: 7,
                circleColor: "#e11d48",
                circleStrokeWidth: 2,
                circleStrokeColor: "#ffffff",
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Title bar */}
        <View style={styles.titleBar} pointerEvents="none">
          <Text style={styles.titleText}>Future Hackers</Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap} pointerEvents="box-none">
          <View style={styles.searchBar} pointerEvents="none">
            <Text style={styles.searchPlaceholder}>検索する</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  // overlay container
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  // black title bar like the screenshot
  titleBar: {
    backgroundColor: "#0b0b0b",
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    color: "#fff",
    fontSize: 24,
    letterSpacing: 2,
    fontStyle: "italic",
    // optional subtle shadow
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // position search bar just under the title
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  searchBar: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#D6D6D6",
    justifyContent: "center",
    paddingHorizontal: 14,
    // shadow / elevation
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchPlaceholder: {
    textAlign: "center",
    color: "#9AA0A6", // soft gray like the mock
    fontSize: 16,
  },
});
