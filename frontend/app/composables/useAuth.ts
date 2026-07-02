import type { AuthResponse, SignupData } from "~/types/auth";

export const useAuth = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  const signup = async (data: SignupData): Promise<AuthResponse> => {
    return await $fetch<AuthResponse>("/auth/signup", {
      baseURL: apiBase,
      method: "POST",
      body: data,
      credentials: "include",
    });
  };

  const login = async (data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    return await $fetch<AuthResponse>("/auth/login", {
      baseURL: apiBase,
      method: "POST",
      body: data,
      credentials: "include",
    });
  };

  const verify2fa = async (data: {
    mfaToken: string;
    code: string;
  }): Promise<AuthResponse> => {
    return await $fetch<AuthResponse>("/auth/verify-2fa", {
      baseURL: apiBase,
      method: "POST",
      body: data,
      credentials: "include",
    });
  };

  const requestPasswordReset = async (data: { email: string }) => {
    return await $fetch("/auth/request-password-reset", {
      baseURL: apiBase,
      method: "POST",
      body: data,
      credentials: "include",
    });
  };

  const resetPassword = async (data: {
    token: string;
    newPassword: string;
  }) => {
    return await $fetch("/auth/reset-password", {
      baseURL: apiBase,
      method: "POST",
      body: data,
      credentials: "include",
    });
  };

  const verifyEmail = async (data: { token: string }) => {
    return await $fetch("/auth/verify-email", {
      baseURL: apiBase,
      method: "POST",
      body: data,
      credentials: "include",
    });
  };

  const resendVerification = async (data: { email: string }) => {
    return await $fetch("/auth/resend-verification", {
      baseURL: apiBase,
      method: "POST",
      body: data,
      credentials: "include",
    });
  };

  const refreshToken = async (data: { refreshToken: string }) => {
    return await $fetch("/auth/refresh", {
      baseURL: apiBase,
      method: "POST",
      body: data,
      credentials: "include",
    });
  };

  return {
    signup,
    login,
    verify2fa,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerification,
    refreshToken,
  };
};
