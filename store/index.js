import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import cityReducer from "./slices/citySlice";
import vendorReducer from "./slices/vendorSlice";
import signupReducer from "./slices/signupSlice";
// Persist configuration
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["vendor", "city", "signup"], // persist vendor, city, and signup
};

const rootReducer = combineReducers({
  vendor: vendorReducer,
  city: cityReducer,
  signup: signupReducer,
  // add other reducers here
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER",
        ],
      },
    }),
});

export const persistor = persistStore(store);
