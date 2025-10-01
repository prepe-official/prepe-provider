import React, { useState } from "react";
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
import {
  saveProgress,
  nextStep,
  resetToStep,
} from "../store/slices/signupSlice";

// This component is responsible for collecting the vendor's bank details.
const SignupScreenStep3 = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    ownerName,
    shopName,
    email,
    password,
    phone,
    address,
    city,
    ifscCode,
    accountNumber,
    bankHolderName,
    upiId,
  } = useSelector((state) => state.signup);

  /**
   * Handles the navigation to the next step.
   * It validates the required inputs and passes all accumulated data forward.
   */
  const handleNextStep = () => {
    // Validate that required bank details are filled
    if (!ifscCode || !accountNumber || !bankHolderName || !upiId) {
      Alert.alert("Error", "Please fill in all required bank details.");
      return;
    }

    // Save progress and move to next step
    dispatch(saveProgress({ ifscCode, accountNumber, bankHolderName, upiId }));
    dispatch(nextStep());
    navigation.navigate("SignupStep4");
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
      >
        {/* Logo Image */}
        <Image
          source={require("../assets/splash-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.formContainer}>
          {/* Header */}
          <Text style={styles.headerText}>Bank Details</Text>
          <Text style={styles.subMessage}>
            Provide details to receive payments from your subscribers
          </Text>
          <Text style={styles.stepHeader}>Step 3 of 4</Text>

          {/* Bank Holder Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bank Holder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter account holder's name"
              placeholderTextColor="#666"
              value={bankHolderName}
              onChangeText={(text) =>
                dispatch(saveProgress({ bankHolderName: text }))
              }
            />
          </View>

          {/* Account Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter bank account number"
              placeholderTextColor="#666"
              value={accountNumber}
              onChangeText={(text) =>
                dispatch(saveProgress({ accountNumber: text }))
              }
              keyboardType="number-pad"
            />
          </View>

          {/* IFSC Code Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>IFSC Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter bank IFSC code"
              placeholderTextColor="#666"
              value={ifscCode}
              onChangeText={(text) =>
                dispatch(saveProgress({ ifscCode: text }))
              }
              autoCapitalize="characters"
            />
          </View>

          {/* UPI ID Input (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>UPI ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your UPI ID"
              placeholderTextColor="#666"
              value={upiId}
              onChangeText={(text) => dispatch(saveProgress({ upiId: text }))}
              autoCapitalize="none"
            />
          </View>

          {/* Next Button */}
          <TouchableOpacity style={styles.button} onPress={handleNextStep}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>

          {/* Go Back Link */}
          {/* <View style={styles.loginContainer}>
            <TouchableOpacity
              onPress={() => {
                dispatch(resetToStep(1));
                navigation.goBack();
              }}
            >
              <Text style={styles.loginLink}>Go Back</Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </ScrollView>
      <Text style={styles.version}>Version 1.0.0</Text>
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
    paddingVertical: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  formContainer: {
    width: "88%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  headerText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 5,
    textAlign: "center",
  },
  stepHeader: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A5568",
    textAlign: "center",
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#F7FAFC",
    color: "#2D3748",
  },
  button: {
    backgroundColor: "#76c8f2",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonText: {
    color: "#1A202C",
    fontSize: 16,
    fontWeight: "700",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginLink: {
    color: "#2b6cb0",
    fontSize: 14,
    fontWeight: "700",
  },
  version: {
    position: "absolute",
    bottom: 15,
    alignSelf: "center",
    color: "#4A5568",
    fontSize: 12,
    fontWeight: "500",
  },
  subMessage: {
    fontSize: 14,
    color: "#4A5568",
    textAlign: "center",
    marginBottom: 15,
  },
});

export default SignupScreenStep3;
