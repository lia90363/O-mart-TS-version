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
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    // 有 savedPosition (代表點擊返回或前進按鈕)
    if (savedPosition) {
      return savedPosition;
    } else {
      // 正常的頁面切換則捲動到頂部
      return { top: 0 };
    }
  },
})

router.beforeEach((to) => {
  const authStore = useAuthStore();
  const toast = useToastStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // 直接 return 路由目標
    toast.showToast('請先登入唷!')
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.name === 'login' && authStore.isLoggedIn) {
    return { name: 'home' };
  }
  // 不回傳任何東西表示放行 (等於 next())
});

export default router;