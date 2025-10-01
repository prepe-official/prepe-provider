import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  SafeAreaView,
  Linking, // Import Linking
  ActivityIndicator, // To show a loading state
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MenuHeader from "../components/MenuHeader";
import axios from "axios"; // Import axios for API calls

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  {
    question: "What is Prepe?",
    answer:
      "Prepe is a marketplace for subscription-based services. You can create subscription packs, publish them, and gain long-term subscribers.",
  },
  {
    question: "How do I create a subscription pack?",
    answer:
      "In the app, go to “Create” tab from the bottom bar, click on create pack, fill details and choose whether to allow customers to skip deliveries.",
  },
  {
    question: "How will I receive payments?",
    answer:
      "Payments are made directly to your bank account. Make sure to add your bank details under Account Setting → Bank Details.",
  },
  {
    question: "When do I get paid?",
    answer:
      "Payments are released after customer confirms delivery (or if no dispute is raised). If the delivery is denied, our team will review the event.",
  },
  {
    question: "What if I don’t deliver within 24 hours?",
    answer:
      "If you don’t onboard or deliver within 24 hours of subscription, the order will be cancelled automatically.",
  },
  {
    question: "Can I cancel a customer’s order?",
    answer: "Yes, you can cancel before delivery.",
  },
  {
    question: "What is the “Skip” option?",
    answer:
      "If enabled during creating a pack, customers and you can skip future delivery by choosing dates from the calendar, and the pack’s expiry date will be extended accordingly.",
  },
  {
    question: "What happens if a customer denies delivery?",
    answer:
      "The case will be reviewed by Prepe. We kindly ask you to not misinform about the delivery and please cooperate if such scenario arises.",
  },
  {
    question: "What if I have issues with the app or customer?",
    answer: "You can contact us. Our Team will step in to help.",
  },
];

const FAQItem = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.faqContainer}>
      <TouchableOpacity style={styles.faqHeader} onPress={toggleExpand}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#333"
        />
      </TouchableOpacity>
      {expanded && <Text style={styles.faqAnswer}>{item.answer}</Text>}
    </View>
  );
};

const CustomerSupportScreen = () => {
  const navigation = useNavigation();
  const [supportInfo, setSupportInfo] = useState({ phone: "", email: "" });
  const [loading, setLoading] = useState(true);

  // Fetch configuration data when the component mounts
  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/configuration/get`
        );
        if (data.success && data.configuration.customerSupport) {
          setSupportInfo(data.configuration.customerSupport);
        }
      } catch (error) {
        console.error("Failed to fetch configuration:", error);
        // Optionally, show an alert to the user
      } finally {
        setLoading(false);
      }
    };

    fetchConfiguration();
  }, []);

  // Function to handle calling
  const handleCall = () => {
    if (supportInfo.phone) {
      Linking.openURL(`tel:${supportInfo.phone}`);
    }
  };

  // Function to handle emailing
  const handleEmail = () => {
    if (supportInfo.email) {
      Linking.openURL(`mailto:${supportInfo.email}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MenuHeader title="Customer Support" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Frequently Asked Questions */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQ_DATA.map((item, index) => (
          <FAQItem key={index} item={item} />
        ))}

        {/* Contact Us */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#222" />
        ) : (
          <View style={styles.contactButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.contactButton,
                !supportInfo.phone && styles.disabledButton,
              ]}
              onPress={handleCall}
              disabled={!supportInfo.phone}
            >
              <Text style={styles.contactButtonText}>Call Us</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.contactButton,
                !supportInfo.email && styles.disabledButton,
              ]}
              onPress={handleEmail}
              disabled={!supportInfo.email}
            >
              <Text style={styles.contactButtonText}>Email Us</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    marginTop: 10,
  },
  faqContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  contactButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  contactButton: {
    flex: 1,
    backgroundColor: "#222",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  contactButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    backgroundColor: "#a0a0a0",
  },
});

export default CustomerSupportScreen;
