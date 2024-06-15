import React, { useEffect, useState } from "react";

import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    Platform,
    TouchableOpacity,
    Image,
    Alert,
    Dimensions,
} from "react-native";
import SegmentControl from "../components/SegmentControl";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { signOut, getAuth } from "firebase/auth";
import app from "../../firebase";
import axios from "axios";
import moment from "moment";
import LoadingScreen from "./LoadingScreen";

const API = "AIzaSyC3kEbJVHO9eZbUODtJwjJLkOggPzad_ZM";

const RenderMap = ({ navigation }) => {
    const [location, setLocation] = useState(null);
    const [crimes, setCrimes] = useState([]);
    const [heading, setHeading] = useState(0);
    const [selectedRouting, setSelectedRouting] = useState("Time-Based");
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [targetCrime, setTargetCrime] = useState(null);
    const [renderedOnce, setRenderedOnce] = useState(false);
    const [crimeIndex, setCrimeIndex] = useState(0);
    const [flag, setFlag] = useState(true);
    const [mapRegion, setMapRegion] = useState(null); // New state for map region
    const user = getAuth(app);

    const db = getDatabase();

    useEffect(() => {
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                alert("Permission to access location was denied");
                return;
            }
            Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 0, // Update every second
                    distanceInterval: 0, // Update every movement
                },
                (newLocation) => {
                    setUserLocation(newLocation.coords);
                    setLocation(newLocation.coords);
                }
            );

            Location.watchHeadingAsync((newHeading) => {
                setHeading(newHeading.trueHeading);
            });

            const crimeRef = ref(db, "crimes");
            onValue(crimeRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const formattedData = Object.keys(data).map((key) => ({
                        id: key,
                        ...data[key],
                    }));
                    setCrimes(formattedData);
                }
            });
        })();
    }, []);

    const distance = (loc1, loc2) => {
        const toRadian = (angle) => (Math.PI / 180) * angle;
        const R = 6371; // Earth’s radius in kilometers

        const deltaLat = toRadian(loc2.latitude - loc1.latitude);
        const deltaLon = toRadian(loc2.longitude - loc1.longitude);

        const a =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(toRadian(loc1.latitude)) *
                Math.cos(toRadian(loc2.latitude)) *
                Math.sin(deltaLon / 2) *
                Math.sin(deltaLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    };

    useEffect(() => {
        // push user coordinates to database for accessing
        (async () => {
            const coordsRef = ref(
                db,
                "patrolCoordinates/" + user.currentUser.uid
            );

            await set(coordsRef, {
                email: user.currentUser.email,
                location,
                heading,
            });
        })();
    }, [location, heading]);

    useEffect(() => {
        // Set or reset the target crime when the user changes the routing method or on initial load
        if (!location || crimes.length === 0) return;

        const initialCrimeSetup = () => {
            let calculatedCrime;

            if (selectedRouting === "Time-based") {
                const sortedCrimes = [...crimes].sort((a, b) => {
                    const parseDateTime = (date, time) => {
                        const dateTimeString = `${date} ${time}`;
                        const dateTime = moment(
                            dateTimeString,
                            "MM/DD/YYYY hh:mm:ss A"
                        );
                        return dateTime.toDate();
                    };

                    const dateTimeA = parseDateTime(a.date, a.time);
                    const dateTimeB = parseDateTime(b.date, b.time);

                    return dateTimeA - dateTimeB; // Sort from earliest to latest
                });
                calculatedCrime = sortedCrimes[crimeIndex];
            } else {
                // Nearest crime based routing
                const sortedCrimes = crimes.sort(
                    (a, b) => distance(location, a) - distance(location, b)
                );
                calculatedCrime = sortedCrimes[crimeIndex];
            }

            // prevent initializing
            if (!renderedOnce) {
                setTargetCrime(calculatedCrime || crimes[0]);
            }
            setRenderedOnce(true);
        };

        initialCrimeSetup();
    }, [selectedRouting, location, crimes, flag, crimeIndex]);

    useEffect(() => {
        setCrimeIndex(0);
        setRenderedOnce(false);
        setFlag(!flag);
    }, [selectedRouting]);

    useEffect(() => {
        if (!targetCrime) return;
        const fetchRoute = async () => {
            const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${targetCrime.latitude},${targetCrime.longitude}&key=${API}`;
            const response = await axios.get(directionsUrl);
            const points = response.data.routes[0]?.overview_polyline.points;
            setRouteCoordinates(decodePolyline(points));
        };

        fetchRoute();
    }, [targetCrime]);

    const decodePolyline = (encoded) => {
        let poly = [];
        let index = 0,
            len = encoded?.length;
        let lat = 0,
            lng = 0;

        while (index < len) {
            let b,
                shift = 0,
                result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlat = result & 1 ? ~(result >> 1) : result >> 1;
            lat += dlat;
            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlng = result & 1 ? ~(result >> 1) : result >> 1;
            lng += dlng;
            poly.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
        }
        return poly;
    };

    const handleLogout = async () => {
        Alert.alert("Confirm Logout", "Do you want to logout?", [
            {
                text: "Yes",
                onPress: async () => {
                    try {
                        await signOut(user);
                        Alert.alert(
                            "Logged Out",
                            "You have successfully logged out."
                        );
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

    const handleAllCrimes = () => {
        if (!location || crimes.length === 0) return;

        let sortedCrimes;
        if (selectedRouting === "Time-based") {
            sortedCrimes = [...crimes].sort((a, b) => {
                const dateTimeA = moment(
                    a.date + " " + a.time,
                    "MM/DD/YYYY hh:mm:ss A"
                ).toDate();
                const dateTimeB = moment(
                    b.date + " " + b.time,
                    "MM/DD/YYYY hh:mm:ss A"
                ).toDate();
                return dateTimeA - dateTimeB;
            });
        } else if (selectedRouting === "Nearest Crime") {
            sortedCrimes = [...crimes].sort(
                (a, b) => distance(location, a) - distance(location, b)
            );
        }

        if (sortedCrimes && sortedCrimes.length > 0) {
            const waypoints = sortedCrimes
                .map((crime) => `${crime.latitude},${crime.longitude}`)
                .join("|");
            fetchRouteForMultipleCrimes(location, waypoints);
        }
    };

    const fetchRouteForMultipleCrimes = async (startLocation, waypoints) => {
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${
            startLocation.latitude
        },${startLocation.longitude}&destination=${waypoints
            .split("|")
            .pop()}&waypoints=optimize:true|${waypoints}&key=${API}`;

        try {
            const response = await axios.get(directionsUrl);
            const points = response.data.routes[0]?.overview_polyline.points;
            setRouteCoordinates(decodePolyline(points));
        } catch (error) {
            console.error("Failed to fetch route", error);
        }
    };

    const goToNextCrime = () => {
        if (crimeIndex + 1 >= crimes.length) {
            return;
        } else {
            setRenderedOnce(false);
            setCrimeIndex((prev) => (prev += 1));
        }
    };

    const goToPrevCrime = () => {
        if (crimeIndex - 1 < 0) {
            return;
        } else {
            setRenderedOnce(false);
            setCrimeIndex((prev) => (prev -= 1));
        }
    };

    const recenterMap = () => {
        if (userLocation) {
            setMapRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
            });
        }
    };

    useEffect(() => {
        if (userLocation && !mapRegion) {
            setMapRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
            });
        }
    }, [userLocation]);

    if (!location) return <LoadingScreen />;

    return (
        <View style={styles.container}>
            <SegmentControl
                options={[
                    { key: "Time-based", label: "Time-based Routing" },
                    { key: "Nearest Crime", label: "TSP Routing" },
                ]}
                onChange={(selectedRouting) =>
                    setSelectedRouting(selectedRouting)
                }
            />
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.mapStyle}
                initialRegion={{
                    latitude: location ? location.latitude : 37.78825,
                    longitude: location ? location.longitude : -122.4324,
                    latitudeDelta: 0.001,
                    longitudeDelta: 0.001,
                }}
                region={mapRegion}
            >
                <Marker
                    coordinate={{
                        latitude: userLocation
                            ? userLocation.latitude
                            : location.latitude,
                        longitude: userLocation
                            ? userLocation.longitude
                            : location.longitude,
                    }}
                    title="My Location"
                    anchor={{ x: 0.5, y: 0.5 }} // Ensures the marker pivots around the center
                    rotation={heading} // Optional: if you want the marker to rotate based on user heading
                >
                    <Image
                        source={require("../../assets/images/patrol.png")}
                        style={{ width: 50, height: 50 }}
                        resizeMode="contain"
                    />
                </Marker>
                {crimes.map((crime) => (
                    <Marker
                        key={crime.id}
                        coordinate={{
                            latitude: crime.latitude,
                            longitude: crime.longitude,
                        }}
                        title={crime.crime.toUpperCase()}
                        description={crime.date + " " + crime.time}
                        pinColor="blue" // Different color to distinguish crime locations
                    />
                ))}
                {routeCoordinates?.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeWidth={2}
                        strokeColor="red"
                    />
                )}
            </MapView>

            {selectedRouting !== "Routes" && (
                <View style={styles.crimeNav}>
                    <TouchableOpacity
                        style={[styles.crimeNavPressable, styles.prev]}
                        onPress={handleAllCrimes}
                    >
                        <Text style={styles.crimeNavTxt}>All Crimes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.crimeNavPressable, styles.prev]}
                        onPress={goToPrevCrime}
                    >
                        <Text style={styles.crimeNavTxt}>PREV</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.crimeNavPressable, styles.next]}
                        onPress={goToNextCrime}
                    >
                        <Text style={styles.crimeNavTxt}>NEXT</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.nav}>
                <TouchableOpacity onPress={recenterMap} style={styles.navItem}>
                    <Image
                        source={require("../../assets/images/map.png")}
                        style={styles.navImg}
                    />
                    <Text style={[styles.navTxt]}>Recenter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
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

export default RenderMap;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    mapStyle: {
        width: "100%",
        height: Dimensions.get("window").height - 30,
    },
    buttonContainer: {
        flexDirection: "row",
        position: "absolute",
        top: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 10,
        zIndex: 1,
        backgroundColor: "#FFFFFFAA",
        borderRadius: 20,
        overflow: "hidden",
    },
    button: {
        padding: 10,
        margin: 5,
        backgroundColor: "#F0F0F0",
        borderWidth: 1,
        borderColor: "#DDD",
    },
    buttonText: {
        color: "#333",
    },
    nav: {
        flex: 1,
        width: "100%",
        height: 40,
        backgroundColor: "#01042D",
        flexDirection: "row",
        justifyContent: "space-evenly",
        position: "absolute",
        bottom: 0,
        height: 70,
    },
    navItem: {
        justifyContent: "center",
        alignItems: "center",
    },

    navImg: {
        height: 25,
        aspectRatio: 4 / 4,
    },
    navTxt: {
        color: "white",
    },

    crimeNav: {
        position: "absolute",
        bottom: 100,
        flexDirection: "row",
        width: "90%",
        justifyContent: "space-evenly",
        backgroundColor: "white",
        borderRadius: 10,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#01042D",
    },
    crimeNavPressable: {
        padding: 10,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    crimeNavTxt: {
        color: "#01042D",
        fontWeight: "600",
    },
});
