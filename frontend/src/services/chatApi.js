import api from "./api";

export const chatApi = {
  /**
   * Send a message to the AI chatbot.
   * @param {string} message - The user's latest message
   * @param {Array}  history - Previous conversation turns [{role, parts}]
   * @returns {Promise<{reply: string}>}
   */
  sendMessage: async (message, history = []) => {
    const res = await api.post("/chat/", { message, history });
    return res.data; // { success, message, data: { reply } }
  },
};
