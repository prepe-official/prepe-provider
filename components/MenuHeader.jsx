import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Sidebar from "./Sidebar";
import { useSelector } from "react-redux";

const MenuHeader = ({ title }) => {
  const navigation = useNavigation();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { isLoggedIn, vendor } = useSelector((state) => state.vendor);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const goToNotifications = () => {
    if (isLoggedIn) {
      navigation.navigate("Notification");
      setUnreadCount(0); // clear badge after opening
    } else {
      navigation.navigate("Login");
    }
  };

  const goBack = () => {
    navigation.navigate("Main");
  };

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
    }
  }, [isLoggedIn, fetchUnreadNotifications]);

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="home-outline" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={goToNotifications}>
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
          </TouchableOpacity>
        </View>
      </View>
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
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
    backgroundColor: "white",
    height: 60,
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
});

export default MenuHeader;
