<script setup>
import { ref, watch } from 'vue' // 刪掉 computed
import { useRouter, useRoute } from 'vue-router'
import { useProductStore } from '@/stores/productStore'
import { useDebounce } from '@/composables/useDebounce'
import { onMounted, onUnmounted } from 'vue';

const productStore = useProductStore()
const router = useRouter()
const route = useRoute()

const tempKeyword = ref('')
const debounced = useDebounce(tempKeyword, 300)

const categories = [
  { value: 'all', label: '全部' },
  { value: '生活家居', label: '生活家居' }, 
  { value: '3C數位', label: '3C數位' },
  { value: '配件飾品', label: '配件飾品' },
  { value: '服飾鞋包', label: '服飾鞋包' },
  { value: '戶外運動', label: '戶外運動' },
]

const handleReset = () => {
  tempKeyword.value = ''; // 這行最重要，清空輸入框
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
  
  if (newVal.trim() !== '' && route.name !== 'home') {
    router.push({ name: 'home' })
  }
})

watch(() => productStore.keyword, (newVal) => {
  tempKeyword.value = newVal; // 當 Store 被外部清空時，同步更新輸入框
});

watch(() => productStore.category, (newCat) => {
  // 檢查：只有當「下拉選單選的分類」跟「目前路由 query」不一樣時，才執行跳轉
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
  <Teleport to="#nav-search-target">
    <input v-model="tempKeyword" placeholder="搜尋..." />

    <select v-model="productStore.category" class="select">
      <option v-for="item in categories" :key="item.value" :value="item.value">
        {{ item.label }} 
      </option>
    </select>
  </Teleport>
</template>