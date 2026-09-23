import api from "./api";

export const serviceApi = {
  getServices: async () => {
    const res = await api.get("/services/");
    return res.data;
  },

  getServiceById: async (id) => {
    const res = await api.get(`/services/${id}/`);
    return res.data;
  },

  createService: async (serviceData) => {
    const res = await api.post("/services/", serviceData);
    return res.data;
  },

  updateService: async (id, serviceData) => {
    const res = await api.patch(`/services/${id}/`, serviceData);
    return res.data;
  },

  deleteService: async (id) => {
    const res = await api.delete(`/services/${id}/`);
    return res.data;
  },
};
