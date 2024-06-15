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
} from "react-native";
import React, { useEffect, useState } from "react";

import logo from "../../assets/images/logo.png";
import app from "../../firebase";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
const Register = ({ navigation }) => {
  const [datas, setDatas] = useState({
    email: "",
    password: "",
    cpass: "",
  });

  useEffect(() => {
    setDatas({ email: "", password: "", cpass: "" });
  }, []);

  const handleChange = (text, name) => {
    setDatas({ ...datas, [name]: text });
  };

  const handleSubmit = () => {
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const { email, password, cpass } = datas;

    if (!email.length || !password.length || !cpass.length) {
      Alert.alert("Warning", "All Fields are required");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please Enter a valid email address");
      return;
    }

    if (password !== cpass) {
      Alert.alert("Passowrds Mismatch", "Passwords doesnt matched");
      return;
    }

    const auth = getAuth(app);

    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCred) => {
        if (userCred.user) {
          await signOut(auth).then(() => {
            Alert.alert("Success", "Account Created");
            navigation.replace("Login");
          });
        }
      })
      .catch((error) => {
        const err = error.code;
        const errMessage = error.message;
        Alert.alert("Something went wrong", errMessage);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Image source={logo} style={styles.logoImg} />
      </View>

      <KeyboardAvoidingView style={styles.keyboard}>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={datas.email}
            onChangeText={(text) => handleChange(text, "email")}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={datas.password}
            onChangeText={(text) => handleChange(text, "password")}
          />
          <TextInput
            placeholder="Confirm Password"
            secureTextEntry
            style={styles.input}
            value={datas.cpass}
            onChangeText={(text) => handleChange(text, "cpass")}
          />
        </View>
        <View style={styles.buttons}>
          <View
            style={{
              width: "50%",
            }}
          >
            <Button title="REGISTER" onPress={handleSubmit} />
          </View>
          <Pressable onPress={() => navigation.replace("Login")}>
            <Text
              style={{
                color: "white",
                textAlign: "center",
              }}
            >
              I have an account
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,

    marginTop: Platform.OS == "android" ? StatusBar.currentHeight : 0,
    flexDirection: "column",
    backgroundColor: "#01042D",
    justifyContent: "center",
  },

  logoImg: {
    resizeMode: "contain",
    height: "100%",
    aspectRatio: 4 / 4,
  },

  logo: {
    flex: 0.7,

    alignItems: "center",
  },
  keyboard: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: "column",
    width: "100%",

    paddingHorizontal: 10,
  },
  input: {
    backgroundColor: "white",
    width: "100%",
    fontSize: 15,
    padding: 15,
    marginVertical: 15,
  },

  buttons: {
    marginTop: 10,
    paddingHorizontal: 10,
    gap: 50,
    alignItems: "center",
  },
});
