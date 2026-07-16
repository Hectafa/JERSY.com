const DEFAULT_TTL_MS = 60000;

const store = new Map();

export function getOrFetch(key, fetcher, ttlMs = DEFAULT_TTL_MS) {
  const cached = store.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = Promise.resolve()
    .then(fetcher)
    .catch((err) => {
      store.delete(key);
      throw err;
    });

  store.set(key, { promise, expiresAt: Date.now() + ttlMs });
  return promise;
}

export function clearCache() {
  store.clear();
}
