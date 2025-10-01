import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MenuHeader from "../components/MenuHeader";
import BlueButton from "../components/BlueButton";
import { useSelector } from "react-redux";
import axios from "axios";

const OrdersScreen = () => {
  const navigation = useNavigation();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("Latest");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { vendor, token } = useSelector((state) => state.vendor);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [deliverModalVisible, setDeliverModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryInfoModalVisible, setDeliveryInfoModalVisible] =
    useState(false);

  const fetchOrders = async () => {
    if (!vendor?._id) {
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/order/get-by-vendor?vendorId=${vendor._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchOrders();
      setLoading(false);
    };
    if (vendor?._id) {
      loadData();
    }
  }, [vendor?._id, token]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [vendor?._id, token]);

  const handleCancelOrder = async (orderToCancel) => {
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/subscription/cancel-order?orderId=${orderToCancel._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setOrders((prevOrders) =>
          prevOrders.filter((o) => o._id !== orderToCancel._id)
        );
      } else {
        console.error("Failed to cancel order:", response.data.message);
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  const onDeliverPress = (order) => {
    setSelectedOrder(order);
    setDeliverModalVisible(true);
  };

  const onCancelPress = (order) => {
    setSelectedOrder(order);
    setCancelModalVisible(true);
  };

  const confirmDeliver = async () => {
    if (!selectedOrder) return;
    setDeliverModalVisible(false);
    setUpdatingOrderId(selectedOrder._id);
    try {
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/order/mark-delivered?orderId=${selectedOrder._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setInfoModalVisible(true);
        setOrders((prevOrders) =>
          prevOrders.map((o) =>
            o._id === selectedOrder._id ? { ...o, status: "delivered" } : o
          )
        );
      } else {
        console.error(
          "Failed to mark order as delivered:",
          response.data.message
        );
      }
    } catch (error) {
      console.error("Failed to deliver order:", error);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const confirmCancel = async () => {
    if (!selectedOrder) return;
    setCancelModalVisible(false);
    try {
      await handleCancelOrder(selectedOrder);
    } finally {
      setSelectedOrder(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!order) return false;
    const customerName = order.userId?.name || "";
    const packName = order.packId?.name || "";
    const query = searchQuery.toLowerCase();
    return (
      customerName.toLowerCase().includes(query) ||
      packName.toLowerCase().includes(query)
    );
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortOption) {
      case "Latest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "Oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "A to Z": {
        const nameA = a.userId?.name || "";
        const nameB = b.userId?.name || "";
        return nameA.localeCompare(nameB);
      }
      case "Z to A": {
        const nameA = a.userId?.name || "";
        const nameB = b.userId?.name || "";
        return nameB.localeCompare(nameA);
      }
      default:
        return 0;
    }
  });

  const calculateTimeLeft = (item) => {
    const timeLeft = Math.round(
      (new Date(item.deliveryDate) - new Date()) / (1000 * 60 * 60)
    );
    return `${timeLeft} Hours`;
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("OrderScreen", {
            orderId: item._id,
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Image
              source={{ uri: item.userId?.image }}
              style={styles.avatarImage}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.customerName}>
              {item.userId?.name || "Mr. Ankit"}
            </Text>
            <Text style={styles.timeLeft}>
              Time Left: {calculateTimeLeft(item) || "14 Hours"}
            </Text>
            <Text style={styles.packInfo}>
              Pack: {item.packId?.name || "Lite Milk Pack"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {updatingOrderId === item._id || item.status === "delivered" ? (
        <View style={styles.confirmingDelivery}>
          <Text style={styles.confirmingText}>
            Confirming Delivery with customer ... Please Wait
          </Text>
        </View>
      ) : item.status === "rejected" ? (
        <View style={styles.deniedDelivery}>
          <Text style={styles.confirmingText}>
            Customer Denied The Delivery. Event Under Investigation. Please
            Cooperate.
          </Text>
        </View>
      ) : (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => onCancelPress(item)}
          >
            <Text style={[styles.buttonText, styles.cancelButtonText]}>
              Cancel Order
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.deliveredButton]}
            onPress={() => onDeliverPress(item)}
          >
            <Text style={[styles.buttonText, styles.deliveredButtonText]}>
              Delivered
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <MenuHeader title="Pending Orders" />

      {/* Info Button */}
      <View style={styles.infoButtonContainer}>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setDeliveryInfoModalVisible(true)}
        >
          <Ionicons name="information-circle" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.floatingFilterButtonContainer}>
        <TouchableOpacity
          style={styles.floatingFilterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="funnel-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E8B57" style={{ flex: 1 }} />
      ) : (
        <View style={{ flex: 1 }}>
          {sortedOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending orders found.</Text>
            </View>
          ) : (
            <FlatList
              data={sortedOrders}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: 40, paddingTop: 75 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search & Sort</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close-circle" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#555"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by customer or pack"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <Text style={styles.sortTitle}>Sort</Text>
            <TouchableOpacity
              style={[
                styles.sortOption,
                sortOption === "Latest" && styles.selectedSort,
              ]}
              onPress={() => setSortOption("Latest")}
            >
              <Text style={styles.sortText}>Latest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortOption === "Oldest" && styles.selectedSort,
              ]}
              onPress={() => setSortOption("Oldest")}
            >
              <Text style={styles.sortText}>Oldest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortOption === "A to Z" && styles.selectedSort,
              ]}
              onPress={() => setSortOption("A to Z")}
            >
              <Text style={styles.sortText}>A to Z (Customer)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortOption === "Z to A" && styles.selectedSort,
              ]}
              onPress={() => setSortOption("Z to A")}
            >
              <Text style={styles.sortText}>Z to A (Customer)</Text>
            </TouchableOpacity>

            <BlueButton
              title="Apply"
              onPress={() => setFilterModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => {
          setCancelModalVisible(false);
          setSelectedOrder(null);
        }}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.confirmationModalContent}>
            <TouchableOpacity
              onPress={() => {
                setCancelModalVisible(false);
                setSelectedOrder(null);
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
              onPress={confirmCancel}
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
          setSelectedOrder(null);
        }}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.confirmationModalContent}>
            <TouchableOpacity
              onPress={() => {
                setDeliverModalVisible(false);
                setSelectedOrder(null);
              }}
              style={styles.confirmationCloseButton}
            >
              <Ionicons name="close-circle" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.confirmationModalTitle}>Confirm Delivery</Text>
            <Text style={styles.confirmationModalText}>
              Are you sure you want to mark this order as delivered to{" "}
              {selectedOrder?.userId?.name || "the customer"}?
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
          setSelectedOrder(null);
        }}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.confirmationModalContent}>
            <TouchableOpacity
              onPress={() => {
                setInfoModalVisible(false);
                setSelectedOrder(null);
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
              {selectedOrder?.userId?.name} on{" "}
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
                setSelectedOrder(null);
              }}
            >
              <Text style={styles.confirmDeliverButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delivery Info Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={deliveryInfoModalVisible}
        onRequestClose={() => setDeliveryInfoModalVisible(false)}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.deliveryInfoModalContent}>
            <TouchableOpacity
              onPress={() => setDeliveryInfoModalVisible(false)}
              style={styles.confirmationCloseButton}
            >
              <Ionicons name="close-circle" size={24} color="#333" />
            </TouchableOpacity>

            <View style={styles.modalTitleContainer}>
              <Ionicons name="information-circle" size={24} color="#007AFF" />
              <Text style={styles.deliveryInfoModalTitle}>
                Subscribers & Payment
              </Text>
            </View>

            <Text style={styles.deliveryInfoModalText}>
              You have 24 hours to provide the benefits and onboard your new
              subscribers. Payment will be released only after you marked the
              delivery and the customer confirms it.
            </Text>

            <View style={styles.noteContainer}>
              <Text style={styles.noteTitle}>Note:</Text>
              <Text style={styles.noteText}>
                Misreporting deliveries is prohibited. We verify with customers,
                and violations may lead to account suspension and legal action.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.understandButton}
              onPress={() => setDeliveryInfoModalVisible(false)}
            >
              <Text style={styles.understandButtonText}>I Understand</Text>
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
    backgroundColor: "#F7F7F7",
  },
  floatingFilterButtonContainer: {
    position: "absolute",
    top: 70,
    right: 20,
    zIndex: 1,
  },
  infoButtonContainer: {
    position: "absolute",
    top: 76,
    left: 20,
    zIndex: 1,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  floatingFilterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  listContainer: {
    padding: 16,
    paddingTop: 75,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0E0E0",
    marginRight: 16,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  headerText: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  timeLeft: {
    fontSize: 14,
    color: "red",
    marginVertical: 4,
  },
  packInfo: {
    fontSize: 14,
    color: "#333",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
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
  confirmingDelivery: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  deniedDelivery: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 47, 0, 0.34)",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmingText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  confirmationCloseButton: {
    padding: 8,
    position: "absolute",
    top: 10,
    right: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  sortTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  sortOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  selectedSort: {
    backgroundColor: "#f8f8f8",
  },
  sortText: {
    fontSize: 16,
    fontWeight: "500",
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
  deliveryInfoModalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 350,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  deliveryInfoModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#333",
  },
  deliveryInfoModalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  noteContainer: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  learnMoreLink: {
    marginBottom: 20,
  },
  learnMoreText: {
    fontSize: 16,
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  understandButton: {
    backgroundColor: "#A9C4D4",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  understandButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default OrdersScreen;
