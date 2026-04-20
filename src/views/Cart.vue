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

// 解決 HTML Input 事件型別問題，確保輸入的值能正確傳回 Store 更新 MySQL 或 LocalState
const handleQtyChange = (e: Event, id: number, variantIndex: number) => {
    // 告訴 TS 這個 e.target 是一個 HTML 輸入框以取得 .value
    const target = e.target as HTMLInputElement;
    cartStore.updateQtyByInput(id, target.value, variantIndex);
};
</script>

<template>
    <div v-if="cartStore.cart.length === 0" class="empty">
        <p  class="empty-word">購物車內還沒有商品<br/>趕快將喜歡的商品加入購物車吧!</p>
    </div>
    
    <!-- 購物車清單 -->
    <ul v-else class="cart-flex">
        <li v-for="item in cartStore.cart" :key="`${item.id}-${item.selectedVariantIndex}`" class="cart-card">
            <div class="cart-img">
                <router-link :to="`/product/${item.id}`">
                    <img :src="item.variants?.[item.selectedVariantIndex]?.image" :alt="item.title" loading="lazy">
                </router-link>
            </div>
            <div class="item-info">
                <!-- 刪除按鈕：點擊後會連動 Store 進行過濾 -->
                <button @click="cartStore.removeFromCart(item.id, item.selectedVariantIndex)" class="item-delete">×</button>
                <div class="item-title">
                    <router-link :to="`/product/${item.id}`">{{ item.title }}</router-link>
                </div>
                <div class="item-category">({{ item.category }})</div>
                
                <small v-if="item.selectedVariantName">
                    規格：{{ item.selectedVariantName }}
                </small>

                <!-- 小計計算：單價 * 該品項數量 -->
                <div class="item-subtotal">NT$ {{ (item.price * item.qty) }}</div>

                <!-- 數量增減控制區 -->
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

    <!-- 底部結帳欄 -->
    <div class="cart-footer">
        <div class="total-price">
            <span>總額：</span>
            <!-- 使用 store 中的 computed: totalPrice 確保金額即時更新 -->
            <span class="price-highlight">$ {{ cartStore.totalPrice }}</span>
            <span class="pending-shipping">不含運費</span>
        </div>
        <button 
            class="checkout-btn" 
            :disabled="cartStore.totalItems === 0"
            @click="router.push('/checkout')"
        >
            前往結帳
        </button>
    </div>
</template>