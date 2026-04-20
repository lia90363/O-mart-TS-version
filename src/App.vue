<template>
  <nav class="navbar">
    <!-- Logo：點擊可重置搜尋狀態並回首頁 -->
    <a href="javascript:void(0)" class="nav-img" @click.prevent="handleLogoClick">
      <img src="/O-mart01.jpg" alt="Logo" />
    </a>

    <!-- 購物車按鈕：顯示當前商品總數 -->
    <RouterLink to="/cart" class="nav-button">
      購物車
      <span v-if="cartCount > 0" class="cart-badge">
        {{ cartCount }}
      </span>
    </RouterLink>
    
    <!-- 登入與會員功能區 -->
    <RouterLink v-if="!authStore.isLoggedIn" to="/login" class="nav-button">登入</RouterLink>
    <div v-else class="user-menu">
      <router-link v-if="authStore.isLoggedIn" to="/member" class="nav-button">會員中心</router-link>
      <button @click="handleLogout">登出</button>
    </div> 

    <!-- SearchBar 的傳送門目標：讓 SearchBar 組件可以 Teleport 內容到這裡 -->
    <div id="nav-search-target"></div>
  </nav>

  <!-- 全域訊息提示框 (Toast) -->
  <Transition name="toast-fade">
    <div 
      v-if="toastStore.isShow" 
      class="global-toast"
      @click="toastStore.isShow = false"
    >
      {{ toastStore.message }}
    </div>
  </Transition>

  <!-- 搜尋列組件 (包含 Teleport 到導覽列的邏輯) -->
  <SearchBar/> 

  <!-- 路由渲染視窗：負責顯示首頁、商品詳情、會員中心等不同頁面 -->
  <RouterView/>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import { useProductStore } from '@/stores/productStore'
import { useCartStore } from '@/stores/cartStore'
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/useToastStore'
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const authStore = useAuthStore()
const cartStore = useCartStore()
const toastStore = useToastStore()

// 監聽購物車商品總數，由於 Pinia 的響應式特性，當商品加入 MySQL/本地購物車時，導覽列的數字會自動跳動
const cartCount = computed(() => cartStore.totalItems)

// Logo 點擊處理
const handleLogoClick = () => {
  productStore.resetSearch() // 清空所有的搜尋關鍵字與分類

  // 如果已在首頁則平滑捲動到頂部，否則跳轉回首頁
  if (route.path === '/') {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  } else {
    router.push('/')
  }
}

// 登出邏輯
const handleLogout = () => {
  const currentRoute = router.currentRoute.value;
  
  // 清除 AuthStore 的 user 與 token (包含 localStorage)
  authStore.logout();

  toastStore.showToast('您已成功登出！');

  // 若當前頁面需要登入，登出後強制跳回首頁
  if (currentRoute.meta?.requiresAuth || currentRoute.path === '/cart') {
    router.push('/');
  }
};
</script>