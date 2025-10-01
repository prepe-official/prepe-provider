import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import Sidebar from "./Sidebar";
import BlinkingDot from "./BlinkingDot";
import { logout } from "../store/slices/vendorSlice";

const Header = ({ title, showBackButton }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { isLoggedIn, vendor } = useSelector((state) => state.vendor);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasPendingOrders, setHasPendingOrders] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigation.reset({
      index: 0,
      routes: [{ name: "Intro" }],
    });
  };

  const checkVendorStatus = useCallback(async () => {
    if (!vendor?._id || !isLoggedIn) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/vendor/get?id=${vendor._id}`
      );
      const data = await response.json();

      if (data.success) {
        const vendorStatus = data.vendor?.status || data.status;

        if (vendorStatus === "suspended") {
          // Show warning and log out vendor
          Alert.alert(
            "Account Suspended",
            "Your vendor account has been suspended. You will be logged out automatically.",
            [
              {
                text: "OK",
                onPress: () => handleLogout(),
              },
            ],
            { cancelable: false }
          );
        }
      }
    } catch (err) {
      console.error("Failed to check vendor status:", err.message);
    }
  }, [vendor, isLoggedIn, dispatch, navigation]);

  const toggleSidebar = () => {
    if (isLoggedIn) {
      setSidebarVisible(!sidebarVisible);
    } else {
      navigation.navigate("Login");
    }
  };

  const goToNotifications = () => {
    if (isLoggedIn) {
      navigation.navigate("Notification");
      setUnreadCount(0); // clear after opening
    } else {
      navigation.navigate("Login");
    }
  };

  const fetchPendingOrders = useCallback(async () => {
    if (!vendor?._id) return;
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/order/get-by-vendor?vendorId=${vendor._id}`,
        { headers: { Authorization: `Bearer ${vendor?.token}` } }
      );
      const data = await response.json();
      if (data.success) {
        const pending = data.orders.some((o) => o.status === "pending");
        setHasPendingOrders(pending);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err.message);
    }
  }, [vendor]);

  const fetchUnreadNotifications = useCallback(async () => {
    if (!vendor?._id) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/notification/get-by-vendor?vendorId=${vendor._id}`
      );
      const data = await response.json();
      if (data.success) {
        const unread = data.data.filter((n) => !n.isRead);
        setUnreadCount(unread.length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err.message);
    }
  }, [vendor]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadNotifications();
      fetchPendingOrders();
      checkVendorStatus(); // Check vendor status when component mounts or login state changes
    }
  }, [
    isLoggedIn,
    fetchUnreadNotifications,
    fetchPendingOrders,
    checkVendorStatus,
  ]);

  // Optional: Periodic status check (every 5 minutes)
  useEffect(() => {
    if (!isLoggedIn) return;

    const statusCheckInterval = setInterval(() => {
      checkVendorStatus();
    }, 300000); // 5 minutes

    return () => clearInterval(statusCheckInterval);
  }, [isLoggedIn, checkVendorStatus]);

  return (
    <>
      <View style={styles.header}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={26} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={goToNotifications}
          >
            <Ionicons name="notifications-outline" size={26} color="#333" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleSidebar}>
            <Ionicons name="options-outline" size={26} color="#333" />
            {hasPendingOrders && <BlinkingDot style={styles.pendingDot} />}
          </TouchableOpacity>
        </View>
      </View>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        hasPendingOrders={hasPendingOrders}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    position: "relative",
    height: 60,
    backgroundColor: "white",
  },
  backButton: {
    position: "absolute",
    left: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },
  headerIcons: {
    flexDirection: "row",
    position: "absolute",
    right: 16,
  },
  iconButton: {
    marginLeft: 20,
  },
  badge: {
    position: "absolute",
    right: 10,
    top: -2,
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  pendingDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: "100%",
    backgroundColor: "#1b94e4",
  },
});

export default Header;
