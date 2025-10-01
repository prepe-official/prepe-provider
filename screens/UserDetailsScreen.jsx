import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  isBefore,
  isEqual,
} from "date-fns";
import { useNavigation } from "@react-navigation/native";
import Header from "../components/Header";
import { useSelector } from "react-redux";
import axios from "axios";
import Calendar from "../components/Calendar";
import BlueButton from "../components/BlueButton";

const UserDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { subscriptionId, fetchSubscriptions } = route.params || {};
  const { token, vendor } = useSelector((state) => state.vendor);

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSkipModalVisible, setSkipModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [skipLoading, setSkipLoading] = useState(false);
  const [isRemoveModalVisible, setRemoveModalVisible] = useState(false);
  const [removeDescription, setRemoveDescription] = useState("");
  const [removeLoading, setRemoveLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allowedDates, setAllowedDates] = useState([]);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [deliverModalVisible, setDeliverModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const fetchSubscription = async () => {
    if (!subscriptionId) {
      setLoading(false);
      setError("Subscription ID not provided.");
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/subscription/get?id=${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.success) {
        setSubscription(data.subscription);
        if (vendor?._id) {
          fetchPendingOrder(vendor?._id);
        }
      } else {
        setError(data.message || "Failed to fetch subscription details.");
      }
    } catch (e) {
      setError("An error occurred while fetching subscription details.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrder = async (vendorId) => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/order/get-by-vendor?vendorId=${vendorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        const order = response.data.orders.find(
          (o) => o.subscriptionId === subscriptionId
        );
        setPendingOrder(order);
      }
    } catch (error) {
      console.error("Failed to fetch pending order:", error);
    }
  };

  const calculateDeliveryDates = () => {
    if (!subscription || !subscription.packId) {
      return;
    }

    const { createdAt, expiryDate, packId } = subscription;
    const { duration } = packId;

    let startDate = new Date(createdAt);
    switch (duration) {
      case "day":
        startDate = addDays(startDate, 1);
        break;
      case "week":
        startDate = addWeeks(startDate, 1);
        break;
      case "2weeks":
        startDate = addWeeks(startDate, 2);
        break;
      case "3weeks":
        startDate = addWeeks(startDate, 3);
        break;
      case "month":
        startDate = addDays(startDate, 30);
        break;
      default:
        return;
    }
    const endDate = new Date(expiryDate);
    const dates = [];

    let currentDate = startDate;

    while (isBefore(currentDate, endDate)) {
      dates.push(new Date(currentDate));

      switch (duration) {
        case "day":
          currentDate = addDays(currentDate, 1);
          break;
        case "week":
          currentDate = addWeeks(currentDate, 1);
          break;
        case "2weeks":
          currentDate = addWeeks(currentDate, 2);
          break;
        case "3weeks":
          currentDate = addWeeks(currentDate, 3);
          break;
        case "month":
          currentDate = addMonths(currentDate, 1);
          break;
        default:
          return;
      }
    }
    setAllowedDates(dates);
  };

  const onOpenSkipModal = () => {
    calculateDeliveryDates();
    setSkipModalVisible(true);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSubscription();
      setLoading(false);
    };
    loadData();
  }, [subscriptionId, token]);

  // --- MODIFICATION START: Call calculateDeliveryDates when subscription data is available ---
  useEffect(() => {
    if (subscription) {
      calculateDeliveryDates();
    }
  }, [subscription]);
  // --- MODIFICATION END ---

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchSubscription();
    setRefreshing(false);
  }, [subscriptionId, token]);

  const handleSkipDay = async () => {
    if (!selectedDate) {
      alert("Please select a date to skip.");
      return;
    }
    // Additional validation: Ensure selected date is not beyond subscription expiry
    if (subscription?.expiryDate) {
      const expiryDate = new Date(subscription.expiryDate);
      expiryDate.setHours(23, 59, 59, 999); // Set to end of day for comparison

      if (selectedDate > expiryDate) {
        alert("Cannot skip a date beyond the subscription expiry date.");
        return;
      }
    }

    setSkipLoading(true);
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");

      const payload = {
        date: `${year}-${month}-${day}`,
        isVendor: true,
      };

      const { data } = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/subscription/skip-day?subscriptionId=${subscriptionId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        await fetchSubscriptions();
        await fetchSubscription();
        setSkipModalVisible(false);
        setSelectedDate(null);
        alert("Day skipped successfully!");
      } else {
        alert(data.message || "Failed to skip day.");
      }
    } catch (error) {
      console.error("Skip day error:", error);
      alert(
        "An error occurred while skipping the day. Please try again later."
      );
    } finally {
      setSkipLoading(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!removeDescription.trim()) {
      alert("Please provide a reason for removal.");
      return;
    }
    setRemoveLoading(true);
    try {
      const payload = {
        vendorId: subscription?.vendorId,
        userId: subscription?.userId?._id,
        packId: subscription?.packId?._id,
        subscriptionId: subscriptionId,
        description: removeDescription,
      };

      if (
        !payload.vendorId ||
        !payload.userId ||
        !payload.packId ||
        !payload.description
      ) {
        alert("Could not assemble the request. Some data is missing.");
        setRemoveLoading(false);
        return;
      }

      const { data } = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/request/create`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setRemoveModalVisible(false);
        setRemoveDescription("");
        alert(
          "Request to remove user has been submitted. Please wait for admin confirmation."
        );
      } else {
        alert(data.message || "Failed to submit removal request.");
      }
    } catch (error) {
      console.error("Remove user error:", error);
      alert(
        "An error occurred while submitting the removal request. Please try again later."
      );
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!pendingOrder) return;
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/subscription/cancel-order?orderId=${pendingOrder._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setPendingOrder(null); // Or refetch
        alert("Order cancelled successfully!");
      } else {
        alert(response.data.message || "Failed to cancel order.");
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert("An error occurred while canceling the order.");
    } finally {
      setCancelModalVisible(false);
    }
  };

  const onDeliverPress = () => {
    setDeliverModalVisible(true);
  };

  const onCancelPress = () => {
    setCancelModalVisible(true);
  };

  const confirmDeliver = async () => {
    if (!pendingOrder) return;
    setDeliverModalVisible(false);
    setUpdatingOrderId(pendingOrder._id);
    try {
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/order/mark-delivered?orderId=${pendingOrder._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setInfoModalVisible(true);
        setPendingOrder({ ...pendingOrder, status: "delivered" });
      } else {
        alert(response.data.message || "Failed to mark order as delivered.");
      }
    } catch (error) {
      console.error("Failed to deliver order:", error);
      alert("An error occurred while delivering the order.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const user = subscription?.userId || {};
  const pack = subscription?.packId || {};

  const showPleaseWait =
    pendingOrder &&
    (updatingOrderId === pendingOrder._id ||
      pendingOrder.status === "delivered");

  const getSkippedDates = () => {
    if (!subscription?.skippedDates || subscription.skippedDates.length === 0) {
      return [];
    }

    return subscription.skippedDates
      .map((d) => new Date(d))
      .sort((a, b) => a - b)
      .map((date) => ({
        day: date.getDate(),
        month: format(date, "MMM"),
      }));
  };

  const skippedDates = getSkippedDates();

  // --- MODIFICATION START: Calculate the next valid delivery date ---
  let nextDeliveryDate = null;
  if (subscription && allowedDates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the beginning of today

    const skippedDateStrings = new Set(
      subscription.skippedDates?.map((d) => d.substring(0, 10)) || []
    );

    nextDeliveryDate = allowedDates.find((date) => {
      const isUpcoming = !isBefore(date, today);
      const dateString = date.toISOString().substring(0, 10);
      const isSkipped = skippedDateStrings.has(dateString);
      return isUpcoming && !isSkipped;
    });
  }
  // --- MODIFICATION END ---

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="User Detail" showBackButton />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="User Detail" showBackButton />
        <View style={styles.centerContent}>
          <Text>{error}</Text>
        </View>
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Detail</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.content}>
          <Text>No user details provided.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="User Detail" showBackButton />

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user.image || "https://via.placeholder.com/150" }}
              style={styles.avatar}
            />
          </View>

          <Text style={styles.userName}>{user.name || "N/A"}</Text>
          <Text style={styles.packName}>{pack.name || "N/A"}</Text>

          <View style={styles.separator} />

          <View style={styles.dateInfoContainer}>
            <View>
              <Text style={styles.dateLabel}>Started :</Text>
              <Text style={styles.dateValue}>
                {subscription.createdAt
                  ? format(new Date(subscription.createdAt), "dd/MM/yyyy")
                  : "N/A"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.dateLabel}>Expiring :</Text>
              <Text style={styles.dateValue}>
                {subscription.expiryDate
                  ? format(new Date(subscription.expiryDate), "dd/MM/yyyy")
                  : "N/A"}
              </Text>
            </View>
          </View>

          {/* --- MODIFICATION START: Display the next delivery date --- */}
          {nextDeliveryDate && (
            <View style={styles.nextDeliveryContainer}>
              <Text style={styles.dateLabel}>Next Delivery :</Text>
              <Text style={styles.dateValue}>
                {format(nextDeliveryDate, "dd/MM/yyyy")}
              </Text>
            </View>
          )}
          {/* --- MODIFICATION END --- */}

          <View style={styles.separator} />

          {skippedDates.length > 0 && (
            <>
              <View style={styles.skippedContainer}>
                <Text style={styles.skippedTitle}>Skipped Dates</Text>
                <View style={styles.skippedDates}>
                  {skippedDates.map((dateObj, index) => (
                    <View key={index} style={styles.dateCircle}>
                      <Text style={styles.dateCircleText}>
                        {dateObj.day} {dateObj.month}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.separator} />
            </>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {user.address || "Donec congue pretium vehicula."}
            </Text>
            <Text style={styles.detailValue}>{user.phoneNumber || "N/A"}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Renewal</Text>
            <Text style={styles.detailValue}>
              {subscription.renewAmount ?? "05"}
            </Text>
          </View>
          {showPleaseWait ? (
            <View style={styles.confirmingDelivery}>
              <Text style={styles.confirmingText}>
                Confirming Delivery with customer ... Please Wait
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {!showPleaseWait && (
        <View style={styles.footer}>
          {pendingOrder ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancelPress}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                  Cancel Order
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deliveredButton]}
                onPress={onDeliverPress}
              >
                <Text style={[styles.buttonText, styles.deliveredButtonText]}>
                  Delivered
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {subscription?.packId?.isSkipBenefits && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={onOpenSkipModal}
                >
                  <Ionicons
                    name="play-skip-forward"
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={styles.skipButtonText}>Skip Day</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setRemoveModalVisible(true)}
              >
                <Text style={styles.removeButtonText}>Remove User</Text>
                <Ionicons name="alert-circle" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={isSkipModalVisible}
        onRequestClose={() => setSkipModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSkipModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.skipModalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSkipModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.skipModalTitle}>Select Date to Skip</Text>
              <Calendar
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
                skippedDates={subscription?.skippedDates || []}
                allowedDates={allowedDates}
              />

              <BlueButton
                title={skipLoading ? "Confirming..." : "Confirm"}
                onPress={handleSkipDay}
                disabled={skipLoading || !selectedDate}
                style={styles.confirmSkipButton}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isRemoveModalVisible}
        onRequestClose={() => setRemoveModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRemoveModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.skipModalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setRemoveModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.skipModalTitle}>Remove User Request</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Reason for removal..."
                value={removeDescription}
                onChangeText={setRemoveDescription}
                multiline
              />
              <BlueButton
                title={removeLoading ? "Submitting..." : "Submit Request"}
                onPress={handleRemoveUser}
                disabled={removeLoading || !removeDescription.trim()}
                style={styles.confirmSkipButton}
              />
              <Text style={styles.infoText}>
                Your request will be sent to the admin for approval.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => {
          setCancelModalVisible(false);
        }}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.confirmationModalContent}>
            <TouchableOpacity
              onPress={() => {
                setCancelModalVisible(false);
              }}
              style={styles.confirmationCloseButton}
            >
              <Ionicons name="close-circle" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.confirmationModalTitle}>
              Canceling the order!
            </Text>
            <Text style={styles.confirmationModalText}>
              Canceling the order will make you loose a potential subscriber.
              Are you sure want to cancel this order?
            </Text>
            <TouchableOpacity
              style={styles.confirmCancelButton}
              onPress={handleCancelOrder}
            >
              <Text style={styles.confirmCancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Deliver Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={deliverModalVisible}
        onRequestClose={() => {
          setDeliverModalVisible(false);
        }}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.confirmationModalContent}>
            <TouchableOpacity
              onPress={() => {
                setDeliverModalVisible(false);
              }}
              style={styles.confirmationCloseButton}
            >
              <Ionicons name="close-circle" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.confirmationModalTitle}>Confirm Delivery</Text>
            <Text style={styles.confirmationModalText}>
              Are you sure you want to mark this order as delivered to{" "}
              {user.name || "the customer"}?
            </Text>
            <TouchableOpacity
              style={styles.confirmDeliverButton}
              onPress={confirmDeliver}
            >
              <Text style={styles.confirmDeliverButtonText}>
                Yes, Delivered
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Info Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={infoModalVisible}
        onRequestClose={() => {
          setInfoModalVisible(false);
        }}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.confirmationModalContent}>
            <TouchableOpacity
              onPress={() => {
                setInfoModalVisible(false);
              }}
              style={styles.confirmationCloseButton}
            >
              <Ionicons name="close-circle" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.confirmationModalTitle}>
              Benefits Delivered
            </Text>
            <Text style={styles.confirmationModalText}>
              We have received your notification of benefit delivery to{" "}
              {user.name} on{" "}
              {new Date().toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              . We will be confirming with your customer and upon successful
              confirmation, you'll receive the payments and the subscriber.
            </Text>
            <TouchableOpacity
              style={styles.confirmDeliverButton}
              onPress={() => {
                setInfoModalVisible(false);
              }}
            >
              <Text style={styles.confirmDeliverButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  packName: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 20,
  },
  dateInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  // --- MODIFICATION START: Add style for the new row ---
  nextDeliveryContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // --- MODIFICATION END ---
  dateLabel: {
    fontSize: 14,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },
  skippedContainer: {},
  skippedTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  skippedDates: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dateCircle: {
    minWidth: 60,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  dateCircleText: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  confirmingDelivery: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmingText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  skipButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    flexDirection: "row",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "red",
    marginRight: 8,
  },
  deliveredButton: {
    backgroundColor: "#A9C4D4",
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButtonText: {
    color: "red",
  },
  deliveredButtonText: {
    color: "#000",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginLeft: 8,
  },
  removeButton: {
    flex: 1,
    height: 50,
    backgroundColor: "#ff4d4f",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    flexDirection: "row",
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
  },
  skipModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  skipModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
  },
  confirmSkipButton: {
    width: "100%",
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  descriptionInput: {
    width: "100%",
    height: 100,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  infoText: {
    marginTop: 15,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  confirmationModalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
    width: "100%",
  },
  confirmationModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  confirmationModalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmCancelButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  confirmCancelButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  confirmDeliverButton: {
    backgroundColor: "#A9C4D4",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  confirmDeliverButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  confirmationCloseButton: {
    padding: 8,
    position: "absolute",
    top: 10,
    right: 10,
  },
});

export default UserDetailsScreen;
