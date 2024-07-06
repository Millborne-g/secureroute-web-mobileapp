import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    Platform,
    TouchableOpacity,
    Image,
    Animated,
    Alert,
    Dimensions,
} from "react-native";

import SegmentControl from "../components/SegmentControl";
import MapView, {
    Marker,
    Polyline,
    PROVIDER_GOOGLE,
    Circle,
} from "react-native-maps";
import DropDownPicker from "react-native-dropdown-picker";

import * as Location from "expo-location";
import { getDatabase, ref, onValue, set, push } from "firebase/database";
import { signOut, getAuth } from "firebase/auth";
import app from "../../firebase";
import axios from "axios";
import moment from "moment";
import LoadingScreen from "./LoadingScreen";

// socket
import io from "socket.io-client";
const socket = io("https://taweng-sever.onrender.com/");

// const RenderMap = ({ navigation }) => {
const RenderMap = ({ setLogin }) => {
    const apiKey = "AIzaSyC3kEbJVHO9eZbUODtJwjJLkOggPzad_ZM";
    const [location, setLocation] = useState(null);
    const [crimes, setCrimes] = useState([]);
    const [allCrimes, setAllCrimes] = useState([]);
    const [crimesDisplay, setCrimesDisplay] = useState(); // Using sample data
    const [heading, setHeading] = useState(0);
    const [selectedRouting, setSelectedRouting] = useState("Nearest Crime");
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [targetCrime, setTargetCrime] = useState(null);
    const [renderedOnce, setRenderedOnce] = useState(false);
    const [crimeIndex, setCrimeIndex] = useState(0);
    const [flag, setFlag] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(moment().week());
    const [weekRange, setWeekRange] = useState("");
    const [mapRegion, setMapRegion] = useState(null); // New state for map region
    const [openDropdown, setOpenDropdown] = useState(false);
    const [valueDropdown, setValueDropdown] = useState("crimes");
    const [items, setItems] = useState([
        { label: "Crimes", value: "crimes" },
        { label: "Manual Pin", value: "manualPin" },
    ]);
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
                    socket.emit("sendLocation", {
                        longitude: newLocation.coords.longitude,
                        latitude: newLocation.coords.latitude,
                    });
                }
            );

            Location.watchHeadingAsync((newHeading) => {
                setHeading(newHeading.trueHeading);
            });
            const crimeRef = ref(db, "crimes");
            onValue(crimeRef, (snapshot) => {
                setAllCrimes([]);
                const data = snapshot.val();
                if (data) {
                    const formattedData = Object.keys(data).map((key) => ({
                        id: key,
                        ...data[key],
                    }));

                    if (valueDropdown === "manualPin") {
                        const filteredCrimes = formattedData.filter(
                            (crime) => crime.crime === "Manually Added"
                        );
                        setAllCrimes(filteredCrimes);
                    } else {
                        const filteredCrimes = formattedData.filter(
                            (crime) => crime.crime !== "Manually Added"
                        );
                        setAllCrimes(filteredCrimes);
                    }
                }
            });
        })();
    }, [valueDropdown]);

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
        // Set or reset the target crime when the user changes the routing method or on initial load
        if (!location || crimes.length === 0) return;

        const initialCrimeSetup = () => {
            let calculatedCrime;

            if (selectedRouting === "Time-based") {
                // Sort crimes by date and time, then select the earliest one
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
                calculatedCrime = sortedCrimes[crimeIndex]; // Select the crime based on index
            } else if (selectedRouting === "Nearest Crime") {
                // Sort crimes by distance from the current location, then select the nearest one
                const sortedCrimes = [...crimes].sort(
                    (a, b) => distance(location, a) - distance(location, b)
                );
                calculatedCrime = sortedCrimes[crimeIndex]; // Select the crime based on index
            }

            // Prevent initializing multiple times unnecessarily
            if (!renderedOnce) {
                setTargetCrime(calculatedCrime || crimes[0]);
            }
            setRenderedOnce(true);
        };

        initialCrimeSetup();
    }, [selectedRouting, location, crimes, flag, crimeIndex, renderedOnce]);

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
            .pop()}&waypoints=optimize:true|${waypoints}&key=${apiKey}`;

        try {
            const response = await axios.get(directionsUrl);
            const points = response.data.routes[0]?.overview_polyline.points;
            setRouteCoordinates(decodePolyline(points));
        } catch (error) {
            console.error("Failed to fetch route", error);
        }
    };

    useEffect(() => {
        setCrimeIndex(0);
        setRenderedOnce(false);
        setFlag(!flag);
    }, [selectedRouting]);

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

    useEffect(() => {
        if (!targetCrime) return;
        const fetchRoute = async () => {
            // alert(`${targetCrime.crime} || ${selectedRouting}`);
            const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${targetCrime.latitude},${targetCrime.longitude}&key=${apiKey}`;
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
                        const logRef = ref(db, `logs/${user.currentUser.uid}`);
                        await push(logRef, {
                            latitude: location.latitude,
                            longitude: location.longitude,
                            timestamp: new Date().toISOString(),
                            status: "logout",
                            email: user.currentUser.email,
                        });
                        socket.disconnect();
                        await signOut(user);
                        Alert.alert(
                            "Logged Out",
                            "You have successfully logged out."
                        );
                        // navigation.replace("Login");
                        setLogin(false);
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

    //Filter by week
    const filterCrimes = (crimes, week) => {
        const startOfWeek = moment().isoWeek(week).isoWeekday(1).startOf("day");
        const endOfWeek = moment().isoWeek(week).isoWeekday(7).endOf("day");

        const filtered = crimes.filter((crime) => {
            const crimeDate = moment(crime.date, "YYYY-MM-DD"); // Updated date format
            return crimeDate.isBetween(startOfWeek, endOfWeek, null, "[]");
        });
        let convertFiltered = convertLatLongToNumbers(filtered);
        const mergedPoints = mergeClosePoints(convertFiltered);
        let convertMergedPoints = convertLatLongToNumbers(mergedPoints);
        setCrimesDisplay(convertFiltered);
        setCrimes(convertMergedPoints);
        setWeekRange(
            `${startOfWeek.format("MMMM D, YYYY")} to ${endOfWeek.format(
                "MMMM D, YYYY"
            )}`
        );
    };

    const handlePrevWeek = () => {
        setValueDropdown("crimes");
        const prevWeek = currentWeek - 1;
        setCurrentWeek(prevWeek);
        filterCrimes(allCrimes, prevWeek);
        setCrimeIndex(0);
        setRenderedOnce(false);
        setFlag(!flag);
    };

    const handleNextWeek = () => {
        setValueDropdown("crimes");
        const nextWeek = currentWeek + 1;
        setCurrentWeek(nextWeek);
        filterCrimes(allCrimes, nextWeek);
        setCrimeIndex(0);
        setRenderedOnce(false);
        setFlag(!flag);
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
        if (allCrimes) {
            filterCrimes(allCrimes, currentWeek);
            setCrimeIndex(0);
            setRenderedOnce(false);
            setFlag(!flag);
        }
    }, [allCrimes]);

    // merge closed location:
    const haversineDistance = (point1, point2) => {
        var R = 6371e3; // Radius of the Earth in meters
        var lat1Rad = (point1.latitude * Math.PI) / 180; // Convert degrees to radians
        var lat2Rad = (point2.latitude * Math.PI) / 180;
        var deltaLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
        var deltaLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
        var deltaAlt = (point2.altitude || 0) - (point1.altitude || 0); // Calculate altitude difference

        var a =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1Rad) *
                Math.cos(lat2Rad) *
                Math.sin(deltaLon / 2) *
                Math.sin(deltaLon / 2);

        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var distance = R * c; // Distance in meters

        // Calculate the vertical distance
        var verticalDistance = Math.abs(deltaAlt);

        // Return the maximum of horizontal and vertical distances
        return Math.max(distance, verticalDistance);
    };

    // Function to merge points within 100 meters
    function mergeClosePoints(points) {
        var mergedPoints = [];
        var visited = new Array(points.length).fill(false);

        for (var i = 0; i < points.length; i++) {
            if (!visited[i]) {
                visited[i] = true;
                var closePoints = [points[i]];
                var earliestDate = points[i].date;
                var earliestTime = points[i].time;

                for (var j = i + 1; j < points.length; j++) {
                    if (haversineDistance(points[i], points[j]) <= 100) {
                        closePoints.push(points[j]);
                        visited[j] = true;

                        const currentDateTime = moment(
                            points[j].date + " " + points[j].time,
                            "MM/DD/YYYY hh:mm:ss A"
                        );
                        const earliestDateTime = moment(
                            earliestDate + " " + earliestTime,
                            "MM/DD/YYYY hh:mm:ss A"
                        );

                        if (currentDateTime.isBefore(earliestDateTime)) {
                            earliestDate = points[j].date;
                            earliestTime = points[j].time;
                        }
                    }
                }

                // Calculate the average latitude and longitude of the close points
                var avgLat =
                    closePoints.reduce(
                        (sum, point) => sum + parseFloat(point.latitude),
                        0
                    ) / closePoints.length;
                var avgLon =
                    closePoints.reduce(
                        (sum, point) => sum + parseFloat(point.longitude),
                        0
                    ) / closePoints.length;

                mergedPoints.push({
                    latitude: avgLat,
                    longitude: avgLon,
                    earliestDate: earliestDate,
                    earliestTime: earliestTime,
                });
            }
        }

        return mergedPoints;
    }

    function convertLatLongToNumbers(data) {
        return data.map((item) => {
            item.latitude =
                typeof item.latitude === "string"
                    ? parseFloat(item.latitude)
                    : item.latitude;
            item.longitude =
                typeof item.longitude === "string"
                    ? parseFloat(item.longitude)
                    : item.longitude;
            return item;
        });
    }

    if (!location) return <LoadingScreen />;

    return (
        <View style={styles.container}>
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
                // region={{
                //     latitude: location.latitude,
                //     longitude: location.longitude,
                //     latitudeDelta: 0.015,
                //     longitudeDelta: 0.015,
                // }}
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
                {crimes.map((crime, index) => (
                    <Marker
                        key={index}
                        coordinate={{
                            latitude: crime.latitude,
                            longitude: crime.longitude,
                        }}
                        // title={crime.crime.toUpperCase()}
                        description={crime.date + " " + crime.time}
                    >
                        <View
                            style={{
                                width: 5,
                                height: 5,
                                backgroundColor: "red",
                                borderRadius: 5,
                            }}
                        />
                    </Marker>
                ))}
                {routeCoordinates?.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeWidth={2}
                        strokeColor="blue"
                    />
                )}

                {crimes.map((crime, index) => (
                    <Circle
                        key={index}
                        center={{
                            latitude: crime.latitude,
                            longitude: crime.longitude,
                        }}
                        radius={100} // Radius in meters
                        strokeWidth={2}
                        strokeColor="rgba(235, 64, 52, 0.5)"
                        fillColor="rgba(235, 64, 52, 0.1)"
                    />
                ))}

                {crimesDisplay.map((crime) => (
                    <Marker
                        key={crime.id}
                        coordinate={{
                            latitude: crime.latitude,
                            longitude: crime.longitude,
                        }}
                        title={crime.type}
                        description={`${crime.date} ${crime.time}`}
                        pinColor="black"
                        opacity={1}
                    >
                        <View
                            style={{
                                width: 5,
                                height: 5,
                                backgroundColor: "black",
                                borderRadius: 5,
                            }}
                        />
                    </Marker>
                ))}
            </MapView>

            <View
                style={{
                    position: "absolute",
                    top: 45,
                    height: "10px",
                    width: "110%",
                }}
            >
                {/* <SegmentControl
                    options={[
                        { key: "Time-based", label: "Time-based Routing" },
                        { key: "Nearest Crime", label: "TSP Routing" },
                    ]}
                    onChange={(selectedRouting) =>
                        setSelectedRouting(selectedRouting)
                    }
                /> */}
                <View
                    style={{
                        flexDirection: "column",
                        width: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <View style={{ width: "80%" }}>
                        <DropDownPicker
                            open={openDropdown}
                            value={valueDropdown}
                            items={items}
                            setOpen={setOpenDropdown}
                            setValue={setValueDropdown}
                            setItems={setItems}
                            style={{ height: "10px", width: "100%" }}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.dateRangeContainer} gap={5}>
                <TouchableOpacity
                    style={styles.weekbutton}
                    onPress={handlePrevWeek}
                >
                    <Text style={styles.weekButtonText}>{"<"}</Text>
                </TouchableOpacity>
                <Text style={styles.weekText}>{weekRange}</Text>
                <TouchableOpacity
                    style={styles.weekbutton}
                    onPress={handleNextWeek}
                >
                    <Text style={styles.weekButtonText}>{">"}</Text>
                </TouchableOpacity>
            </View>

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
        backgroundColor: "#EEEEEE",
        position: "relative",
    },
    mapStyle: {
        width: "100%",
        height: Dimensions.get("window").height - 30,
    },
    buttonContainer: {
        flexDirection: "row",
        position: "absolute",
        // top: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 10,
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
        bottom: 80,
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
    dateRangeContainer: {
        flexDirection: "row",
        position: "absolute",
        // top: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 10,
        zIndex: 1,
        bottom: 130,
        backgroundColor: "white",
        borderRadius: 10,
        overflow: "hidden",
        alignItems: "center",
        height: 50,
        borderWidth: 1,
        borderColor: "#01042D",
        gap: 1,
    },
    weekbutton: {
        height: "100%",
        width: 35,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0d6efd",
    },
    weekText: {
        fontSize: 16,
        fontWeight: "bold",
    },

    weekButtonText: {
        fontSize: 20,
        color: "white",
    },
});
