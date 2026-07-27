<template>
  <div class="relative w-full">
    <div
      ref="mapContainer"
      role="region"
      aria-label="Carte interactive des praticiens et cabinets"
      class="w-full rounded-lg"
      :style="{ height, zIndex: 0 }"
    />

    <!-- Controls overlay -->
    <div
      v-if="showControls"
      class="absolute right-3 top-3 z-[400] flex flex-col gap-2"
    >
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-md hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
        :disabled="locating"
        @click="locateUser"
      >
        <IconLocate
          class="h-4 w-4"
          :class="locating ? 'animate-spin' : ''"
          aria-hidden="true"
        />
        {{ locating ? "Localisation..." : "Ma position" }}
      </button>
      <p class="sr-only" role="status" aria-live="polite">
        {{
          locating
            ? "Localisation en cours"
            : userLocation
              ? "Position détectée"
              : ""
        }}
      </p>
    </div>

    <!-- Radius slider (shown when user is located) -->
    <div
      v-if="showControls && userLocation"
      class="absolute bottom-8 left-3 right-3 z-[400]"
    >
      <div
        class="rounded-lg border border-gray-200 bg-white p-3 shadow-md dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="mb-1 flex items-center justify-between">
          <label
            for="map-radius"
            class="text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            Rayon de recherche
          </label>
          <span class="text-xs font-semibold text-[var(--color-primary)]">
            {{ radiusKm }} km
          </span>
        </div>
        <input
          id="map-radius"
          v-model.number="radiusKm"
          type="range"
          min="1"
          max="50"
          step="1"
          :aria-valuetext="`Rayon de ${radiusKm} kilomètres`"
          class="w-full accent-[#00804A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          @input="onRadiusChange"
        />
        <div
          class="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400"
        >
          <span>1 km</span>
          <span>50 km</span>
        </div>
      </div>
    </div>

    <!-- Empty state overlay -->
    <div
      v-if="
        !loading &&
        mapReady &&
        practitionersWithCoords === 0 &&
        cabinetsWithCoords === 0
      "
      class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 dark:bg-gray-950/70"
      style="z-index: 400"
      role="status"
    >
      <div
        class="rounded-xl bg-white p-6 text-center shadow-lg dark:bg-gray-900"
      >
        <IconMapPin
          class="mx-auto mb-3 h-12 w-12 text-gray-300"
          aria-hidden="true"
        />
        <p class="text-gray-700 dark:text-gray-300">
          Aucun résultat localisé dans cette zone.
        </p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Cliquez sur « Ma position » pour chercher près de vous.
        </p>
      </div>
    </div>

    <!-- Legend -->
    <div
      v-if="showControls"
      class="absolute bottom-8 right-3 z-[400]"
      role="group"
      aria-label="Légende de la carte"
    >
      <div
        class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="mb-1 flex items-center gap-2">
          <span
            class="inline-block h-3 w-3 rounded-full bg-[#0891b2]"
            aria-hidden="true"
          />
          <span class="text-gray-700 dark:text-gray-300">Praticien</span>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="inline-block h-3 w-3 rounded-full bg-[#7c3aed]"
            aria-hidden="true"
          />
          <span class="text-gray-700 dark:text-gray-300">Cabinet</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import { MapPin as IconMapPin, Locate as IconLocate } from "lucide-vue-next";

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  city: string;
  baseConsultationFee: number;
  teleconsultationEnabled: boolean;
  averageRating: number | null;
  totalReviews: number;
  latitude: number | null;
  longitude: number | null;
  specialties: Array<{ id: string; name: string; isPrimary: boolean }>;
}

interface Cabinet {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  practitionersCount: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface UserLocation {
  lat: number;
  lng: number;
}

const props = withDefaults(
  defineProps<{
    practitioners: Practitioner[];
    cabinets?: Cabinet[];
    loading?: boolean;
    showControls?: boolean;
    height?: string;
  }>(),
  {
    cabinets: undefined,
    loading: false,
    showControls: true,
    height: "560px",
  },
);

const emit = defineEmits<{
  (e: "locate", lat: number, lng: number, radius: number): void;
}>();

const mapContainer = ref<HTMLElement | null>(null);
const locating = ref(false);
const radiusKm = ref(10);
const userLocation = ref<UserLocation | null>(null);
const mapReady = ref(false);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let L: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let map: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let practitionerMarkers: any[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cabinetMarkers: any[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let userMarker: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let radiusCircle: any = null;
let resizeObserver: ResizeObserver | null = null;
let pendingFit = false;

const SINGLE_MARKER_ZOOM = 15;

const isContainerVisible = () =>
  !!mapContainer.value &&
  mapContainer.value.offsetWidth > 0 &&
  mapContainer.value.offsetHeight > 0;

const practitionersWithCoords = computed(
  () => props.practitioners.filter((p) => p.latitude && p.longitude).length,
);

const cabinetsWithCoords = computed(
  () => (props.cabinets ?? []).filter((c) => c.latitude && c.longitude).length,
);

const makePractitionerIcon = () =>
  L.divIcon({
    html: `<div style="width:28px;height:28px;background:#0891b2;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });

const makeCabinetIcon = () =>
  L.divIcon({
    html: `<div style="width:32px;height:32px;background:#7c3aed;border:3px solid white;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });

const updatePractitionerMarkers = () => {
  if (!L || !map) return;
  practitionerMarkers.forEach((m) => map.removeLayer(m));
  practitionerMarkers = [];

  props.practitioners
    .filter((p) => p.latitude && p.longitude)
    .forEach((p) => {
      const specialty = p.specialties[0]?.name || "Généraliste";
      const rating = p.averageRating
        ? `<span style="color:#f59e0b;">★ ${p.averageRating}</span> <span style="color:#9ca3af;">(${p.totalReviews})</span>`
        : `<span style="color:#9ca3af;">Pas encore noté</span>`;

      const marker = L.marker([p.latitude!, p.longitude!], {
        icon: makePractitionerIcon(),
        title: `${p.title} ${p.firstName} ${p.lastName} — ${specialty}`,
        alt: `Praticien : ${p.title} ${p.firstName} ${p.lastName}, ${specialty}`,
        riseOnHover: true,
      }).bindPopup(
        `<div style="min-width:210px;font-family:Inter,sans-serif;">
          <div style="font-weight:600;font-size:14px;margin-bottom:2px;">${p.title} ${p.firstName} ${p.lastName}</div>
          <div style="color:#6b7280;font-size:12px;margin-bottom:4px;">${specialty}</div>
          <div style="font-size:12px;margin-bottom:6px;">${rating}</div>
          <div style="font-weight:600;color:#0891b2;font-size:13px;margin-bottom:10px;">${p.baseConsultationFee.toLocaleString()} FCFA</div>
          <a href="/practitioner/${p.id}"
             style="display:inline-block;background:#0891b2;color:white;padding:5px 14px;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;">
            Voir le profil →
          </a>
        </div>`,
        { maxWidth: 260 },
      );

      marker.addTo(map);
      practitionerMarkers.push(marker);
    });
};

const updateCabinetMarkers = () => {
  if (!L || !map) return;
  cabinetMarkers.forEach((m) => map.removeLayer(m));
  cabinetMarkers = [];

  (props.cabinets ?? [])
    .filter((c) => c.latitude && c.longitude)
    .forEach((c) => {
      const marker = L.marker([c.latitude!, c.longitude!], {
        icon: makeCabinetIcon(),
        title: `${c.name}${c.city ? " — " + c.city : ""}`,
        alt: `Cabinet : ${c.name}${c.city ? ", " + c.city : ""}`,
        riseOnHover: true,
      }).bindPopup(
        `<div style="min-width:210px;font-family:Inter,sans-serif;">
          <div style="font-weight:600;font-size:14px;margin-bottom:2px;">${c.name}</div>
          <div style="color:#6b7280;font-size:12px;margin-bottom:4px;">${c.city || ""} ${c.address ? "· " + c.address : ""}</div>
          <div style="font-size:12px;color:#7c3aed;margin-bottom:10px;">${c.practitionersCount} praticien${c.practitionersCount > 1 ? "s" : ""}</div>
          <a href="/cabinet/${c.id}"
             style="display:inline-block;background:#7c3aed;color:white;padding:5px 14px;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;">
            Voir le cabinet →
          </a>
        </div>`,
        { maxWidth: 260 },
      );

      marker.addTo(map);
      cabinetMarkers.push(marker);
    });
};

const fitToMarkers = () => {
  if (!L || !map) return;
  const all = [...practitionerMarkers, ...cabinetMarkers];
  if (all.length === 0 || userLocation.value) return;

  if (!isContainerVisible()) {
    pendingFit = true;
    return;
  }
  pendingFit = false;

  if (all.length === 1) {
    map.setView(all[0].getLatLng(), SINGLE_MARKER_ZOOM);
    return;
  }

  const group = L.featureGroup(all);
  map.fitBounds(group.getBounds().pad(0.25), { maxZoom: 16 });
};

const handleContainerResize = () => {
  if (!map || !isContainerVisible()) return;
  map.invalidateSize();
  if (pendingFit) fitToMarkers();
};

const initMap = async () => {
  if (!mapContainer.value || map) return;

  const leaflet = await import("leaflet");
  L = leaflet.default;

  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });

  // Default center: Abidjan
  map = L.map(mapContainer.value).setView([5.3599517, -4.0082563], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  mapReady.value = true;
  updatePractitionerMarkers();
  updateCabinetMarkers();
  fitToMarkers();

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(handleContainerResize);
    resizeObserver.observe(mapContainer.value);
  }
};

const locateUser = () => {
  if (!navigator.geolocation) return;
  locating.value = true;

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const { latitude, longitude } = coords;
      userLocation.value = { lat: latitude, lng: longitude };
      locating.value = false;

      if (!L || !map) return;

      if (userMarker) map.removeLayer(userMarker);
      if (radiusCircle) map.removeLayer(radiusCircle);

      const userIcon = L.divIcon({
        html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.5);"></div>`,
        className: "",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      userMarker = L.marker([latitude, longitude], {
        icon: userIcon,
        title: "Votre position",
        alt: "Votre position actuelle",
      })
        .bindPopup("<b>Votre position</b>")
        .addTo(map);

      radiusCircle = L.circle([latitude, longitude], {
        radius: radiusKm.value * 1000,
        color: "#3b82f6",
        fillColor: "#93c5fd",
        fillOpacity: 0.12,
        weight: 2,
        dashArray: "6 4",
      }).addTo(map);

      map.setView([latitude, longitude], 13);
      emit("locate", latitude, longitude, radiusKm.value);
    },
    () => {
      locating.value = false;
    },
  );
};

const onRadiusChange = () => {
  if (!L || !map || !userLocation.value) return;
  if (radiusCircle) radiusCircle.setRadius(radiusKm.value * 1000);
  emit(
    "locate",
    userLocation.value.lat,
    userLocation.value.lng,
    radiusKm.value,
  );
};

watch(
  () => props.practitioners,
  () => {
    updatePractitionerMarkers();
    fitToMarkers();
  },
  { deep: true },
);

watch(
  () => props.cabinets,
  () => {
    updateCabinetMarkers();
    fitToMarkers();
  },
  { deep: true },
);

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style>
@import "leaflet/dist/leaflet.css";
</style>
