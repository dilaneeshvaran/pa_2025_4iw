<template>
  <div
    ref="mapContainer"
    class="w-full rounded-lg"
    :style="{ height: height, zIndex: 0 }"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";

const props = withDefaults(
  defineProps<{
    latitude: number;
    longitude: number;
    label?: string;
    address?: string;
    zoom?: number;
    height?: string;
  }>(),
  {
    zoom: 15,
    height: "384px",
  },
);

const mapContainer = ref<HTMLElement | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let L: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let map: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let marker: any = null;

const makeMarkerIcon = () =>
  L.divIcon({
    html: `<div style="width:28px;height:28px;background:#0891b2;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildPopup = () => {
  const lines: string[] = [];
  if (props.label) {
    lines.push(
      `<div style="font-weight:600;font-size:14px;margin-bottom:2px;">${escapeHtml(props.label)}</div>`,
    );
  }
  if (props.address) {
    lines.push(
      `<div style="color:#6b7280;font-size:12px;">${escapeHtml(props.address)}</div>`,
    );
  }
  return `<div style="min-width:180px;font-family:Inter,sans-serif;">${lines.join("")}</div>`;
};

const updateMarker = () => {
  if (!L || !map) return;
  const latLng = [props.latitude, props.longitude];

  if (marker) {
    marker.setLatLng(latLng);
    marker.setPopupContent(buildPopup());
  } else {
    marker = L.marker(latLng, { icon: makeMarkerIcon() })
      .bindPopup(buildPopup())
      .addTo(map);
  }

  map.setView(latLng, props.zoom);
};

const initMap = async () => {
  if (!mapContainer.value || map) return;

  const leaflet = await import("leaflet");
  L = leaflet.default;

  // Fix Vite/webpack asset resolution for default icons
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });

  map = L.map(mapContainer.value).setView(
    [props.latitude, props.longitude],
    props.zoom,
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  updateMarker();

  // Container may have been hidden (e.g. inside a tab) when the map was
  // created, leaving it sized at 0. Recompute the size once it is visible.
  await nextTick();
  map.invalidateSize();
};

watch(
  () => [props.latitude, props.longitude],
  () => updateMarker(),
);

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style>
@import "leaflet/dist/leaflet.css";
</style>
