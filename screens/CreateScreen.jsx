import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useSelector } from "react-redux";
import Header from "../components/Header";

// --- START: Added for Demo Pack ---
// 1. Define the static demo pack object.
const demoPack = {
  _id: "demo-pack-id", // A unique static ID is crucial for the keyExtractor
  name: "Demo Milk Pack",
  quantity: 2,
  unit: "Litre",
  duration: "day",
  price: 1500,
  isDemo: true, // Custom flag to identify the demo pack
};
// --- END: Added for Demo Pack ---

const fetchPacks = async (vendorId) => {
  try {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_API_URL}/pack/get-by-vendor?vendorId=${vendorId}`
    );
    if (response.data.success) {
      return response.data.packs;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch packs:", error);
    return [];
  }
};

const CreateScreen = ({ navigation }) => {
  const [packs, setPacks] = useState([]);
  const vendor = useSelector((state) => state.vendor.vendor);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPacks = async () => {
    if (vendor?._id) {
      const fetchedPacks = await fetchPacks(vendor._id);
      setPacks(fetchedPacks);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await loadPacks();
      setLoading(false);
    };
    initialLoad();
  }, [vendor]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadPacks();
    setRefreshing(false);
  }, [vendor]);

  // --- START: Modified renderItem ---
  // 2. Update renderItem to handle both demo and real packs.
  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        if (item.isDemo) {
          // Navigate to DemoPackScreen for the demo card
          navigation.navigate("DemoPack");
        } else {
          // Navigate to AddPack for real packs
          navigation.navigate("AddPack", {
            pack: item,
            fetchPacks: loadPacks,
          });
        }
      }}
    >
      <View style={styles.packCard}>
        {/* Conditionally render the "Demo" badge */}
        {item.isDemo && (
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>Demo</Text>
          </View>
        )}
        <View>
          <Text style={styles.packName}>{item.name}</Text>
          <Text style={styles.packQuantity}>
            {item.quantity} {item.unit} / {item.duration}
          </Text>
          <Text style={styles.packPrice}>Rs. {item.price} / Month</Text>
        </View>
        <View>
          <Ionicons
            name={item.isDemo ? "eye-outline" : "pencil"} // Show a different icon for demo
            size={24}
            color="#333"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
  // --- END: Modified renderItem ---

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header title="Create Pack" />

      {/* Packs List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007bff"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          // --- START: Modified FlatList data ---
          // 3. Prepend the demo pack to the fetched packs array.
          data={[demoPack, ...packs]}
          // --- END: Modified FlatList data ---
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Create Pack Button */}
      <TouchableOpacity
        style={styles.createPackButton}
        onPress={() => navigation.navigate("AddPack", { fetchPacks: loadPacks })} // Ensure fetchPacks is passed so the list can refresh after creation
      >
        <Ionicons name="add" size={24} color="black" />
        <Text style={styles.createPackButtonText}>Create Pack</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// --- START: Added styles for Demo Badge ---
// 4. Add new styles for the badge.
const styles = StyleSheet.create({
  // ... (keep all your existing styles)
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContainer: {
    padding: 16,
  },
  packCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 110,
    position: "relative", // Needed for absolute positioning of the badge
    overflow: "hidden",   // Ensures badge corners are clipped by the card's borderRadius
  },
  demoBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#ffc107", // A distinct color for the demo badge
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomRightRadius: 12, // Stylish corner
  },
  demoBadgeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  packName: {
    fontSize: 16,
    fontWeight: "700",
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
  createPackButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    flexDirection: "row",
    backgroundColor: "#b2d1e5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  createPackButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
// --- END: Added styles for Demo Badge ---

export default CreateScreen;