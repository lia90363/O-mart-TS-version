import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useToastStore } from './useToastStore'

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image?: string;
  variants?: {
    name: string;
    image?: string;
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

  // 加入購物車
  const addToCart = (
    product: Product, 
    qty: number | string = 1,
    variantIndex: number = 0, 
    variantName?: string
  ) => {
    const numQty = Math.max(1, Math.floor(Number(qty) || 1));

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

    const variantLabel = variantName ? ` (${variantName})` : '';
    toast.showToast(`成功將 ${product.title}${variantLabel} 加入購物車！`);
  }

  const removeFromCart = (productId: number, variantIndex: number) => {
    cart.value = cart.value.filter(item => 
      !(item.id === productId && item.selectedVariantIndex === variantIndex)
    )
  }

  const updateQty = (productId: number, variantIndex: number, num: number) => {
    const item = cart.value.find(i => 
      i.id === productId && i.selectedVariantIndex === variantIndex
    )
    if (!item) return
    
    item.qty += num
    // 如果數量歸零，呼叫帶有規格參數的刪除
    if (item.qty <= 0) removeFromCart(productId, variantIndex)
  }

  const updateQtyByInput = (productId: number, value: string | number, variantIndex: number) => {
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