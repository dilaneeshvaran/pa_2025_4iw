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
});
