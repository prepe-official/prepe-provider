import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MenuHeader from "../components/MenuHeader";

const TransactionDetailScreen = ({ route }) => {
  const navigation = useNavigation();
  const { transaction } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <MenuHeader title="Transaction Details" />

      <View style={styles.content}>
        {/* Category Tag */}
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>
            {transaction.subscriptionId?.packId?.category || "N/A"}
          </Text>
        </View>

        {/* Item Details */}
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>
            {transaction.subscriptionId?.packId?.name}
          </Text>
          <Text style={styles.itemQuantity}>{`${
            transaction.subscriptionId?.packId?.quantity || ""
          } ${transaction.subscriptionId?.packId?.unit || ""} / ${
            transaction.subscriptionId?.packId?.duration || ""
          }`}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.discountedPrice}>Rs. {transaction.amount}</Text>
          </View>
        </View>

        {/* Received Time */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeLabel}>Received Time:</Text>
          <Text style={styles.timeValue}>
            {new Date(transaction.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
            , {new Date(transaction.createdAt).toLocaleDateString("en-GB")}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Customer Details */}
        <View style={styles.providerContainer}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: transaction.userId?.image }}
              style={styles.avatar}
            />
          </View>

          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>
              {transaction.userId?.name || "Customer Name"}
            </Text>
          </View>

          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>
              {transaction.userId?.phoneNumber}
            </Text>
            <Text style={styles.contactText}>{transaction.userId?.email}</Text>
          </View>
        </View>

        {/* Customer Address */}
        <Text style={styles.addressText}>
          {transaction.userId?.address?.street},{" "}
          {transaction.userId?.address?.city},{" "}
          {transaction.userId?.address?.state} -{" "}
          {transaction.userId?.address?.zipCode}
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Transaction ID */}
        <Text style={styles.transactionId}>
          Transaction ID: {transaction._id}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    padding: 16,
  },
  categoryTag: {
    backgroundColor: "#f8d56f",
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#000000",
  },
  categoryText: {
    color: "#000",
    fontWeight: "600",
  },
  itemDetails: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
    fontWeight: "700",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: "#333",
    textDecorationLine: "line-through",
    marginRight: 8,
    fontWeight: "600",
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  timeContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  providerContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: "600",
  },
  shopName: {
    fontSize: 14,
    color: "#333",
  },
  contactInfo: {
    alignItems: "flex-end",
  },
  contactText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  addressText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: "600",
  },
  transactionId: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
});

export default TransactionDetailScreen;
