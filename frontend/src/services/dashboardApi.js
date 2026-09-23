import api from "./api";

export const dashboardApi = {
  getDashboardStats: async () => {
    const res = await api.get("/dashboard/");
    return res.data;
  },
};
