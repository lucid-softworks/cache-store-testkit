# `@lucid-softworks/cache-store-testkit`

Framework-neutral contract checks for `CacheStore` adapters. The verifier
covers initial misses, insertion, replacement, successful deletion, and
idempotent deletion.

```ts
import type { CacheRecord } from "@lucid-softworks/cache-core";
import { verifyCacheStore } from "@lucid-softworks/cache-store-testkit";

const records = new Map<string, CacheRecord<unknown>>();
await verifyCacheStore(async () => ({
  store: {
    delete: (key) => records.delete(key),
    get: (key) => records.get(key),
    set: (key, record) => {
      records.set(key, record);
    },
  },
}));
```
