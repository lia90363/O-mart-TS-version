import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useToastStore = defineStore('toast', () => {
  const message = ref('')
  const isShow = ref(false)
  let timer = null; // 增加這行記錄計時器

  function showToast(msg) {
    if (timer) clearTimeout(timer); // 如果正在顯示，清除舊的計時器重新計算
    
    message.value = msg
    isShow.value = true

    timer = setTimeout(() => {
      isShow.value = false
      timer = null;
    }, 2000)
  }
  return { message, isShow, showToast }
})