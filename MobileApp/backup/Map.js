import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  Platform,
  StatusBar,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import app from "../firebase";
import { getDatabase, ref, onValue } from "firebase/database";
import { getAuth, signOut } from "firebase/auth";
import LoadingScreen from "../src/views/LoadingScreen";
import polyline from "@mapbox/polyline";

const Map = ({ navigation }) => {
  const [region, setRegion] = useState(null);
  const [crimes, setCrimes] = useState([]);
  const [route, setRoute] = useState(null);
  const [heading, setHeading] = useState(0);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const auth = getAuth(app);

  async function getLocationPermissions() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Location access is necessary for app functionality."
      );
      return false;
    }
    return true;
  }

  useEffect(() => {
    const db = getDatabase(app);
    const crimesRef = ref(db, "crimes");

    const unsubscribe = onValue(crimesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const updatedCrimes = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setCrimes(updatedCrimes);
      if (region) {
        updateRoute(region, updatedCrimes);
      }
    });

    return () => unsubscribe();
  }, [region]);

  useEffect(() => {
    (async () => {
      if (!(await getLocationPermissions())) {
        return;
      }

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1, // Update for every meter moved
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          setRegion(newRegion);
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
          }
        }
      );

      Location.watchHeadingAsync((newHeading) => {
        setHeading(newHeading.trueHeading);
      });
    })();
  }, []);

  const updateRoute = async (currentLocation, crimes) => {
    if (!currentLocation || crimes.length === 0) return;
    const waypoints = crimes.map((crime) => ({
      latitude: crime.latitude,
      longitude: crime.longitude,
    }));
    const encodedRoute = await fetchOptimizedRoute(currentLocation, waypoints);
    if (encodedRoute) {
      const decodedRoute = polyline.decode(encodedRoute).map((arr) => ({
        latitude: arr[0],
        longitude: arr[1],
      }));
      setRoute(decodedRoute);
    }
  };

  const fetchOptimizedRoute = async (currentLocation, waypoints) => {
    const apiKey = "AIzaSyC3kEbJVHO9eZbUODtJwjJLkOggPzad_ZM";
    const waypointsString = waypoints
      .map((wp) => `${wp.latitude},${wp.longitude}`)
      .join("|");
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${currentLocation.latitude},${currentLocation.longitude}&waypoints=optimize:true|${waypointsString}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const json = await response.json();
      if (json.routes.length) {
        return json.routes[0].overview_polyline.points;
      }
    } catch (error) {
      console.error("Google Maps Directions API error: ", error);
    }
    return null;
  };

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Do you want to logout?", [
      {
        text: "Yes",

        onPress: async () => {
          try {
            await signOut(auth);
            Alert.alert("Logged Out", "You have successfully logged out.");
            navigation.replace("Login");
          } catch (error) {
            Alert.alert("Logout Error", error.message);
          }
        },
      },
      {
        text: "No",
        onPress: () => {},
      },
    ]);
  };

  if (!region) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={region}>
        {region && (
          <Marker
            ref={markerRef}
            coordinate={region}
            pinColor="blue"
            title="You are here"
            rotation={heading}
            flat={true}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Image
              source={require("../../assets/images/patrol.png")}
              style={styles.markerImage}
            />
          </Marker>
        )}
        {crimes.map((crime) => (
          <Marker
            key={crime.id}
            coordinate={{
              latitude: crime.latitude,
              longitude: crime.longitude,
            }}
            title={crime.crime}
          />
        ))}
        {route && (
          <Polyline coordinates={route} strokeColor="#FF0000" strokeWidth={1} />
        )}
      </MapView>

      <View style={styles.nav}>
        <TouchableOpacity onPress={() => {}} style={styles.navItem}>
          <Image
            source={require("../../assets/images/map.png")}
            style={styles.navImg}
          />
          <Text style={[styles.navTxt, { color: "red" }]}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.navItem}>
          <Image
            source={require("../../assets/images/arrow.png")}
            style={styles.navImg}
          />
          <Text style={styles.navTxt}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height - 70,
  },
  logoutButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  markerImage: {
    width: 60,
    height: 60,
  },

  nav: {
    height: 70,
    backgroundColor: "handle",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  navItem: {
    justifyContent: "center",
    alignItems: "center",
  },

  navImg: {
    height: 25,
    aspectRatio: 4 / 4,
  },
});

export default Map;
