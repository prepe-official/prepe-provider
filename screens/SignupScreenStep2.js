import React, { useEffect, useState } from "react";
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
  setOtpVerified,
  resetToStep,
} from "../store/slices/signupSlice";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const SignupScreenStep2 = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    ownerName,
    shopName,
    email,
    password,
    phone,
    address,
    city: selectedCity,
    sessionId,
    isOtpVerified,
  } = useSelector((state) => state.signup);

  // otp state
  const [stage, setStage] = useState("form"); // 'form' or 'otp'
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(15);

  // loading
  const [isLoading, setIsLoading] = useState(false);

  // STEP 1: send OTP
  const handleSendOtp = async () => {
    if (!phone || !address) {
      return Alert.alert("Error", "Please fill in all fields");
    }
    if (!selectedCity) {
      return Alert.alert("Error", "Please select a city first");
    }

    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/utils/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const result = await resp.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to send OTP");
      }

      dispatch(saveProgress({ sessionId: result.sessionId }));
      setStage("otp");
      setResendTimer(15);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) {
      return Alert.alert("Error", "Please enter the OTP");
    }

    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/utils/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otp }),
      });
      const result = await resp.json();

      if (!result.success) {
        throw new Error(result.error || "OTP verification failed");
      }

      // OTP ok → mark as verified and go to Step 3
      dispatch(setOtpVerified(true));
      dispatch(nextStep());
      navigation.navigate("SignupStep3");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (stage === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage, resendTimer]);

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
          {stage === "form" ? (
            <>
              <Text style={styles.headerText}>
                Create Account (Step 2 of 4)
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#333333"
                  value={phone}
                  onChangeText={(text) =>
                    dispatch(saveProgress({ phone: text }))
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your address"
                  placeholderTextColor="#333333"
                  value={address}
                  onChangeText={(text) =>
                    dispatch(saveProgress({ address: text }))
                  }
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && { opacity: 0.6 }]}
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Sending OTP…" : "Send OTP"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.headerText}>Verify OTP</Text>
              <Text style={styles.infoText}>
                To verify your mobile number we will provide otp with a phone
                call. Make sure the number is correct.
              </Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>OTP Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter the OTP"
                  placeholderTextColor="#333333"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && { opacity: 0.6 }]}
                onPress={handleVerifyOtp}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Verifying…" : "Verify OTP"}
                </Text>
              </TouchableOpacity>
              {resendTimer > 0 ? (
                <Text style={styles.timerText}>
                  Resend available in {resendTimer}s
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleSendOtp}
                  style={[styles.resendButton, isLoading && { opacity: 0.6 }]}
                  disabled={isLoading}
                >
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <View style={styles.loginContainer}>
            <TouchableOpacity
              onPress={() => {
                dispatch(resetToStep(0));
                navigation.goBack();
              }}
            >
              <Text style={styles.loginLink}>Go Back</Text>
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
  timerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  resendButton: {
    alignSelf: "center",
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
});

export default SignupScreenStep2;
