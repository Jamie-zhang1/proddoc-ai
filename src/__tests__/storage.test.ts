import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => "test-uuid" },
});

describe("localStorage operations", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("should store and retrieve JSON data", () => {
    const data = { name: "test", value: 42 };
    localStorageMock.setItem("test-key", JSON.stringify(data));
    const retrieved = JSON.parse(localStorageMock.getItem("test-key") ?? "null");
    expect(retrieved).toEqual(data);
  });

  it("should remove items", () => {
    localStorageMock.setItem("to-delete", "value");
    localStorageMock.removeItem("to-delete");
    expect(localStorageMock.getItem("to-delete")).toBeNull();
  });

  it("should return null for non-existent keys", () => {
    expect(localStorageMock.getItem("non-existent")).toBeNull();
  });

  it("should overwrite existing values", () => {
    localStorageMock.setItem("key", "first");
    localStorageMock.setItem("key", "second");
    expect(localStorageMock.getItem("key")).toBe("second");
  });

  it("should handle empty strings", () => {
    localStorageMock.setItem("empty", "");
    expect(localStorageMock.getItem("empty")).toBe("");
  });
});

describe("IndexedDB operations (mocked)", () => {
  // These are stub tests for IndexedDB operations
  // In a real setup, you'd use fake-indexeddb

  it("should store data in IndexedDB store", async () => {
    // TODO: Implement with fake-indexeddb when full IDB testing is needed
    const mockStore = new Map<string, unknown>();
    mockStore.set("key1", { data: "test" });
    expect(mockStore.get("key1")).toEqual({ data: "test" });
  });

  it("should retrieve data from IndexedDB store", async () => {
    const mockStore = new Map<string, unknown>();
    mockStore.set("key1", { content: "hello" });
    const result = mockStore.get("key1") as { content: string } | undefined;
    expect(result?.content).toBe("hello");
  });

  it("should delete data from IndexedDB store", async () => {
    const mockStore = new Map<string, unknown>();
    mockStore.set("key1", { data: "test" });
    mockStore.delete("key1");
    expect(mockStore.has("key1")).toBe(false);
  });

  it("should clear all data from IndexedDB store", async () => {
    const mockStore = new Map<string, unknown>();
    mockStore.set("key1", { data: "test" });
    mockStore.set("key2", { data: "test2" });
    mockStore.clear();
    expect(mockStore.size).toBe(0);
  });
});
