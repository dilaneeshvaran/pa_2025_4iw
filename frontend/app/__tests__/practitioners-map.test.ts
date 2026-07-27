import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import PractitionersMap from "../components/PractitionersMap.vue";

const mapInstance = {
  setView: vi.fn(() => mapInstance),
  fitBounds: vi.fn(),
  invalidateSize: vi.fn(),
  removeLayer: vi.fn(),
  remove: vi.fn(),
};

const makeMarker = (latlng: [number, number]) => {
  const marker = {
    bindPopup: vi.fn(() => marker),
    addTo: vi.fn(() => marker),
    getLatLng: () => latlng,
  };
  return marker;
};

const leafletMock = {
  map: vi.fn(() => mapInstance),
  tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
  divIcon: vi.fn(() => ({})),
  marker: vi.fn((latlng: [number, number]) => makeMarker(latlng)),
  circle: vi.fn(() => ({ addTo: vi.fn(), setRadius: vi.fn() })),
  featureGroup: vi.fn(() => ({
    getBounds: () => ({ pad: () => "bounds" }),
  })),
  Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
};

vi.mock("leaflet", () => ({ default: leafletMock }));

let resizeCallback: (() => void) | null = null;
let containerSize = { width: 0, height: 0 };

const makePractitioner = (id: string, latitude: number, longitude: number) => ({
  id,
  firstName: "Mariam",
  lastName: "Ouattara",
  title: "Dr.",
  city: "Abidjan",
  baseConsultationFee: 18000,
  teleconsultationEnabled: false,
  averageRating: null,
  totalReviews: 0,
  latitude,
  longitude,
  specialties: [{ id: "s1", name: "Pédiatrie", isPrimary: true }],
});

describe("PractitionersMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resizeCallback = null;
    containerSize = { width: 0, height: 0 };

    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          resizeCallback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );

    // happy-dom has no layout engine: fake the container dimensions.
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get: () => containerSize.width,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get: () => containerSize.height,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mountHidden = async (
    practitioners: ReturnType<typeof makePractitioner>[],
  ) => {
    const wrapper = mount(PractitionersMap, {
      props: { practitioners, showControls: false },
      attachTo: document.body,
    });
    await flushPromises();
    return wrapper;
  };

  it("does not fit the view while the container is hidden", async () => {
    await mountHidden([makePractitioner("p1", 5.3878, -3.9882)]);

    expect(leafletMock.map).toHaveBeenCalled();
    expect(leafletMock.marker).toHaveBeenCalledTimes(1);
    // Only the initial default center, no fit against a 0x0 viewport.
    expect(mapInstance.setView).toHaveBeenCalledTimes(1);
    expect(mapInstance.fitBounds).not.toHaveBeenCalled();
  });

  it("re-measures and centers on the marker once the container is revealed", async () => {
    await mountHidden([makePractitioner("p1", 5.3878, -3.9882)]);

    containerSize = { width: 800, height: 420 };
    resizeCallback?.();
    await flushPromises();

    expect(mapInstance.invalidateSize).toHaveBeenCalled();
    // A single location must not be fitted (that zooms to maxZoom).
    expect(mapInstance.fitBounds).not.toHaveBeenCalled();
    expect(mapInstance.setView).toHaveBeenLastCalledWith([5.3878, -3.9882], 15);
  });

  it("fits capped bounds when several markers are revealed", async () => {
    await mountHidden([
      makePractitioner("p1", 5.3878, -3.9882),
      makePractitioner("p2", 5.3546, -4.0038),
    ]);

    containerSize = { width: 800, height: 560 };
    resizeCallback?.();
    await flushPromises();

    expect(mapInstance.invalidateSize).toHaveBeenCalled();
    expect(mapInstance.fitBounds).toHaveBeenCalledWith("bounds", {
      maxZoom: 16,
    });
  });

  it("fits immediately when mounted in a visible container", async () => {
    containerSize = { width: 800, height: 560 };
    await mountHidden([
      makePractitioner("p1", 5.3878, -3.9882),
      makePractitioner("p2", 5.3546, -4.0038),
    ]);

    expect(mapInstance.fitBounds).toHaveBeenCalledWith("bounds", {
      maxZoom: 16,
    });
  });

  it("hides the geolocation controls when showControls is false", async () => {
    const wrapper = await mountHidden([
      makePractitioner("p1", 5.3878, -3.9882),
    ]);

    expect(wrapper.text()).not.toContain("Ma position");
    expect(wrapper.find("#map-radius").exists()).toBe(false);
  });
});
