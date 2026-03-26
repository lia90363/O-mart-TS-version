<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, useRoute } from 'vue-router';
import { useToastStore } from '@/stores/useToastStore';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute(); 
const toast = useToastStore();

const loginForm = reactive({
  account: '',
  password: ''
});

const isLoading = ref(false);
const isRegisterMode = ref(false);

const handleLogin = async () => {
  if (isLoading.value) return;
  
  isLoading.value = true;

  try {
    const res = await authStore.login(loginForm.account, loginForm.password);
    
    if (res.success) {
      const redirectPath = route.query.redirect || '/';
      router.push(redirectPath);
      toast.showToast('歡迎回來！'); 
    } else {
      toast.showToast(res.message || '帳號或密碼錯誤');
    }
  } catch (err) {
    toast.showToast(err.message || '伺服器連線異常');
  } finally {
    isLoading.value = false;
  }
};

const handleRegister = async () => {
  if (isLoading.value) return; // 防止重複觸發

  // 如果點擊時還不是註冊模式，先切換成註冊模式
  if (!isRegisterMode.value) {
    isRegisterMode.value = true;
    return;
  }

  // 真正的註冊邏輯
  if (!loginForm.account || !loginForm.password) {
      toast.showToast('請輸入完整的帳號密碼');
    return;
  }
  
  isLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 800)); 
  
  toast.showToast('註冊成功！其實還沒有註冊功能QQ');
  
  isRegisterMode.value = false; // 成功後切換回登入模式
  isLoading.value = false;
  loginForm.password = ''; // 註冊完清空密碼，讓使用者重新輸入
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
    
    <form @submit.prevent="handleSubmit">
      <input 
        v-model="loginForm.account" 
        type="text" 
        placeholder="帳號(您的英文名字)" 
        :disabled="isLoading" 
        required
      >
      <input 
        v-model="loginForm.password" 
        type="password" 
        placeholder="密碼(您的4碼生日)" 
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
            {{ isLoading ? '立即註冊' : '註冊' }}
          </button>
          <button type="button" @click="isRegisterMode = false" :disabled="isLoading">返回</button>
        </template>
      </div>
    </form>
  </div>
</template>