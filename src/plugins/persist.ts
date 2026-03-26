export function piniaPersist(context) {
    const { store, options } = context;
    // 取得 Store 定義時傳入的 persist 設定
    const persistOptions = options.persist;

    // 如果沒有設定 persist: true 或 persist 物件，就不執行持久化
    if (!persistOptions) return;

    const storageKey = `pinia-${store.$id}`;
    const persistedState = localStorage.getItem(storageKey);

    if (persistedState) {
        store.$patch(JSON.parse(persistedState));
    }

    let timer = null;
    store.$subscribe((mutation, state) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            let stateToSave = state;

            // 💡 關鍵：如果 persist 有設定 paths，就只存指定的 key
            if (persistOptions.paths) {
                stateToSave = persistOptions.paths.reduce((acc, key) => {
                    acc[key] = state[key];
                    return acc;
                }, {});
            }

            localStorage.setItem(storageKey, JSON.stringify(stateToSave));
        }, 300);
    });
}