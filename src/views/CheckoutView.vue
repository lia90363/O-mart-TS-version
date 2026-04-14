<script setup lang="ts">
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/stores/useToastStore';
import apiClient from '@/api/axios';

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();
const toast = useToastStore();

const handleConfirmCheckout = async () => {
  if (!authStore.user) return;
  
  try {
    const response = await apiClient.post('checkout', {
    userId: authStore.user.id,
    totalPrice: cartStore.totalPrice,
    items: cartStore.cart
    });

    if (response.data.success) {
      toast.showToast('訂單已成立！感謝您的購買');
      cartStore.clearCart(); // 清空本地購物車
      router.push('/member'); // 跳轉到會員中心看訂單
    }
  } catch (error) {
    toast.showToast('結帳失敗，請稍後再試');
  }
};
</script>

<template>
  <div class="checkout-container">
    <h2>訂單確認</h2>
    <div v-for="item in cartStore.cart" :key="item.id + item.selectedVariantIndex" class="checkout-item">
      <span>{{ item.title }} ({{ item.selectedVariantName }})</span>
      <span>${{ item.price }} x {{ item.qty }}</span>
    </div>
    <hr>
    <div class="total">總金額：${{ cartStore.totalPrice }}</div>
    <button @click="handleConfirmCheckout">確認扣款並下單</button>
    <button @click="router.back()">返回購物車</button>
  </div>
</template>