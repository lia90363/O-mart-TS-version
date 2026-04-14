<script setup lang="ts">
import { onMounted, watch } from 'vue'; 
import { useRoute } from 'vue-router';
import { useProductStore } from "@/stores/productStore";
import { useCartStore } from '@/stores/cartStore'

const productStore = useProductStore();
const cartStore = useCartStore()
const route = useRoute();

watch(
  () => route.query.category,
  async (newCat) => {
    const category = Array.isArray(newCat) ? newCat[0] : newCat;
    productStore.category = category || 'all'; 
    
    await productStore.fetchProducts();
  },
  { immediate: true }
);

onMounted(() => {}); 
</script>

<template>
    <section class="container">
        <!-- loading 時產生假項目，看起來像資料快出來了 -->
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
        
        <ul v-else class="product-grid">
            <li v-for="item in productStore.filteredProducts" :key="item.id" class="card">
                <router-link :to="`/product/${item.id}`">
                    <div class="card-img-placeholder">
                        <img 
                            :src="item.variants?.[0]?.image || item.image" 
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