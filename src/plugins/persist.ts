import { type PiniaPluginContext } from 'pinia';

export function piniaPersist(context: PiniaPluginContext) {
  const { store, options } = context;
  const persistOptions = options.persist;

  if (!persistOptions) return;

  const storageKey = `pinia-${store.$id}`;
  const persistedState = localStorage.getItem(storageKey);

  if (persistedState) {
    try {
      // 使用 $patch 前先解析，並確保它是個物件
      store.$patch(JSON.parse(persistedState));
    } catch (e) {
      console.error(`Failed to parse persisted state for ${store.$id}:`, e);
    }
  }

  let timer: ReturnType<typeof setTimeout> | null = null;

  store.$subscribe((_mutation, state) => {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      let stateToSave: Record<string, any> = state;

      // 💡 判斷 persist 是否為物件且包含 paths
      if (typeof persistOptions === 'object' && persistOptions.paths) {
        stateToSave = persistOptions.paths.reduce((acc, key) => {
          acc[key] = (state as any)[key];
          return acc;
        }, {} as Record<string, any>);
      }

      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }, 300);
  });
}