/**
 * Simple in-memory mutex to prevent concurrent calls to the same n8n webhook.
 * n8n returns empty body when a webhook execution is already running.
 */
const locks = new Map<string, Promise<void>>();

export async function withWebhookLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  // Wait for any existing lock on this key
  while (locks.has(key)) {
    await locks.get(key);
  }

  let resolve!: () => void;
  const lock = new Promise<void>((r) => { resolve = r; });
  locks.set(key, lock);

  try {
    return await fn();
  } finally {
    locks.delete(key);
    resolve();
  }
}
