import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useToastStore } from './useToastStore'
import { useAuthStore } from './authStore'
import apiClient from '@/api/axios'

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  variants: {
    name: string;
    image: string;
    id: number;
  }[];
}

export interface CartItem extends Product {
  qty: number;
  selectedVariantIndex: number;
  selectedVariantName?: string;
}

export const useCartStore = defineStore('cart', () => {
  const cart = ref<CartItem[]>([])
  const toast = useToastStore()

  // --- 原有功能區 ---

  // 加入購物車，先更新本地 State (UI 立即反應)，若已登入則同步發送 API 給後端 MySQL
  const addToCart = async (
    product: Product, 
    qty: number | string = 1,
    variantIndex: number = 0, 
    variantName?: string,
  ) => {
    const numQty = Math.max(1, Math.floor(Number(qty) || 1));
    const authStore = useAuthStore();

    // 檢查購物車內是否已有「同商品且同規格」的項目
    const index = cart.value.findIndex((item) => 
      item.id === product.id && 
      item.selectedVariantIndex === variantIndex
    );

    if (index === -1) {
      const newItem: CartItem = {
        ...product,
        qty: numQty,
        selectedVariantIndex: variantIndex,
        selectedVariantName: variantName
      };
      cart.value.push(newItem);
    } else {
      const item = cart.value[index];
      if (item) item.qty += numQty;
    }

    // 若使用者已登入，立即同步到資料庫
    if (authStore.user) {
      try {
        // 呼叫後端的合併購物車 API 或新增 API
        await apiClient.post('cart/merge', {
          userId: authStore.user.id,
          localItems: [{
            id: product.id,
            qty: numQty,
            selectedVariantIndex: product.variants?.[variantIndex]?.id || null
          }]
        });
      } catch (error) {
        console.error('後端同步失敗:', error);
      }
    }

    const variantLabel = variantName ? ` (${variantName})` : '';
    toast.showToast(`成功將 ${product.title}${variantLabel} 加入購物車！`);
  }

  // 刪除品項
  const removeFromCart = (productId: number, variantIndex: number) => {
    // 強制檢查：如果不是陣列就先校正為空陣列，防止 filter 崩潰
    if (!Array.isArray(cart.value)) {
      cart.value = [];
      return;
    }
    
    cart.value = cart.value.filter(item => 
      !(item.id === productId && item.selectedVariantIndex === variantIndex)
    );
  };

  // 更新數量(透過+-)
  const updateQty = (productId: number, variantIndex: number, num: number) => {
    const item = cart.value.find(i => 
      i.id === productId && i.selectedVariantIndex === variantIndex
    )
    if (!item) return
    
    item.qty += num
    if (item.qty <= 0) removeFromCart(productId, variantIndex)
  }

  // 更新數量(透過輸入欄)
  const updateQtyByInput = (productId: number, value: string | number, variantIndex: number) => {
    const item = cart.value.find(i => 
      i.id === productId && i.selectedVariantIndex === variantIndex
    )
    if (!item) return
    let newQty = Math.max(1, Math.floor(Number(value) || 1))
    item.qty = newQty
  }

  const clearCart = () => {
    cart.value = []
  }


  // 將本地購物車合併到後端 (通常在登入成功後執行)
  const syncCartToServer = async (userId: number) => {
    if (cart.value.length === 0) return; // 如果本地沒東西就不跑 API

    try {
      const response = await apiClient.post(`cart/merge`, {
        userId,
        localItems: cart.value // 傳送目前的 cart 陣列
      });
      
      if (response.data) {
        // 同步完後，立刻從伺服器抓取最新的完整清單（包含原本就在雲端的商品）
        await fetchCartFromServer(userId);
      }
    } catch (error) {
      console.error('同步購物車至伺服器失敗:', error);
    }
  }

  // 從後端抓取該用戶的最新購物車清單
  const fetchCartFromServer = async (userId: number) => {
    try {
      const response = await apiClient.get(`cart/${userId}`);
      
      if (response.data && response.data.success && Array.isArray(response.data.items)) {
        cart.value = response.data.items;
      } else {
        // 如果格式不對，至少不要讓 cart 變成 undefined
        console.warn('API 回傳資料不符合預期');
      }
    } catch (error) {
      console.error('抓取購物車失敗:', error);
      // 這裡可以選擇不動作，保留本地現有的內容，或是提示使用者
    }
  };

  // 計算屬性
  const totalPrice = computed(() => {
    // 如果 cart.value 不是陣列，直接回傳 0，不執行 reduce
    if (!Array.isArray(cart.value)) return 0;
    return cart.value.reduce((acc, item) => acc + (item.price * item.qty), 0);
  });

  const totalItems = computed(() => {
    if (!Array.isArray(cart.value)) return 0;
    return cart.value.reduce((acc, item) => acc + item.qty, 0);
  });

  return {
    cart,
    addToCart,
    clearCart,
    removeFromCart,
    updateQty,
    updateQtyByInput,
    syncCartToServer,
    fetchCartFromServer,
    totalPrice,
    totalItems
  };
}, {
  persist: true // 即使是登入狀態，本地也存一份複本，加速首屏渲染
});