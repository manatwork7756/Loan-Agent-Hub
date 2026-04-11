import axios from "axios";

const API = "http://127.0.0.1:8000";

const authService = {
  login: (email, password) =>
    axios.post(`${API}/auth/login`, { email, password }),

  register: (data) =>
    axios.post(`${API}/auth/register`, data),

  verifyOtp: (email, otp) =>
    axios.post(`${API}/auth/verify-otp`, { email, otp }),

  forgotPassword: (email) =>
    axios.post(`${API}/auth/forgot-password`, { email }),

  resetPassword: (email, otp, new_password) =>
    axios.post(`${API}/auth/reset-password`, {
      email,
      otp,
      new_password,
    }),
};

export default authService;