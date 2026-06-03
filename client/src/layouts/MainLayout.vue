<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round dense icon="menu" @click="drawer = !drawer" />
        <q-toolbar-title>НашЛДбюджет</q-toolbar-title>
        <q-btn flat round dense icon="logout" @click="authStore.logout(); router.push('/login')" />
      </q-toolbar>
    </q-header>
    <q-drawer v-model="drawer" show-if-above bordered>
      <q-list>
        <q-item-label header>Меню</q-item-label>
        <q-item clickable v-ripple :to="item.to" @click="drawer = false" v-for="item in menuItems" :key="item.to">
          <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>
    <q-page-container><router-view /></q-page-container>
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn round color="primary" size="lg" icon="add" @click="handleFabClick" />
    </q-page-sticky>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth';
const drawer = ref(false);
const router = useRouter();
const authStore = useAuthStore();
const fabTarget = ref('/transactions');

const handleFabClick = () => {
  if (router.currentRoute.value.path === '/transactions') {
    document.dispatchEvent(new CustomEvent('open-add-transaction'));
  } else {
    router.push('/transactions');
  }
};

const menuItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Дашборд' },
  { to: '/accounts', icon: 'account_balance_wallet', label: 'Счета' },
  { to: '/transactions', icon: 'receipt_long', label: 'Операции' },
  { to: '/categories', icon: 'category', label: 'Категории' },
  { to: '/analytics', icon: 'analytics', label: 'Аналитика' },
  { to: '/budget', icon: 'savings', label: 'Бюджет' },
  { to: '/goals', icon: 'flag', label: 'Цели' },
  { to: '/settings', icon: 'settings', label: 'Настройки' }
];
</script>