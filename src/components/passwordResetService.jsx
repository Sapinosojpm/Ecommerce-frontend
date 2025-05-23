// passwordResetService.js
import axios from 'axios';

const API_URL = 'https://ecommerce-server-d8a1.onrender.com/api/user/reset-password/confirm';

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(API_URL, { token, newPassword });
    return response.data; // Return the success response from the backend
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
};
