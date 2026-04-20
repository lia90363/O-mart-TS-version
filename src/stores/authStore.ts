import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import apiClient from '@/api/axios';
import { useCartStore } from './cartStore';

// 定義 Member 型別
export interface Member {
  id: number;
  name: string;
  email: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Member | null>(null);
  const token = ref<string>(''); // 存放 JWT，用於後續 API 的 Authorization Header

  // 透過雙重驚嘆號將物件轉為布林值，判斷是否已登入
  const isLoggedIn = computed(() => !!user.value);
  
  // 登入邏輯，包含：驗證身分、存儲狀態、合併本地購物車、同步雲端購物車
  async function login(email: string, password: string) {
    const cartStore = useCartStore();
    try {
      const response = await apiClient.post('login', {
        email,
        password
      });

      if (response.data.success) {
        // 處理後端回傳資料格式的相容性 (防止陣列/物件混亂)
        const userData = Array.isArray(response.data.user) 
          ? response.data.user[0] 
          : response.data.user;
          
        user.value = userData;
        token.value = response.data.token || '';

        const currentUserId = userData?.id;

        if (currentUserId) {
          // 合併邏輯：若登入前「遊客狀態」的購物車有東西，則傳給後端寫入 MySQL
          if (cartStore.cart.length > 0) {
            await apiClient.post('cart/merge', {
              userId: currentUserId,
              localItems: cartStore.cart
            });
          }
          // 同步邏輯：確保前端購物車顯示的是資料庫中最新的內容
          await cartStore.fetchCartFromServer(currentUserId);
        }

        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login Error:', error);
      return { success: false, message: '連線伺服器失敗' };
    }
  }

  // 登出邏輯：清空個人資料並重置購物車狀態
  function logout() {
    const cartStore = useCartStore();
    user.value = null;
    token.value = '';
    cartStore.clearCart(); // 登出時清空本地 state 與 localStorage
  }

  // 註冊邏輯
  async function register(name: string, email: string, password: string) {
    try {
      const response = await apiClient.post('register', {
        name,
        email,
        password
      });

      if (response.data.success) {
        // 註冊成功後，通常可以直接幫使用者執行登入，或導向登入頁
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error: any) {
      // 抓取後端傳回的 400 錯誤訊息
      const msg = error.response?.data?.message || '註冊失敗，請稍後再試';
      return { success: false, message: msg };
    }
  }

  return { user, token, isLoggedIn, login, logout, register };
}, {
  persist: true // 保留自動持久化，讓使用者重整頁面後不會被強制登出
});