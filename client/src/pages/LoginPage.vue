<template>
  <q-page class="flex flex-center">
    <q-card style="min-width: 350px">
      <q-card-section><div class="text-h6 text-center">Вход в систему</div></q-card-section>
      <q-card-section>
        <q-form @submit="handleLogin" class="q-gutter-md">
          <q-input v-model="email" label="Email" type="email" filled required />
          <q-input v-model="password" label="Пароль" type="password" filled required />
          <q-btn type="submit" color="primary" label="Войти" class="full-width" :loading="loading" />
        </q-form>
      </q-card-section>
      <q-card-section class="text-center">
        <q-btn flat color="primary" label="Нет аккаунта? Зарегистрируйтесь" to="/register" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { useDataStore } from 'stores/data';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const dataStore = useDataStore();

const email = ref('');
const password = ref('');
const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    dataStore.loadFromStorage();
    await dataStore.sync();
    router.push('/dashboard');
  } catch (error: any) {
    $q.notify({ message: error.response?.data?.error || 'Ошибка входа', color: 'negative' });
  } finally {
    loading.value = false;
  }
};
</script>