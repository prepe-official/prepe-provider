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
    // Prevent duplicate verifications
    if (verifiedPaymentIds.has(razorpay_payment_id)) {
      return;
    }

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
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data && response.data.success) {
        // If payment was already processed, still show success
        if (response.data.alreadyProcessed) {
          console.log("Payment was already processed");
        }

        // Fetch updated vendor data and show success
        await fetchVendorData();
        setShowSuccessModal(true);
      } else {
        Alert.alert(
          "Payment Failed",
          response.data?.message ||
            "Payment verification failed. Please try again.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error verifying payment:", error);

      let errorMessage = "Failed to verify payment. Please contact support.";
      if (error.response) {
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 404) {
          errorMessage =
            "Payment verification service not found. Please try again later.";
        } else if (error.response.status >= 500) {
          errorMessage = "Server error. Please try again in a few moments.";
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        errorMessage = "No response from server. Please check your connection.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage =
          "Request timed out. Please check your connection and try again.";
      }

      Alert.alert("Verification Error", errorMessage, [
        {
          text: "Retry",
          onPress: () => {
            // Remove from verified set to allow retry
            setVerifiedPaymentIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(razorpay_payment_id);
              return newSet;
            });
          },
        },
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  };

  const extractPaymentId = (url) => {
    if (!url) return null;

    try {
      // Handle both # and ? query parameters
      const cleanUrl = url.replace(/#/g, "?");
      const urlObj = new URL(cleanUrl);
      return urlObj.searchParams.get("razorpay_payment_id");
    } catch (error) {
      // Fallback regex matching
      const paymentIdMatch = url.match(/[?&#]razorpay_payment_id=([^&?#]+)/);
      return paymentIdMatch ? paymentIdMatch[1] : null;
    }
  };

  const handleNavigationStateChange = (navState) => {
    const { url: navUrl } = navState;

    // If Razorpay redirects to our callback URL, let the server handle it
    // Don't call verify from the app - the callback URL (GET handler) will process it
    if (navUrl.includes("/vendor/recharge/verify")) {
      // Just extract payment ID for tracking, but don't call verify
      // The callback URL will handle the verification
      const razorpay_payment_id = extractPaymentId(navUrl);
      if (razorpay_payment_id) {
        setVerifiedPaymentIds((prev) => new Set(prev).add(razorpay_payment_id));
        // Wait a bit for server to process, then check status
        setTimeout(async () => {
          // Fetch vendor data to check if payment was processed
          const success = await fetchVendorData();
          if (success) {
            setShowSuccessModal(true);
          }
        }, 2000);
      }
      return;
    }

    // Only verify if we detect payment ID in URL but NOT in callback URL
    if (
      navUrl.includes("razorpay_payment_id") &&
      !navUrl.includes("/vendor/recharge/verify")
    ) {
      const razorpay_payment_id = extractPaymentId(navUrl);
      if (razorpay_payment_id && !verifiedPaymentIds.has(razorpay_payment_id)) {
        setVerifiedPaymentIds((prev) => new Set(prev).add(razorpay_payment_id));
        verifyPayment(razorpay_payment_id);
      }
    }
  };

  const handleShouldStartLoadWithRequest = (request) => {
    const { url } = request;

    // Block Razorpay/UPI deep links to prevent WebView crashes
    if (
      url.startsWith("razorpay://") ||
      url.startsWith("upi://") ||
      url.startsWith("paytmmp://")
    ) {
      return false;
    }

    // If Razorpay redirects to our callback URL, let it load
    // The server will handle verification via GET handler
    if (url.includes("/vendor/recharge/verify")) {
      const razorpay_payment_id = extractPaymentId(url);
      if (razorpay_payment_id) {
        setVerifiedPaymentIds((prev) => new Set(prev).add(razorpay_payment_id));
        // Don't call verify - let the callback URL handle it
        // Just wait and then check vendor status
        setTimeout(async () => {
          const success = await fetchVendorData();
          if (success) {
            setShowSuccessModal(true);
          }
        }, 2000);
      }
      return true; // Allow the callback URL to load
    }

    return true;
  };

  const fetchVendorData = async () => {
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
        // Check if payment was successful by checking expiry date
        if (data.vendor.expiryDate) {
          const expiryDate = new Date(data.vendor.expiryDate);
          const now = new Date();
          if (expiryDate > now) {
            return true; // Payment successful
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch vendor data", error);
    }
    return false;
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Loading Payment Gateway...</Text>
          </View>
        )}
        // Handle JavaScript messages from injected script
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "payment_detected" && data.url) {
              const razorpay_payment_id = extractPaymentId(data.url);
              if (
                razorpay_payment_id &&
                !verifiedPaymentIds.has(razorpay_payment_id)
              ) {
                setVerifiedPaymentIds((prev) =>
                  new Set(prev).add(razorpay_payment_id)
                );
                verifyPayment(razorpay_payment_id);
              }
            } else if (
              data.razorpay_payment_id &&
              !verifiedPaymentIds.has(data.razorpay_payment_id)
            ) {
              setVerifiedPaymentIds((prev) =>
                new Set(prev).add(data.razorpay_payment_id)
              );
              verifyPayment(data.razorpay_payment_id);
            }
          } catch (error) {
            // Not a JSON message, ignore
            console.log(
              "Non-JSON message from WebView:",
              event.nativeEvent.data
            );
          }
        }}
        // Inject JavaScript to detect payment completion
        injectedJavaScript={`
          (function() {
            // Listen for URL changes
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            function checkUrl() {
              const currentUrl = window.location.href;
              if (currentUrl.includes('razorpay_payment_id')) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'payment_detected',
                  url: currentUrl
                }));
              }
            }
            
            history.pushState = function() {
              originalPushState.apply(history, arguments);
              setTimeout(checkUrl, 100);
            };
            
            history.replaceState = function() {
              originalReplaceState.apply(history, arguments);
              setTimeout(checkUrl, 100);
            };
            
            // Check initial URL
            setTimeout(checkUrl, 1000);
            
            // Also listen for hash changes
            window.addEventListener('hashchange', checkUrl);
          })();
          true;
        `}
        // Ignore Razorpay/UPI deep link errors
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;

          if (
            nativeEvent.url?.startsWith("razorpay://") ||
            nativeEvent.url?.startsWith("upi://") ||
            nativeEvent.url?.startsWith("paytmmp://")
          ) {
            return; // ignore these fake errors
          }

          console.error("WebView error:", nativeEvent);
          // Don't show success modal on error, let user retry
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
            <Text style={styles.modalMessage}>
              You can now access and freely use the app for 30 days.
            </Text>
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
