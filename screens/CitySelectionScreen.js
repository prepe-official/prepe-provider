import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import BlueButton from "../components/BlueButton";
import DropDownPicker from "react-native-dropdown-picker";
import { useDispatch } from "react-redux";
import { setCity } from "../store/slices/citySlice";
import { saveProgress } from "../store/slices/signupSlice";
import axios from "axios";

const majorCities = ["Indore", "Khandwa", "Bhopal", "Gwalior", "Jabalpur"];

export default function CitySelectionScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const [selectedCity, setSelectedCity] = useState(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(
    majorCities.map((city, index) => ({
      label: city,
      value: city,
      disabled: index >= 2, // Disable items at index 2 and above (last three cities)
    }))
  );

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/configuration/get`
        );

        if (
          data?.success &&
          Array.isArray(data?.configuration?.supportedCities)
        ) {
          const cityItems = data.configuration.supportedCities.map((city) => ({
            label: city.isActive === false ? `${city.name} (Coming Soon)` : city.name,
            value: city.name,
            disabled: city.isActive === false,
          }));
          if (cityItems.length > 0) {
            setItems(cityItems);
          }
        }
      } catch (err) {
        // Silently fall back to default items without altering UI
      }
    };

    fetchCities();
  }, []);

  const handleContinue = () => {
    if (selectedCity) {
      // Save selected city to Redux
      dispatch(setCity(selectedCity));

      // Also save to signup slice if we're in signup flow
      dispatch(saveProgress({ city: selectedCity }));

      // Navigate to Main screen with the selected city
      navigation.navigate("Login");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Image
        source={require("../assets/city.png")}
        style={styles.backgroundBlob}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Which city are you{"\n"}based of?</Text>

        <View style={styles.dropdownContainer}>
          <DropDownPicker
            open={open}
            value={selectedCity}
            items={items}
            setOpen={setOpen}
            setValue={setSelectedCity}
            setItems={setItems}
            placeholder="Select City"
            style={styles.dropdown}
            textStyle={styles.dropdownText}
            dropDownContainerStyle={styles.dropdownList}
            listItemContainerStyle={styles.dropdownItem}
            placeholderStyle={styles.placeholderStyle}
            disabledStyle={styles.disabledItem}
            disabledItemLabelStyle={styles.disabledItemText}
            zIndex={3000}
            zIndexInverse={1000}
          />
        </View>

        <BlueButton
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedCity}
          style={styles.continueButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backgroundBlob: {
    position: "absolute",
    width: "100%",
    height: "80%",
    top: "8%",
    right: "0",
    // resizeMode: "cover",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 30,
  },
  dropdownContainer: {
    width: "100%",
    position: "relative",
    zIndex: 2000,
    marginBottom: 30,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderColor: "#E0E0E0",
    borderRadius: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderColor: "#E0E0E0",
    borderRadius: 10,
  },
  dropdownItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  placeholderStyle: {
    color: "#555",
  },
  disabledItem: {
    backgroundColor: "#F5F5F5",
  },
  disabledItemText: {
    color: "#AAAAAA",
  },
  continueButton: {
    width: "100%",
    position: "absolute",
    bottom: 35,
  },
});
