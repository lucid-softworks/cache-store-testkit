# `@lucid-softworks/cache-store-testkit`

Framework-neutral contract checks for `CacheStore` adapters. The verifier
covers initial misses, insertion, replacement, successful deletion, and
idempotent deletion.

```ts
await verifyCacheStore(async () => ({
  store: await createStore(),
  close: () => connection.close(),
}));
```
