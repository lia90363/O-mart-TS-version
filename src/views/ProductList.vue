<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'; 
import { useRoute } from 'vue-router';
import { useProductStore } from "@/stores/productStore";

const productStore = useProductStore();
const route = useRoute();

const messages = ref([
    "🎉 歡慶開幕！全館滿 $999 免運",
    "⚡️ 限時優惠：輸入折扣碼「Omart520」現折 $100"
]);

const currentIndex = ref(0);
let timer: number | null = null;

// 監聽網址參數切換分類，負責同步給 Store 並觸發 MySQL API 抓取
watch(
    () => route.query.category,
    async (newCat) => {
        const category = Array.isArray(newCat) ? newCat[0] : newCat;
        productStore.category = category || 'all'; 
        
        // 向後端 MySQL 請求最新商品資料
        await productStore.fetchProducts();
    },
    { immediate: true } // 頁面一開啟就執行一次
);

onMounted(() => {
    timer = window.setInterval(() => { // 加上 window. 確保是指向瀏覽器的 API
        currentIndex.value = (currentIndex.value + 1) % messages.value.length;
    }, 4000);
});

onUnmounted(() => {
    // 離開頁面時清除計時器，避免記憶體洩漏
    if (timer) clearInterval(timer);
});
</script>

<template>
    <div class="promo-bar">
        <div class="promo-container">
            <!-- mode="out-in" 確保舊的離開後，新的才進來 -->
            <transition name="slide-vertical" mode="out-in">
                <p :key="currentIndex" class="promo-text">
                    {{ messages[currentIndex] }}
                </p>
            </transition>
        </div>
    </div>    
    <section class="container">
        <!-- loading 顯示骨架屏，提升使用者體驗 (UX) -->
        <ul v-if="productStore.loading" class="product-grid">
            <li v-for="n in 8" :key="n" class="card skeleton">
                <div class="skeleton-img"></div>
                <div class="card-body">
                    <div class="skeleton-text title"></div>
                    <div class="skeleton-text price"></div>
                    <div class="skeleton-btn"></div>
                </div>
            </li>
        </ul>
        
        <!-- 商品列表展示 -->
        <ul v-else class="product-grid">
            <li v-for="item in productStore.filteredProducts" :key="item.id" class="card">
                <router-link :to="`/product/${item.id}`">
                    <div class="card-img-placeholder">
                        <img 
                            :src="item.variants?.[0]?.image" 
                            :alt="item.title" 
                            loading="lazy"
                        >
                    </div>
                    
                    <div class="card-info">
                        <div class="title">{{ item.title }}</div>
                        <div class="price">NT$ {{ item.price }}</div>
                    </div>
                </router-link>
            </li>
        </ul>

        <div v-if="!productStore.loading && productStore.filteredProducts.length === 0" class="empty">
            <p class="empty-word">找不到符合條件的商品喔！</p>
        </div>
    </section>
</template>