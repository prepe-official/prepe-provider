import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import { useSelector } from "react-redux";
import axios from "axios";

const DashboardScreen = () => {
  const [showEarningsDropdown, setShowEarningsDropdown] = useState(false);
  const [selectedEarningsOption, setSelectedEarningsOption] =
    useState("This Year");
  const [showSubscribersDropdown, setShowSubscribersDropdown] = useState(false);
  const [selectedSubscribersOption, setSelectedSubscribersOption] =
    useState("This Month");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { vendor, token } = useSelector((state) => state.vendor);

  // --- subscription progress calculation (last 30 days before expiry) ---
  const nowMs = Date.now();
  // expiry timestamp
  const expiryMs = vendor?.expiryDate
    ? new Date(vendor?.expiryDate).getTime()
    : nowMs;
  // length of our window in milliseconds
  const windowMs = 30 * 24 * 60 * 60 * 1000;
  // start of the 30-day window
  const windowStart = expiryMs - windowMs;

  // how much time has elapsed since the window began (clamped 0→windowMs)
  const elapsedMs =
    nowMs <= windowStart
      ? 0
      : nowMs >= expiryMs
      ? windowMs
      : nowMs - windowStart;

  // percentage for the bar
  const progressPercentage = (elapsedMs / windowMs) * 100;

  // days remaining until expiry (same as before)
  const daysRemaining =
    expiryMs > nowMs
      ? Math.ceil((expiryMs - nowMs) / (1000 * 60 * 60 * 24))
      : 0;

  const fetchDashboardData = async () => {
    if (!vendor?._id) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/vendor/dashboard?id=${vendor._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };
    loadData();
  }, [vendor?._id, token]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [vendor?._id, token]);

  const earningsDropdownOptions = [
    "This Month",
    "Last 3 Month",
    "Last 6 Month",
    "This Year",
  ];

  const subscribersDropdownOptions = [
    "This Month",
    "Last 3 Month",
    "Last 6 Month",
  ];

  const handleEarningsOptionSelect = (option) => {
    setSelectedEarningsOption(option);
    setShowEarningsDropdown(false);
  };

  const handleSubscribersOptionSelect = (option) => {
    setSelectedSubscribersOption(option);
    setShowSubscribersDropdown(false);
  };

  const keyMapping = {
    "This Month": "thisMonth",
    "Last 3 Month": "last3Months",
    "Last 6 Month": "last6Months",
    "This Year": "thisYear",
  };

  const selectedEarningsKey = keyMapping[selectedEarningsOption];
  const selectedSubscribersKey = keyMapping[selectedSubscribersOption];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Dashboard" />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Dashboard" />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>No data available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header title="Dashboard" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Image
              source={{ uri: dashboardData.image }}
              style={styles.profileAvatar}
            />
          </View>
          <Text style={styles.greeting}>Hi, {dashboardData.name}</Text>
          {dashboardData.unreadNotifications > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Notification")}
            >
              <Text style={styles.notification}>
                {dashboardData.unreadNotifications} Notifications Need Your
                Attention
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <View style={[styles.card, { marginHorizontal: 0 }]}>
            <Text style={{ ...styles.cardTitle, textAlign: "center" }}>
              Current Total Subscribers
            </Text>
            <Text style={{ ...styles.cardAmount, textAlign: "center" }}>
              {dashboardData.totalSubscribers}
            </Text>
          </View>
        </View>
        {/* Financial Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>

          {/* Total Earnings Card */}
          <View style={styles.wideCard}>
            <View style={styles.wideCardHeader}>
              <Text style={styles.cardTitle}>Total Earnings</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowEarningsDropdown(!showEarningsDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {selectedEarningsOption}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#333" />
              </TouchableOpacity>

              {/* Dropdown Menu */}
              {showEarningsDropdown && (
                <View style={styles.dropdownMenu}>
                  {earningsDropdownOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        index === earningsDropdownOptions.length - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}
                      onPress={() => handleEarningsOptionSelect(option)}
                    >
                      <Text style={styles.dropdownItemText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <Text style={styles.cardAmount}>
              ₹{dashboardData.totalEarnings[selectedEarningsKey]}
            </Text>
          </View>

          <View style={styles.cardRow}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Earnings</Text>
              <Text style={styles.cardAmount}>
                {dashboardData.earningIncreasePercentage[selectedEarningsKey]}%
              </Text>
              <Text style={styles.cardSubtext}>Increased</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Subscribers</Text>
              <Text style={styles.cardAmount}>
                {
                  dashboardData.subscribersIncreasePercentage[
                    selectedEarningsKey
                  ]
                }
                %
              </Text>
              <Text style={styles.cardSubtext}>Increased</Text>
            </View>
          </View>

          {/* New Subscribers Gained Card */}
          <View style={styles.wideCard}>
            <View style={styles.wideCardHeader}>
              <Text style={styles.cardTitle}>New Subscribers Gained</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() =>
                  setShowSubscribersDropdown(!showSubscribersDropdown)
                }
              >
                <Text style={styles.dropdownText}>
                  {selectedSubscribersOption}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#333" />
              </TouchableOpacity>

              {/* Dropdown Menu */}
              {showSubscribersDropdown && (
                <View style={styles.dropdownMenu}>
                  {subscribersDropdownOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        index === subscribersDropdownOptions.length - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}
                      onPress={() => handleSubscribersOptionSelect(option)}
                    >
                      <Text style={styles.dropdownItemText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <Text style={styles.cardAmount}>
              {dashboardData.newSubscribersGained[selectedSubscribersKey]}
            </Text>
          </View>
        </View>

        {/* Most Popular Pack */}
        <View style={styles.section1}>
          <Text style={styles.sectionTitle}>Most Popular Pack</Text>

          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionPlan}>
                <Text style={styles.planText}>
                  {dashboardData.mostPopularPack?.name} @ Rs.{" "}
                  {dashboardData.mostPopularPack?.price} Per Month
                </Text>
              </View>
            </View>

            <View style={styles.wideCardContent}>
              <View style={styles.wideCardColumnLeft}>
                <Text style={styles.cardAmount}>
                  {dashboardData.mostPopularPack?.totalSubscribers}
                </Text>
                <Text style={styles.cardSubtext}>Total Subscribers</Text>
              </View>
              <View style={styles.wideCardColumnRight}>
                <Text style={styles.cardAmount}>
                  ₹{dashboardData.mostPopularPack?.totalEarned}
                </Text>
                <Text style={styles.cardSubtext}>Total Earned</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Subscription Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Access Remaining</Text>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>

          <Text style={styles.progressText}>
            {daysRemaining > 0
              ? `${daysRemaining} day${daysRemaining > 1 ? "s" : ""} remaining`
              : "Expired"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  profileSection: {
    backgroundColor: "#b2d1e5",
    alignItems: "center",
    paddingVertical: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#000",
    marginBottom: 12,
  },
  progressBarContainer: {
    width: "100%",
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#b2d1e5",
  },
  progressText: {
    fontSize: 14,
    color: "#333",
    textAlign: "right",
  },

  greeting: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  notification: {
    color: "#fff",
    fontSize: 14,
  },
  section: {
    padding: 16,
  },
  section1: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: "700",
  },
  cardSubtext: {
    fontSize: 12,
    color: "#333",
    marginTop: 4,
  },
  wideCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 16,
    marginHorizontal: 4,
  },
  wideCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
    zIndex: 1,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dropdownText: {
    marginRight: 4,
  },
  wideCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  wideCardColumnLeft: {
    alignItems: "flex-start",
    flex: 1,
  },
  wideCardColumnRight: {
    alignItems: "flex-end",
    flex: 1,
  },
  subscriptionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginHorizontal: 4,
  },
  subscriptionHeader: {
    marginBottom: 16,
  },
  subscriptionPlan: {
    backgroundColor: "#f8d56f",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  planText: {
    fontWeight: "600",
  },
  dropdownMenu: {
    position: "absolute",
    top: 30,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1000,
    minWidth: 140,
  },
  dropdownItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  dropdownItemText: {
    fontSize: 14,
  },
});

export default DashboardScreen;
