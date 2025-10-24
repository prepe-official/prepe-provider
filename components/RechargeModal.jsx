import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

const RechargeModal = ({
  visible,
  onPay,
  loading,
  isFirstTime,
  rechargeAmount,
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {isFirstTime ? "Welcome!" : "Subscription Expired"}
          </Text>
          <Text style={styles.modalMessage}>
            {isFirstTime
              ? "Please recharge to activate your account and start using the app."
              : "Your subscription has expired. Please recharge to continue using the app."}
          </Text>
          <TouchableOpacity
            style={styles.payButton}
            onPress={onPay}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.payButtonText}>
                Recharge for ₹{rechargeAmount}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 24,
  },
  payButton: {
    backgroundColor: "#B2D1E5",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  payButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default RechargeModal;
