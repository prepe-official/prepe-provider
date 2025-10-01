import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import { useSelector } from "react-redux";
import axios from "axios";
import { format } from "date-fns";
import { useNavigation } from "@react-navigation/native";

const CalendarScreen = () => {
  const navigation = useNavigation();
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "MMM"));
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showDateSelectionModal, setShowDateSelectionModal] = useState(false);
  const [years, setYears] = useState([]);
  const vendor = useSelector((state) => state.vendor.vendor);

  const [subscriptions, setSubscriptions] = useState([]);
  const [subbedPacks, setSubbedPacks] = useState([]);
  const [expiringPacks, setExpiringPacks] = useState([]);
  const [skippedPacks, setSkippedPacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Generate years dynamically on component mount
  useEffect(() => {
    const currentDate = new Date();
    const currentCalendarYear = currentDate.getFullYear();
    const yearsArray = [];

    // Include current year and next 3 years
    for (let i = 0; i < 4; i++) {
      yearsArray.push(currentCalendarYear + i);
    }

    setYears(yearsArray);
  }, []);

  const fetchSubscriptions = async () => {
    if (vendor?._id) {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/subscription/get-by-vendor?vendorId=${vendor._id}`,
          {
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        if (response.data.success) {
          setSubscriptions(response.data.subscriptions);
        }
      } catch (error) {
        console.error("Failed to fetch subscriptions:", error);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSubscriptions();
      setLoading(false);
    };
    loadData();
  }, [vendor]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  }, [vendor]);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  useEffect(() => {
    if (subscriptions.length > 0) {
      const monthIndex = months.indexOf(currentMonth);
      const firstDayOfSelectedMonth = new Date(currentYear, monthIndex, 1);
      const lastDayOfSelectedMonth = new Date(currentYear, monthIndex + 1, 0);

      // Filter for packs subscribed in the selected month
      const subbed = subscriptions.filter((sub) => {
        const createdAt = new Date(sub.createdAt);
        return (
          createdAt >= firstDayOfSelectedMonth &&
          createdAt <= lastDayOfSelectedMonth
        );
      });

      // Filter for packs expiring in the selected month
      const expiring = subscriptions.filter((sub) => {
        if (!sub.expiryDate) return false;
        const expiry = new Date(sub.expiryDate);
        return (
          expiry >= firstDayOfSelectedMonth && expiry <= lastDayOfSelectedMonth
        );
      });

      // Filter for active packs in the selected month (for skipped dates logic)
      const relevantSubscriptions = subscriptions.filter((sub) => {
        const createdAt = new Date(sub.createdAt);
        const createdBeforeOrDuring = createdAt <= lastDayOfSelectedMonth;

        const notExpiredBefore =
          !sub.expiryDate ||
          new Date(sub.expiryDate) >= firstDayOfSelectedMonth;

        return createdBeforeOrDuring && notExpiredBefore;
      });

      setSubbedPacks(subbed);
      setExpiringPacks(expiring);

      // Filter for packs with skipped dates in the selected month
      const skipped = relevantSubscriptions
        .map((sub) => {
          if (!sub.skippedDates || sub.skippedDates.length === 0) {
            return null;
          }
          const datesForCurrentMonth = sub.skippedDates
            .map((d) => new Date(d))
            .filter(
              (d) =>
                d.getFullYear() === currentYear && d.getMonth() === monthIndex
            )
            .map((d) => d.getDate())
            .sort((a, b) => a - b);

          if (datesForCurrentMonth.length > 0) {
            return { ...sub, skippedDatesForMonth: datesForCurrentMonth };
          }
          return null;
        })
        .filter(Boolean); // remove nulls

      setSkippedPacks(skipped);
    }
  }, [subscriptions, currentMonth, currentYear]);

  const goToPreviousMonth = () => {
    const currentMonthIndex = months.indexOf(currentMonth);

    if (currentMonthIndex === 0) {
      // If January, go to December of previous year
      setCurrentMonth(months[11]);
      setCurrentYear((prevYear) => prevYear - 1);
    } else {
      // Go to previous month
      setCurrentMonth(months[currentMonthIndex - 1]);
    }
  };

  const goToNextMonth = () => {
    const currentMonthIndex = months.indexOf(currentMonth);

    if (currentMonthIndex === 11) {
      // If December, go to January of next year
      setCurrentMonth(months[0]);
      setCurrentYear((prevYear) => prevYear + 1);
    } else {
      // Go to next month
      setCurrentMonth(months[currentMonthIndex + 1]);
    }
  };

  const selectYear = (year) => {
    setCurrentYear(year);
  };

  const selectMonth = (month) => {
    setCurrentMonth(month);
    setShowDateSelectionModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Calendar" />

      <View style={styles.calendarHeader}>
        <TouchableOpacity
          onPress={goToPreviousMonth}
          style={styles.arrowButton}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setShowDateSelectionModal(true);
          }}
        >
          <Text style={styles.monthYearText}>
            {currentMonth} {currentYear}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToNextMonth} style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007bff"
          style={{ marginTop: 20 }}
        />
      ) : (
        <ScrollView
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Packs Subbed</Text>
            {subbedPacks.map((pack, index) => (
              <TouchableOpacity
                key={`subbed-${index}`}
                onPress={() =>
                  navigation.navigate("UserDetails", {
                    subscriptionId: pack._id,
                    fetchSubscriptions,
                  })
                }
              >
                <View style={styles.packCard}>
                  <View style={styles.avatarPlaceholder}>
                    {pack.userId?.image ? (
                      <Image
                        source={{ uri: pack.userId.image }}
                        style={styles.avatar}
                      />
                    ) : (
                      <Ionicons name="person" size={24} color="#fff" />
                    )}
                  </View>
                  <View style={styles.packDetails}>
                    <Text style={styles.packName}>{pack.userId?.name}</Text>
                    <Text style={styles.packDate}>
                      Subbed :{" "}
                      {format(new Date(pack.createdAt), "dd / MM / yy")}
                    </Text>
                    <Text style={styles.packSubName}>{pack.packId?.name}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Packs Expiring</Text>
            {expiringPacks.map((pack, index) => (
              <TouchableOpacity
                key={`expiring-${index}`}
                onPress={() =>
                  navigation.navigate("UserDetails", {
                    subscriptionId: pack._id,
                    fetchSubscriptions,
                  })
                }
              >
                <View style={styles.packCard}>
                  <View style={styles.avatarPlaceholder}>
                    {pack.userId?.image ? (
                      <Image
                        source={{ uri: pack.userId.image }}
                        style={styles.avatar}
                      />
                    ) : (
                      <Ionicons name="person" size={24} color="#fff" />
                    )}
                  </View>
                  <View style={styles.packDetails}>
                    <Text style={styles.packName}>{pack.userId?.name}</Text>
                    <Text style={styles.packDate}>
                      Expiring :{" "}
                      {format(new Date(pack.expiryDate), "dd / MM / yy")}
                    </Text>
                    <Text style={styles.packSubName}>{pack.packId?.name}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Skipped Dates</Text>
            {skippedPacks.map((pack, index) => (
              <TouchableOpacity
                key={`skipped-${index}`}
                onPress={() =>
                  navigation.navigate("UserDetails", {
                    subscriptionId: pack._id,
                    fetchSubscriptions,
                  })
                }
              >
                <View style={styles.packCard}>
                  <View style={styles.avatarPlaceholder}>
                    {pack.userId?.image ? (
                      <Image
                        source={{ uri: pack.userId.image }}
                        style={styles.avatar}
                      />
                    ) : (
                      <Ionicons name="person" size={24} color="#fff" />
                    )}
                  </View>
                  <View style={styles.packDetails}>
                    <Text style={styles.packName}>{pack.userId?.name}</Text>
                    <Text style={styles.packSubName}>{pack.packId?.name}</Text>
                  </View>
                  <View style={styles.skippedDatesContainer}>
                    <Text style={styles.skippedDatesLabel}>Skipped Dates</Text>
                    <View style={styles.skippedDatesCircles}>
                      {pack.skippedDatesForMonth.map((date, i) => (
                        <View key={i} style={styles.dateCircle}>
                          <Text style={styles.dateCircleText}>{date}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add padding at the bottom for better scrolling */}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      {/* Combined Year and Month Selection Modal */}
      <Modal
        visible={showDateSelectionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateSelectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateSelectionModalContent}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowDateSelectionModal(false)}
            >
              <Ionicons name="close-circle" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Select Year</Text>

            <ScrollView
              style={styles.yearScrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearItem,
                    year === currentYear && styles.selectedYearItem,
                  ]}
                  onPress={() => selectYear(year)}
                >
                  <Text
                    style={[
                      styles.yearText,
                      year === currentYear && styles.selectedYearText,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalTitle}>Select Month</Text>

            <View style={styles.monthGrid}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthItem,
                    month === currentMonth && styles.selectedMonthItem,
                  ]}
                  onPress={() => selectMonth(month)}
                >
                  <Text
                    style={[
                      styles.monthText,
                      month === currentMonth && styles.selectedMonthText,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
  },
  arrowButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  monthYearText: {
    fontSize: 22,
    fontWeight: "700",
  },
  contentContainer: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 16,
    marginBottom: 10,
  },
  packCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    alignItems: "center",
    minHeight: 100,
  },
  packDetails: {
    flex: 1,
    marginLeft: 16,
  },
  packName: {
    fontSize: 16,
    fontWeight: "700",
  },
  packSubName: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  packQuantity: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
    fontWeight: "600",
  },
  packPrice: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  packed: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    height: "100%",
    paddingBottom: 12,
  },
  packDate: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    marginBottom: 4,
  },
  skippedDatesContainer: {
    alignItems: "flex-end",
  },
  skippedDatesLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: "right",
    fontWeight: "500",
  },
  skippedDatesCircles: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    maxWidth: 150,
  },
  dateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    margin: 3,
  },
  dateCircleText: {
    fontSize: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  dateSelectionModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    margin: 20,
  },
  closeModalButton: {
    position: "absolute",
    right: 15,
    top: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 15,
    marginTop: 10,
  },
  yearScrollContainer: {
    maxHeight: 200,
    marginBottom: 30,
  },
  yearItem: {
    padding: 15,
    alignItems: "center",
    width: "100%",
  },
  selectedYearItem: {
    borderBottomWidth: 0,
    backgroundColor: "#f8d56f",
    borderRadius: 8,
  },
  yearText: {
    fontSize: 24,
    textAlign: "center",
    color: "#555",
  },
  selectedYearText: {
    color: "#000",
    fontWeight: "700",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthItem: {
    width: "30%",
    alignItems: "center",
    padding: 15,
    margin: 5,
    borderRadius: 5,
  },
  selectedMonthItem: {
    backgroundColor: "#f8d56f",
    borderRadius: 8,
  },
  monthText: {
    fontSize: 18,
  },
  selectedMonthText: {
    fontWeight: "700",
  },
});

export default CalendarScreen;
