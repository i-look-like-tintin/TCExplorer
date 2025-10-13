/**
 * Cache Manager
 * Handles client-side persistent caching using IndexedDB
 */

class CacheManager {
    constructor() {
        this.dbName = 'TCExplorerCache';
        this.dbVersion = 1;
        this.storeName = 'cycloneData';
        this.db = null;
        this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    }

    /**
     * Initialize the IndexedDB database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'cacheKey' });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('Created IndexedDB object store:', this.storeName);
                }
            };
        });
    }

    /**
     * Get cached data for a given cache key
     * @param {string} cacheKey - Cache key identifier
     * @returns {Promise<object|null>} Cached data or null if not found/expired
     */
    async get(cacheKey) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(cacheKey);

            request.onsuccess = () => {
                const result = request.result;

                if (!result) {
                    resolve(null);
                    return;
                }

                // Check if cache is expired
                const now = Date.now();
                const age = now - result.timestamp;

                if (age >= this.cacheExpiry) {
                    console.log(`Cache expired for key: ${cacheKey} (age: ${Math.round(age / 1000 / 3600)} hours)`);
                    // Delete expired cache
                    this.delete(cacheKey);
                    resolve(null);
                    return;
                }

                console.log(`Cache hit for key: ${cacheKey} (age: ${Math.round(age / 1000 / 3600)} hours)`);
                resolve(result.data);
            };

            request.onerror = () => {
                console.error('Failed to get cached data:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Store data in cache
     * @param {string} cacheKey - Cache key identifier
     * @param {object} data - Data to cache
     * @returns {Promise<void>}
     */
    async set(cacheKey, data) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);

            const cacheEntry = {
                cacheKey: cacheKey,
                data: data,
                timestamp: Date.now()
            };

            const request = objectStore.put(cacheEntry);

            request.onsuccess = () => {
                console.log(`Cached data for key: ${cacheKey}`);
                resolve();
            };

            request.onerror = () => {
                console.error('Failed to cache data:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Delete cached data for a given key
     * @param {string} cacheKey - Cache key identifier
     * @returns {Promise<void>}
     */
    async delete(cacheKey) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete(cacheKey);

            request.onsuccess = () => {
                console.log(`Deleted cache for key: ${cacheKey}`);
                resolve();
            };

            request.onerror = () => {
                console.error('Failed to delete cache:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Clear all cached data
     * @returns {Promise<void>}
     */
    async clear() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.clear();

            request.onsuccess = () => {
                console.log('Cleared all cached data');
                resolve();
            };

            request.onerror = () => {
                console.error('Failed to clear cache:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all cache keys
     * @returns {Promise<string[]>}
     */
    async getAllKeys() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.getAllKeys();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Failed to get cache keys:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get cache statistics
     * @returns {Promise<object>}
     */
    async getStats() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                const entries = request.result;
                const now = Date.now();

                const stats = {
                    totalEntries: entries.length,
                    validEntries: 0,
                    expiredEntries: 0,
                    totalSize: 0,
                    entries: []
                };

                entries.forEach(entry => {
                    const age = now - entry.timestamp;
                    const isExpired = age >= this.cacheExpiry;

                    if (isExpired) {
                        stats.expiredEntries++;
                    } else {
                        stats.validEntries++;
                    }

                    // Estimate size (rough approximation)
                    const size = JSON.stringify(entry.data).length;
                    stats.totalSize += size;

                    stats.entries.push({
                        key: entry.cacheKey,
                        age: Math.round(age / 1000 / 3600), // hours
                        expired: isExpired,
                        size: Math.round(size / 1024) // KB
                    });
                });

                stats.totalSize = Math.round(stats.totalSize / 1024); // KB

                resolve(stats);
            };

            request.onerror = () => {
                console.error('Failed to get cache stats:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Clean up expired cache entries
     * @returns {Promise<number>} Number of entries deleted
     */
    async cleanExpired() {
        if (!this.db) {
            await this.init();
        }

        const stats = await this.getStats();
        const expiredKeys = stats.entries
            .filter(entry => entry.expired)
            .map(entry => entry.key);

        for (const key of expiredKeys) {
            await this.delete(key);
        }

        console.log(`Cleaned ${expiredKeys.length} expired cache entries`);
        return expiredKeys.length;
    }
}
