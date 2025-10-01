import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

const BottomBar = ({ state, navigation }) => {
  const { isLoggedIn } = useSelector((state) => state.vendor);
  const tabs = [
    {
      name: "Dashboard",
      icon: "grid-outline",
      activeIcon: "grid",
      route: "Dashboard",
    },
    {
      name: "Create",
      icon: "add-circle-outline",
      activeIcon: "add-circle",
      route: "Create",
    },
    {
      name: "Calendar",
      icon: "calendar-outline",
      activeIcon: "calendar",
      route: "Calendar",
    },
  ];

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {tabs.map((tab, index) => {
          const isFocused = state.index === index;

          const handleTabPress = () => {
            if (isLoggedIn) {
              const event = navigation.emit({
                type: "tabPress",
                target: tab.route,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(tab.route);
              }
            } else {
              navigation.navigate("Login");
            }
          };

          return (
            <TouchableOpacity
              key={index}
              style={styles.tabItem}
              onPress={handleTabPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
            >
              <Ionicons
                name={isFocused ? tab.activeIcon : tab.icon}
                size={tab.name === "Create" ? 30 : 24}
                color={isFocused ? "#000" : "#202020"}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? "#000" : "#202020" },
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 80,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingBottom: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
});

export default BottomBar;
