import type {IdempotencyValue} from "./types.js";

/**
 * Simple in-memory idempotency store.
 *
 * Stores responses keyed by an idempotency key with an expiration time.
 * Designed for short-lived caching of previous responses to support idempotent requests.
 */
export class Idempotency {
    /**
     * Internal map storing idempotency values by key.
     */
    private store = new Map<string, IdempotencyValue>();

    /**
     * Create a new IdempotencyStore.
     *
     * @param ttlMs Time-to-live for stored entries in milliseconds (default: 10 minutes).
     */
    constructor(private ttlMs = 10 * 60 * 1000) {}

    /**
     * Retrieve a stored idempotency value by key.
     *
     * Behavior:
     * - Returns `null` when `key` is missing/empty.
     * - Returns `null` when there is no entry for `key`.
     * - If an entry exists but is expired, deletes it and returns `null`.
     * - Otherwise returns the stored `IdempotencyValue`.
     *
     * Side effects:
     * - May remove an expired entry from the internal map.
     *
     * @param key The idempotency key to look up (optional).
     *
     * @returns The stored value or `null` when not found/expired/invalid key.
     */
    get(key?: string | null) {
        // If key is missing/empty
        if(!key) {
            console.debug(`[IDEMPOTENCY] IdempotencyStore.get called with empty key`);
            return null;
        }

        // Lookup the value
        const value = this.store.get(key);

        // If entry is missing
        if(!value) {
            console.debug(`[IDEMPOTENCY] IdempotencyStore.get miss for key=${key}`);
            return null;
        }

        // If entry is expired
        if(value.expiresAt < Date.now()) {
            console.debug(`[IDEMPOTENCY] IdempotencyStore.get expired for key=${key}`);
            this.store.delete(key);
            return null;
        }

        // Else return valid entry
        console.debug(`[IDEMPOTENCY] IdempotencyStore.get hit for key=${key} expiresAt=${value.expiresAt}`);
        return value;
    } // get()

    /**
     * Store an idempotent response value for a key.
     *
     * Behavior:
     * - No-op when `key` is missing/empty.
     * - Stores `{status, location, body, expiresAt}` under the provided key.
     *
     * Side effects:
     * - Mutates the internal map and logs the stored entry.
     *
     * @param key The idempotency key to store the value under.
     * @param status HTTP status code to remember for this key.
     * @param location Optional location header value associated with the response.
     * @param body Response body to be returned for repeated requests.
     */
    set(key: string | undefined | null, status: number, location: string, body: any): void {
        // If key is missing/empty
        if(!key) {
            console.debug(`[IDEMPOTENCY] IdempotencyStore.set called with empty key - skipping`);
            return;
        }

        // Store the value with expiration
        const expiresAt = Date.now() + this.ttlMs;
        this.store.set(key, {status, location, body, expiresAt});

        console.debug(`[IDEMPOTENCY] IdempotencyStore.set stored key=${key} status=${status} location=${location} expiresAt=${expiresAt}`);
    } // set()

    /**
     * Sweep the store and remove all expired entries.
     *
     * Behavior:
     * - Iterates over the internal map and deletes entries whose `expiresAt < now`.
     * - Logs how many entries were removed (if any).
     *
     * Side effects:
     * - Mutates the internal map by deleting expired entries.
     */
    sweep(): void {
        const now = Date.now();  // Current time for expiration comparison

        // Iterate and remove expired entries
        let removed = 0;
        for(const [key, value] of this.store) {
            if(value.expiresAt < now) {
                this.store.delete(key);
                removed++;
            }
        } // for

        // Log the number of removed entries
        if(removed > 0) {
            console.debug(`[IDEMPOTENCY] IdempotencyStore.sweep removed ${removed} expired entries`);
        }
    } // sweep()
} // IdempotencyStore
