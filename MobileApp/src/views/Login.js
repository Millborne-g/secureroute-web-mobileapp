import {
    StyleSheet,
    Text,
    View,
    Platform,
    StatusBar,
    Image,
    KeyboardAvoidingView,
    TextInput,
    Button,
    Pressable,
    Alert,
    TouchableOpacity
} from "react-native";
import React, { useEffect, useState } from "react";

import app, { db } from "../../firebase";
import { signInWithEmailAndPassword, getAuth, signOut } from "firebase/auth";

import logo from "../../assets/logo.png";
import { getDatabase, push, ref, set } from "firebase/database";
import * as Location from "expo-location";
// const Auth = ({ navigation }) => {
const Auth = ({ setLogin }) => {
    const [data, setData] = useState({
        email: "",
        password: "",
    });

    useEffect(() => {
        setData({
            email: "",
            password: "",
        });
    }, []);

    const handleChange = (text, name) => {
        setData({ ...data, [name]: text });
    };

    const handleSubmit = async () => {
        const { email, password } = data;
        const location = await getLocation();

        if (email == "" || password == "") {
            Alert.alert("Warning", "All fields are required");
            return;
        }

        if (email !== "mobilepatrol@gmail.com") {
            Alert.alert("Warning", "Invalid Email");
            return;
        }

        if (!location) {
            Alert.alert("Error", "Permit to location denied");
            return;
        }

        const auth = getAuth(app);
        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCred) => {
                const user = userCred.user;

                if (user) {
                    if (location) {
                        const db = getDatabase(app);
                        const logRef = ref(db, `logs/${user.uid}`);

                        await push(logRef, {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            timestamp: new Date().toISOString(),
                            status: "login",
                            email: user.email,
                        });
                    }

                    // navigation.replace("Map");
                    setLogin(true);
                }
            })
            .catch((error) => {
                const err = error.code;
                const errMessage = error.message;

                Alert.alert("Something went wrong", errMessage);
            });
    };

    async function getLocation() {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Permission Denied",
                "Allow location access to continue"
            );
            return;
        }
        return await Location.getCurrentPositionAsync({});
    }
    return (
        <View style={styles.container}>
            <View style={styles.logo}>
                <Image source={logo} style={styles.logoImg} />

                <View style={{ alignItems: "center", gap: 10 }}>
                    <Text
                        style={{
                            fontSize: 30,
                            fontWeight: 600,
                            color: "#01042D",
                        }}
                    >
                        SecureRoute
                    </Text>
                    <Text>Login to continue</Text>
                </View>
            </View>

            <KeyboardAvoidingView style={styles.keyboard}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        placeholder="Email"
                        style={styles.input}
                        value={data.email}
                        onChangeText={(text) => handleChange(text, "email")}
                    />
                    <TextInput
                        placeholder="Password"
                        secureTextEntry
                        style={styles.input}
                        value={data.password}
                        onChangeText={(text) => handleChange(text, "password")}
                    />
                </View>
                <View style={styles.buttons}>
                    <View
                        style={{
                            width: "100%",
                        }}
                    >
                        {/* <Button title="LOGIN" onPress={handleSubmit} /> */}
                        
                        <TouchableOpacity onPress={handleSubmit} style={{padding: 15, borderRadius: 10, alignItems: "center", backgroundColor: "#007AFF"}}>
                            <Text style={{color: "#FFFFFF"}}>Login</Text>
                        </TouchableOpacity>
                    </View>
                    {/**<Pressable onPress={() => navigation.replace("Register")}>
                        <Text
                        style={{
                            color: "white",
                            textAlign: "center",
                        }}
                        >
                        Create an account
                        </Text>
                    </Pressable>
                    */}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default Auth;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // marginTop: Platform.OS == "android" ? StatusBar.currentHeight : 0,
        // marginTop: StatusBar.currentHeight,
        flexDirection: "column",
        // backgroundColor: "#01042D",
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
    },

    logoImg: {
        resizeMode: "contain",
        height: "80%",
    },

    logo: {
        // flex: 0.7,
        alignItems: "center",
        justifyContent: "center",
        height: 210,
        gap: 10,
        marginBottom: 30,
    },
    keyboard: {
        // flex: 1,
        alignItems: "center"
    },
    inputWrapper: {
        flexDirection: "column",
        width: "90%",
        paddingHorizontal: 10,
    },
    input: {
        backgroundColor: "#F2F2F2",
        width: "100%",
        fontSize: 15,
        padding: 15,
        marginVertical: 10,
        borderRadius: 10,
    },

    buttons: {
        marginTop: 10,
        paddingHorizontal: 10,
        gap: 50,
        alignItems: "center",
        width: "90%"
    },
});
