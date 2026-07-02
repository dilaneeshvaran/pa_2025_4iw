import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Nuxt global helpers BEFORE importing the file
vi.stubGlobal("defineNuxtRouteMiddleware", (handler: any) => handler);
vi.stubGlobal("useCookie", vi.fn().mockImplementation((name: string) => {
  return { value: null };
}));

const navigateToMock = vi.fn();
vi.stubGlobal("navigateTo", navigateToMock);

const mockAuthStore = {
  isAuthenticated: false,
  user: null,
  currentRole: null,
  initAuth: vi.fn(),
  initServerAuth: vi.fn(),
};
vi.stubGlobal("useAuthStore", () => mockAuthStore);

describe("auth.global middleware", () => {
  let authGlobal: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.user = null;
    mockAuthStore.currentRole = null;
    
    // Dynamically import the middleware to ensure stubs are active
    authGlobal = (await import("../auth.global")).default;
  });

  it("should allow access to landing page (/) without redirecting", () => {
    const to = { path: "/", fullPath: "/", name: "index", params: {}, matched: [] } as any;
    authGlobal(to, {} as any);
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("should allow access to public routes (like /auth/login) without redirecting", () => {
    const to = { path: "/auth/login", fullPath: "/auth/login", name: "auth-login", params: {}, matched: [] } as any;
    authGlobal(to, {} as any);
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("should redirect unauthenticated users to login for protected routes", () => {
    const to = { path: "/patient/dashboard", fullPath: "/patient/dashboard", name: "patient-dashboard", params: {}, matched: [] } as any;
    authGlobal(to, {} as any);
    expect(navigateToMock).toHaveBeenCalledWith({
      path: "/auth/login",
      query: { redirect: "/patient/dashboard" },
    });
  });

  it("should allow guest users to access practitioner profile page (/practitioner/:id)", () => {
    const to = {
      path: "/practitioner/dr-drogba-123",
      fullPath: "/practitioner/dr-drogba-123",
      name: "practitioner-id",
      params: { id: "dr-drogba-123" },
      matched: [],
    } as any;
    authGlobal(to, {} as any);
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("should redirect guest users trying to access practitioner dashboard (/practitioner/dashboard)", () => {
    const to = {
      path: "/practitioner/dashboard",
      fullPath: "/practitioner/dashboard",
      name: "practitioner-dashboard",
      params: {},
      matched: [],
    } as any;
    authGlobal(to, {} as any);
    expect(navigateToMock).toHaveBeenCalledWith({
      path: "/auth/login",
      query: { redirect: "/practitioner/dashboard" },
    });
  });

  it("should redirect guest users trying to access practitioner agenda (/practitioner/agenda)", () => {
    const to = {
      path: "/practitioner/agenda",
      fullPath: "/practitioner/agenda",
      name: "practitioner-agenda",
      params: {},
      matched: [],
    } as any;
    authGlobal(to, {} as any);
    expect(navigateToMock).toHaveBeenCalledWith({
      path: "/auth/login",
      query: { redirect: "/practitioner/agenda" },
    });
  });

  it("should redirect authenticated but unverified email users to the verify-email-notice page when visiting a protected route", () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { emailVerified: false, role: "PATIENT" } as any;
    mockAuthStore.currentRole = "PATIENT";

    const to = {
      path: "/patient/dashboard",
      fullPath: "/patient/dashboard",
      name: "patient-dashboard",
      params: {},
      matched: [],
    } as any;

    authGlobal(to, {} as any);
    expect(navigateToMock).toHaveBeenCalledWith("/auth/verify-email-notice");
  });

  it("should allow authenticated but unverified email users to access public routes", () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { emailVerified: false, role: "PATIENT" } as any;
    mockAuthStore.currentRole = "PATIENT";

    const to = {
      path: "/legal",
      fullPath: "/legal",
      name: "legal",
      params: {},
      matched: [],
    } as any;

    authGlobal(to, {} as any);
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("should not redirect authenticated but unverified users when they visit the verification notice page itself", () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { emailVerified: false, role: "PATIENT" } as any;
    mockAuthStore.currentRole = "PATIENT";

    const to = {
      path: "/auth/verify-email-notice",
      fullPath: "/auth/verify-email-notice",
      name: "auth-verify-email-notice",
      params: {},
      matched: [],
    } as any;

    authGlobal(to, {} as any);
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("should redirect authenticated but unverified email users to verify-email-notice when visiting the landing page (/) ", () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { emailVerified: false, role: "PATIENT" } as any;
    mockAuthStore.currentRole = "PATIENT";

    const to = {
      path: "/",
      fullPath: "/",
      name: "index",
      params: {},
      matched: [],
    } as any;

    authGlobal(to, {} as any);
    expect(navigateToMock).toHaveBeenCalledWith("/auth/verify-email-notice");
  });
});
