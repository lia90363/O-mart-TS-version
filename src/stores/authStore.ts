import { ref, computed } from 'vue'
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null);
    const token = ref('');
    const isLoggedIn = computed(() => !!token.value);

    async function login(account, password) {
        try {
            // 使用 window.location.origin 確保路徑從網站根目錄開始
            const url = `${window.location.origin}/member.json?t=${Date.now()}`;
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json' // 強制要求 JSON
                }
            });

            // 檢查回傳的是不是真的 JSON，如果是 HTML (以 < 開頭) 就報錯
            const contentType = response.headers.get('content-type');
            if (!response.ok || !contentType || !contentType.includes('application/json')) {
                throw new Error('抓取不到正確的成員資料格式');
            }

            const members = await response.json();

            // 搜尋邏輯
            const member = members.find(m => m.account === account && m.password === password);

            if (member) {
                user.value = member.data;
                token.value = `mock-jwt-${member.account}-${Math.random().toString(36).substring(2)}`;
                return { success: true };
            } else {
                return { success: false, message: '帳號或密碼錯誤' };
            }
        } catch (error) {
            console.error('Login Error:', error);
            return { success: false, message: '系統讀取失敗，請重新整理頁面' };
        }
    }

    function logout() {
        user.value = null;
        token.value = '';
    }

    return { user, token, isLoggedIn, login, logout };
}, {
    persist: true
});