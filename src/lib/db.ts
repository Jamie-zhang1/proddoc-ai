/**
 * IndexedDB wrapper for storing large data (screenshots, document content)
 * that exceeds localStorage's 5MB limit.
 */

const DB_NAME = "proddoc-ai";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("documents")) {
        db.createObjectStore("documents", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("screenshots")) {
        db.createObjectStore("screenshots", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGet<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve((request.result as T) ?? null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function idbSet<T>(storeName: string, key: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put({ id: key, ...value });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function idbDelete(storeName: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function idbClear(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Estimate IndexedDB usage via the Storage Manager API.
 * Returns { usage, quota } in bytes, or null if unavailable.
 */
export async function estimateIDBUsage(): Promise<{ usage: number; quota: number } | null> {
  try {
    // Try estimate API first (requires HTTPS)
    if (typeof navigator !== "undefined" && "storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
    }
  } catch {
    // ignore
  }
  return null;
}

/** Check if IndexedDB is available and has data */
export async function getIDBStatus(): Promise<{ available: boolean; stores: string[] }> {
  try {
    const db = await openDB();
    const stores = Array.from(db.objectStoreNames);
    db.close();
    return { available: true, stores };
  } catch {
    return { available: false, stores: [] };
  }
}

/** Estimate IndexedDB data size by counting records */
export async function getIDBRecordCount(storeName: string): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const countReq = store.count();
      countReq.onsuccess = () => { resolve(countReq.result); db.close(); };
      countReq.onerror = () => { resolve(0); db.close(); };
    });
  } catch {
    return 0;
  }
}
