import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";

// ─── Role → home route map ────────────────────────────────────
export const ROLE_HOME = {
  SUPER_ADMIN: "/admin",
  ADMIN:       "/admin",
  FACULTY:     "/faculty",
  STUDENT:     "/student",
};

export const getRoleHome = (role) => ROLE_HOME[role] ?? "/login";

// ─── Thunks ───────────────────────────────────────────────────

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.login, { email, password });
      return res.data.data; // full user + nested profile
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.post(EP.auth.logout);
    } catch (err) {
      // Swallow — clear state regardless
    }
  }
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(EP.auth.me);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(null);
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.changePassword, {
        currentPassword,
        newPassword,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to change password."
      );
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.forgotPassword, { email });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to send reset email."
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.resetPassword, {
        token,
        password,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to reset password."
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user:        null,   // full user object (with nested student/faculty/admin)
    initialized: false,  // fetchMe completed (prevents redirect flash)
    loading:     false,
    error:       null,
  },
  reducers: {
    clearError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    // ── login ──
    b.addCase(login.pending,   (s) => { s.loading = true; s.error = null; })
     .addCase(login.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; })
     .addCase(login.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });

    // ── logout ──
    b.addCase(logout.fulfilled, (s) => { s.user = null; s.initialized = true; });

    // ── fetchMe ──
    b.addCase(fetchMe.pending,   (s) => { s.loading = true; })
     .addCase(fetchMe.fulfilled, (s, a) => {
       s.user = a.payload;
       s.loading = false;
       s.initialized = true;
     })
     .addCase(fetchMe.rejected,  (s) => {
       s.user = null;
       s.loading = false;
       s.initialized = true;
     });

    // ── changePassword ──
    b.addCase(changePassword.pending,  (s) => { s.loading = true; s.error = null; })
     .addCase(changePassword.fulfilled,(s) => { s.loading = false; })
     .addCase(changePassword.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // ── forgotPassword / resetPassword — no state changes needed ──
    b.addCase(forgotPassword.pending,  (s) => { s.loading = true; s.error = null; })
     .addCase(forgotPassword.fulfilled,(s) => { s.loading = false; })
     .addCase(forgotPassword.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    b.addCase(resetPassword.pending,   (s) => { s.loading = true; s.error = null; })
     .addCase(resetPassword.fulfilled, (s) => { s.loading = false; })
     .addCase(resetPassword.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
