import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { ref, computed } from "vue";
import RegisterPage from "../register.vue";

// Stub standard auto-imported Nuxt globals
vi.stubGlobal("ref", ref);
vi.stubGlobal("computed", computed);
vi.stubGlobal("definePageMeta", vi.fn());

const mockRoute = { query: { redirect: "" } };
const mockRouter = { push: vi.fn() };
vi.stubGlobal("useRoute", () => mockRoute);
vi.stubGlobal("useRouter", () => mockRouter);

const mockSignup = vi.fn();
vi.mock("~/composables/useAuth", () => ({
  useAuth: () => ({
    signup: mockSignup,
  }),
}));

// Mock validation functions to keep them stable and controllable in unit tests
vi.mock("~/utils/validation", () => ({
  isValidPhone: (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  },
  isValidBirthDate: (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 15, now.getMonth(), now.getDate());
    const maxDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
    return date <= minDate && date >= maxDate;
  },
}));

describe("register.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.query.redirect = "";
  });

  const getValidFormData = () => ({
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@example.com",
    phone: "+2250102030405",
    dateOfBirth: "1990-01-01",
    gender: "MALE",
    password: "Password1!",
    confirmPassword: "Password1!",
  });

  it("renders registration form fields correctly", () => {
    const wrapper = mount(RegisterPage, {
      global: {
        stubs: {
          NuxtLink: true,
          UiRedirectingOverlay: true,
        },
      },
    });

    expect(wrapper.find("#firstName").exists()).toBe(true);
    expect(wrapper.find("#lastName").exists()).toBe(true);
    expect(wrapper.find("#email").exists()).toBe(true);
    expect(wrapper.find("#phone").exists()).toBe(true);
    expect(wrapper.find("#dateOfBirth").exists()).toBe(true);
    expect(wrapper.find("#gender").exists()).toBe(true);
    expect(wrapper.find("#password").exists()).toBe(true);
    expect(wrapper.find("#confirmPassword").exists()).toBe(true);
  });

  it("shows local validation error when passwords do not match", async () => {
    const wrapper = mount(RegisterPage, {
      global: {
        stubs: {
          NuxtLink: true,
          UiRedirectingOverlay: true,
        },
      },
    });

    const data = getValidFormData();
    data.confirmPassword = "DifferentPassword1!";

    // set form values
    await wrapper.find("#firstName").setValue(data.firstName);
    await wrapper.find("#lastName").setValue(data.lastName);
    await wrapper.find("#email").setValue(data.email);
    await wrapper.find("#phone").setValue(data.phone);
    await wrapper.find("#dateOfBirth").setValue(data.dateOfBirth);
    await wrapper.find("#gender").setValue(data.gender);
    await wrapper.find("#password").setValue(data.password);
    await wrapper.find("#confirmPassword").setValue(data.confirmPassword);
    
    // check terms
    await wrapper.find("#agreeTerms").setValue(true);

    await wrapper.find("form").trigger("submit.prevent");

    expect(mockSignup).not.toHaveBeenCalled();
    expect(wrapper.find("#confirmPassword-error").exists()).toBe(true);
    expect(wrapper.find("#confirmPassword-error").text()).toContain("Les mots de passe ne correspondent pas");
  });

  it("shows validation error when dateOfBirth is under 15 years old", async () => {
    const wrapper = mount(RegisterPage, {
      global: {
        stubs: {
          NuxtLink: true,
          UiRedirectingOverlay: true,
        },
      },
    });

    const data = getValidFormData();
    const date5YearsAgo = new Date();
    date5YearsAgo.setFullYear(date5YearsAgo.getFullYear() - 5);
    data.dateOfBirth = date5YearsAgo.toISOString().split("T")[0];

    await wrapper.find("#firstName").setValue(data.firstName);
    await wrapper.find("#lastName").setValue(data.lastName);
    await wrapper.find("#email").setValue(data.email);
    await wrapper.find("#phone").setValue(data.phone);
    await wrapper.find("#dateOfBirth").setValue(data.dateOfBirth);
    await wrapper.find("#gender").setValue(data.gender);
    await wrapper.find("#password").setValue(data.password);
    await wrapper.find("#confirmPassword").setValue(data.confirmPassword);
    await wrapper.find("#agreeTerms").setValue(true);

    await wrapper.find("form").trigger("submit.prevent");

    expect(mockSignup).not.toHaveBeenCalled();
    expect(wrapper.find("#dateOfBirth-error").exists()).toBe(true);
    expect(wrapper.find("#dateOfBirth-error").text()).toContain("La date de naissance doit être dans le passé");
  });

  it("parses and displays API validation errors correctly", async () => {
    const apiError = {
      statusCode: 400,
      data: {
        success: false,
        message: "Erreur de validation",
        errors: [
          {
            instancePath: "/email",
            message: "Email invalide",
            keyword: "invalid_string",
          },
          {
            instancePath: "/phone",
            message: "Le numéro de téléphone doit contenir entre 10 et 15 chiffres",
            keyword: "custom",
          },
        ],
      },
    };

    mockSignup.mockRejectedValueOnce(apiError);

    const wrapper = mount(RegisterPage, {
      global: {
        stubs: {
          NuxtLink: true,
          UiRedirectingOverlay: true,
        },
      },
    });

    const data = getValidFormData();
    await wrapper.find("#firstName").setValue(data.firstName);
    await wrapper.find("#lastName").setValue(data.lastName);
    await wrapper.find("#email").setValue(data.email);
    await wrapper.find("#phone").setValue(data.phone);
    await wrapper.find("#dateOfBirth").setValue(data.dateOfBirth);
    await wrapper.find("#gender").setValue(data.gender);
    await wrapper.find("#password").setValue(data.password);
    await wrapper.find("#confirmPassword").setValue(data.confirmPassword);
    await wrapper.find("#agreeTerms").setValue(true);

    await wrapper.find("form").trigger("submit.prevent");

    await vi.waitFor(() => {
      expect(wrapper.find("#email-error").exists()).toBe(true);
    });

    expect(wrapper.find("#email-error").text()).toBe("Email invalide");
    expect(wrapper.find("#phone-error").text()).toBe("Le numéro de téléphone doit contenir entre 10 et 15 chiffres");
  });

  it("handles duplicate email conflict error correctly by mapping it to the email field", async () => {
    const apiError = {
      statusCode: 400,
      data: {
        success: false,
        message: "Un utilisateur avec cet email existe déjà",
      },
    };

    mockSignup.mockRejectedValueOnce(apiError);

    const wrapper = mount(RegisterPage, {
      global: {
        stubs: {
          NuxtLink: true,
          UiRedirectingOverlay: true,
        },
      },
    });

    const data = getValidFormData();
    await wrapper.find("#firstName").setValue(data.firstName);
    await wrapper.find("#lastName").setValue(data.lastName);
    await wrapper.find("#email").setValue(data.email);
    await wrapper.find("#phone").setValue(data.phone);
    await wrapper.find("#dateOfBirth").setValue(data.dateOfBirth);
    await wrapper.find("#gender").setValue(data.gender);
    await wrapper.find("#password").setValue(data.password);
    await wrapper.find("#confirmPassword").setValue(data.confirmPassword);
    await wrapper.find("#agreeTerms").setValue(true);

    await wrapper.find("form").trigger("submit.prevent");

    await vi.waitFor(() => {
      expect(wrapper.find("#email-error").exists()).toBe(true);
    });

    expect(wrapper.find("#email-error").text()).toBe("Un utilisateur avec cet email existe déjà.");
  });
});
