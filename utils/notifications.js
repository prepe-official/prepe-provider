import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import axios from "axios";
import { store } from "../store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }
    const projectId = "724e3dc8-fe89-4a3a-aa19-2703210e399f";
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log(token);
  } else {
    alert("Must use physical device for Push Notifications");
  }

  return token;
}

export async function sendFCMTokenToServer(fcmToken) {
  const { vendor, token } = store.getState().vendor;

  if (!vendor || !token || !fcmToken) {
    return;
  }

  try {
    await axios.put(
      `${process.env.EXPO_PUBLIC_API_URL}/vendor/fcm?id=${vendor._id}`,
      {
        fcmToken,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "Error sending FCM token to server:",
      error.response?.data || error.message
    );
  }
}
