import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import {
  AUTH_EMAIL_VERIFIED_COOKIE,
  AUTH_ROLE_COOKIE,
  AUTHENTICATED_COOKIE,
} from "~/utils/authSessionCookies";

// Mock Nuxt's useCookie composable globally for Pinia store unit tests
const mockCookies = new Map<string, { value: string | null }>();
vi.stubGlobal(
  "useCookie",
  vi.fn().mockImplementation((name: string) => {
    if (!mockCookies.has(name)) {
      mockCookies.set(name, { value: null });
    }

    return mockCookies.get(name);
  }),
);

import { useAuthStore } from "../auth";

// helper to create a mock jwt token with custom exp
function createMockJWT(exp: number): string {
  const header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; // standard mock header
  const payload = { exp };
  const payloadBase64 = btoa(JSON.stringify(payload))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const signature = "mock-signature";
  return `${header}.${payloadBase64}.${signature}`;
}

describe("auth store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    mockCookies.clear();
  });

  afterEach(() => {
    localStorage.clear();
    mockCookies.clear();
  });

  it("should initialize with default values", () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.accessToken).toBeNull();
    expect(store.refreshToken).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.tokenExpiresAt).toBeNull();
    expect(store.isTokenExpired).toBe(true);
  });

  it("should setAuth successfully and store tokens in localStorage", () => {
    const store = useAuthStore();
    const mockUser = {
      id: "user-1",
      email: "test@medicote.ci",
      role: "PATIENT",
      status: "ACTIVE",
      emailVerified: true,
    };
    const expTime = Math.floor(Date.now() / 1000) + 3600; // expires in 1 hour
    const accessToken = createMockJWT(expTime);
    const refreshToken = "refresh-token-123";

    store.setAuth(mockUser, { accessToken, refreshToken });

    expect(store.user).toEqual(mockUser);
    expect(store.accessToken).toBe(accessToken);
    expect(store.refreshToken).toBe(refreshToken);
    expect(store.isAuthenticated).toBe(true);
    expect(store.tokenExpiresAt).toBe(expTime);
    expect(store.isTokenExpired).toBe(false);

    expect(localStorage.getItem("accessToken")).toBe(accessToken);
    expect(localStorage.getItem("refreshToken")).toBe(refreshToken);
    expect(JSON.parse(localStorage.getItem("user") || "{}")).toEqual(mockUser);
    expect(localStorage.getItem("tokenExpiresAt")).toBe(expTime.toString());
    expect(mockCookies.get(AUTHENTICATED_COOKIE)?.value).toBe("true");
    expect(mockCookies.get(AUTH_ROLE_COOKIE)?.value).toBe("PATIENT");
    expect(mockCookies.get(AUTH_EMAIL_VERIFIED_COOKIE)?.value).toBe("true");
  });

  it("should updateUser state and update localStorage", () => {
    const store = useAuthStore();
    const mockUser = {
      id: "user-1",
      email: "test@medicote.ci",
      role: "PATIENT",
      status: "ACTIVE",
      emailVerified: true,
    };
    const expTime = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = createMockJWT(expTime);
    const refreshToken = "refresh-token-123";

    store.setAuth(mockUser, { accessToken, refreshToken });
    
    store.updateUser({ email: "new@medicote.ci", emailVerified: false });

    expect(store.user?.email).toBe("new@medicote.ci");
    expect(store.user?.emailVerified).toBe(false);
    expect(store.user?.id).toBe("user-1"); // preserves other fields

    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    expect(storedUser.email).toBe("new@medicote.ci");
    expect(storedUser.emailVerified).toBe(false);
    expect(mockCookies.get(AUTH_ROLE_COOKIE)?.value).toBe("PATIENT");
    expect(mockCookies.get(AUTH_EMAIL_VERIFIED_COOKIE)?.value).toBe("false");
  });

  it("should not updateUser if user is null", () => {
    const store = useAuthStore();
    store.updateUser({ email: "new@medicote.ci" });
    expect(store.user).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("should logout successfully and clear localStorage", () => {
    const store = useAuthStore();
    const mockUser = {
      id: "user-1",
      email: "test@medicote.ci",
      role: "PATIENT",
      status: "ACTIVE",
      emailVerified: true,
    };
    const expTime = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = createMockJWT(expTime);
    const refreshToken = "refresh-token-123";

    store.setAuth(mockUser, { accessToken, refreshToken });
    store.logout();

    expect(store.user).toBeNull();
    expect(store.accessToken).toBeNull();
    expect(store.refreshToken).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.tokenExpiresAt).toBeNull();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("tokenExpiresAt")).toBeNull();
    expect(mockCookies.get(AUTHENTICATED_COOKIE)?.value).toBeNull();
    expect(mockCookies.get(AUTH_ROLE_COOKIE)?.value).toBeNull();
    expect(mockCookies.get(AUTH_EMAIL_VERIFIED_COOKIE)?.value).toBeNull();
  });

  it("should initAuth correctly from localStorage if token is not expired", () => {
    const store = useAuthStore();
    const mockUser = {
      id: "user-1",
      email: "test@medicote.ci",
      role: "PATIENT",
      status: "ACTIVE",
      emailVerified: true,
    };
    const expTime = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = createMockJWT(expTime);
    const refreshToken = "refresh-token-123";

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(mockUser));
    localStorage.setItem("tokenExpiresAt", expTime.toString());

    store.initAuth();

    expect(store.user).toEqual(mockUser);
    expect(store.accessToken).toBe(accessToken);
    expect(store.refreshToken).toBe(refreshToken);
    expect(store.isAuthenticated).toBe(true);
    expect(store.tokenExpiresAt).toBe(expTime);
    expect(store.isTokenExpired).toBe(false);
    expect(mockCookies.get(AUTHENTICATED_COOKIE)?.value).toBe("true");
    expect(mockCookies.get(AUTH_ROLE_COOKIE)?.value).toBe("PATIENT");
    expect(mockCookies.get(AUTH_EMAIL_VERIFIED_COOKIE)?.value).toBe("true");
  });

  it("should initialize minimal server auth state from session cookie role", () => {
    const store = useAuthStore();

    store.initServerAuth("PRACTITIONER");

    expect(store.isAuthenticated).toBe(true);
    expect(store.user).toBeNull();
    expect(store.sessionRole).toBe("PRACTITIONER");
    expect(store.currentRole).toBe("PRACTITIONER");
  });

  it("should clear auth during initAuth if token is expired", () => {
    const store = useAuthStore();
    const mockUser = {
      id: "user-1",
      email: "test@medicote.ci",
      role: "PATIENT",
      status: "ACTIVE",
      emailVerified: true,
    };
    // expired 1 hour ago
    const expTime = Math.floor(Date.now() / 1000) - 3600;
    const accessToken = createMockJWT(expTime);
    const refreshToken = "refresh-token-123";

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(mockUser));
    localStorage.setItem("tokenExpiresAt", expTime.toString());

    store.initAuth();

    expect(store.user).toBeNull();
    expect(store.accessToken).toBeNull();
    expect(store.refreshToken).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.tokenExpiresAt).toBeNull();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("tokenExpiresAt")).toBeNull();
  });
});
