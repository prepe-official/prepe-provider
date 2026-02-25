import React, { useEffect, useState } from "react";

// FIXED: Offline modal flash on startup by adding initialization delay and robust network checking
import {
  StatusBar,
  StyleSheet,
  Modal,
  View,
  Text,
  Pressable,
  BackHandler,
} from "react-native";
import * as Notifications from "expo-notifications";
import NetInfo from "@react-native-community/netinfo";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import { useNavigationContainerRef } from "@react-navigation/native";

// Screens
import SplashScreen from "./screens/SplashScreen";
import IntroScreen from "./screens/IntroScreen";
import CitySelectionScreen from "./screens/CitySelectionScreen";
import SearchScreen from "./screens/SearchScreen";
import ProductDetailScreen from "./screens/ProductDetailScreen";
import NotificationScreen from "./screens/NotificationScreen";
import TransactionHistoryScreen from "./screens/TransactionHistoryScreen";
import TransactionDetailScreen from "./screens/TransactionDetailScreen";
import SubscriptionsScreen from "./screens/SubscriptionsScreen";
import AccountSettingsScreen from "./screens/AccountSettingsScreen";
import CustomerSupportScreen from "./screens/CustomerSupportScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import SignupScreenStep2 from "./screens/SignupScreenStep2";
import SignupScreenStep3 from "./screens/SignupScreenStep3";
import SignupScreenStep4 from "./screens/SignupScreenStep4";
import SubscriptionCheck from "./navigation/SubscriptionCheck";
import PaymentWebViewScreen from "./screens/PaymentWebViewScreen";
import AddPackScreen from "./screens/AddPackScreen";
import OrdersScreen from "./screens/OrdersScreen";
import UserDetailsScreen from "./screens/UserDetailsScreen";
import ForgotPasswordScreen from "./screens/ForgetScreen";
import DemoPackScreen from "./screens/DemoPackScreen";
import OrderScreen from "./screens/OrderScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const navigationRef = useNavigationContainerRef();

  const checkPermission = async () => {
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) {
      setShowPermissionModal(true);
    }
  };

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      alert("Please enable notifications in Settings.");
    }
    setShowPermissionModal(false);
  };

  // ✅ Robust network check (no flash, no false modal on startup)
  const checkNetworkStatus = async () => {
    try {
      const networkState = await NetInfo.fetch();

      // Handle "unknown" state gracefully
      if (networkState.isInternetReachable === false) {
        setShowOfflineModal(true);
      } else if (networkState.isInternetReachable) {
        setShowOfflineModal(false);
      }
      // if null → do nothing (prevents flashing modal)
    } catch (error) {
      console.log("Error checking network status:", error);
    }
  };

  useEffect(() => {
    checkPermission();

    // Wait briefly before setting initialized to avoid startup glitches
    const timer = setTimeout(() => {
      checkNetworkStatus(); // run first check after delay
    }, 1000);

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isInternetReachable === false) {
        setShowOfflineModal(true);
      } else if (state.isInternetReachable) {
        setShowOfflineModal(false);
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // 👂 Listen for notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Tapped notification:", response);

        // navigate to Notification screen
        if (navigationRef.isReady()) {
          navigationRef.navigate("Notification");
        }
      }
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (fontError) {
      console.error("Font load error:", fontError);
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <NavigationContainer>
            <SafeAreaView style={styles.container}>
              <StatusBar barStyle="dark-content" backgroundColor="#fff" />

              {/* 🔔 Notification Reminder Modal */}
              <Modal
                transparent
                visible={showPermissionModal}
                animationType="fade"
                onRequestClose={() => setShowPermissionModal(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Enable Notifications</Text>
                    <Text style={styles.modalText}>
                      Please allow notifications to get important updates on
                      your subscription packs.
                    </Text>

                    <View style={styles.modalActions}>
                      <Pressable
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => setShowPermissionModal(false)}
                      >
                        <Text style={styles.cancelText}>Not Now</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.modalButton, styles.confirmButton]}
                        onPress={requestPermission}
                      >
                        <Text style={styles.confirmText}>Allow</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Modal>

              {/* 📡 Offline Modal */}
              <Modal
                transparent
                visible={showOfflineModal}
                animationType="fade"
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                      No Internet Connection
                    </Text>
                    <Text style={styles.modalText}>
                      Please connect to the internet to use this app.
                    </Text>

                    <View style={styles.modalActions}>
                      <Pressable
                        style={[styles.modalButton, styles.confirmButton]}
                        onPress={checkNetworkStatus}
                      >
                        <Text style={styles.confirmText}>Retry</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Modal>

              {/* Navigation Stack */}
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                }}
                initialRouteName="Splash"
              >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Intro" component={IntroScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen
                  name="SignupStep2"
                  component={SignupScreenStep2}
                />
                <Stack.Screen
                  name="SignupStep3"
                  component={SignupScreenStep3}
                />
                <Stack.Screen
                  name="SignupStep4"
                  component={SignupScreenStep4}
                />
                <Stack.Screen name="Forget" component={ForgotPasswordScreen} />
                <Stack.Screen
                  name="CitySelection"
                  component={CitySelectionScreen}
                />
                <Stack.Screen name="Main" component={SubscriptionCheck} />
                <Stack.Screen
                  name="Search"
                  component={SearchScreen}
                  options={{ presentation: "modal" }}
                />
                <Stack.Screen
                  name="ProductDetail"
                  component={ProductDetailScreen}
                />
                <Stack.Screen name="DemoPack" component={DemoPackScreen} />
                <Stack.Screen
                  name="Notification"
                  component={NotificationScreen}
                />
                <Stack.Screen
                  name="TransactionHistory"
                  component={TransactionHistoryScreen}
                />
                <Stack.Screen
                  name="TransactionDetail"
                  component={TransactionDetailScreen}
                />
                <Stack.Screen
                  name="Subscriptions"
                  component={SubscriptionsScreen}
                />
                <Stack.Screen
                  name="AccountSettings"
                  component={AccountSettingsScreen}
                />
                <Stack.Screen
                  name="CustomerSupport"
                  component={CustomerSupportScreen}
                />
                <Stack.Screen name="Orders" component={OrdersScreen} />
                <Stack.Screen
                  name="PaymentWebView"
                  component={PaymentWebViewScreen}
                />
                <Stack.Screen name="AddPack" component={AddPackScreen} />
                <Stack.Screen
                  name="UserDetails"
                  component={UserDetailsScreen}
                />
                <Stack.Screen name="OrderScreen" component={OrderScreen} />
              </Stack.Navigator>
            </SafeAreaView>
          </NavigationContainer>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  cancelButton: { backgroundColor: "#eee", flex: 2 },
  confirmButton: { backgroundColor: "#1b94e4", flex: 2 },
  cancelText: { color: "#333", fontWeight: "600", textAlign: "center" },
  confirmText: { color: "#fff", fontWeight: "700", textAlign: "center" },
});
