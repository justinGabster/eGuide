const globalAny: any = global;

if (!globalAny.scanStore) {
  globalAny.scanStore = {};
}

export const scanStore = globalAny.scanStore;
