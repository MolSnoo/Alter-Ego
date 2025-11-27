class CaseInsensitiveMap extends Map {
  #originalKeys = new Map();

  constructor(iterable) {
    super();
    if (iterable != null) {
      for (const [k, v] of iterable) {
        this.set(k, v);
      }
    }
  }

  #normalizeKey(key) {
    if (typeof key === 'string') {
      return key.toLowerCase();
    }
    return key;
  }

  set(key, value) {
    const normalized = this.#normalizeKey(key);
    this.#originalKeys.set(normalized, key);
    return super.set(normalized, value);
  }

  get(key) {
    return super.get(this.#normalizeKey(key));
  }

  has(key) {
    return super.has(this.#normalizeKey(key));
  }

  delete(key) {
    const normalized = this.#normalizeKey(key);
    this.#originalKeys.delete(normalized);
    return super.delete(normalized);
  }

  clear() {
    this.#originalKeys.clear();
    return super.clear();
  }

  keys() {
    return this.#originalKeys.values();
  }

  *values() {
    for (const [, value] of super.entries()) {
      yield value;
    }
  }

  *entries() {
    for (const [normalizedKey, value] of super.entries()) {
      const originalKey = this.#originalKeys.get(normalizedKey);
      yield [originalKey, value];
    }
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  forEach(callbackfn, thisArg) {
    for (const [normalizedKey, value] of super.entries()) {
      const originalKey = this.#originalKeys.get(normalizedKey);
      callbackfn.call(thisArg, value, originalKey, this);
    }
  }

  get size() {
    return super.size;
  }
}

module.exports = CaseInsensitiveMap;