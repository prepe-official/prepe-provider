import React, { useEffect } from "react";
import { Image, StyleSheet, View, StatusBar, Text } from "react-native";
import { useSelector } from "react-redux";

const SplashScreen = ({ navigation }) => {
  const user = useSelector((state) => state.vendor);
  const vendor = useSelector((state) => state.vendor);

  useEffect(() => {
    // Check login status and navigate accordingly after splash screen
    setTimeout(() => {
      if (user?.isLoggedIn || vendor?.isLoggedIn) {
        navigation.navigate("Main");
      } else {
        navigation.navigate("Intro");
      }
    }, 2000); // 2 seconds splash screen
  }, [user, vendor, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#B2D1E5" />
      <Image
        source={require("../assets/splash-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B2D1E5",
  },
  logo: {
    width: "80%",
    height: "80%",
  },
  version: {
    position: "absolute",
    bottom: 40,
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
