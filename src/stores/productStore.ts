import { ref, computed } from 'vue'
import { defineStore } from "pinia";
import { getProducts } from "@/api/product";
import type { Product } from "@/stores/cartStore"; 

export const useProductStore = defineStore("product", () => {
  const products = ref<Product[]>([]);
  const loading = ref(false);
  const keyword = ref('');
  const category = ref('all');
  const error = ref<string | null>(null);

  // 前端即時篩選，邏輯：當關鍵字或分類改變時，自動計算出符合條件的商品
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

  // 取得商品列表，透過 getProducts API 去串接 MySQL 後端
  async function fetchProducts() {
    // 如果已經有資料，就不重複抓取
    if (products.value.length > 0) return;

    loading.value = true;
    error.value = null; // error reset

    try {
      const res = await getProducts();
      // 這裡 res.data 就是從 MySQL 查詢出來的結果
      products.value = res.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = '未知錯誤';
      }
    } finally {
      loading.value = false;
    }
  }

  // 重置搜尋狀態
  function resetSearch() {
    keyword.value = '';
    category.value = 'all';
  }

  return { 
    products, 
    loading, 
    keyword, 
    category, 
    error,
    filteredProducts, 
    resetSearch,
    fetchProducts 
  };
}, {
  persist: {
    paths: ['keyword', 'category'] // 只保存搜尋條件，商品列表不保存，確保每次重整頁面都能抓到最新的 MySQL 資料
  }
});