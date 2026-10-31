/* ==========================================================================
   Tsuki — Cache API avec TTL (évite de rappeler les mêmes endpoints)
   ========================================================================== */

export class Cache {
  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttl = ttlMs;
    this.store = new Map(); // clé -> { value, expiry }
  }

  _key(namespace, ...args) {
    if (args.length === 0) return String(namespace);
    return `${namespace}:${JSON.stringify(args)}`;
  }

  get(namespace, ...args) {
    const k = this._key(namespace, ...args);
    const entry = this.store.get(k);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(k);
      return null;
    }
    return entry.value;
  }

  set(namespace, value, ...args) {
    const k = args.length === 0 ? String(namespace) : this._key(namespace, ...args);
    this.store.set(k, { value, expiry: Date.now() + this.ttl });
  }

  has(namespace, ...args) {
    return this.get(namespace, ...args) !== null;
  }

  clear() {
    this.store.clear();
  }
}
