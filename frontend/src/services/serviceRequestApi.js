import api from "./api";

export const serviceRequestApi = {
  bookService: async (bookingData) => {
    // bookingData: { service, device_brand, device_model, serial_number, problem_description, preferred_date, preferred_time }
    const res = await api.post("/service-requests/", bookingData);
    return res.data;
  },

  getServiceRequests: async (params = {}) => {
    const res = await api.get("/service-requests/", { params });
    return res.data;
  },

  getServiceRequestById: async (id) => {
    const res = await api.get(`/service-requests/${id}/`);
    return res.data;
  },

  updateStatus: async (id, status, note = "") => {
    const res = await api.patch(`/service-requests/${id}/status/`, {
      status,
      note,
    });
    return res.data;
  },

  getHistory: async (id) => {
    const res = await api.get(`/service-requests/${id}/history/`);
    return res.data;
  },
};
