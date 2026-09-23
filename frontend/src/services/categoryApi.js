import api from "./api";

export const categoryApi = {
  getCategories: async () => {
    const res = await api.get("/categories/");
    return res.data;
  },

  createCategory: async (categoryData) => {
    const res = await api.post("/categories/", categoryData);
    return res.data;
  },

  updateCategory: async (id, categoryData) => {
    const res = await api.patch(`/categories/${id}/`, categoryData);
    return res.data;
  },

  deleteCategory: async (id) => {
    const res = await api.delete(`/categories/${id}/`);
    return res.data;
  },
};
