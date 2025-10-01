import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedCity: null,
};

const citySlice = createSlice({
  name: "city",
  initialState,
  reducers: {
    setCity: (state, action) => {
      state.selectedCity = action.payload;
    },
    clearCity: (state) => {
      state.selectedCity = null;
    },
  },
});

export const { setCity, clearCity } = citySlice.actions;
export default citySlice.reducer;
