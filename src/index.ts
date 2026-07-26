import {
  createCacheRecord,
  type CacheRecord,
  type CacheStore,
  type MaybePromise,
} from "@lucid-softworks/cache-core";

export type CacheStoreFixture = Readonly<{
  store: CacheStore;
  close?: () => MaybePromise<void>;
}>;

export type CacheStoreFactory = () => MaybePromise<CacheStoreFixture>;

export class CacheStoreContractError extends Error {
  override readonly name = "CacheStoreContractError";
}

export function createCacheStoreFixture(
  value: unknown = { nested: true },
): CacheRecord<unknown> {
  return createCacheRecord(value, {
    now: 1,
    staleWhileRevalidate: 20,
    tags: ["contract"],
    ttl: 10,
  });
}

export function assertCacheRecord(
  actual: CacheRecord<unknown> | undefined,
  expected: CacheRecord<unknown>,
): void {
  if (actual === undefined)
    throw new CacheStoreContractError("Expected cache record, received none");
  if (
    actual.createdAt !== expected.createdAt ||
    actual.freshUntil !== expected.freshUntil ||
    actual.staleUntil !== expected.staleUntil ||
    JSON.stringify(actual.tags) !== JSON.stringify(expected.tags) ||
    JSON.stringify(actual.value) !== JSON.stringify(expected.value)
  )
    throw new CacheStoreContractError("Cache records do not match");
}

export async function verifyCacheStore(
  factory: CacheStoreFactory,
): Promise<void> {
  const fixture = await factory();
  const key = "cache-store-contract";
  const record = createCacheStoreFixture();
  try {
    await fixture.store.delete(key);
    if ((await fixture.store.get(key)) !== undefined)
      throw new CacheStoreContractError("Expected initial cache miss");
    await fixture.store.set(key, record);
    assertCacheRecord(await fixture.store.get(key), record);
    const replacement = createCacheStoreFixture({ replaced: true });
    await fixture.store.set(key, replacement);
    assertCacheRecord(await fixture.store.get(key), replacement);
    if (!(await fixture.store.delete(key)))
      throw new CacheStoreContractError("Expected first deletion to succeed");
    if (await fixture.store.delete(key))
      throw new CacheStoreContractError("Expected second deletion to miss");
  } finally {
    await fixture.close?.();
  }
}
