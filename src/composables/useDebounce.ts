import { ref, watch, onUnmounted, type Ref } from 'vue'

// debounce composable  輸入中…（不請求） 停下來 → 才更新
export function useDebounce<T>(sourceRef: Ref<T>, delay: number = 300): Ref<T> {
  const debounced = ref(sourceRef.value) as Ref<T> // debounced 的型別會自動跟隨 T
  let timer: ReturnType<typeof setTimeout> | null = null

  watch(() => sourceRef.value, (newVal) => {
    if (timer) clearTimeout(timer)
    
    timer = setTimeout(() => {
      debounced.value = newVal
    }, delay)
  }, { immediate: true })

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })
  return debounced
}