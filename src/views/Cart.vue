<script setup lang="ts">
import { useCartStore } from '@/stores/cartStore'
import { useToastStore } from '@/stores/useToastStore';
import { useRouter } from 'vue-router'

const router = useRouter()
const cartStore = useCartStore()
const toast = useToastStore();

const checkOut = () => {
    if (cartStore.cart.length === 0) return;
    toast.showToast('訂單已送出，感謝您的購買！');
    cartStore.clearCart();  // 結帳完通常會清空購物車
    setTimeout(() => {
        router.push('/');
    }, 1000);
};

// 在 Script 定義處理函式，解決 e.target.value 的型別問題
const handleQtyChange = (e: Event, id: number, variantIndex: number) => {
    // 告訴 TS 這個 e.target 是一個 HTML 輸入框
    const target = e.target as HTMLInputElement;
    cartStore.updateQtyByInput(id, target.value, variantIndex);
};
</script>

<template>
    <div v-if="cartStore.cart.length === 0" class="empty">
        <p  class="empty-word">購物車內還沒有商品<br/>趕快將喜歡的商品加入購物車吧!</p>
    </div>
    <ul v-else class="cart-flex">
        <li v-for="item in cartStore.cart" :key="`${item.id}-${item.selectedVariantIndex}`" class="cart-card">
            <div class="cart-img">
                <router-link :to="`/product/${item.id}`">
                    <img :src="item.variants?.[item.selectedVariantIndex || 0]?.image || item.image"  :alt="item.title" loading="lazy">
                </router-link>
            </div>
            <div class="item-info">
                <button @click="cartStore.removeFromCart(item.id, item.selectedVariantIndex)" class="item-delete">×</button>
                <div class="item-title">
                    <router-link :to="`/product/${item.id}`">{{ item.title }}</router-link>
                </div>
                <div class="item-category">({{ item.category }})</div>
                
                <small v-if="item.selectedVariantName">
                    規格：{{ item.selectedVariantName }}
                </small>

                <div class="item-subtotal">NT$ {{ (item.price * item.qty).toLocaleString() }}</div>

                <div class="item-qty">
                    <button @click="cartStore.updateQty(item.id, item.selectedVariantIndex, -1)" class="qty-btn">-</button>
                    <input 
                        type="number" 
                        class="qty-input"
                        :value="item.qty" 
                        @change="(e) => handleQtyChange(e, item.id, item.selectedVariantIndex)"
                        min="1"
                    />
                    <button @click="cartStore.updateQty(item.id, item.selectedVariantIndex, 1)" class="qty-btn">+</button>
                </div>
            </div>
        </li>
    </ul>

    <div class="cart-footer">
        <h3 class="total-price">總計金額：NT$ {{ cartStore.totalPrice.toLocaleString() }}</h3>
        <button 
            class="checkout-btn" 
            :disabled="cartStore.totalItems === 0"
            @click="router.push('/checkout')"
        >
            前往結帳
        </button>
    </div>
</template>