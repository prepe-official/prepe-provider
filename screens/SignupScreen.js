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
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { saveProgress, nextStep } from "../store/slices/signupSlice";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const VendorSignupScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { ownerName, email, phone } = useSelector((state) => state.signup);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyPhone = async () => {
    // Validate inputs
    if (!ownerName?.trim()) {
      return Alert.alert("Error", "Please enter your username");
    }
    if (!email?.trim()) {
      return Alert.alert("Error", "Please enter your email");
    }
    if (!phone?.trim()) {
      return Alert.alert("Error", "Please enter your contact number");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Alert.alert("Error", "Please enter a valid email address");
    }

    // Basic phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
      return Alert.alert("Error", "Please enter a valid 10-digit phone number");
    }

    setIsLoading(true);
    try {
      // Send OTP to phone
      const resp = await fetch(`${API_BASE}/utils/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const result = await resp.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to send OTP");
      }

      // Save data and session ID
      dispatch(saveProgress({
        ownerName,
        email,
        phone,
        sessionId: result.sessionId
      }));
      dispatch(nextStep());
      navigation.navigate("SignupStep2");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
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
          <Text style={styles.headerText}>Create New Account</Text>
          <Text style={styles.subHeaderText}>Provide Personal Detail</Text>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Please Provide Correct Details as this information Will Be Used By Your Subscriber to reach You
            </Text>
          </View>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              value={ownerName}
              onChangeText={(text) => dispatch(saveProgress({ ownerName: text }))}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => dispatch(saveProgress({ email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Contact Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={(text) => dispatch(saveProgress({ phone: text }))}
              keyboardType="phone-pad"
            />
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && { opacity: 0.6 }]}
            onPress={handleVerifyPhone}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Verify Phone Number</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Log In</Text>
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
    marginBottom: 15,
  },
  infoBox: {
    backgroundColor: "#FFE4E4",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    lineHeight: 18,
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
  button: {
    backgroundColor: "#B2D1E5",
    borderRadius: 8,
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
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

export default VendorSignupScreen;
