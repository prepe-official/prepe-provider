import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  step: 0,
  // Step 1: Owner & Business Details
  ownerName: "",
  shopName: "",
  email: "",
  password: "",

  // Step 2: Contact Information
  phone: "",
  address: "",
  city: null,
  sessionId: null, // For OTP verification

  // Step 3: Bank Details
  bankHolderName: "",
  accountNumber: "",
  ifscCode: "",
  upiId: "",

  // Step 4: Images
  profileImage: null,
  shopImages: [],

  // Meta fields
  isOtpVerified: false,
  isComplete: false,
};

const signupSlice = createSlice({
  name: "signup",
  initialState,
  reducers: {
    saveProgress: (state, action) => {
      return { ...state, ...action.payload };
    },

    setStep: (state, action) => {
      state.step = action.payload;
    },

    nextStep: (state) => {
      state.step += 1;
    },

    prevStep: (state) => {
      if (state.step > 0) {
        state.step -= 1;
      }
    },

    setOtpVerified: (state, action) => {
      state.isOtpVerified = action.payload;
      state.sessionId = action.payload ? state.sessionId : null;
    },

    clearProgress: () => initialState,

    resetToStep: (state, action) => {
      const targetStep = action.payload;
      state.step = targetStep;

      // Clear data from subsequent steps
      if (targetStep < 1) {
        state.phone = "";
        state.address = "";
        state.city = null;
        state.sessionId = null;
        state.isOtpVerified = false;
      }
      if (targetStep < 2) {
        state.bankHolderName = "";
        state.accountNumber = "";
        state.ifscCode = "";
        state.upiId = "";
      }
      if (targetStep < 3) {
        state.profileImage = null;
        state.shopImages = [];
      }
    },
  },
});

export const {
  saveProgress,
  clearProgress,
  setStep,
  nextStep,
  prevStep,
  setOtpVerified,
  resetToStep,
} = signupSlice.actions;

export default signupSlice.reducer;
