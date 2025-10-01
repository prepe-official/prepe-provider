import React, { useState, useEffect, useCallback, useRef } from "react";
import { AppState, NativeModules, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { updateVendor } from "../store/slices/vendorSlice";
import RechargeModal from "../components/RechargeModal";
import MainTabNavigator from "./MainTabNavigator";

// Create a module to track picker operations across the app
export const ImagePickingTracker = {
  isImagePickingActive: false,
  setImagePickingActive(active) {
    this.isImagePickingActive = active;
  },
  getIsImagePickingActive() {
    return this.isImagePickingActive;
  },
};

const SubscriptionCheck = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { vendor, token } = useSelector((state) => state.vendor);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const appStateTimeout = useRef(null);
  const lastActive = useRef(Date.now());

  const checkSubscription = useCallback(() => {
    if (vendor) {
      const expiryDate = vendor.expiryDate ? new Date(vendor.expiryDate) : null;
      const now = new Date();
      if (!expiryDate) {
        setIsFirstTime(true);
        setShowModal(true);
      } else if (expiryDate < now) {
        setIsFirstTime(false);
        setShowModal(true);
      } else {
        setShowModal(false);
      }
    }
  }, [vendor]);

  const fetchVendorData = useCallback(async () => {
    if (vendor && token) {
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
      } catch (error) {
        console.error("Failed to fetch vendor data", error);
      }
    }
  }, [vendor, token, dispatch]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // Check if the app was in background for more than 5 seconds
        // and not in the middle of an image picker operation
        const now = Date.now();
        const backgroundTime = now - lastActive.current;

        if (
          backgroundTime > 5000 &&
          !ImagePickingTracker.getIsImagePickingActive()
        ) {
          // Only check subscription if app was in background for significant time
          clearTimeout(appStateTimeout.current);
          appStateTimeout.current = setTimeout(() => {
            fetchVendorData();
          }, 500);
        }
      } else if (nextAppState === "background") {
        lastActive.current = Date.now();
      }
    });

    return () => {
      subscription.remove();
      clearTimeout(appStateTimeout.current);
    };
  }, [fetchVendorData]);

  useFocusEffect(
    useCallback(() => {
      checkSubscription();
    }, [checkSubscription])
  );

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/vendor/recharge/createPaymentLink`,
        {
          amount: 20,
          vendorId: vendor._id,
        }
      );
      if (data.short_url && data.transactionId) {
        setShowModal(false);
        navigation.navigate("PaymentWebView", {
          url: data.short_url,
          transactionId: data.transactionId,
          amount: 20,
          vendor,
          token,
        });
      } else {
        alert("Failed to get payment link.");
      }
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Failed to initiate payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MainTabNavigator />
      <RechargeModal
        visible={showModal}
        onPay={handlePayment}
        loading={loading}
        isFirstTime={isFirstTime}
      />
    </>
  );
};

export default SubscriptionCheck;
