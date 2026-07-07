// simple-peer > readable-stream uses process.nextTick internally.
// Vite shims the `process` global in dev mode but strips it in production
// client builds, causing "process.nextTick is not a function" at runtime.
//
// This client-only plugin provides a browser-safe microtask-based polyfill.
// It runs at app initialization, before any component (e.g. TeleconsultationRoom)
// dynamically imports simple-peer.

export default defineNuxtPlugin(() => {
  if (typeof globalThis.process === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).process = {};
  }

  if (typeof globalThis.process.nextTick !== "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.process.nextTick = (cb: (...args: any[]) => void, ...args: any[]) => {
      Promise.resolve().then(() => cb(...args));
    };
  }
});
