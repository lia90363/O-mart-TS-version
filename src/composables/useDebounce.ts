import { ref, watch, onUnmounted, type Ref } from 'vue'

// debounce composable 防抖 輸入中…（不請求） 停下來 → 才更新
export function useDebounce<T>(sourceRef: Ref<T>, delay: number = 300): Ref<T> {
  // 建立一個新的 Ref 來存儲防抖後的值，並使用泛型 T 確保型別正確
  const debounced = ref(sourceRef.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | null = null

  // 監聽原始值的變化
  watch(() => sourceRef.value, (newVal) => {
    // 如果在 delay 時間內再次輸入，就清除前一個計時器
    if (timer) clearTimeout(timer)
    
    // 重新計時
    timer = setTimeout(() => {
      debounced.value = newVal
    }, delay)
  }, { immediate: true }) // 確保初始值能立即同步

  // 組件卸載時清除計時器，防止記憶體洩漏或在組件銷毀後執行錯誤的邏輯
  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })
  return debounced
}