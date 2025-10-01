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
import { useDispatch, useSelector } from "react-redux";
import { saveProgress, nextStep } from "../store/slices/signupSlice";

const VendorSignupScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { ownerName, shopName, email, password } = useSelector(
    (state) => state.signup
  );

  const handleNextStep = () => {
    // Validate inputs
    if (!ownerName || !shopName || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Save progress and move to next step
    dispatch(saveProgress({ ownerName, shopName, email, password }));
    dispatch(nextStep());
    navigation.navigate("SignupStep2");
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
        <Image
          source={require("../assets/splash-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.formContainer}>
          <Text style={styles.headerText}>Create Vendor Account</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Owner Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter owner's full name"
              placeholderTextColor="#333333"
              value={ownerName}
              onChangeText={(text) =>
                dispatch(saveProgress({ ownerName: text }))
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Shop Or Business Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your Shop Or Business Name"
              placeholderTextColor="#333333"
              value={shopName}
              onChangeText={(text) =>
                dispatch(saveProgress({ shopName: text }))
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#333333"
              value={email}
              onChangeText={(text) => dispatch(saveProgress({ email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#333333"
              value={password}
              onChangeText={(text) =>
                dispatch(saveProgress({ password: text }))
              }
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNextStep}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
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
    paddingVertical: 40,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  formContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
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
    marginBottom: 20,
    textAlign: "center",
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
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fafafa",
    color: "#333",
  },
  button: {
    backgroundColor: "#B2D1E5",
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "#333",
    fontSize: 14,
  },
  loginLink: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  version: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default VendorSignupScreen;
