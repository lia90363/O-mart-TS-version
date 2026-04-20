<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProductStore } from '@/stores/productStore'
import { useDebounce } from '@/composables/useDebounce'
import { onMounted, onUnmounted } from 'vue';

const productStore = useProductStore()
const router = useRouter()
const route = useRoute()

const tempKeyword = ref('')
// 透過 composable 處理防抖，避免每打一個字就觸發 API 請求
const debounced = useDebounce(tempKeyword, 300)
// useDebounce 寫了泛型，這裡 debounced 會自動推斷為 Ref<string>

interface CategoryOption {
  value: string;
  label: string;
}

const categories: CategoryOption[] = [
  { value: 'all', label: '全部' },
  { value: '生活家居', label: '生活家居' }, 
  { value: '3C數位', label: '3C數位' },
  { value: '配件飾品', label: '配件飾品' },
  { value: '服飾鞋包', label: '服飾鞋包' },
  { value: '戶外運動', label: '戶外運動' },
]

// 監聽自定義事件：清空輸入框
const handleReset = () => {
  tempKeyword.value = ''; 
};

onMounted(() => {
  window.addEventListener('reset-search-input', handleReset);
});

onUnmounted(() => {
  window.removeEventListener('reset-search-input', handleReset);
});

// 當 debounced 變了，同步到 Store
watch(debounced, (newVal) => {
  productStore.keyword = newVal
  // 若不在首頁則自動導回首頁顯示搜尋結果
  if (newVal.trim() !== '' && route.name !== 'home') {
    router.push({ name: 'home' })
  }
})

// 雙向同步：當 Store 的關鍵字被外部修改時（例如切換頁面重置），同步回輸入框
watch(() => productStore.keyword, (newVal) => {
  tempKeyword.value = newVal;
});

// 監聽分類切換，當下拉選單改變時，同步更新網址的 query 參數
watch(() => productStore.category, (newCat) => {
  if (newCat !== route.query.category) {
    router.push({ 
      path: '/', 
      query: { 
        ...route.query, 
        category: (newCat === 'all' || !newCat) ? undefined : newCat 
      } 
    });
  }
});
</script>

<template>
  <!-- 使用 Teleport 將搜尋列傳送到導覽列(Navbar)預留的 ID 位置 -->
  <Teleport to="#nav-search-target">
    <input v-model="tempKeyword" placeholder="搜尋..." />

    <select v-model="productStore.category" class="select">
      <option v-for="item in categories" :key="item.value" :value="item.value">
        {{ item.label }} 
      </option>
    </select>
  </Teleport>
</template>