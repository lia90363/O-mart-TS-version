import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/useToastStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/ProductList.vue')
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/Cart.vue')
    },
    { 
      path: '/product/:id', 
      name: 'ProductDetail',
      component: () => import('../views/ProductDetail.vue')
    },
    { 
      path: '/login', 
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('../views/CheckoutView.vue'),
      meta: { requiresAuth: true } // 標記需要登入
    },
    {
      path: '/member',
      name: 'member',
      component: () => import('../views/MemberView.vue'),
      meta: { requiresAuth: true } // 標記需要登入
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPassword.vue')
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    // 如果是按瀏覽器的「後退」，就回到上次捲動的位置
    if (savedPosition) {
      return savedPosition;
    } else {
      // 點擊連結進入新頁面，則自動捲動到最上方
      return { top: 0 };
    }
  },
})

// 每次切換頁面（路由導航）之前都會執行此函數
router.beforeEach((to) => {
  const authStore = useAuthStore();
  const toast = useToastStore()

  // 權限檢查：如果目標頁面需要登入，但使用者未登入
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    toast.showToast('請先登入唷!')
    // 跳轉到登入頁，並記錄原本想去的路徑 (redirect)，方便登入後跳回去
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  // 防呆機制：如果已經登入了還想去登入頁，直接導向首頁
  if (to.name === 'login' && authStore.isLoggedIn) {
    return { name: 'home' };
  }
  // 不回傳任何東西表示放行，等於 next()
});

export default router;