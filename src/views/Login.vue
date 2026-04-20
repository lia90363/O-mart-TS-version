<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, useRoute } from 'vue-router';
import { useToastStore } from '@/stores/useToastStore';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute(); 
const toast = useToastStore();

// 使用 reactive 集中管理表單欄位
const loginForm = reactive({
  name: '', 
  email: '',   
  password: '',
  confirmPassword: ''
});

const isLoading = ref(false); // 防止重複點擊送出
const isRegisterMode = ref(false); // 切換「登入」與「註冊」模式

// 處理登入
const handleLogin = async () => {
  if (isLoading.value) return;
  
  isLoading.value = true;

  try {
    const res = await authStore.login(loginForm.email, loginForm.password);
    
    if (res.success) {
      // 登入成功後，檢查是否有「被攔截前」的路徑，沒有則導向首頁
      const redirectPath = (route.query.redirect as string) || '/';
      router.push(redirectPath);
      toast.showToast('歡迎回來！'); 
    } else {
      toast.showToast(res.message || '帳號或密碼錯誤');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '伺服器連線異常';
    toast.showToast(errorMessage);
  } finally {
    isLoading.value = false;
  }
};

// 處理註冊，包含完整的前端欄位驗證，確保資料送到 MySQL 前是格式正確的
const handleRegister = async () => {
  if (isLoading.value) return;

  if (!loginForm.email || !loginForm.password || !loginForm.name) {
    toast.showToast('請填寫完整註冊資訊');
    return;
  }

  if (loginForm.password !== loginForm.confirmPassword) {
    toast.showToast('兩次輸入的密碼不一致');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(loginForm.email)) {
    toast.showToast('Email 格式不正確');
    return;
  }

  if (loginForm.password.length < 6) {
    toast.showToast('密碼長度至少需要 6 位數');
    return;
  }

  isLoading.value = true;
  try {
    const res = await authStore.register(loginForm.name, loginForm.email, loginForm.password);
    
    if (res.success) {
      toast.showToast('註冊成功！請重新登入');
      isRegisterMode.value = false; // 切換回登入模式
      loginForm.password = '';      // 清空密碼安全考量
      loginForm.confirmPassword = '';  
    } else {
      toast.showToast(res.message || '註冊失敗');
    }
  } catch (err) {
    toast.showToast('註冊失敗，請稍後再試');
  } finally {
    isLoading.value = false;
  }
};

const handleSubmit = () => {
  if (isRegisterMode.value) {
    handleRegister(); // 執行註冊邏輯
  } else {
    handleLogin();    // 執行登入邏輯
  }
};
</script>

<template>
  <div class="login-container">
    <h2>{{ isRegisterMode ? '會員註冊' : '會員登入' }}</h2>
    <hr class="orange-divider">
    
    <!-- 使用 .prevent 阻止表單原生跳頁行為 -->
    <form @submit.prevent="handleSubmit">
      <input 
        v-if="isRegisterMode"
        v-model="loginForm.name" 
        type="text" 
        placeholder="姓名" 
        :disabled="isLoading" 
        required
      >
      <input 
        v-model="loginForm.email" 
        type="email" 
        placeholder="信箱" 
        :disabled="isLoading" 
        required
      >
      <input 
        v-model="loginForm.password" 
        type="password" 
        placeholder="密碼" 
        :disabled="isLoading" 
        required
      >
      <input 
        v-if="isRegisterMode"
        v-model="loginForm.confirmPassword" 
        type="password" 
        placeholder="再次確認密碼" 
        :disabled="isLoading" 
        required
      >      
      <div class="button-group">
        <!-- 登入模式：顯示「登入」按鈕(submit) 與 「切換註冊」按鈕(button) -->
        <template v-if="!isRegisterMode">
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? '登入中...' : '登入' }}
          </button>
          <button type="button" @click="isRegisterMode = true">前往註冊</button>
        </template>

        <!-- 註冊模式：顯示「立即註冊」按鈕(submit) 與 「返回」按鈕(button) -->
        <template v-else>
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? '處理中' : '立即註冊' }}
          </button>
          <button type="button" @click="isRegisterMode = false" :disabled="isLoading">返回</button>
        </template>
      </div>
    </form>
  </div>
</template>