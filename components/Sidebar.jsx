import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/vendorSlice";
import axios from "axios";
import BlinkingDot from "./BlinkingDot";

const Sidebar = ({ visible, onClose, hasPendingOrders }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { vendor } = useSelector((state) => state.vendor);

  const [config, setConfig] = useState({
    termsLink: "",
    privacyLink: "",
  });

  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/configuration/get`
        );
        if (data?.success && data?.configuration) {
          setConfig(data.configuration);
        }
      } catch (error) {
        console.error("Failed to fetch configuration:", error);
      }
    };

    if (visible) {
      fetchConfiguration();
    }
  }, [visible]);

  if (!visible) return null;

  // Navigate to wallet screen
  const navigateTo = (screen) => {
    navigation.navigate(screen);
    onClose();
  };

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  const handleLinkPress = async (url) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(`Don't know how to open this URL: ${url}`);
      }
    } catch (err) {
      Alert.alert("Unable to open link");
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.sidebar}>
          {/* Header with back button and blue background */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            {/* User info */}
            <View style={styles.userInfo}>
              {vendor?.image ? (
                <Image source={{ uri: vendor.image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar} />
              )}
              <Text style={styles.username}>
                {vendor?.ownerName || "Username"}
              </Text>
            </View>
          </View>

          {/* Scrollable Menu Items */}
          <ScrollView style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("Main")}
            >
              <Ionicons name="home-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("Subscriptions")}
            >
              <Ionicons name="people-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Manage Subscribers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("Orders")}
            >
              <Ionicons name="receipt-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Pending Orders</Text>
              {hasPendingOrders && (<BlinkingDot />)}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("TransactionHistory")}
            >
              <Ionicons name="time-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Transaction Records</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("AccountSettings")}
            >
              <Ionicons name="settings-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Account Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("CustomerSupport")}
            >
              <Ionicons name="help-circle-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Customer Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Log Out</Text>
            </TouchableOpacity>

            {/* Add padding at the bottom to ensure content isn't hidden by footer */}
            <View style={styles.menuFooterSpace} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => handleLinkPress(config.privacyLink)}
            >
              <Text style={styles.footerText}>Privacy Policies</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>/</Text>
            <TouchableOpacity onPress={() => handleLinkPress(config.termsLink)}>
              <Text style={styles.footerText}>Terms & Conditions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end", // Changed from "flex-start" to "flex-end"
  },
  sidebar: {
    width: "75%",
    height: "100%",
    backgroundColor: "white",
  },
  header: {
    backgroundColor: "#b2d1e5",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    paddingVertical: 10,
  },
  userInfo: {
    alignItems: "center",
    marginTop: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(200, 200, 200, 0.8)",
    marginBottom: 10,
  },
  username: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },
  menuContainer: {
    paddingVertical: 10,
    flexGrow: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: "600",
    color: "#333",
  },
  menuFooterSpace: {
    height: 60, // Add space at bottom to prevent content being hidden by footer
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  footerText: {
    fontSize: 12,
    color: "#1b94e4",
    textAlign: "center",
  },
  disabledFooterText: {
    color: "#a0a0a0",
  },
  footerSeparator: {
    fontSize: 12,
    color: "#a0a0a0",
    marginHorizontal: 4,
  },
});

export default Sidebar;
