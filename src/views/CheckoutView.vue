<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/stores/useToastStore';
import apiClient from '@/api/axios';

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();
const toast = useToastStore();
const FREE_SHIPPING_THRESHOLD = 999;
const couponCode = ref('');
const discount = ref(0);

const handleConfirmCheckout = async () => {
  if (!authStore.user) return;
  
  try {
    const response = await apiClient.post('checkout', {
    userId: authStore.user.id,
    totalPrice: finalTotal.value,
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

const amountToFreeShipping = computed(() => {
  const diff = FREE_SHIPPING_THRESHOLD - cartStore.totalPrice;
  return diff > 0 ? diff : 0;
});

const isFreeShipping = computed(() => cartStore.totalPrice >= FREE_SHIPPING_THRESHOLD);

const applyCoupon = () => {
  if (couponCode.value === 'HELLO') {
    discount.value = 100;
    alert('成功套用折扣碼！');
  } else {
    alert('無效的折扣碼');
    discount.value = 0;
  }
};

const finalTotal = computed(() => {
  const shippingFee = isFreeShipping.value ? 0 : 60; // 運費 60
  return cartStore.totalPrice + shippingFee - discount.value;
});
</script>

<template>
  <div class="checkout-container">
    <h2>訂單確認</h2>
    <hr class="orange-divider">
    <!-- 1. 免運進度提示 -->
    <div class="shipping-info" :class="{ 'is-free': isFreeShipping }">
      <p v-if="!isFreeShipping">
        🚚 全館<strong>$999</strong>免運，再買 <strong>${{ amountToFreeShipping }}</strong> 即可享免運
      </p>
      <p v-else>🎉 已達成免運門檻！</p>
      <!-- 進度條 -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: Math.min((cartStore.totalPrice / 999) * 100, 100) + '%' }"></div>
      </div>
    </div>

    <!-- 2. 商品清單 (維持你原有的) -->
    <div class="checkout-list">
      <div v-for="item in cartStore.cart" :key="item.id + item.selectedVariantIndex" class="checkout-item">
        <div class="checkout-img">
          <img :src="item.variants?.[item.selectedVariantIndex || 0]?.image || item.image"  :alt="item.title" loading="lazy">
        </div>
        <div class="checkout-info">
          <span class="checkout-title">{{ item.title }}</span>
          <span class="checkout-variant">{{ item.selectedVariantName }}</span>
          <span class="checkout-price">${{ item.price }}</span>
          <span class="checkout-qty">x{{ item.qty }}</span>
        </div>
      </div>
    </div>
    <hr>

    <!-- 3. 折扣碼輸入區 -->
    <div class="coupon-section">
      <!-- 左側：輸入框區域 -->
      <div class="coupon-input-group">
        <input v-model="couponCode" placeholder="輸入折扣碼" />
        <button @click="applyCoupon" class="apply-btn">套用</button>
      </div>

      <!-- 右側：金額明細區域 -->
      <div class="price-details">
        <div class="price-row">
          <span>商品小計：</span>
          <span class="amount">${{ cartStore.totalPrice }}</span>
        </div>
        <div class="price-row">
          <span>運費：</span>
          <span class="amount">{{ isFreeShipping ? '免運' : '$60' }}</span>
        </div>
        <div class="price-row discount" v-if="discount > 0">
          <span>折扣碼折抵：</span>
          <span class="amount">-${{ discount }}</span>
        </div>
      </div>
    </div>

    <!-- 4. 金額明細明細 -->
    <div class="checkout-footer">
      <div class="checkout-total">
        <span>總額：</span>
        <span class="price-highlight">${{ finalTotal }}</span>
      </div>
      <button class="confirm-btn" @click="handleConfirmCheckout">確認購買</button>
    </div>
  </div>
</template>