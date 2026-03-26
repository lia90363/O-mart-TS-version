import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useToastStore } from './useToastStore'

export const useCartStore = defineStore('cart', () => {
  const cart = ref([])
  const toast = useToastStore()

  // 加入購物車
  const addToCart = (product, qty = 1) => {
    const numQty = Math.max(1, Math.floor(Number(qty) || 1));

    const index = cart.value.findIndex((item) => 
      item.id === product.id && 
      item.selectedVariantIndex === product.selectedVariantIndex
    );

    if (index === -1) {
      cart.value.push({ 
        ...product, 
        qty: numQty
      });
    } else {
      cart.value[index].qty += numQty;
    }

    // 💡 關鍵修正：不要去讀取 product.variants，改用傳進來的 selectedVariantName
    const variantLabel = product.selectedVariantName ? ` (${product.selectedVariantName})` : '';
    toast.showToast(`成功將 ${product.title}${variantLabel} 加入購物車！`);
  }

  const removeFromCart = (productId, variantIndex) => {
    cart.value = cart.value.filter(item => 
      !(item.id === productId && item.selectedVariantIndex === variantIndex)
    )
  }

  const updateQty = (productId, variantIndex, num) => {
    const item = cart.value.find(i => 
      i.id === productId && i.selectedVariantIndex === variantIndex
    )
    if (!item) return
    
    item.qty += num
    // 如果數量歸零，呼叫帶有規格參數的刪除
    if (item.qty <= 0) removeFromCart(productId, variantIndex)
  }

  const updateQtyByInput = (productId, value, variantIndex) => {
    // 加上雙重判定：ID + 規格索引
    const item = cart.value.find(i => 
      i.id === productId && i.selectedVariantIndex === variantIndex
    )
    
    if (!item) return
    
    // 強制過濾非數字與負數
    let newQty = Math.max(1, Math.floor(Number(value) || 1))
    item.qty = newQty
  }

  const clearCart = () => {
    cart.value = []
  }

  const totalPrice = computed(() => {
    return cart.value.reduce((acc, item) => acc + (item.price * item.qty), 0)
  })

  const totalItems = computed(() => {
    return cart.value.reduce((acc, item) => acc + item.qty, 0)
  })

  return {
    cart,
    addToCart,
    clearCart,
    removeFromCart,
    updateQty,
    updateQtyByInput,
    totalPrice,
    totalItems
  };
}, {
  persist: true
});