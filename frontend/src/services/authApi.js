import api from "./api";

export const authApi = {
  login: async (email, password) => {
    const res = await api.post("/auth/login/", { email, password });
    return res.data;
  },

  register: async (userData) => {
    const res = await api.post("/auth/register/", userData);
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get("/auth/me/");
    return res.data;
  },

  refreshToken: async (refresh) => {
    const res = await api.post("/auth/refresh/", { refresh });
    return res.data;
  },

  getUsers: async (params = {}) => {
    const res = await api.get("/auth/users/", { params });
    return res.data;
  },

  updateUser: async (id, data) => {
    const res = await api.patch(`/auth/users/${id}/`, data);
    return res.data;
  },
};
