// buffer polyfill for simple peer in browser
// dont rename the file to make sure it loads first before simple peer
interface SimpleBufferPolyfill {
  (
    data: string | number | number[] | ArrayBuffer | Uint8Array,
    encoding?: string,
  ): Uint8Array;
  from(
    data: string | ArrayBuffer | Uint8Array | number[],
    encoding?: string,
  ): Uint8Array;
  alloc(size: number): Uint8Array;
  allocUnsafe(size: number): Uint8Array;
  isBuffer(obj: unknown): boolean;
  concat(list: Uint8Array[], totalLength?: number): Uint8Array;
}

export default defineNuxtPlugin(() => {
  if (import.meta.client && typeof window !== "undefined") {
    // check if global and process are available first
    if (!(globalThis as Record<string, unknown>).global) {
      (globalThis as Record<string, unknown>).global = globalThis;
    }

    if (!(globalThis as Record<string, unknown>).process) {
      (globalThis as Record<string, unknown>).process = {
        env: {},
        version: "",
        browser: true,
      };
    }

    // buffer polyfill for simple peer
    if (!(globalThis as Record<string, unknown>).Buffer) {
      const BufferPolyfill = function BufferPolyfill(
        data: string | number | number[] | ArrayBuffer | Uint8Array,
        encoding?: string,
      ): Uint8Array {
        if (typeof data === "number") {
          return new Uint8Array(data);
        }
        if (typeof data === "string") {
          if (encoding === "base64") {
            const binary = atob(data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
          }
          const encoder = new TextEncoder();
          return encoder.encode(data);
        }
        if (Array.isArray(data)) {
          return new Uint8Array(data);
        }
        if (data instanceof ArrayBuffer) {
          return new Uint8Array(data);
        }
        return data;
      } as SimpleBufferPolyfill;

      BufferPolyfill.from = function (
        data: string | ArrayBuffer | Uint8Array | number[],
        encoding?: string,
      ): Uint8Array {
        if (typeof data === "string") {
          if (encoding === "base64") {
            const binary = atob(data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
          }
          const encoder = new TextEncoder();
          return encoder.encode(data);
        }
        if (data instanceof ArrayBuffer) {
          return new Uint8Array(data);
        }
        if (Array.isArray(data)) {
          return new Uint8Array(data);
        }
        return data as Uint8Array;
      };

      BufferPolyfill.alloc = function (size: number): Uint8Array {
        return new Uint8Array(size);
      };

      BufferPolyfill.allocUnsafe = function (size: number): Uint8Array {
        return new Uint8Array(size);
      };

      BufferPolyfill.isBuffer = function (obj: unknown): boolean {
        return obj instanceof Uint8Array;
      };

      BufferPolyfill.concat = function (
        list: Uint8Array[],
        totalLength?: number,
      ): Uint8Array {
        if (!totalLength) {
          totalLength = list.reduce((acc, buf) => acc + buf.length, 0);
        }
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of list) {
          result.set(buf, offset);
          offset += buf.length;
        }
        return result;
      };

      (globalThis as Record<string, unknown>).Buffer = BufferPolyfill;
      (window as unknown as Record<string, unknown>).Buffer = BufferPolyfill;
    }
  }
});
