import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  View,
  StatusBar,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/slices/vendorSlice";
import {
  saveProgress,
  clearProgress,
  resetToStep,
} from "../store/slices/signupSlice";
import {
  registerForPushNotificationsAsync,
  sendFCMTokenToServer,
} from "../utils/notifications";

const SignupScreenStep4 = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    ownerName,
    shopName,
    email,
    password,
    phone,
    address,
    city,
    upiId,
    bankHolderName,
    ifscCode,
    accountNumber,
    profileImage,
    shopImages,
  } = useSelector((state) => state.signup);

  const [image, setImage] = useState(profileImage || null);
  const [shopImagesLocal, setShopImagesLocal] = useState(shopImages || []);
  const [isLoading, setIsLoading] = useState(false);

  const removeShopImage = (indexToRemove) => {
    const newImages = shopImagesLocal.filter(
      (_, index) => index !== indexToRemove
    );
    setShopImagesLocal(newImages);
    dispatch(saveProgress({ shopImages: newImages }));
  };

  const pickImage = async (type) => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Denied",
        "You need to grant permission to access photos."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: type === "single",
      aspect: type === "single" ? [1, 1] : undefined,
      quality: 1,
      allowsMultipleSelection: type === "multiple",
      base64: true,
    });

    if (!result.canceled) {
      if (type === "single") {
        const imageData = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setImage(imageData);
        dispatch(saveProgress({ profileImage: imageData }));
      } else {
        const uris = result.assets.map(
          (asset) => `data:image/jpeg;base64,${asset.base64}`
        );
        const newImages = [...shopImagesLocal, ...uris];
        setShopImagesLocal(newImages);
        dispatch(saveProgress({ shopImages: newImages }));
      }
    }
  };

  const handleSignup = async () => {
    if (!image) {
      Alert.alert("Error", "Please select a profile image.");
      return;
    }
    // if (shopImagesLocal.length === 0) {
    //   Alert.alert("Error", "Please select at least one shop image.");
    //   return;
    // }
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/vendor/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownerName,
            shopName,
            email,
            password,
            phoneNumber: phone,
            address,
            upiId,
            bankHolderName,
            ifscCode,
            accountNumber,
            city,
            image: image,
            shopImages: shopImagesLocal,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Auto-login right after successful signup
        try {
          const loginRes = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/vendor/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email, password }),
            }
          );

          const loginData = await loginRes.json();

          if (loginRes.ok && loginData.success) {
            dispatch(
              login({
                vendor: loginData.user,
                token: loginData.token,
              })
            );

            // Clear signup progress after successful signup
            dispatch(clearProgress());

            const fcmToken = await registerForPushNotificationsAsync();
            if (fcmToken) {
              await sendFCMTokenToServer(fcmToken);
            }

            navigation.replace("Main");
          } else {
            // Fallback: account created but auto-login failed
            Alert.alert(
              "Account Created",
              "Your account was created. Please log in to continue."
            );
            navigation.navigate("Login");
          }
        } catch (autoLoginError) {
          console.error("Auto-login error:", autoLoginError);
          Alert.alert(
            "Account Created",
            "Your account was created. Please log in to continue."
          );
          navigation.navigate("Login");
        }
      } else {
        Alert.alert("Error", data.message || "Registration failed");
        navigation.navigate("Signup");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
      navigation.navigate("Signup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#B2D1E5" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.headerText}>Upload Images (Step 4 of 4)</Text>

        <View style={styles.formContainer}>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={() => pickImage("single")}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.profileImage} />
            ) : (
              <Text style={styles.imagePickerText}>Select Profile Image</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.imagePicker}
            onPress={() => pickImage("multiple")}
          >
            <Text style={styles.imagePickerText}>Select Shop Images</Text>
          </TouchableOpacity>

          <View style={styles.shopImagesContainer}>
            {shopImagesLocal.map((uri, index) => (
              <View key={index} style={styles.shopImageWrapper}>
                <Image source={{ uri }} style={styles.shopImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeShopImage(index)}
                >
                  <Text style={styles.removeImageButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Go Back Link */}
          <View style={styles.loginContainer}>
            <TouchableOpacity
              onPress={() => {
                dispatch(resetToStep(2));
                navigation.goBack();
              }}
            >
              <Text style={styles.loginLink}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B2D1E5",
    paddingTop: 40,
  },
  scrollContainer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
    textAlign: "center",
  },
  formContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  imagePicker: {
    width: "100%",
    height: 150,
    backgroundColor: "#fafafa",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  imagePickerText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  shopImagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  shopImageWrapper: {
    position: "relative",
    margin: 5,
  },
  shopImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeImageButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
  button: {
    backgroundColor: "#B2D1E5",
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginLink: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

export default SignupScreenStep4;
