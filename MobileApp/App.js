import "react-native-gesture-handler";

import { useState, useEffect } from "react";
import { View , StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "./firebase";

import RenderMap from "./src/views/RenderMap";
import Login from "./src/views/Login";
import Register from "./src/views/Register";
import LoadingScreen from "./src/views/LoadingScreen";

const Stack = createStackNavigator();
export default function App() {
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        setUser(user);
        setLogin(true);
      } else {
        // User is signed out
        setUser(null);
        setLogin(false);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.error("Error in unsubscribe:", error);
      }
    };
  }, []);

  if (loading) {
    return <LoadingScreen />; // Or some other loading indicator
  }
  return (
    // <NavigationContainer>
    //   <Stack.Navigator screenOptions={{ headerShown: false }}>
    //     {/* {user ? (
    //       <Stack.Screen name="Map" component={RenderMap} />
    //     ) : (
    //       <Stack.Screen name="Login" component={Login} />
    //     )}

    //     <Stack.Screen name="Register" component={Register} /> */}
    //     <Stack.Screen name="Login" component={Login} />
    //   </Stack.Navigator>
    // </NavigationContainer>
    <View style={styles.container}>
      {!login? 
        <Login setLogin={setLogin} />
        :
        <RenderMap setLogin={setLogin} />
      }
    
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: "center",
    // justifyContent: "center",
  },
});
