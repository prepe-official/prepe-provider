import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import axios from "axios";
import MenuHeader from "../components/MenuHeader";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fetchNotifications = async (vendorId) => {
  try {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_API_URL}/notification/get-by-vendor?vendorId=${vendorId}`
    );
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
};

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const vendor = useSelector((state) => state.vendor.vendor);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    if (vendor?._id) {
      const fetchedNotifications = await fetchNotifications(vendor._id);
      setNotifications(fetchedNotifications);
    }
  };

  fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/notification/mark-read-by-vendor?vendorId=${vendor._id}`,
    {
      method: "PUT",
    }
  ).catch((err) => {
    console.error("Failed to mark notifications as read:", err);
  });

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await loadNotifications();
      setLoading(false);
    };

    if (vendor?._id) {
      initialLoad();
    }
  }, [vendor]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [vendor]);

  const renderNotificationItem = (item) => {
    return (
      <View key={item._id} style={styles.notificationCard}>
        <View style={styles.notificationHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            {item.createdAt && (
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {item.type && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Text>
              </View>
            )}
            {item.status && (
              <View style={styles.skippedBadge}>
                <Text style={styles.skippedBadgeText}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <MenuHeader title="Notification" />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007bff"
          style={{ marginTop: 20 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {Array.isArray(notifications) && notifications.length > 0 ? (
            notifications.map((item) => renderNotificationItem(item))
          ) : (
            <Text style={styles.noNotificationsText}>
              No notifications yet.
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  skippedBadge: {
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeBadge: {
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  typeBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  skippedBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  messageText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
    marginTop: 8,
  },
  noNotificationsText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },
});

export default NotificationScreen;
