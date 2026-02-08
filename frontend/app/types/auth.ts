export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
}

export interface AuthData {
  user: User;
  tokens: AuthTokens;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthData;
}

export interface ApiError {
  data?: {
    message?: string;
  };
  message?: string;
}

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
}
