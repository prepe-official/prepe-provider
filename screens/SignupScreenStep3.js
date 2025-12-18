import React, { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  View,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { saveProgress, nextStep, resetToStep } from "../store/slices/signupSlice";
import { setCity } from "../store/slices/citySlice";
import DropDownPicker from "react-native-dropdown-picker";
import axios from "axios";

const SignupScreenStep3 = ({ navigation }) => {
  const dispatch = useDispatch();
  const { shopName, city, address } = useSelector((state) => state.signup);

  // City dropdown state
  const [open, setOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(city || null);
  const [items, setItems] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setLoadingCities(true);
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/configuration/get`
      );

      if (data.success && data.configuration.supportedCities) {
        const cityItems = data.configuration.supportedCities.map((c) => ({
          label: c.isActive === false ? `${c.name} (Coming Soon)` : c.name,
          value: c.name,
          disabled: c.isActive === false,
        }));
        setItems(cityItems);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      Alert.alert("Error", "Failed to load cities. Please check your internet.");
    } finally {
      setLoadingCities(false);
    }
  };

  const handleNext = () => {
    if (!selectedCity) {
      return Alert.alert("Error", "Please select a city");
    }
    if (!address?.trim()) {
      return Alert.alert("Error", "Please enter your address");
    }

    // Save progress
    dispatch(saveProgress({
      shopName: shopName || "",
      city: selectedCity,
      address,
    }));
    dispatch(setCity(selectedCity));
    dispatch(nextStep());
    navigation.navigate("SignupStep4");
  };

  const handleGoBack = () => {
    dispatch(resetToStep(1));
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#B2D1E5" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <Image
          source={require("../assets/splash-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.formContainer}>
          <Text style={styles.headerText}>Create New Account</Text>
          <Text style={styles.subHeaderText}>Provide Business Detail</Text>

          {/* Shop/Business Name Input (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Shop/Business Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your business name"
              placeholderTextColor="#999"
              value={shopName}
              onChangeText={(text) => dispatch(saveProgress({ shopName: text }))}
            />
          </View>

          {/* City Selection */}
          <View style={[styles.inputContainer, { zIndex: 3000 }]}>
            <Text style={styles.label}>Select City</Text>
            <DropDownPicker
              open={open}
              value={selectedCity}
              items={items}
              setOpen={setOpen}
              setValue={setSelectedCity}
              setItems={setItems}
              placeholder={loadingCities ? "Loading cities..." : "Select City"}
              style={styles.dropdown}
              textStyle={styles.dropdownText}
              dropDownContainerStyle={styles.dropdownList}
              listItemContainerStyle={styles.dropdownItem}
              placeholderStyle={{ color: "#999" }}
              disabledStyle={styles.disabledItem}
              disabledItemLabelStyle={styles.disabledItemText}
              disabled={loadingCities}
              listMode="SCROLLVIEW"
              zIndex={3000}
              zIndexInverse={1000}
            />
          </View>

          {/* Address Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.addressInput]}
              placeholder="Enter your address"
              placeholderTextColor="#999"
              value={address}
              onChangeText={(text) => dispatch(saveProgress({ address: text }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.goBackButton}
              onPress={handleGoBack}
            >
              <Text style={styles.goBackButtonText}>Go back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B2D1E5",
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  formContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fafafa",
    color: "#333",
  },
  addressInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  dropdown: {
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownList: {
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  dropdownItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  disabledItem: {
    backgroundColor: "#F5F5F5",
  },
  disabledItemText: {
    color: "#999999",
    fontStyle: "italic",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
  goBackButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  goBackButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  nextButton: {
    flex: 1,
    backgroundColor: "#B2D1E5",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  nextButtonText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
  },
});

export default SignupScreenStep3;
