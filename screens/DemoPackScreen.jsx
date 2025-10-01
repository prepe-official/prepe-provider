import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";

// This screen is a simplified, read-only version of AddPackScreen with static data.
const DemoPackScreen = () => {
  // Static data for the demo pack
  const demoPackData = {
    images: [require("../assets/logo.png"), require("../assets/milk.jpg"), require("../assets/milk1.jpeg")],
    name: "Demo Milk Pack",
    description:
      "This is a demonstration of how a pack will look. It includes fresh, high-quality milk delivered to your doorstep daily.",
    products: ["Fresh Cow Milk", "Toned Milk"],
    category: "Dairy",
    quantity: "30",
    unit: "Litre",
    duration: "day",
    price: "1500",
    deliveryTimeFrom: "6:00 AM",
    deliveryTimeTo: "8:00 AM",
    allowSkip: true,
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Demo Pack" showBackButton={true} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* --- Static Images --- */}
        <Text style={styles.sectionTitle}>Images</Text>
        <View style={styles.imageContainer}>
          {demoPackData.images.map((uri, index) => (
            <Image key={index} source={uri} style={styles.image} />
          ))}
        </View>

        {/* --- Static Details --- */}
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Pack Name</Text>
          <Text style={styles.detailValue}>{demoPackData.name}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Pack Description</Text>
          <Text style={styles.detailValue}>{demoPackData.description}</Text>
        </View>

        <Text style={styles.sectionTitle}>Products Included</Text>
        <View style={styles.productListContainer}>
          {demoPackData.products.map((product, index) => (
            <View key={index} style={styles.productListItem}>
              <Text style={styles.productListItemText}>{product}</Text>
            </View>
          ))}
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Category</Text>
          <Text style={styles.detailValue}>{demoPackData.category}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.flexItem}>
            <Text style={styles.detailLabel}>Quantity/Unit</Text>
            <Text style={styles.detailValue}>
              {demoPackData.quantity} {demoPackData.unit}
            </Text>
          </View>
          <View style={styles.flexItem}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{demoPackData.duration}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flexItem}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>Rs. {demoPackData.price}</Text>
          </View>
          <View style={styles.flexItem}>
            <Text style={styles.detailLabel}>Per</Text>
            <Text style={styles.detailValue}>Month</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flexItem}>
            <Text style={styles.detailLabel}>Delivery Time (From)</Text>
            <Text style={styles.detailValue}>
              {demoPackData.deliveryTimeFrom}
            </Text>
          </View>
          <View style={styles.flexItem}>
            <Text style={styles.detailLabel}>Delivery Time (To)</Text>
            <Text style={styles.detailValue}>
              {demoPackData.deliveryTimeTo}
            </Text>
          </View>
        </View>

        <View style={styles.checkboxContainer}>
          <Ionicons
            name={demoPackData.allowSkip ? "checkbox" : "square-outline"}
            size={24}
            color="black"
          />
          <Text style={styles.checkboxLabel}>
            Allow Customer To Skip Benefits
          </Text>
        </View>

        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Preview of pack</Text>
          <Text style={styles.previewText}>
            {demoPackData.quantity} {demoPackData.unit} {demoPackData.name} /{" "}
            {demoPackData.duration}
            {"\n"}@ Rs. {demoPackData.price} / Month
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles are borrowed and simplified from AddPackScreen for consistency
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 4,
  },
  detailItem: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#000",
  },
  productListContainer: {
    marginBottom: 16,
  },
  productListItem: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  productListItemText: {
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  flexItem: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  previewContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#f8f8f8",
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    color: "#666",
  },
  previewText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
});

export default DemoPackScreen;
