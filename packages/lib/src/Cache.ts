import { LoadResult } from "./loader/BaseLoader";

export type CacheImpl = {
  [key: string]: unknown;
};

export type CacheKey = {
  locale: string;
  namespace: string[];
  extra?: string;
};

export type CacheDef = {
  loadPromise: Promise<LoadResult>;
  loaded: LoadResult;
};

export function makeCacheKey(key: CacheKey) {
  return `${key.locale}_${key.namespace.join(".")}_${key.extra || ""}`;
}

export default class Cache<T extends CacheImpl = CacheDef> {
  // cache each one into its own map
  // just an easier abstraction???

  map = new Map<string, any>();

  private makeCacheKey(tag: any, key: CacheKey) {
    return `${tag}_${key.locale}_${key.namespace.join(".")}_${key.extra || ""}`;
  }

  // need to give it an object of
  get<K extends keyof T>(tag: K, key: CacheKey): T[K] | null {
    const cacheKey = this.makeCacheKey(tag, key);

    const res = this.map.get(cacheKey);

    if (res === undefined) return null;

    return res;
  }

  set<K extends keyof T>(tag: K, key: CacheKey, value: T[K]): void {
    const cacheKey = this.makeCacheKey(tag, key);

    this.map.set(cacheKey, value);
  }

  delete<K extends keyof T>(tag: K, key: CacheKey): boolean {
    const cacheKey = this.makeCacheKey(tag, key);

    return this.map.delete(cacheKey);
  }
}
