import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DropDownPicker from "react-native-dropdown-picker";
import { useSelector } from "react-redux";
import axios from "axios";
import { addDays, addWeeks, addMonths, isBefore, isEqual } from "date-fns";
import Header from "../components/Header";
import { ImagePickingTracker } from "../navigation/SubscriptionCheck";
import Calendar from "../components/Calendar";
import BlueButton from "../components/BlueButton";

const AddPackScreen = ({ navigation, route }) => {
  const { pack: packToEdit, fetchPacks } = route.params || {};
  const isEditMode = !!packToEdit;
  const isDraftPack = isEditMode && packToEdit.status === "draft";

  const { vendor, token } = useSelector((state) => state.vendor);
  const [images, setImages] = useState([]);
  const imageAssets = useRef([]);
  const [packName, setPackName] = useState("");
  const [packDescription, setPackDescription] = useState("");
  const [productName, setProductName] = useState("");
  const [productList, setProductList] = useState([]);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState(null);
  const [categories, setCategories] = useState([]);

  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  const [durationOpen, setDurationOpen] = useState(false);
  const [durationValue, setDurationValue] = useState("day");
  const [durations, setDurations] = useState([
    { label: "Day", value: "day" },
    { label: "Week", value: "week" },
    { label: "2 Weeks", value: "2weeks" },
    { label: "3 Weeks", value: "3weeks" },
    { label: "Month", value: "month" },
  ]);

  const [price, setPrice] = useState("");
  const [fullPrice, setFullPrice] = useState("");
  const [deliveryTimeFrom, setDeliveryTimeFrom] = useState("");
  const [deliveryTimeTo, setDeliveryTimeTo] = useState("");
  const [allowSkip, setAllowSkip] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSkipModalVisible, setSkipModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [skipLoading, setSkipLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [togglingActive, setTogglingActive] = useState(false);
  const [isConfirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [allowedSkipDates, setAllowedSkipDates] = useState([]);
  const [allSkippedDatesForPack, setAllSkippedDatesForPack] = useState([]);
  const [fetchingSkipDates, setFetchingSkipDates] = useState(false);
  const [isAllowSkipInfoVisible, setAllowSkipInfoVisible] = useState(false);
  const [isCompleteProfileModalVisible, setCompleteProfileModalVisible] = useState(false);
  const hasExplicitlySaved = useRef(false);

  useEffect(() => {
    if (isEditMode) {
      setPackName(packToEdit.name);
      setPackDescription(packToEdit.description);
      setCategoryValue(packToEdit.category);
      setProductList(packToEdit.products);
      setQuantity(packToEdit.quantity.toString());
      setUnit(packToEdit.unit);
      setDurationValue(packToEdit.duration);
      setPrice(packToEdit.price.toString());
      setFullPrice(packToEdit.strikeoutPrice ? packToEdit.strikeoutPrice.toString() : "");
      setDeliveryTimeFrom(packToEdit.deliveryTimeStart);
      setDeliveryTimeTo(packToEdit.deliveryTimeEnd);
      setAllowSkip(packToEdit.isSkipBenefits);
      setImages(packToEdit.images || []);
      if (typeof packToEdit.isActive === "boolean") {
        setIsActive(packToEdit.isActive);
      }
    }
  }, [isEditMode, packToEdit]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/category/get-all`
        );
        if (data.success) {
          const formattedCategories = data.categories.map((category) => ({
            label: category.name,
            value: category.name,
          }));
          setCategories(formattedCategories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        Alert.alert("Error", "Failed to load categories.");
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status: cameraStatus } =
          await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== "granted") {
          alert("Sorry, we need camera permission to take photos!");
        }
      }
    })();
  }, []);

  // Auto-save as draft when navigating away without explicitly saving
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Don't auto-save if:
      // 1. User explicitly saved/published
      // 2. No data has been entered
      // 3. Already in edit mode (existing pack)
      if (hasExplicitlySaved.current || isEditMode) {
        return;
      }

      // Check if there's any data to save
      const hasData = packName || packDescription || productList.length > 0 ||
        categoryValue || quantity || unit || price || fullPrice ||
        deliveryTimeFrom || deliveryTimeTo || images.length > 0;

      if (!hasData) {
        return;
      }

      // Prevent default navigation
      e.preventDefault();

      // Save as draft silently
      const saveDraft = async () => {
        try {
          const imageBase64 = imageAssets.current.map((img) => img.base64);

          const packData = {
            name: packName || "Untitled Pack",
            description: packDescription,
            category: categoryValue,
            vendorId: vendor._id,
            products: productList,
            quantity,
            unit,
            duration: durationValue,
            price: price || 0,
            strikeoutPrice: fullPrice ? parseFloat(fullPrice) : null,
            deliveryTimeStart: deliveryTimeFrom,
            deliveryTimeEnd: deliveryTimeTo,
            isSkipBenefits: allowSkip,
            status: "draft",
            images: imageBase64,
          };

          await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/pack/create`,
            packData
          );

          if (fetchPacks) {
            fetchPacks();
          }
        } catch (error) {
          console.error("Auto-save draft failed:", error);
        }

        // Continue with navigation after saving
        navigation.dispatch(e.data.action);
      };

      saveDraft();
    });

    return unsubscribe;
  }, [navigation, isEditMode, packName, packDescription, productList, categoryValue,
    quantity, unit, price, fullPrice, deliveryTimeFrom, deliveryTimeTo,
    images, allowSkip, durationValue, vendor, fetchPacks]);

  const onOpenSkipForAllModal = async () => {
    setSkipModalVisible(true);
    setFetchingSkipDates(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/subscription/get-by-vendor?vendorId=${vendor._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const subscriptions = response.data.subscriptions;
        const packSubscriptions = subscriptions.filter(
          (sub) => sub.packId._id === packToEdit._id
        );

        const allDeliveryDates = new Set();
        const allSkippedDates = new Set();

        packSubscriptions.forEach((sub) => {
          if (sub.skippedDates) {
            sub.skippedDates.forEach((d) => allSkippedDates.add(d));
          }

          const { createdAt, expiryDate, packId } = sub;
          if (!createdAt || !expiryDate || !packId || !packId.duration) return;

          const { duration } = packId;
          const startDate = addDays(new Date(createdAt), 1);
          const endDate = new Date(expiryDate);
          let currentDate = startDate;

          while (
            isBefore(currentDate, endDate) ||
            isEqual(currentDate, endDate)
          ) {
            allDeliveryDates.add(currentDate.toISOString().split("T")[0]);

            switch (duration) {
              case "day":
                currentDate = addDays(currentDate, 1);
                break;
              case "week":
                currentDate = addWeeks(currentDate, 1);
                break;
              case "2weeks":
                currentDate = addWeeks(currentDate, 2);
                break;
              case "month":
                currentDate = addMonths(currentDate, 1);
                break;
              default:
                currentDate = addDays(endDate, 1);
                break;
            }
          }
        });
        setAllowedSkipDates(
          Array.from(allDeliveryDates).map((d) => new Date(d))
        );
        setAllSkippedDatesForPack(Array.from(allSkippedDates));
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions for pack:", error);
      Alert.alert("Error", "Could not load valid skip dates.");
    } finally {
      setFetchingSkipDates(false);
    }
  };

  const pickImage = async () => {
    if (images.length >= 4) {
      Alert.alert("You can only select up to 4 images.");
      return;
    }

    // Show action sheet to choose between camera and gallery
    Alert.alert(
      "Select Image",
      "Choose an option to add images",
      [
        {
          text: "Take Photo",
          onPress: () => pickFromCamera(),
        },
        {
          text: "Choose from Gallery",
          onPress: () => pickFromGallery(),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const pickFromCamera = async () => {
    try {
      ImagePickingTracker.setImagePickingActive(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: true,
        allowsMultipleSelection: true,
      });
      ImagePickingTracker.setImagePickingActive(false);
      processPickerResult(result);
    } catch (error) {
      ImagePickingTracker.setImagePickingActive(false);
      console.error("Error taking photo:", error);
    }
  };

  const checkImageSize = (base64String) => {
    // Calculate size in MB from base64 string
    const sizeInBytes = (base64String.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return sizeInMB;
  };

  const pickFromGallery = async () => {
    try {
      ImagePickingTracker.setImagePickingActive(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8, // Reduced quality to help with size limits
        base64: true,
        selectionLimit: 4 - images.length,
        allowsMultipleSelection: true,
        // Use Android Photo Picker (no permissions required)
        presentationStyle:
          ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });
      ImagePickingTracker.setImagePickingActive(false);
      processPickerResult(result);
    } catch (error) {
      ImagePickingTracker.setImagePickingActive(false);
      console.error("Error picking from gallery:", error);
    }
  };

  const processPickerResult = (result) => {
    if (!result.canceled && result.assets) {
      const newAssets = result.assets;
      if (images.length + newAssets.length > 4) {
        Alert.alert(
          "Limit reached",
          `You can only select up to 4 images. You can add ${4 - images.length
          } more.`
        );
        return;
      }

      // Validate image sizes
      const validAssets = [];
      const rejectedSizes = [];

      for (const asset of newAssets) {
        if (asset.base64) {
          const imageSize = checkImageSize(asset.base64);
          if (imageSize > 4.5) {
            rejectedSizes.push(imageSize.toFixed(2));
          } else {
            validAssets.push(asset);
          }
        } else {
          validAssets.push(asset);
        }
      }

      if (rejectedSizes.length > 0) {
        Alert.alert(
          "Some Images Too Large",
          `${rejectedSizes.length} image(s) exceeded 4.5MB limit and were not added. Sizes: ${rejectedSizes.join(", ")}MB`
        );
      }

      if (validAssets.length > 0) {
        imageAssets.current = [...imageAssets.current, ...validAssets];
        const newUris = validAssets.map((asset) => asset.uri);
        setImages([...images, ...newUris]);
      }
    }
  };

  const removeImage = (index) => {
    const removedImageUri = images[index];
    imageAssets.current = imageAssets.current.filter(
      (asset) => asset.uri !== removedImageUri
    );
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleAddProduct = () => {
    if (productName.trim()) {
      setProductList([...productList, productName.trim()]);
      setProductName("");
    }
  };

  const handleRemoveProduct = (index) => {
    setProductList(productList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (publishStatus = "published") => {
    // For publishing, validate all fields
    if (publishStatus === "published") {
      if (
        !packName ||
        !packDescription ||
        !categoryValue ||
        !vendor?._id ||
        productList.length === 0 ||
        !quantity ||
        !unit ||
        !durationValue ||
        !price ||
        !deliveryTimeFrom ||
        !deliveryTimeTo ||
        (images.length === 0 && !isEditMode)
      ) {
        Alert.alert("Error", "Please provide all required fields to publish");
        return;
      }
    } else {
      // For drafts, only require vendorId
      if (!vendor?._id) {
        Alert.alert("Error", "Vendor information not found");
        return;
      }
    }

    hasExplicitlySaved.current = true;
    setLoading(true);
    const imageBase64 = imageAssets.current.map((img) => img.base64);

    const packData = {
      name: packName,
      description: packDescription,
      category: categoryValue,
      vendorId: vendor._id,
      products: productList,
      quantity,
      unit,
      duration: durationValue,
      price,
      strikeoutPrice: fullPrice ? parseFloat(fullPrice) : null,
      deliveryTimeStart: deliveryTimeFrom,
      deliveryTimeEnd: deliveryTimeTo,
      isSkipBenefits: allowSkip,
      status: publishStatus,
    };

    if (isEditMode) {
      const newImageUris = imageAssets.current.map((asset) => asset.uri);
      const existingImageUrls = images.filter(
        (uri) => !newImageUris.includes(uri)
      );
      packData.images = [...existingImageUrls, ...imageBase64];
    } else {
      packData.images = imageBase64;
    }

    try {
      if (isEditMode) {
        const response = await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/pack/update?id=${packToEdit._id}`,
          packData
        );

        // Check for bank details requirement
        if (response.data?.requireBankDetails) {
          setCompleteProfileModalVisible(true);
          return;
        }

        Alert.alert("Success", response.data.message || "Pack updated successfully");
      } else {
        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/pack/create`,
          packData
        );

        // Check for bank details requirement
        if (response.data?.requireBankDetails) {
          setCompleteProfileModalVisible(true);
          return;
        }

        Alert.alert("Success", response.data.message || "Pack created successfully");
      }
      if (fetchPacks) {
        fetchPacks();
      }
      navigation.goBack();
    } catch (error) {
      console.error(
        `Failed to ${isEditMode ? "update" : "create"} pack:`,
        error.response?.data || error.message
      );

      // Handle bank details requirement from error response
      if (error.response?.data?.requireBankDetails) {
        setCompleteProfileModalVisible(true);
        return;
      }

      Alert.alert(
        "Error",
        error.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} pack.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = () => {
    if (!isEditMode) return;
    setConfirmationModalVisible(true);
  };

  const confirmToggleActive = async () => {
    if (!isEditMode) return;

    setConfirmationModalVisible(false);
    const action = isActive ? "deactivate" : "activate";
    const endpoint = `/pack/${action}?id=${packToEdit._id}`;

    setTogglingActive(true);
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_API_URL}${endpoint}`);
      Alert.alert("Success", `Pack has been ${action}d.`);
      setIsActive((prev) => !prev);
      if (fetchPacks) {
        fetchPacks();
      }
    } catch (error) {
      console.error(
        `Failed to ${action} pack`,
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        `Could not ${action} pack. ` + (error.response?.data?.message || "")
      );
    } finally {
      setTogglingActive(false);
    }
  };

  const handleDeletePack = async () => {
    if (!isEditMode) return;
    setDeleting(true);
    try {
      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/pack/mark-deleted?id=${packToEdit._id}`
      );
      Alert.alert("Success", "Pack deleted successfully.");
      setDeleteModalVisible(false);
      if (fetchPacks) {
        fetchPacks();
      }
      navigation.goBack();
    } catch (error) {
      console.error(
        "Failed to delete pack:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        "Failed to delete pack. " + (error.response?.data?.message || "")
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleSkipForAll = async () => {
    if (!selectedDate) {
      Alert.alert("Error", "Please select a date to skip.");
      return;
    }
    if (!isEditMode || !packToEdit?._id) {
      Alert.alert("Error", "Cannot skip for a pack that is not being edited.");
      return;
    }

    setSkipLoading(true);
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");

      const payload = {
        packId: packToEdit._id,
        date: `${year}-${month}-${day}`,
      };

      const { data } = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/subscription/skip-by-pack`,
        payload
      );

      if (data.success) {
        Alert.alert(
          "Success",
          "Date skipped for all subscribers of this pack."
        );
        setSkipModalVisible(false);
        setSelectedDate(null);
      } else {
        Alert.alert(
          "Error",
          data.message || "Failed to skip date for the pack."
        );
      }
    } catch (error) {
      console.error(
        "Skip by pack error:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        "An error occurred while skipping the date. " +
        (error.response?.data?.message || "")
      );
    } finally {
      setSkipLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={isEditMode ? "Edit Pack" : "Add Pack"}
        showBackButton={true}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        nestedScrollEnabled={true}
      >
        <Text style={styles.sectionTitle}>Pack Images</Text>
        <Text style={styles.noteText}>
          *Image should be less than 4MB
        </Text>
        <View style={styles.imageContainer}>
          <View style={styles.imageRow}>
            {[0, 1].map((boxIndex) => {
              const imageUri = images[boxIndex];
              return imageUri ? (
                <View key={boxIndex} style={styles.imageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeIcon}
                    onPress={() => removeImage(boxIndex)}
                  >
                    <Ionicons name="close-circle" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  key={boxIndex}
                  style={styles.imagePicker}
                  onPress={pickImage}
                >
                  <Ionicons name="image-outline" size={40} color="#999" />
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.imageRow}>
            {[2, 3].map((boxIndex) => {
              const imageUri = images[boxIndex];
              return imageUri ? (
                <View key={boxIndex} style={styles.imageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeIcon}
                    onPress={() => removeImage(boxIndex)}
                  >
                    <Ionicons name="close-circle" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  key={boxIndex}
                  style={styles.imagePicker}
                  onPress={pickImage}
                >
                  <Ionicons name="image-outline" size={40} color="#999" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pack Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Pack Name"
          placeholderTextColor="#333"
          value={packName}
          onChangeText={setPackName}
        />
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Pack Description"
          placeholderTextColor="#333"
          value={packDescription}
          onChangeText={setPackDescription}
          multiline
        />
        <View style={styles.addProductContainer}>
          <TextInput
            style={[styles.input, styles.addProductInput]}
            placeholder="Add Product or Service"
            placeholderTextColor="#999"
            value={productName}
            onChangeText={setProductName}
          />
          <TouchableOpacity style={styles.addProductIcon} onPress={handleAddProduct}>
            <Ionicons name="add-circle-outline" size={28} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.productListContainer}>
          {productList.map((product, index) => (
            <View key={index} style={styles.productListItem}>
              <Text style={styles.productListItemText}>{product}</Text>
              <TouchableOpacity onPress={() => handleRemoveProduct(index)}>
                <Ionicons name="close-circle" size={24} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <DropDownPicker
          listMode="SCROLLVIEW"
          open={categoryOpen}
          value={categoryValue}
          items={categories}
          setOpen={setCategoryOpen}
          setValue={setCategoryValue}
          setItems={setCategories}
          placeholder="Select Category"
          style={styles.input}
          containerStyle={{ flex: 1, marginBottom: 16 }}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={3000}
          zIndexInverse={1000}
        />

        <Text style={styles.sectionTitle}>Pack Size & Price</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input2, { flex: 0.4, marginHorizontal: 4 }]}
            placeholder="Quantity"
            placeholderTextColor="#999"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input2, { flex: 1.1, marginHorizontal: 4 }]}
            placeholder="Unit"
            placeholderTextColor="#999"
            value={unit}
            onChangeText={setUnit}
          />
          <Text style={styles.timeSeparator}>/</Text>
          <DropDownPicker
            listMode="SCROLLVIEW"
            open={durationOpen}
            value={durationValue}
            items={durations}
            setOpen={setDurationOpen}
            setValue={setDurationValue}
            setItems={setDurations}
            placeholder="Duration"
            style={[styles.input2, { flex: 1, marginHorizontal: 4 }]}
            containerStyle={{ flex: 1 }}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={2000}
            zIndexInverse={2000}
          />
        </View>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Full Price"
            placeholderTextColor="#999"
            value={fullPrice}
            onChangeText={setFullPrice}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="Selling Price"
            placeholderTextColor="#999"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <Text style={styles.timeSeparator}>/</Text>
          <View style={[styles.input, styles.flexInput, styles.fakeInput]}>
            <Text>Month</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pack Delivery Timing</Text>
        <View style={styles.row}>
          <View style={styles.timeInputContainer}>
            <TextInput
              style={[styles.input, styles.flexInput]}
              placeholder="Delivery Time (From)"
              placeholderTextColor="#999"
              value={deliveryTimeFrom}
              onChangeText={setDeliveryTimeFrom}
            />
          </View>
          <Text style={styles.timeSeparator}>-</Text>
          <View style={styles.timeInputContainer}>
            <TextInput
              style={[styles.input, styles.flexInput]}
              placeholder="Delivery Time (To)"
              placeholderTextColor="#999"
              value={deliveryTimeTo}
              onChangeText={setDeliveryTimeTo}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Additional Option</Text>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => {
            const newValue = !allowSkip;
            setAllowSkip(newValue);
            if (newValue) {
              setAllowSkipInfoVisible(true);
            }
          }}
        >
          <Ionicons
            name={allowSkip ? "checkbox" : "square-outline"}
            size={24}
            color="black"
          />
          <Text style={styles.checkboxLabel}>
            Allow Customer To Skip Benefits
          </Text>
          <Ionicons name="information-circle-outline" size={20} color="black" />
        </TouchableOpacity>
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Preview of pack</Text>
          <Text style={styles.packName}>
            {quantity} {unit} {packName || "Pack Name"}
          </Text>
          <Text style={styles.priceText}>
            Rs.{price || "0"}{" "}
            {fullPrice ? (
              <Text style={styles.strikethroughPrice}>
                Rs.{fullPrice}
              </Text>
            ) : null}{" "}
            / Month
          </Text>
        </View>

        {isEditMode && typeof packToEdit?.activeSubscribers === "number" && (
          <View style={styles.activeSubscribersContainer}>
            <Text style={styles.activeSubscribersTitle}>
              Active Subscribers
            </Text>
            <Text style={styles.activeSubscribersCount}>
              {packToEdit.activeSubscribers < 10
                ? `0${packToEdit.activeSubscribers}`
                : packToEdit.activeSubscribers}
            </Text>
          </View>
        )}
      </ScrollView>

      {isDraftPack ? (
        // Editing a DRAFT pack - show Delete Draft, Save, and Publish buttons
        <View style={styles.bottomContainer}>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setDeleteModalVisible(true)}
            >
              <Text style={styles.deleteButtonText}>Delete Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveDraftButton}
              onPress={() => handleSubmit("draft")}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text style={styles.saveDraftButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.publishFullButton}
            onPress={() => handleSubmit("published")}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text style={styles.publishButtonText}>Publish</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : isEditMode ? (
        // Editing a PUBLISHED pack - show Deactivate, Delete, Save
        <View style={styles.bottomContainer}>
          {!packToEdit?.isDeleted && (
            <TouchableOpacity
              style={styles.inactiveButton}
              onPress={handleToggleActive}
              disabled={togglingActive}
            >
              {togglingActive ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.inactiveButtonText}>
                  {isActive ? "Deactivate Pack" : "Activate Pack"}
                </Text>
              )}
              <Ionicons
                name="information-circle"
                size={24}
                color="white"
                style={styles.inactiveIcon}
              />
            </TouchableOpacity>
          )}

          <View style={styles.actionButtonsRow}>
            {packToEdit?.isDeleted ? (
              <View style={[styles.deleteButton, { borderColor: "grey" }]}>
                <Text style={[styles.deleteButtonText, { color: "grey" }]}>
                  Deleted
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => setDeleteModalVisible(true)}
              >
                <Text style={styles.deleteButtonText}>Delete Pack</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSubmit("published")}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // New pack - show Save Draft and Publish buttons
        <View style={styles.draftButtonsContainer}>
          <TouchableOpacity
            style={styles.saveDraftButton}
            onPress={() => handleSubmit("draft")}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text style={styles.saveDraftButtonText}>Save Draft</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.publishButton}
            onPress={() => handleSubmit("published")}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text style={styles.publishButtonText}>Publish Pack</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={isSkipModalVisible}
        onRequestClose={() => setSkipModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSkipModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.skipModalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSkipModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.skipModalTitle}>Select Date to Skip</Text>
              {fetchingSkipDates ? (
                <ActivityIndicator
                  size="large"
                  color="#0000ff"
                  style={{ marginVertical: 20 }}
                />
              ) : (
                <Calendar
                  onSelectDate={setSelectedDate}
                  selectedDate={selectedDate}
                  skippedDates={allSkippedDatesForPack}
                  allowedDates={allowedSkipDates}
                />
              )}
              <BlueButton
                title={skipLoading ? "Confirming..." : "Confirm"}
                onPress={handleSkipForAll}
                disabled={skipLoading || !selectedDate}
                style={styles.confirmSkipButton}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isConfirmationModalVisible}
        onRequestClose={() => setConfirmationModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setConfirmationModalVisible(false)}
        >
          <View style={[styles.modalContainer]}>
            <View style={styles.confirmationModalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setConfirmationModalVisible(false)}
                >
                  <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setConfirmationModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <Text style={styles.confirmationModalTitle}>
                {isActive ? "Deactivate pack!" : "Activate pack!"}
              </Text>
              <Text style={styles.confirmationModalText}>
                {isActive
                  ? "Are you sure you want to deactivate this pack?"
                  : "Are you sure you want to activate this pack?"}
              </Text>
              <BlueButton
                title={togglingActive ? "Confirming..." : "Confirm"}
                onPress={confirmToggleActive}
                disabled={togglingActive}
                style={styles.confirmToggleButton}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDeleteModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.confirmationModalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setDeleteModalVisible(false)}>
                  <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDeleteModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <Text style={styles.deleteModalTitle}>
                Delete {packName} Pack
              </Text>
              <Text style={styles.confirmationModalText}>
                Deleting this pack will remove the pack from the app. You won’t
                be able to get new subscribers. However, you need to continue
                serving the existing subscribers until the last expiry date of
                the pack. Are you sure you want to delete this pack?
              </Text>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={handleDeletePack}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isAllowSkipInfoVisible}
        onRequestClose={() => setAllowSkipInfoVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAllowSkipInfoVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.confirmationModalContent}>
              <Ionicons
                name="information-circle"
                size={40}
                color="#000"
                style={{ marginBottom: 10 }}
              />
              <Text style={styles.confirmationModalText}>
                Enabling this option will make this pack a flexible pack.{"\n"}
                That means your subscribers can choose to skip receiving the
                future product / service at certain dates.
              </Text>
              <Text
                style={[
                  styles.confirmationModalText,
                  { fontStyle: "italic", marginTop: 10 },
                ]}
              >
                (Note: The pack expiry date will extend each time subscriber
                skips the delivery)
              </Text>
              <BlueButton
                title="Allow Skipping"
                onPress={() => setAllowSkipInfoVisible(false)}
                style={{ marginTop: 20, width: "100%" }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Complete Profile Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isCompleteProfileModalVisible}
        onRequestClose={() => setCompleteProfileModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCompleteProfileModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.completeProfileModalContent}>
              <Text style={styles.completeProfileTitle}>Complete Profile</Text>
              <Text style={styles.completeProfileDescription}>
                Please complete your profile and provide necessary information before publishing your first subscription pack.
              </Text>
              <Text style={styles.completeProfileUpdateLabel}>Update following :</Text>
              <View style={styles.completeProfileList}>
                <Text style={styles.completeProfileListItem}>• Profile image</Text>
                <Text style={styles.completeProfileListItem}>• Bank Details</Text>
                <Text style={styles.completeProfileListItem}>• UPI number</Text>
              </View>
              <TouchableOpacity
                style={styles.goToAccountSettingsButton}
                onPress={() => {
                  setCompleteProfileModalVisible(false);
                  navigation.navigate("AccountSettings");
                }}
              >
                <Text style={styles.goToAccountSettingsButtonText}>Go to Account Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: "#FF6B6B",
    marginBottom: 16,
  },
  imageContainer: {
    marginBottom: 16,
    gap: 12,
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  imageWrapper: {
    position: "relative",
    flex: 1,
    aspectRatio: 1,
  },
  imagePicker: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: "#ECF1EE",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  removeIcon: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "white",
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#ECF1EE",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  input2: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#ECF1EE",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  addProductContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  addProductInput: {
    flex: 1,
    marginBottom: 0,
    paddingRight: 48,
  },
  addProductIcon: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  productListContainer: {
    marginBottom: 16,
  },
  productListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  productListItemText: {
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 4,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 8,
    alignSelf: "center",
  },
  flexInput: {
    flex: 1,
    marginBottom: 0,
    marginHorizontal: 4,
  },
  fakeInput: {
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    borderColor: "#E0E0E0",
    backgroundColor: "#ECF1EE",
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
    backgroundColor: "#ECF1EE",
    marginBottom: 16,
    width: "100%",
  },
  previewTitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "start",
    width: "100%",
  },
  packName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000",
  },
  packDetails: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000",
  },
  strikethroughPrice: {
    textDecorationLine: "line-through",
    color: "#888",
    fontSize: 14,
    fontWeight: "400",
  },

  activeSubscribersContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  activeSubscribersTitle: {
    fontSize: 16,
    color: "black",
  },
  activeSubscribersCount: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 4,
  },
  publishButton: {
    flex: 1,
    backgroundColor: "#A9C8E6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  publishButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  publishFullButton: {
    backgroundColor: "#A9C8E6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  draftButtonsContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    gap: 12,
  },
  saveDraftButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#333",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveDraftButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  skipButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  skipButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "500",
  },
  inactiveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#212121",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
    position: "relative",
  },
  inactiveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  inactiveIcon: {
    position: "absolute",
    right: 20,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F44336",
    borderRadius: 8,
    paddingVertical: 16,
    marginRight: 8,
  },
  deleteButtonText: {
    color: "#F44336",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#A9C8E6",
    borderRadius: 8,
    paddingVertical: 16,
    marginLeft: 8,
  },
  saveButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
  },
  skipModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  skipModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
  },
  confirmSkipButton: {
    width: "100%",
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmationModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  confirmationModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  confirmationModalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
    paddingHorizontal: 10,
  },
  confirmToggleButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#F44336",
  },
  confirmDeleteButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 10,
    backgroundColor: "#F44336",
    alignItems: "center",
    marginTop: 20,
  },
  confirmDeleteButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  completeProfileModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "100%",
  },
  completeProfileTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#000",
  },
  completeProfileDescription: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  completeProfileUpdateLabel: {
    fontSize: 14,
    fontWeight: "500",
    alignSelf: "flex-start",
    marginBottom: 8,
    color: "#333",
  },
  completeProfileList: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  completeProfileListItem: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  goToAccountSettingsButton: {
    backgroundColor: "#A9C8E6",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  goToAccountSettingsButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default AddPackScreen;
