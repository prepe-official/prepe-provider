import axios from "axios";

class ConfigService {
  constructor() {
    this.config = null;
    this.lastFetchTime = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  async getConfiguration() {
    // Return cached config if it's still valid
    if (
      this.config &&
      this.lastFetchTime &&
      Date.now() - this.lastFetchTime < this.cacheTimeout
    ) {
      return this.config;
    }

    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/configuration/get`
      );

      if (response.data.success) {
        this.config = response.data.configuration;
        this.lastFetchTime = Date.now();
        return this.config;
      } else {
        throw new Error("Failed to fetch configuration");
      }
    } catch (error) {
      console.error("Error fetching configuration:", error);
      // Return default config if API fails
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      providerMonthlyFee: 0, // Default fallback
      platformFeePercentage: 0,
      firstCashbackPercentage: 0,
      cashbackPercentage: [],
      strikeoutPricePercentage: 0,
      supportedCities: [],
      termsLink: "",
      privacyLink: "",
      refundLink: "",
      heroImage: "",
      customerSupport: {
        phone: "",
        email: "",
      },
    };
  }

  // Helper method to get recharge amount specifically
  async getRechargeAmount() {
    const config = await this.getConfiguration();
    return config.providerMonthlyFee;
  }

  // Clear cache (useful for testing or when config changes)
  clearCache() {
    this.config = null;
    this.lastFetchTime = null;
  }
}

export default new ConfigService();
