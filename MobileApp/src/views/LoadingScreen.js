import { View, Text } from "react-native";
import React from "react";

const LoadingScreen = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#01042D",
      }}
    >
      <Text
        style={{
          textAlign: "center",
          fontSize: 20,
          fontWeight: "bold",
          color: "white",
        }}
      >
        Loading...
      </Text>
    </View>
  );
};

export default LoadingScreen;
