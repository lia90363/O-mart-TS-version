<script setup lang="ts">
import { computed, ref, reactive } from 'vue';
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

const amountToFreeShipping = computed(() => {
  const diff = FREE_SHIPPING_THRESHOLD - cartStore.totalPrice;
  return diff > 0 ? diff : 0;
});

const isFreeShipping = computed(() => cartStore.totalPrice >= FREE_SHIPPING_THRESHOLD);

const applyCoupon = () => {
  if (couponCode.value === 'Omart520') {
    discount.value = 100;
    toast.showToast('成功套用折扣碼！');
  } else {
    toast.showToast('無效的折扣碼');
    discount.value = 0;
  }
};

const selectedMethodId = ref('home'); 

const shippingMethods = [
  { id: 'home', label: '宅配到府', shippingFee: 100 },
  { id: 'store', label: '超商取貨', shippingFee: 60 },
  { id: 'pickup', label: '門市自取', shippingFee: 0 }
];

const currentShippingFee = computed(() => {
  if (isFreeShipping.value) return 0;
  
  const method = shippingMethods.find(m => m.id === selectedMethodId.value);
  return method ? method.shippingFee : 0;
});

const shippingData = reactive({
  address: '',
  receiver: '',
  storeName: '',
  phone: '',
  pickupDate: '',
  pickupTime: ''
});

const handleConfirmCheckout = async () => {
  if (!authStore.user) return;

  if (selectedMethodId.value === 'home' && !shippingData.address) {
    return toast.showToast('請填寫配送地址');
  }  
  
  try {
    const response = await apiClient.post('checkout', {
      userId: authStore.user.id,
      totalPrice: finalTotal.value,
      items: cartStore.cart,
      shippingMethod: selectedMethodId.value,
      shippingDetail: shippingData 
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

const finalTotal = computed(() => {
  return cartStore.totalPrice + currentShippingFee.value - discount.value;
});
</script>

<template>
  <div class="checkout-container">
    <h2>訂單確認</h2>
    <hr class="orange-divider">
    <!-- 免運進度提示 -->
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

    <!-- 商品清單 -->
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

    <hr class="full-divider">
    
    <!-- 運送方式選擇 -->
    <div class="shipping-options">
      <label class="section-title">選擇運送方式</label>
      <div class="radio-group">
        <label v-for="method in shippingMethods" :key="method.id" class="radio-label">
          <input 
            type="radio" 
            :value="method.id" 
            v-model="selectedMethodId"
          >
          {{ method.label }} ${{ method.shippingFee }}
        </label>
      </div>
    </div>

    <!-- 詳細資料填寫區 -->
    <div class="shipping-details-form" v-if="selectedMethodId">
      <!-- 宅配：填寫地址 -->
      <div v-if="selectedMethodId === 'home'" class="form-group">
        <label>收件人姓名</label>
        <input type="text" v-model="shippingData.receiver" placeholder="請輸入姓名">
        <label>配送地址</label>
        <input type="text" v-model="shippingData.address" placeholder="請輸入完整地址">
      </div>

      <!-- 超商：填寫店名/門市 -->
      <div v-else-if="selectedMethodId === 'store'" class="form-group">
        <label>選擇超商門市</label>
        <input type="text" v-model="shippingData.storeName" placeholder="請輸入超商門市名稱或店號">
        <label>取貨人手機</label>
        <input type="tel" v-model="shippingData.phone" placeholder="請輸入手機號碼">
      </div>

      <!-- 門市自取：填寫取貨時間 -->
      <div v-else-if="selectedMethodId === 'pickup'" class="form-group">
        <p class="pickup-note">📍 門市地址：新北市購物路 105 號</p>
        <label>預計到店取貨時間</label>
        <input type="date" v-model="shippingData.pickupDate">
      </div>
    </div>

    <hr class="full-divider">

    <!-- 折扣碼輸入區 -->
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
          <span class="amount">{{ currentShippingFee === 0 ? '免運' : '$' + currentShippingFee }}</span>
        </div>
        <div class="price-row discount" v-if="discount > 0">
          <span>折扣碼折抵：</span>
          <span class="amount">-${{ discount }}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="checkout-footer">
      <div class="checkout-total">
        <span>總額：</span>
        <span class="price-highlight">$ {{ finalTotal }}</span>
      </div>
      <button class="confirm-btn" @click="handleConfirmCheckout">確認購買</button>
    </div>
  </div>
</template>