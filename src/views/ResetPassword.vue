<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/api/axios';
import { useToastStore } from '@/stores/useToastStore';

const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);

const handleReset = async () => {
  const token = route.query.token; // 從網址 ?token=... 取得

  if (newPassword.value !== confirmPassword.value) {
    return toast.showToast('兩次密碼輸入不一致');
  }

  isLoading.value = true;
  try {
    const res = await apiClient.post('reset-password', {
      token,
      newPassword: newPassword.value
    });

    if (res.data.success) {
      toast.showToast('密碼重設成功，請重新登入');
      router.push('/login');
    }
  } catch (err) {
    toast.showToast('連結已失效或網路異常');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="reset-container">
    <h2>重設密碼</h2>
    <hr class="orange-divider">
    <form @submit.prevent="handleReset">
      <input v-model="newPassword" type="password" placeholder="請輸入新密碼" required>
      <input v-model="confirmPassword" type="password" placeholder="再次確認新密碼" required>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? '處理中...' : '確認修改' }}
      </button>
    </form>
  </div>
</template>