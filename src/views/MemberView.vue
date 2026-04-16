<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/api/axios'; // 記得用你設定好的 apiClient

interface ShippingInfo {
  method: 'home' | 'store' | 'pickup';
  receiver: string | null;
  address: string | null;
  store: string | null;
  phone: string | null;
}

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
  shipping_info: ShippingInfo; 
  items: OrderItem[]; // 包含多個商品
}

const getMethodLabel = (method: string | undefined) => {
  const labels: Record<string, string> = {
    home: '宅配到府',
    store: '超商取貨',
    pickup: '門市自取'
  };
  return method ? labels[method] || '未知方式' : '未選擇';
};

const authStore = useAuthStore();
const orders = ref<Order[]>([]);
const isLoading = ref(true);

const fetchOrders = async () => {
  if (!authStore.user) return;
  try {
    const response = await apiClient.get(`orders/${authStore.user.id}`);
    if (response.data.success) {
      orders.value = response.data.orders;
      console.log('這是 API 回傳的整包訂單資料:', orders.value);
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

// 記錄目前展開的訂單 ID，null 代表全部收合
const expandedOrderId = ref<number | null>(null);

// 切換展開狀態
const toggleOrder = (orderId: number) => {
  if (expandedOrderId.value === orderId) {
    expandedOrderId.value = null; // 如果點的是已展開的，就收起來
  } else {
    expandedOrderId.value = orderId; // 否則展開點擊的那一筆
  }
};
</script>

<template>
    <div class="member-container">
      <h2>我的訂單紀錄</h2>
      <hr class="orange-divider">

      <div v-if="isLoading" class="loading">讀取中...</div>

      <div v-else-if="orders.length === 0" class="empty">
        <p class="empty-word">目前還沒有任何訂單紀錄喔！</p>
      </div>

      <div v-else class="order-list">
        <div v-for="order in orders" :key="order.order_id" class="order-card">
          <!-- 點擊 Header 切換展開 -->
          <div class="order-header" @click="toggleOrder(order.order_id)" :class="{ 'is-active': expandedOrderId === order.order_id }">
            <div class="header-main">
              <span class="order-num">#{{ order.order_id }}</span>
              <span class="order-date">{{ formatDate(order.created_at) }}</span>
            </div>
            <div class="header-side">
              <span class="status-tag">{{ order.status === 'paid' ? '已付款' : order.status }}</span>
              <!-- 旋轉箭頭圖示 -->
              <span class="arrow-icon" :class="{ 'rotate': expandedOrderId === order.order_id }">▼</span>
            </div>
          </div>

          <!-- 使用 Vue 的內建動畫組件，或者簡單用 v-show 控制 -->
          <div v-show="expandedOrderId === order.order_id" class="order-content">
            <div class="order-items">
              <div v-for="item in order.items" :key="item.product_id + item.variant_name" class="order-row">
                <div class="order-pic">
                    <router-link :to="`/product/${item.product_id}`">
                        <img :src="item.image" :alt="item.title" class="order-img">
                    </router-link>
                </div>
                <div class="order-info">
                    <span class="order-title">{{ item.title }}</span>
                    <span class="order-variant">規格：{{ item.variant_name }}</span>
                    <p class="order-price">${{ item.price_at_time }} x {{ item.qty }}</p>
                </div>
              </div>
            </div>

            <div class="shipping-detail-box" v-if="order.shipping_info">
                <p class="section-label">配送資訊：</p>
                <div class="detail-content">
                    <!-- 先顯示配送方式，確認 method 有抓到 -->
                    <p><strong>配送方式：</strong> {{ getMethodLabel(order.shipping_info.method) }}</p>

                    <!-- 宅配 (home) -->
                    <template v-if="order.shipping_info.method === 'home'">
                        <p><strong>收件人：</strong> {{ order.shipping_info.receiver || '未填寫' }}</p>
                        <p><strong>地址：</strong> {{ order.shipping_info.address || '未填寫' }}</p>
                    </template>
                    
                    <!-- 超商 (store) -->
                    <template v-else-if="order.shipping_info.method === 'store'">
                        <p><strong>取貨門市：</strong> {{ order.shipping_info.store || '未填寫' }}</p>
                        <p><strong>手機號碼：</strong> {{ order.shipping_info.phone || '未填寫' }}</p>
                    </template>
                    
                    <!-- 門市自取 (pickup) -->
                    <template v-else-if="order.shipping_info.method === 'pickup'">
                        <p><strong>自取地點：</strong> 新北市購物路 105 號</p>
                    </template>
                </div>
            </div>

            <div class="order-footer">
              <span>共 {{ order.items.length }} 件商品，實付金額：</span>
              <strong class="grand-total">${{ order.total_price }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>