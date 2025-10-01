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
  Pressable,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MenuHeader from "../components/MenuHeader";
import BlueButton from "../components/BlueButton";
import { useSelector } from "react-redux";
import axios from "axios";
import { format } from "date-fns";

const SubscriptionsScreen = () => {
  const navigation = useNavigation();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("Latest");
  const vendor = useSelector((state) => state.vendor.vendor);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Filter subscriptions based on search query
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const userName = subscription.userId?.name || "";
    const packName = subscription.packId?.name || "";
    const query = searchQuery.toLowerCase();
    return (
      userName.toLowerCase().includes(query) ||
      packName.toLowerCase().includes(query)
    );
  });

  // Sort subscriptions based on selected option
  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    switch (sortOption) {
      case "Latest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "Oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "A to Z":
        return (a.userId?.name || "").localeCompare(b.userId?.name || "");
      case "Z to A":
        return (b.userId?.name || "").localeCompare(a.userId?.name || "");
      default:
        return 0;
    }
  });

  // Render each subscription item
  const renderItem = ({ item }) => {
    return (
      <Pressable
        onPress={() => {
          navigation.navigate("UserDetails", {
            subscriptionId: item._id,
            fetchSubscriptions,
          });
        }}
        style={styles.subscriptionCard}
      >
        <View style={styles.avatarPlaceholder}>
          {item.userId?.image ? (
            <Image source={{ uri: item.userId.image }} style={styles.avatar} />
          ) : (
            <Ionicons name="person" size={24} color="#fff" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.subscriptionName}>{item.userId?.name}</Text>
          <Text style={styles.subscriptionDate}>
            Subbed : {format(new Date(item.createdAt), "dd / MM / yy")}
          </Text>
          <Text style={styles.subscriptionQuantity}>{item.packId?.name}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <MenuHeader title="Manage Subscribers" />

      {/* Controls Container */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.floatingFilterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="funnel-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Subscriptions List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007bff"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={sortedSubscriptions}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
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
              <Text style={styles.modalTitle}>Search</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close-circle" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#555"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Sort Options */}
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
              <Text style={styles.sortText}>A to Z</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortOption === "Z to A" && styles.selectedSort,
              ]}
              onPress={() => setSortOption("Z to A")}
            >
              <Text style={styles.sortText}>Z to A</Text>
            </TouchableOpacity>

            {/* Filter Button */}
            <BlueButton
              title="Filter"
              onPress={() => setFilterModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 16,
  },
  floatingFilterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  subscriptionCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  subscriptionQuantity: {
    fontSize: 14,
    color: "#333",
    fontWeight: "700",
  },
  subscriptionDate: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    paddingLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
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
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});

export default SubscriptionsScreen;
