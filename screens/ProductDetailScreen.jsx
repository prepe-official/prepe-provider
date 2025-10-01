import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BlueButton from "../components/BlueButton";
import { useSelector } from "react-redux";

const ProductDetailScreen = ({ navigation, route }) => {
  const { product } = route.params || {};
  // Image dots indicator state
  const [activeDot, setActiveDot] = useState(0);
  // Modal visibility state
  const [modalVisible, setModalVisible] = useState(false);
  // Get isLoggedIn state from redux
  const { isLoggedIn } = useSelector((state) => state.vendor);

  const images =
    product?.images?.length > 0
      ? product.images
      : ["https://images.unsplash.com/photo-1563636619-e9143da7973b"];

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveDot(viewableItems[0].index || 0);
    }
  }).current;

  // Dummy reviews data
  const reviews = [
    {
      id: 1,
      name: "Sophia Clark",
      date: "June 15, 2024",
      rating: 5,
      comment:
        "Absolutely loved my stay! The apartment was clean, well-equipped, and in a fantastic location. The host was very responsive and helpful.",
    },
    {
      id: 2,
      name: "Ethan Bennett",
      date: "May 22, 2024",
      rating: 4,
      comment:
        "Great place to stay, very convenient and comfortable. Only minor issue was the noise from the street at night.",
    },
  ];

  // Ratings breakdown
  const ratingsData = [
    { stars: 5, percentage: 70 },
    { stars: 4, percentage: 20 },
    { stars: 3, percentage: 5 },
    { stars: 2, percentage: 3 },
    { stars: 1, percentage: 2 },
  ];

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color="#FFD700"
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pack Detail</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => {
              if (isLoggedIn) {
                navigation.navigate("Notification");
              } else {
                navigation.navigate("Login");
              }
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => {
              if (isLoggedIn) {
                // Share functionality
              } else {
                navigation.navigate("Login");
              }
            }}
          >
            <Ionicons name="share-social-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <FlatList
            data={images}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.productImage}
                resizeMode="cover"
              />
            )}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            decelerationRate="fast"
          />
          <View style={styles.dotsContainer}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeDot === index ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.productInfoContainer}>
          <View style={styles.categoryContainer}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>
                {product?.category || "Dairy"}
              </Text>
            </View>
            <View style={styles.ratingsTag}>
              <Text style={styles.ratingsText}>4.8 Ratings</Text>
            </View>
          </View>

          <View style={styles.mainInfoContainer}>
            <View style={styles.leftInfo}>
              <Text style={styles.productName}>{product?.name}</Text>
              <Text style={styles.productDescription}>
                {product?.quantity} {product?.unit}/{product?.duration}
              </Text>
            </View>
            <View style={styles.rightInfo}>
              <Text style={styles.deliveryTimeLabel}>Delivery Time</Text>
              <Text style={styles.deliveryTime}>
                {product?.deliveryTimeStart} - {product?.deliveryTimeEnd}
              </Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.originalPrice}>Rs. {product?.price + 50}</Text>
            <Text style={styles.discountedPrice}>
              Rs. {product?.price}/Month
            </Text>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descText}>{product?.description}</Text>
          </View>

          <View style={styles.includeContainer}>
            <Text style={styles.includeText}>
              Pack Include -{" "}
              {product?.products.map((product) => product).join(", ")}
            </Text>
          </View>

          <Text style={styles.benefitsText}>
            You'll get your benefits deliver within 24 hours. After that it'll
            be delivered at the time mentioned by the provider.
          </Text>

          <View style={styles.ownerInfoContainer}>
            <View style={styles.ownerLeftSection}>
              <View style={styles.ownerInfo}>
                <View style={styles.ownerImageContainer}>
                  <Image
                    source={{ uri: product?.vendorId?.image }}
                    style={styles.ownerImage}
                  />
                </View>
                <Text style={styles.infoLabel}>
                  {product?.vendorId?.ownerName}
                </Text>
                <Text style={styles.infoValue}>
                  {product?.vendorId?.shopName}
                </Text>
              </View>
            </View>
            <View style={styles.ownerRightSection}>
              <Text style={styles.contactLabel}>
                {product?.vendorId?.phoneNumber}
              </Text>
              <Text style={styles.contactLabel}>
                {product?.vendorId?.email}
              </Text>
              <Text style={styles.addressText}>
                {product?.vendorId?.address}
              </Text>
            </View>
          </View>

          {product?.isSkipBenefits && (
            <TouchableOpacity
              style={styles.flexiblePackButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.flexiblePackText}>Flexible Pack</Text>
              <View style={styles.infoIcon}>
                <Ionicons name="information-circle" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          <View style={styles.ratingsContainer}>
            <Text style={styles.sectionTitle}>Ratings</Text>

            <View style={styles.ratingsSummary}>
              <View style={styles.ratingScore}>
                <Text style={styles.ratingNumber}>4.8</Text>
                {renderRatingStars(4)}
                <Text style={styles.reviewCount}>12 reviews</Text>
              </View>

              <View style={styles.ratingBreakdown}>
                {ratingsData.map((item, index) => (
                  <View key={index} style={styles.ratingBarContainer}>
                    <Text style={styles.ratingBarLabel}>{item.stars}</Text>
                    <View style={styles.ratingBar}>
                      <View
                        style={[
                          styles.ratingFill,
                          { width: `${item.percentage}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.ratingPercentage}>
                      {item.percentage}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerImage}>
                    <Text style={styles.reviewerInitial}>
                      {review.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{review.name}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>
                {renderRatingStars(review.rating)}
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.loadMoreButton}>
              <Text style={styles.loadMoreText}>Load More</Text>
              <Ionicons name="chevron-down" size={20} color="#555" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.footerTopRow}>
          <Text style={styles.cashbackText}>Get Rs.5 Cashback</Text>
          <View style={styles.priceContainerFooter}>
            <Text style={styles.footerOriginalPrice}>Rs. {product?.price}</Text>
            <Text style={styles.footerDiscountedPrice}>
              Rs. {product?.price}/Month
            </Text>
          </View>
        </View>
        <BlueButton
          title="Subscribe & Pay"
          onPress={() => {
            if (isLoggedIn) {
              // Proceed with subscription
              // Add subscription logic here
            } else {
              // Redirect to login
              navigation.navigate("Login");
            }
          }}
          style={styles.subscribeButton}
        />
      </View>

      {/* Flexible Pack Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="information-circle" size={24} color="#fff" />
              </View>
              <Text style={styles.modalText}>
                This is a flexible pack where you are allowed to skip benefits
                at the time of your convenience without any loss of total
                benefits promised by the pack. *The pack expire date will
                extend.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  backButton: {
    padding: 5,
    zIndex: 1,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 4,
    zIndex: 1,
  },
  headerIcon: {
    marginLeft: 15,
  },
  imageContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#CCCCCC",
    position: "relative",
  },
  productImage: {
    width: Dimensions.get("window").width,
    height: "100%",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 15,
    width: "100%",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "#333",
  },
  inactiveDot: {
    backgroundColor: "#E0E0E0",
  },
  productInfoContainer: {
    padding: 16,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingsTag: {
    alignSelf: "flex-end",
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginBottom: 10,
  },
  ratingsText: {
    fontWeight: "700",
    fontSize: 12,
    color: "#fff",
  },
  categoryTag: {
    alignSelf: "flex-start",
    backgroundColor: "#f8d56f",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#000",
  },
  categoryText: {
    fontWeight: "700",
    fontSize: 12,
  },
  mainInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  leftInfo: {
    flex: 1,
  },
  rightInfo: {
    alignItems: "flex-end",
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
  },
  productDescription: {
    fontSize: 14,
    color: "#333",
    fontWeight: "700",
  },
  deliveryTimeLabel: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  deliveryTime: {
    fontSize: 14,
    fontWeight: "600",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  originalPrice: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    textDecorationLine: "line-through",
    marginRight: 10,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  descriptionContainer: {
    marginVertical: 10,
  },
  descText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#000",
    fontWeight: "500",
  },
  includeContainer: {
    marginVertical: 10,
  },
  includeText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#000",
    fontWeight: "500",
  },
  benefitsText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#000",
    fontWeight: "500",
    marginVertical: 15,
  },
  ownerInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
  },
  ownerLeftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  ownerRightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  ownerInfo: {
    flex: 1,
    alignItems: "center",
  },
  ownerImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
  },
  ownerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  contactLabel: {
    fontSize: 14,
    color: "#333",
    textAlign: "right",
  },
  addressText: {
    fontSize: 14,
    textAlign: "right",
    marginTop: 5,
  },
  flexiblePackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderRadius: 10,
    marginVertical: 10,
  },
  flexiblePackText: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoIcon: {
    marginLeft: 8,
    backgroundColor: "#333",
    borderRadius: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 15,
  },
  ratingsContainer: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
  },
  ratingsSummary: {
    flexDirection: "row",
    marginBottom: 20,
  },
  ratingScore: {
    alignItems: "flex-start",
    justifyContent: "center",
    marginRight: 20,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: "700",
  },
  starsContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  reviewCount: {
    fontSize: 12,
    color: "#333",
    marginTop: 5,
  },
  ratingBreakdown: {
    flex: 1,
    justifyContent: "center",
  },
  ratingBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  ratingBarLabel: {
    fontSize: 12,
    width: 20,
  },
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginHorizontal: 5,
  },
  ratingFill: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 4,
  },
  ratingPercentage: {
    fontSize: 12,
    width: 30,
    textAlign: "right",
  },
  reviewItem: {
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
    paddingVertical: 15,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  reviewerInitial: {
    fontSize: 18,
    fontWeight: "700",
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontWeight: "700",
  },
  reviewDate: {
    fontSize: 12,
    color: "#333",
  },
  reviewComment: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginTop: 10,
  },
  loadMoreText: {
    fontSize: 16,
    marginRight: 5,
    color: "#333",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  footerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cashbackText: {
    color: "#B2D1E5",
    fontSize: 16,
    fontWeight: "600",
  },
  priceContainerFooter: {
    alignItems: "flex-end",
  },
  footerOriginalPrice: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    textDecorationLine: "line-through",
    marginRight: 10,
  },
  footerDiscountedPrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  subscribeButton: {
    marginBottom: 20,
    // No specific styles needed if BlueButton handles its own styling for width
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
    width: "80%",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalIconContainer: {
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 50,
    marginBottom: 15,
  },
  modalText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default ProductDetailScreen;
