// ForgotPasswordScreen.jsx
import React, { useState, useEffect, useRef } from "react";
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

const API_BASE = process.env.EXPO_PUBLIC_API_URL; // e.g. "https://your-domain.com"

export default function ForgotPasswordScreen({ navigation }) {
  const [stage, setStage] = useState("form"); // form → otp → reset
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  // Timer effect for resend OTP
  useEffect(() => {
    if (stage === "otp" && resendTimer > 0) {
      timerRef.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stage, resendTimer]);

  // Start timer when OTP is sent
  const startResendTimer = () => {
    setResendTimer(15);
    setCanResend(false);
  };

  // 1) Send OTP to phone
  const handleSendOtp = async () => {
    if (!email || !phone) {
      return Alert.alert("Error", "Please enter both email and phone");
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
      setSessionId(result.sessionId);
      setStage("otp");
      startResendTimer(); // Start the resend timer
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2) Verify OTP
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
      setStage("reset");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3) Call your change-password API
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      return Alert.alert("Error", "Please fill in both password fields");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/vendor/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: newPassword }),
      });
      const result = await resp.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to reset password");
      }
      Alert.alert("Success", "Your password has been changed. Please log in.", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP function
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/utils/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const result = await resp.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to resend OTP");
      }
      setSessionId(result.sessionId);
      startResendTimer(); // Restart the timer
      Alert.alert("Success", "OTP has been resent successfully");
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
        {/* Optional logo */}
        <Image
          source={require("../assets/splash-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.formContainer}>
          {stage === "form" && (
            <>
              <Text style={styles.headerText}>Forgot Password</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#333"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#333"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
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
          )}

          {stage === "otp" && (
            <>
              <Text style={styles.headerText}>Verify Phone</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>OTP Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter the OTP"
                  placeholderTextColor="#333"
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

              {resendTimer > 0 && (
                <Text style={styles.resendText}>
                  Resend OTP in {resendTimer}s
                </Text>
              )}
              {canResend && (
                <TouchableOpacity
                  style={[styles.resendButton, isLoading && { opacity: 0.6 }]}
                  onPress={handleResendOtp}
                  disabled={isLoading}
                >
                  <Text style={styles.resendButtonText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {stage === "reset" && (
            <>
              <Text style={styles.headerText}>Set New Password</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor="#333"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#333"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && { opacity: 0.6 }]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Resetting…" : "Reset Password"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.loginContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Text style={styles.version}>Version 1.0.0</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#B2D1E5" },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  logo: { width: 150, height: 150, marginBottom: 30 },
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
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, color: "#333", marginBottom: 5, fontWeight: "500" },
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
  buttonText: { color: "#000", fontSize: 16, fontWeight: "600" },
  loginContainer: { flexDirection: "row", justifyContent: "center" },
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
  resendText: {
    fontSize: 14,
    color: "#333",
    marginTop: 10,
    textAlign: "center",
  },
  resendButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  resendButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
});
