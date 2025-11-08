import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useDispatch } from "react-redux";
import { updateVendor } from "../store/slices/vendorSlice";

const PaymentWebViewScreen = ({ route }) => {
  const { url, transactionId, vendor, token, amount } = route.params;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [verifiedPaymentIds, setVerifiedPaymentIds] = useState(new Set());
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const verifyPayment = async (razorpay_payment_id) => {
    try {
      const verifyUrl = `${process.env.EXPO_PUBLIC_API_URL}/vendor/recharge/verify`;

      const response = await axios.post(
        verifyUrl,
        {
          razorpay_payment_id,
          transactionId,
          vendorId: vendor._id,
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        try {
          const { data } = await axios.get(
            `${process.env.EXPO_PUBLIC_API_URL}/vendor/get?id=${vendor._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (data.success) {
            dispatch(updateVendor(data.vendor));
          }
        } catch (fetchError) {
          console.error(
            "Failed to fetch vendor data after payment",
            fetchError
          );
        }

        setShowSuccessModal(true);
      } else {
        Alert.alert(
          "Failed",
          response.data.message ||
            "Payment verification failed. Please try again."
        );
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error verifying payment:", error);

      let errorMessage = "Failed to verify payment. Please contact support.";
      if (error.response) {
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 404) {
          errorMessage =
            "Payment verification service not found. Please try again later.";
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        errorMessage = "No response from server. Please check your connection.";
      }

      navigation.goBack();
    }
  };

  const handleNavigationStateChange = (navState) => {
    const { url: navUrl } = navState;

    try {
      if (navUrl.includes("razorpay_payment_id")) {
        // Fix fragment issue (# → ?)
        const cleanUrl = navUrl.replace("#", "?");
        const urlObj = new URL(cleanUrl);
        const razorpay_payment_id = urlObj.searchParams.get(
          "razorpay_payment_id"
        );

        if (
          razorpay_payment_id &&
          !verifiedPaymentIds.has(razorpay_payment_id)
        ) {
          setVerifiedPaymentIds((prev) =>
            new Set(prev).add(razorpay_payment_id)
          );
          verifyPayment(razorpay_payment_id);
        }
      }
    } catch (error) {
      console.error("URL parsing failed, fallback check", error);
      const paymentIdMatch = navUrl.match(/[?&#]razorpay_payment_id=([^&]+)/);
      if (paymentIdMatch && !verifiedPaymentIds.has(paymentIdMatch[1])) {
        const paymentId = paymentIdMatch[1];
        setVerifiedPaymentIds((prev) => new Set(prev).add(paymentId));
        verifyPayment(paymentId);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Loading Payment Gateway...</Text>
          </View>
        )}
        // ✅ Ignore Razorpay exit URLs
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;

          if (
            nativeEvent.url.startsWith("razorpay://") ||
            nativeEvent.url.startsWith("upi://")
          ) {
            return; // ignore these fake errors
          }

          console.error("WebView error:", nativeEvent);
          setShowSuccessModal(true);
        }}
        onShouldStartLoadWithRequest={(request) => {
          if (
            request.url.startsWith("razorpay://") ||
            request.url.startsWith("upi://")
          ) {
            return false; // prevent WebView crash
          }
          return true;
        }}
      />
      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Recharged Successfully!</Text>
            <Text style={styles.modalMessage}>You can now access and freely use the app for 30 days.</Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: "#B2D1E5",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  continueButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default PaymentWebViewScreen;
