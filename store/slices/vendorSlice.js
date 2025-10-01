import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  vendor: null,
  isLoggedIn: false,
  token: null,
};

const vendorSlice = createSlice({
  name: "vendor",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isLoggedIn = true;
      state.vendor = action.payload.vendor;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.vendor = null;
      state.token = null;
    },
    updateVendor: (state, action) => {
      state.vendor = { ...state.vendor, ...action.payload };
    },
  },
});

export const { login, logout, updateVendor } = vendorSlice.actions;
export default vendorSlice.reducer;
