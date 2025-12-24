import React, { useEffect, useState, useRef } from "react";
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
import { useSelector, useDispatch } from "react-redux";
import {
  saveProgress,
  nextStep,
  setOtpVerified,
  resetToStep,
} from "../store/slices/signupSlice";
import { Ionicons } from "@expo/vector-icons";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const SignupScreenStep2 = ({ navigation }) => {
  const dispatch = useDispatch();
  const { phone, sessionId } = useSelector((state) => state.signup);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(10);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);
  const inputRefs = useRef([]);

  // Timer effect for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timerRef.current);
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
  }, [resendTimer]);

  // Start timer on mount
  useEffect(() => {
    setResendTimer(10);
    setCanResend(false);
  }, []);

  // Handle OTP input change
  const handleOtpChange = (value, index) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split("");
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedOtp.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handle backspace
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (!otpString || otpString.length < 6) {
      return Alert.alert("Error", "Please enter the complete 6-digit OTP");
    }

    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/utils/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otp: otpString }),
      });
      const result = await resp.json();

      if (!result.success) {
        throw new Error(result.error || "OTP verification failed");
      }

      // OTP verified successfully
      dispatch(setOtpVerified(true));
      dispatch(nextStep());
      navigation.navigate("SignupStep3");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

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

      dispatch(saveProgress({ sessionId: result.sessionId }));
      setResendTimer(10);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      Alert.alert("Success", "OTP has been resent successfully");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    dispatch(resetToStep(0));
    navigation.goBack();
  };

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
          <Text style={styles.subHeaderText}>Verify Phone Number</Text>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              You'll Receive The OTP Through A Phone Call. Make Sure You're In Good Network Range And A Quite Place.
            </Text>
          </View>

          {/* OTP Input - 6 Separate Boxes */}
          <Text style={styles.label}>OTP Code</Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.otpBox}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={index === 0 ? 6 : 1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Timer Display */}
          <Text style={styles.timerText}>
            Resend OTP in {formatTimer(resendTimer)}
          </Text>

          {/* Resend Button */}
          <TouchableOpacity
            style={[
              styles.resendButton,
              !canResend && styles.resendButtonDisabled,
            ]}
            onPress={handleResendOtp}
            disabled={!canResend || isLoading}
          >
            <Text
              style={[
                styles.resendButtonText,
                !canResend && styles.resendButtonTextDisabled,
              ]}
            >
              Resend OTP
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.goBackButton}
              onPress={handleGoBack}
              disabled={isLoading}
            >
              <Text style={styles.goBackButtonText}>Go back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.verifyButton, isLoading && { opacity: 0.6 }]}
              onPress={handleVerifyOtp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify & Continue</Text>
              )}
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
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    fontSize: 12,
    color: "#333",
    lineHeight: 18,
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fafafa",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
  },
  timerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  resendButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#fafafa",
  },
  resendButtonDisabled: {
    borderColor: "#eee",
    backgroundColor: "#f5f5f5",
  },
  resendButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  resendButtonTextDisabled: {
    color: "#bbb",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  goBackButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  goBackButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  verifyButton: {
    flex: 1,
    backgroundColor: "#B2D1E5",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  verifyButtonText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
  },
});

export default SignupScreenStep2;
