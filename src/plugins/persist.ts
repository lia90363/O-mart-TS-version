import { type PiniaPluginContext } from 'pinia';

export function piniaPersist(context: PiniaPluginContext) {
  const { store, options } = context;
  const persistOptions = options.persist; // 檢查 Store 定義時是否有寫 persist: true

  // 如果該 Store 沒有開啟 persist 選項，則不執行後續邏輯
  if (!persistOptions) return;

  const storageKey = `pinia-${store.$id}`;
  const persistedState = localStorage.getItem(storageKey);

  // 【初始化】頁面重新整理時，從 localStorage 抓取舊資料還原到 Store
  if (persistedState) {
    try {
      // 使用 $patch 批量更新 Store 狀態
      store.$patch(JSON.parse(persistedState));
    } catch (e) {
      console.error(`Failed to parse persisted state for ${store.$id}:`, e);
    }
  }

  let timer: ReturnType<typeof setTimeout> | null = null;

  // 【監聽】當 Store 的資料發生變動時，自動存入 localStorage
  store.$subscribe((_mutation, state) => {
    // 使用防抖 (Debounce)，避免頻繁寫入 localStorage 影響效能
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      let stateToSave: Record<string, any> = state;

      // 如果有設定 paths，則只儲存指定的欄位 (例如：只存購物車列表，不存載入中狀態)
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