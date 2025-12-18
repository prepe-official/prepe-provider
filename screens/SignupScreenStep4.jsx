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
  ActivityIndicator,
  Modal,
  Switch,
  BackHandler,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { clearProgress, resetToStep } from "../store/slices/signupSlice";
import { login } from "../store/slices/vendorSlice";
import {
  registerForPushNotificationsAsync,
  sendFCMTokenToServer,
} from "../utils/notifications";
import axios from "axios";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const SignupScreenStep4 = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    ownerName,
    email,
    phone,
    shopName,
    city,
    address,
  } = useSelector((state) => state.signup);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Modal state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isHindi, setIsHindi] = useState(false);
  const [termsEnglish, setTermsEnglish] = useState("");
  const [termsHindi, setTermsHindi] = useState("");
  const [platformFee, setPlatformFee] = useState(0);

  // Fetch terms and platform fee from configuration
  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/configuration/get`);
      if (data.success) {
        setPlatformFee(data.configuration.platformFeePercentage || 0);
        setTermsEnglish(data.configuration.providerTerms?.english || "Commission and charges terms will be displayed here.");
        setTermsHindi(data.configuration.providerTerms?.hindi || "कमीशन और शुल्क की शर्तें यहां प्रदर्शित होंगी।");
      }
    } catch (error) {
      console.log("Error fetching configuration:", error);
    }
  };

  // Handle closing modal - exit app if not agreed
  const handleCloseModal = () => {
    Alert.alert(
      "Exit App",
      "You must agree to the terms and conditions to create an account. Do you want to exit?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => {
            BackHandler.exitApp();
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    if (!password) {
      return Alert.alert("Error", "Please enter your password");
    }
    if (password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }
    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    // Show terms modal
    setShowTermsModal(true);
  };

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      return Alert.alert("Error", "Please agree to the terms and conditions");
    }

    setIsLoading(true);
    try {
      // Create vendor account
      const payload = {
        ownerName,
        shopName: shopName || ownerName,
        email,
        password,
        phoneNumber: phone,
        address,
        city,
        ifscCode: "",
        accountNumber: "",
        bankHolderName: "",
        upiId: "",
        image: null,
        shopImages: [],
      };

      const response = await fetch(`${API_BASE}/vendor/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Auto-login after successful registration
      const loginRes = await fetch(`${API_BASE}/vendor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.success) {
        dispatch(
          login({
            vendor: loginData.user,
            token: loginData.token,
          })
        );

        dispatch(clearProgress());

        try {
          const fcmToken = await registerForPushNotificationsAsync();
          if (fcmToken) {
            await sendFCMTokenToServer({
              userId: loginData.user._id,
              authToken: loginData.token,
              expoPushToken: fcmToken,
              isVendor: true,
            });
          }
        } catch (notifError) {
          console.log("Notification registration error:", notifError);
        }

        setShowTermsModal(false);
        navigation.replace("Main");
      } else {
        Alert.alert(
          "Account Created",
          "Your account was created. Please log in to continue."
        );
        setShowTermsModal(false);
        navigation.navigate("Login");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    dispatch(resetToStep(2));
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
      >
        <Image
          source={require("../assets/splash-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.formContainer}>
          <Text style={styles.headerText}>Create New Account</Text>
          <Text style={styles.subHeaderText}>Set Password</Text>

          {/* Username Display (Read-only) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{ownerName}</Text>
            </View>
          </View>

          {/* Email Display (Read-only) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{email}</Text>
            </View>
          </View>

          {/* Set Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Set Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
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
              style={styles.completeButton}
              onPress={handleComplete}
            >
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Commission & Charges Modal */}
      <Modal
        visible={showTermsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseModal}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Modal Header */}
            <Text style={styles.modalTitle}>Commission & Charges</Text>
            <Text style={styles.modalSubtitle}>For Providers</Text>

            {/* Terms Content */}
            <View style={styles.termsContainer}>
              <ScrollView
                style={styles.termsScrollView}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.termsText}>
                  {isHindi ? termsHindi : termsEnglish}
                </Text>
              </ScrollView>
            </View>

            {/* Agreement Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>I Agree with the conditions</Text>
            </TouchableOpacity>

            {/* Bottom Row */}
            <View style={styles.modalBottomRow}>
              {/* Language Toggle */}
              <View style={styles.languageToggle}>
                <Switch
                  value={isHindi}
                  onValueChange={setIsHindi}
                  trackColor={{ false: "#767577", true: "#B2D1E5" }}
                  thumbColor={isHindi ? "#fff" : "#f4f3f4"}
                />
                <Text style={styles.languageText}>Hin / Eng</Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  readOnlyField: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f5f5f5",
  },
  readOnlyText: {
    fontSize: 16,
    color: "#666",
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
  completeButton: {
    flex: 1,
    backgroundColor: "#B2D1E5",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  completeButtonText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#666",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginTop: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  termsContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    backgroundColor: "#fafafa",
    marginBottom: 15,
    maxHeight: 300,
  },
  termsScrollView: {
    padding: 15,
  },
  termsText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#333",
    borderRadius: 4,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#B2D1E5",
    borderColor: "#B2D1E5",
  },
  checkmark: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#333",
  },
  modalBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  languageToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: "#B2D1E5",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
  },
});

export default SignupScreenStep4;

