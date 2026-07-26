import { type CacheRecord, type CacheStore } from "@lucid-softworks/cache-core";
import { describe, expect, it } from "vitest";

import {
  assertCacheRecord,
  CacheStoreContractError,
  createCacheStoreFixture,
  verifyCacheStore,
} from "../src/index.js";

class TestStore implements CacheStore {
  readonly values = new Map<string, CacheRecord<unknown>>();

  get(key: string): CacheRecord<unknown> | undefined {
    return this.values.get(key);
  }

  set(key: string, record: CacheRecord<unknown>): void {
    this.values.set(key, record);
  }

  delete(key: string): boolean {
    return this.values.delete(key);
  }
}

describe("cache store testkit", () => {
  it("verifies conforming stores and closes fixtures", async () => {
    let closed = false;
    await expect(
      verifyCacheStore(() => ({
        close: () => {
          closed = true;
        },
        store: new TestStore(),
      })),
    ).resolves.toBeUndefined();
    expect(closed).toBe(true);
  });

  it("reports absent and mismatched records", () => {
    const expected = createCacheStoreFixture();
    expect(() => assertCacheRecord(undefined, expected)).toThrow(
      CacheStoreContractError,
    );
    for (const actual of [
      { ...expected, createdAt: 2 },
      { ...expected, freshUntil: 2 },
      { ...expected, staleUntil: 2 },
      { ...expected, tags: [] },
      { ...expected, value: "wrong" },
    ])
      expect(() => assertCacheRecord(actual, expected)).toThrow(
        CacheStoreContractError,
      );
  });

  it("closes fixtures when verification fails", async () => {
    let closed = false;
    const store = new TestStore();
    store.get = () => createCacheStoreFixture("unexpected");
    await expect(
      verifyCacheStore(() => ({
        close: () => {
          closed = true;
        },
        store,
      })),
    ).rejects.toThrow(CacheStoreContractError);
    expect(closed).toBe(true);
  });

  it("reports incorrect first and repeated deletion results", async () => {
    const first = new TestStore();
    let firstCalls = 0;
    first.delete = () => {
      firstCalls += 1;
      return firstCalls !== 2;
    };
    await expect(verifyCacheStore(() => ({ store: first }))).rejects.toThrow(
      "first deletion",
    );

    const repeated = new TestStore();
    let repeatedCalls = 0;
    repeated.delete = () => {
      repeatedCalls += 1;
      return repeatedCalls > 1;
    };
    await expect(verifyCacheStore(() => ({ store: repeated }))).rejects.toThrow(
      "second deletion",
    );
  });
});
