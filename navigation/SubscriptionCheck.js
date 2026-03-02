import React, { useState, useEffect, useCallback, useRef } from "react";
import { AppState, NativeModules, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { updateVendor } from "../store/slices/vendorSlice";
import RechargeModal from "../components/RechargeModal";
import MainTabNavigator from "./MainTabNavigator";
import configService from "../services/configService";

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
  const [rechargeAmount, setRechargeAmount] = useState(0);
  const isRefreshingRef = useRef(false); // FIXED: Use ref to prevent infinite loop
  const appStateTimeout = useRef(null);
  const lastActive = useRef(Date.now());

  const checkSubscription = useCallback(async () => {
    if (vendor) {
      const expiryDate = vendor.expiryDate ? new Date(vendor.expiryDate) : null;
      const now = new Date();
      const isExpired = !expiryDate || expiryDate < now;

      if (isExpired) {
        setLoading(true);
        try {
          // 1. Fetch the required recharge amount (provider monthly fee) - FORCE refresh to bypass cache
          const amount = await configService.getRechargeAmount(true);
          setRechargeAmount(amount);

          console.log("[SubscriptionCheck] Expiry Date:", expiryDate);
          console.log("[SubscriptionCheck] Provider Monthly Fee:", amount);

          if (amount === 0) {
            // 2. If fee is 0, auto-renew via backend
            console.log("Subscription expired but fee is 0, auto-renewing...");
            const { data } = await axios.post(
              `${process.env.EXPO_PUBLIC_API_URL}/vendor/recharge/auto-renew`,
              { vendorId: vendor._id }
            );

            if (data.success) {
              // Refresh vendor data to update local state with new expiry date
              await fetchVendorData();
              setShowModal(false);
            } else {
              setShowModal(true); // Fallback to modal if auto-renew fails
            }
          } else {
            // 3. If fee > 0, show the blocking recharge modal
            setIsFirstTime(false);
            setShowModal(true);
          }
        } catch (error) {
          console.error("Failed to check subscription or auto-renew:", error);
          setShowModal(true); // Show modal as safety net
        } finally {
          setLoading(false);
        }
      } else {
        setShowModal(false);
      }
    }
  }, [vendor, fetchVendorData]);

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
          return data.vendor; // Return updated vendor data
        }
      } catch (error) {
        console.error("Failed to fetch vendor data", error);
      }
    }
    return null;
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
          appStateTimeout.current = setTimeout(async () => {
            if (!isRefreshingRef.current) {
              isRefreshingRef.current = true;
              await fetchVendorData();
              isRefreshingRef.current = false;
            }
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

  // FIX: Refresh vendor data BEFORE checking subscription when screen gains focus
  useFocusEffect(
    useCallback(() => {
      const refreshAndCheck = async () => {
        // Don't run if already refreshing
        if (isRefreshingRef.current) return;

        isRefreshingRef.current = true;
        // Fetch latest vendor data first to ensure payment status is current
        await fetchVendorData();
        isRefreshingRef.current = false;

        // Now check subscription with updated data
        checkSubscription();
      };

      refreshAndCheck();
    }, [checkSubscription, fetchVendorData]) // FIXED: Removed isRefreshing from dependencies
  );

  const handlePayment = async () => {
    // Validate amount before proceeding
    if (!rechargeAmount || rechargeAmount <= 0) {
      alert("Invalid recharge amount. Please contact support.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/vendor/recharge/createPaymentLink`,
        {
          amount: rechargeAmount,
          vendorId: vendor._id,
        }
      );
      if (data.short_url && data.transactionId) {
        setShowModal(false);
        navigation.navigate("PaymentWebView", {
          url: data.short_url,
          transactionId: data.transactionId,
          amount: rechargeAmount,
          vendor,
          token,
        });
      } else {
        alert("Failed to get payment link.");
      }
    } catch (error) {
      console.error("Payment Error:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || "Failed to initiate payment. Please try again.";
      alert(errorMessage);
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
        rechargeAmount={rechargeAmount}
      />
    </>
  );
};

export default SubscriptionCheck;
