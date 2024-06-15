import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
} from "react-native";

const SegmentControl = ({ options, onChange }) => {
  const [selectedOption, setSelectedOption] = useState(options[0].key);

  useEffect(() => {
    onChange(selectedOption);
  }, [selectedOption]);

  return (
    <View style={styles.segmentContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.segment,
            selectedOption === option.key ? styles.segmentSelected : {},
          ]}
          onPress={() => setSelectedOption(option.key)}
        >
          <Text
            style={[
              styles.segmentText,
              selectedOption === option.key ? styles.segmentTextSelected : {},
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  segmentContainer: {
    flexDirection: "row",
    width: "80%",
    backgroundColor: "#01042D",
    borderRadius: 20,
    marginVertical: 10,
    alignSelf: "center",
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight + 40 : 40,
  },
  segment: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    borderRadius: 18,
  },
  segmentSelected: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  segmentText: {
    fontSize: 8,
    color: "white",
  },
  segmentTextSelected: {
    color: "#000",
    fontWeight: "bold",
  },
});

export default SegmentControl;
