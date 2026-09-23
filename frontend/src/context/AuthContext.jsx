import React, { createContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../services/authApi";
import { cartApi } from "../services/cartApi";
import {
  getUser,
  setUser,
  setAccessToken,
  setRefreshToken,
  clearAuth,
  getAccessToken,
} from "../utils/storage";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAccessToken());
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = useCallback(async () => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== "CUSTOMER") {
      setCartCount(0);
      return;
    }
    try {
      const res = await cartApi.getCart();

      const items = res?.data?.items || res?.items || [];
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalQuantity);
    } catch (err) {
      setCartCount(0);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authApi.getProfile();
      const profileData = res?.data || res;
      setUserState(profileData);
      setUser(profileData);
      setIsAuthenticated(true);
      if (profileData?.role === "CUSTOMER") {
        fetchCartCount();
      }
      return profileData;
    } catch (err) {
      clearAuth();
      setUserState(null);
      setIsAuthenticated(false);
      setCartCount(0);
    }
  }, [fetchCartCount]);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        await refreshProfile();
      } else {
        setIsAuthenticated(false);
        setUserState(null);
      }
      setLoading(false);
    };

    initAuth();
  }, [refreshProfile]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);

    // Backend payload: { success: true, message: "...", data: { access, refresh, user } }
    const authData = res?.data || res;
    if (authData?.access && authData?.refresh) {
      setAccessToken(authData.access);
      setRefreshToken(authData.refresh);
      setUser(authData.user);
      setUserState(authData.user);
      setIsAuthenticated(true);
      if (authData.user?.role === "CUSTOMER") {
        fetchCartCount();
      }
      return authData.user;
    } else {
      throw new Error(res?.message || "Invalid authentication response.");
    }
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    return res;
  };

  const logout = () => {
    clearAuth();
    setUserState(null);
    setIsAuthenticated(false);
    setCartCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        cartCount,
        login,
        register,
        logout,
        refreshProfile,
        fetchCartCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
