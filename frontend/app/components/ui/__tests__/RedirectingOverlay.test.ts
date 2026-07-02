import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import RedirectingOverlay from "../RedirectingOverlay.vue";

describe("RedirectingOverlay.vue", () => {
  beforeEach(() => {
    document.body.className = "";
  });

  afterEach(() => {
    document.body.className = "";
  });

  it("should not render when show is false", () => {
    const wrapper = mount(RedirectingOverlay, {
      props: {
        show: false,
      },
    });

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(document.body.classList.contains("overflow-hidden")).toBe(false);
  });

  it("should render when show is true with default messages", () => {
    const wrapper = mount(RedirectingOverlay, {
      props: {
        show: true,
      },
    });

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect(wrapper.find("#redirect-title").text()).toBe("Redirection en cours...");
    expect(wrapper.text()).toContain("Veuillez patienter pendant que nous vous redirigeons.");
    expect(document.body.classList.contains("overflow-hidden")).toBe(true);
  });

  it("should render custom title and message", () => {
    const wrapper = mount(RedirectingOverlay, {
      props: {
        show: true,
        title: "Chargement...",
        message: "Préparation de votre session.",
      },
    });

    expect(wrapper.find("#redirect-title").text()).toBe("Chargement...");
    expect(wrapper.text()).toContain("Préparation de votre session.");
  });

  it("should toggle overflow-hidden on body when show prop changes", async () => {
    const wrapper = mount(RedirectingOverlay, {
      props: {
        show: false,
      },
    });

    expect(document.body.classList.contains("overflow-hidden")).toBe(false);

    await wrapper.setProps({ show: true });
    expect(document.body.classList.contains("overflow-hidden")).toBe(true);

    await wrapper.setProps({ show: false });
    expect(document.body.classList.contains("overflow-hidden")).toBe(false);
  });
});
