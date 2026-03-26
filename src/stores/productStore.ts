import { ref, computed } from 'vue'
import { defineStore } from "pinia";
import { getProducts } from "@/api/product";

export const useProductStore = defineStore("product", () => {
  const products = ref([]);
  const loading = ref(false);
  const keyword = ref('');
  const category = ref('all');

  const filteredProducts = computed(() => {
    // 預先處理搜尋字串，避免每次迴圈都重複處理
    const searchStr = keyword.value.trim().toLowerCase();
    const currentCat = category.value;

    return products.value.filter(item => {
      // 類別比對：如果是 'all' 就放行，否則精確比對
      const matchesCategory = currentCat === 'all' || item.category === currentCat;
      
      // 關鍵字比對：支援多斷字搜尋，且增加選取器安全性
      const matchesKeyword = searchStr === '' || 
        searchStr.split(/\s+/).every(word => 
          item.title?.toLowerCase().includes(word) || 
          item.category?.toLowerCase().includes(word)
        );
      
      return matchesKeyword && matchesCategory;
    });
  });

  async function fetchProducts() {
    // 如果已經有資料，就不重複抓取
    if (products.value.length > 0) return;

    loading.value = true;
    try {
      const res = await getProducts();
      console.log("API 吐出來的原始資料:", res.data);
      products.value = res.data || [];
    } catch (error) {
      console.error("取得商品失敗", error);
    } finally {
      loading.value = false;
    }
  }

  function resetSearch() {
    keyword.value = '';
    category.value = 'all';
  }

  return { 
    products, 
    loading, 
    keyword, 
    category, 
    filteredProducts, 
    resetSearch,
    fetchProducts 
  };
}, {
  persist: {
    paths: ['keyword', 'category'] // 👈 只存這兩個欄位，products 重整後會變回空陣列並重新觸發 fetch
  }
});