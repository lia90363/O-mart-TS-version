<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '@/stores/productStore'
import { useCartStore } from '@/stores/cartStore'
import { useToastStore } from '@/stores/useToastStore'

const route = useRoute()
const productStore = useProductStore()
const cartStore = useCartStore()
const quantity = ref(1)
const toastStore = useToastStore()
const selectedVariantIndex = ref(0);

// 計算當前應該顯示的圖片與名稱
// 核心修正：加入多重備援邏輯
const currentDisplayImage = computed(() => {
  if (!item.value) return '';

  // 1. 檢查是否有規格，且該規格是否有圖
  const hasVariants = item.value.variants && item.value.variants.length > 0;
  if (hasVariants) {
    const variant = item.value.variants[selectedVariantIndex.value];
    if (variant && variant.image) return variant.image; // 優先回傳規格圖
  }

  // 2. 如果沒規格、或規格沒圖（如鞋子），回傳商品外層主圖
  return item.value.image || '';
});

const handleAddToCart = () => {
  // 修正：不要因為沒有 variants 就 return
  if (!item.value) return;

  const hasVariants = item.value.variants && item.value.variants.length > 0;
  
  // 安全讀取規格名稱
  let selectedName = '';
  if (hasVariants) {
    selectedName = item.value.variants[selectedVariantIndex.value]?.name || '';
  }

  const payload = {
    ...item.value,
    // 如果沒規格，預設給 index 0
    selectedVariantIndex: hasVariants ? selectedVariantIndex.value : 0,
    selectedVariantName: selectedName,
    image: currentDisplayImage.value 
  };

  cartStore.addToCart(payload, quantity.value);
  
  const toastMsg = selectedName 
    ? `已加入 ${quantity.value} 件 ${item.value.title} (${selectedName})`
    : `已加入 ${quantity.value} 件 ${item.value.title}`;
    
  toastStore.showToast(toastMsg);
};

// 強制轉為數字，並使用 computed 確保路由切換時 ID 會更新
const id = computed(() => Number(route.params.id))

// 修正 input 的手動輸入問題
const updateQuantity = (val) => {
  const num = parseInt(val)
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

// 從 store 找資料，若找不到回傳 null
const item = computed(() => {
    const found = productStore.products.find(p => Number(p.id) === id.value) || null
    return found
})

watch(() => route.params.id, () => {
  selectedVariantIndex.value = 0;
  quantity.value = 1; // 順便重置數量
});
</script>


<template>
    <div class="product-detail">
        <div v-if="productStore.loading">載入中...</div>
        <div v-else-if="!item">找不到商品</div>
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
                        :key="index"
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