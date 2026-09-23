import api from "./api";

export const orderApi = {
  checkout: async (paymentMethod = "CASH", notes = "") => {
    const res = await api.post("/orders/checkout/", {
      payment_method: paymentMethod,
      notes: notes,
    });
    return res.data;
  },

  getOrders: async (params = {}) => {
    const res = await api.get("/orders/", { params });
    return res.data;
  },

  getOrderById: async (id) => {
    const res = await api.get(`/orders/${id}/`);
    return res.data;
  },

  updateOrderStatus: async (id, status) => {
    const res = await api.patch(`/orders/${id}/status/`, { status });
    return res.data;
  },
};
