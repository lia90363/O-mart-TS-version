<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/api/axios'; // 記得用你設定好的 apiClient

// 訂單內商品的型別
interface OrderItem {
  product_id: number;
  title: string;
  image: string;
  variant_name: string;
  price_at_time: number;
  qty: number;
}

// 訂單主體的型別
interface Order {
  order_id: number;
  total_price: number;
  status: string;
  created_at: string;
  items: OrderItem[]; // 包含多個商品
}

const authStore = useAuthStore();
const orders = ref<Order[]>([]);
const isLoading = ref(true);

const fetchOrders = async () => {
  if (!authStore.user) return;
  try {
    const response = await apiClient.get(`orders/${authStore.user.id}`);
    if (response.data.success) {
      orders.value = response.data.orders;
    }
  } catch (error) {
    console.error('抓取訂單失敗:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchOrders);

// 格式化日期的小工具
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString();
};
</script>

<template>
  <div class="member-container">
    <h2>我的訂單紀錄</h2>
    <hr class="orange-divider">

    <div v-if="isLoading" class="loading">讀取中...</div>

    <div v-else-if="orders.length === 0" class="no-orders">
      目前還沒有任何訂單紀錄喔！
    </div>

    <div v-else class="order-list">
      <div v-for="order in orders" :key="order.order_id" class="order-card">
        <div class="order-header">
          <span>訂單編號：#{{ order.order_id }}</span>
          <span>日期：{{ formatDate(order.created_at) }}</span>
          <span class="status-tag">{{ order.status }}</span>
        </div>

        <div class="order-items">
          <div v-for="item in order.items" :key="item.product_id + item.variant_name" class="item-row">
            <img :src="item.image" :alt="item.title" class="item-img">
            <div class="item-info">
              <p class="item-title">{{ item.title }}</p>
              <p class="item-variant">規格：{{ item.variant_name }}</p>
              <p class="item-price">${{ item.price_at_time }} x {{ item.qty }}</p>
            </div>
          </div>
        </div>

        <div class="order-footer">
          <strong>總計金額：${{ order.total_price.toLocaleString() }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>