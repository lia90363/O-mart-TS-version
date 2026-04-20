import { ref } from 'vue'
import { defineStore } from 'pinia'

// 管理畫面上浮動提示框 (Toast) 的顯示內容與開關
export const useToastStore = defineStore('toast', () => {
  const message = ref('')
  const isShow = ref(false)
  
  let timer: ReturnType<typeof setTimeout> | null = null;

  function showToast(msg: string) {
    if (timer) {clearTimeout(timer)}; // 防抖/重置處理：如果正在顯示，清除舊的計時器重新計算，避免文字閃爍或提早消失
    
    // 設定訊息並開啟顯示
    message.value = msg
    isShow.value = true

    // 設定定時器：2 秒後自動隱藏通知
    timer = setTimeout(() => {
      isShow.value = false
      timer = null;
    }, 2000)
  }
  return { message, isShow, showToast }
})