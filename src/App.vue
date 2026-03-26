<template>
  <nav class="navbar">
    <a href="javascript:void(0)" class="nav-img" @click.prevent="handleLogoClick">
      <img src="/O-mart01.jpg" alt="Logo" />
    </a>
    <RouterLink to="/cart" class="nav-button">
      購物車
      <span v-if="cartCount > 0" class="cart-badge">
        {{ cartCount }}
      </span>
    </RouterLink>
    <RouterLink v-if="!authStore.isLoggedIn" to="/login" class="nav-button">登入</RouterLink>
    <div v-else class="user-menu">
      <span class="user-name">{{ authStore.user?.name }}</span>
      <button @click="handleLogout">登出</button>
    </div> 
    <div id="nav-search-target"></div>
  </nav>

  <Transition name="toast-fade">
    <div 
      v-if="toastStore.isShow" 
      class="global-toast"
      @click="toastStore.isShow = false"
    >
      {{ toastStore.message }}
    </div>
  </Transition>

  <SearchBar/> 
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
const authStore = useAuthStore();
const router = useRouter();

const productStore = useProductStore();

const handleLogoClick = () => {
  productStore.resetSearch()

  if (route.path === '/') {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  } else {
    router.push('/')
  }
}

const handleLogout = () => {
  const currentRoute = router.currentRoute.value;
  
  authStore.logout();

  if (toastStore) {
    toastStore.showToast('您已成功登出！');
  }

  if (currentRoute.meta?.requiresAuth || currentRoute.path === '/cart') {
    router.push('/');
  }
};

const cartStore = useCartStore()

const cartCount = computed(() => cartStore.totalItems)

const toastStore = useToastStore()
</script>