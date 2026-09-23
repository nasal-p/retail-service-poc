import api from "./api";

export const inventoryApi = {
  getInventory: async (params = {}) => {
    const res = await api.get("/inventory/", { params });
    return res.data;
  },

  getInventoryDetail: async (productId) => {
    const res = await api.get(`/inventory/${productId}/`);
    return res.data;
  },

  adjustStock: async (productId, newQuantity, note = "") => {
    const res = await api.post(`/inventory/${productId}/adjust/`, {
      new_quantity: newQuantity,
      note,
    });
    return res.data;
  },

  getTransactions: async (productId) => {
    const res = await api.get(`/inventory/${productId}/transactions/`);
    return res.data;
  },
};
