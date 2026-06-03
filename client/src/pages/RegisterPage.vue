<template>
  <q-page class="flex flex-center">
    <q-card style="min-width: 350px">
      <q-card-section><div class="text-h6 text-center">Регистрация</div></q-card-section>
      <q-card-section>
        <q-form @submit="handleRegister" class="q-gutter-md">
          <q-input v-model="email" label="Email" type="email" filled required />
          <q-input v-model="password" label="Пароль" type="password" filled required />
          <q-input v-model="confirmPassword" label="Подтвердите пароль" type="password" filled required />
          <q-btn type="submit" color="primary" label="Зарегистрироваться" class="full-width" :loading="loading" />
        </q-form>
      </q-card-section>
      <q-card-section class="text-center">
        <q-btn flat color="primary" label="Уже есть аккаунт? Войдите" to="/login" />
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
const confirmPassword = ref('');
const loading = ref(false);

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    $q.notify({ message: 'Пароли не совпадают', color: 'negative' });
    return;
  }
  loading.value = true;
  try {
    await authStore.register(email.value, password.value, 'RUB');
    dataStore.loadFromStorage();
    await dataStore.sync();
    router.push('/dashboard');
  } catch (error: any) {
    $q.notify({ message: error.response?.data?.error || 'Ошибка регистрации', color: 'negative' });
  } finally {
    loading.value = false;
  }
};
</script>