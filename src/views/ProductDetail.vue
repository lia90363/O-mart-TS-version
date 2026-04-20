<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '@/stores/productStore'
import { useCartStore, type Product } from '@/stores/cartStore'
import { useToastStore } from '@/stores/useToastStore'

const route = useRoute()
const productStore = useProductStore()
const cartStore = useCartStore()
const toastStore = useToastStore()

const quantity = ref(1)
const selectedVariantIndex = ref(0); // 記錄使用者目前選中的規格索引

// 取得商品資料，從 Store 中找出對應 ID 的商品
const item = computed<Product | null>(() => {
    return productStore.products.find(p => Number(p.id) === id.value) || null
})

// 計算當前應該顯示的圖片與名稱
const currentDisplayImage = computed(() => {
  if (!item.value) return '';
  return item.value.variants[selectedVariantIndex.value]?.image || '';
});

// 加入購物車
const handleAddToCart = () => {
  if (!item.value) return;

  const variants = item.value.variants;
  const selectedVariant = variants[selectedVariantIndex.value];
  const selectedName = selectedVariant?.name || '';

  // 呼叫 CartStore 進行本地與 MySQL 同步
  cartStore.addToCart(
    item.value, 
    quantity.value, 
    selectedVariantIndex.value, // 傳遞選中的索引
    selectedName                // 傳遞選中的規格名稱
  );
  
  // 顯示提示訊息
  const toastMsg = `已加入 ${quantity.value} 件 ${item.value.title} (${selectedName})`;
  toastStore.showToast(toastMsg);
};

// 將路由參數 ID 轉為數字
const id = computed(() => Number(route.params.id))

// 數量防呆，確保手動輸入時不會出現負數或非數字
const updateQuantity = (val: string | number) => {
  const num =  typeof val === 'string' ? parseInt(val) : val;
  if (isNaN(num) || num < 1) {
    quantity.value = 1
  } else {
    quantity.value = num
  }
}

// 只有在 store 沒資料時才去抓 API
onMounted(async () => {
  if (productStore.products.length === 0) {
    await productStore.fetchProducts()
  }
})

// 路由切換監聽
watch(() => route.params.id, () => {
  selectedVariantIndex.value = 0;
  quantity.value = 1; // 順便重置數量
});
</script>


<template>
    <div class="product-detail">
        <div v-if="productStore.loading" class="empty">載入中...</div>
        <div v-else-if="!item" class="empty">找不到商品</div>
        
        <div v-else class="detail-container">
            <!-- 左側：圖片區 -->
            <div class="detail-image">
                <img 
                    v-if="currentDisplayImage" 
                    :src="currentDisplayImage" 
                    :alt="item.title"
                >
            </div>

            <!-- 右側：內容區 -->
            <div class="detail-info">
                <div class="breadcrumb">
                    <RouterLink to="/">首頁</RouterLink> / 
                    <RouterLink :to="{ path: '/', query: { category: item.category } }">
                        {{ item.category }}
                    </RouterLink>
                </div>

                <h1 class="title">{{ item.title }}</h1>

                <div class="variant-options" v-if="item.variants && item.variants.length > 1">
                    <button 
                        v-for="(v, index) in item.variants" 
                        :key="v.id"
                        :class="['variant-btn', { active: selectedVariantIndex === index }]"
                        @click="selectedVariantIndex = index"
                    >
                        {{ v.name }}
                    </button>
                </div>           
                
                <div class="price-tag">
                    <span class="label">售價</span>
                    <span class="amount">${{ item.price }}</span>
                </div>

                <div class="description">
                    <h3>商品描述</h3>
                    <p>{{ item.description }}</p>
                </div>

                <div class="purchase-section">
                    <div class="qty-selector">
                        <button @click="quantity > 1 ? quantity-- : null" class="qty-btn">-</button>
                        <input 
                            type="number" 
                            v-model.number="quantity" 
                            @blur="updateQuantity(quantity)" 
                            min="1" 
                            class="qty-input"
                        >
                        <button @click="quantity++" class="qty-btn">+</button>
                    </div>
                    
                    <button @click="handleAddToCart" class="add-to-cart-btn">
                        加入購物車
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>