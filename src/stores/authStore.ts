import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import axios from 'axios';
import { useCartStore } from './cartStore';

// 定義 Member 型別
export interface Member {
  id: number;
  name: string;
  email: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Member | null>(null);
  const token = ref<string>(''); // 之後後端發 JWT 給你時可以存這

  const isLoggedIn = computed(() => !!user.value);
  
  // 登入邏輯
  async function login(email: string, password: string) {
    const cartStore = useCartStore();
    try {
      const response = await axios.post('http://localhost:3000/api/login', {
        email,
        password
      });

      if (response.data.success) {
        // 如果後端回傳的是 [ {id...} ]，我們取第一筆
        const userData = Array.isArray(response.data.user) 
          ? response.data.user[0] 
          : response.data.user;
          
        user.value = userData;
        token.value = response.data.token || '';

        const currentUserId = userData?.id;

        if (currentUserId) {
          // 如果本地購物車有東西，才合併
          if (cartStore.cart.length > 0) {
            await axios.post('http://localhost:3000/api/cart/merge', {
              userId: currentUserId,
              localItems: cartStore.cart
            });
          }
          // 不管本地有沒有東西，登入後都應該從雲端同步一次最新購物車
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

  // 登出邏輯
  function logout() {
    const cartStore = useCartStore();
    user.value = null;
    token.value = '';
    cartStore.clearCart(); // 登出時清空本地 state 與 localStorage
  }

  // 註冊
  async function register(name: string, email: string, password: string) {
    try {
      const response = await axios.post('http://localhost:3000/api/register', {
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