import { AgentResponse, CacheOptions, CachedResponse } from "../types";

const DEFAULT_OPTIONS: CacheOptions = {
  enabled: true,
  ttlMs: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  storage: "memory",
};

export class ResponseCache {
  private options: CacheOptions;
  private memoryCache: Map<string, CachedResponse> = new Map();
  private storageKey = "ai-agent-cache";

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.loadFromStorage();
  }

  get(key: string): AgentResponse | null {
    if (!this.options.enabled) return null;

    const cached = this.getCachedResponse(key);
    if (!cached) return null;

    // Check if expired
    if (this.isExpired(cached)) {
      this.invalidate(key);
      return null;
    }

    return cached.response;
  }

  set(key: string, response: AgentResponse, ttl?: number): void {
    if (!this.options.enabled) return;

    // Enforce max size
    if (this.memoryCache.size >= this.options.maxSize) {
      this.evictOldest();
    }

    const cached: CachedResponse = {
      response,
      timestamp: Date.now(),
      ttl: ttl ?? this.options.ttlMs,
    };

    this.memoryCache.set(key, cached);
    this.saveToStorage();
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key);
    this.saveToStorage();
  }

  clear(): void {
    this.memoryCache.clear();
    this.saveToStorage();
  }

  has(key: string): boolean {
    const cached = this.getCachedResponse(key);
    if (!cached) return false;
    if (this.isExpired(cached)) {
      this.invalidate(key);
      return false;
    }
    return true;
  }

  size(): number {
    return this.memoryCache.size;
  }

  // Serialization for round-trip testing
  serialize(response: AgentResponse): string {
    return JSON.stringify(response);
  }

  deserialize(data: string): AgentResponse {
    return JSON.parse(data);
  }

  // Generate cache key from query and context
  static generateKey(query: string, dashboardType: string): string {
    const normalized = query.toLowerCase().trim();
    return `${dashboardType}:${normalized}`;
  }

  private getCachedResponse(key: string): CachedResponse | null {
    return this.memoryCache.get(key) ?? null;
  }

  private isExpired(cached: CachedResponse): boolean {
    const now = Date.now();
    return now - cached.timestamp > cached.ttl;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.timestamp < oldestTime) {
        oldestTime = cached.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  private loadFromStorage(): void {
    if (this.options.storage === "memory") return;
    if (typeof window === "undefined") return;

    try {
      if (this.options.storage === "localStorage") {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          const parsed = JSON.parse(data) as Record<string, CachedResponse>;
          this.memoryCache = new Map(Object.entries(parsed));
          // Clean expired entries
          this.cleanExpired();
        }
      }
      // IndexedDB would require async implementation
    } catch (error) {
      console.warn("Failed to load cache from storage:", error);
    }
  }

  private saveToStorage(): void {
    if (this.options.storage === "memory") return;
    if (typeof window === "undefined") return;

    try {
      if (this.options.storage === "localStorage") {
        const data = Object.fromEntries(this.memoryCache.entries());
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      }
    } catch (error) {
      console.warn("Failed to save cache to storage:", error);
    }
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const responseCache = new ResponseCache();
