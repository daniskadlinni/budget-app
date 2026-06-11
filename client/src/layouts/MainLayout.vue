<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round dense icon="menu" @click="drawer = !drawer" />
        <q-toolbar-title>{{ isShopping ? 'Покупки' : 'НашЛДбюджет' }}</q-toolbar-title>
      </q-toolbar>
    </q-header>
    <q-drawer v-if="!isShopping" v-model="drawer" show-if-above bordered>
      <q-list>
        <q-item-label header>Меню</q-item-label>
        <q-item clickable v-ripple :to="item.to" @click="drawer = false" v-for="item in budgetMenuItems" :key="item.to">
          <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>
    <q-drawer v-if="isShopping" v-model="drawer" show-if-above bordered>
      <q-list>
        <q-item-label header>Покупки</q-item-label>
        <q-item clickable v-ripple :to="'/shopping'" @click="drawer = false">
          <q-item-section avatar><q-icon name="shopping_cart" /></q-item-section>
          <q-item-section>Список покупок</q-item-section>
        </q-item>
        <q-item clickable v-ripple :to="'/products'" @click="drawer = false">
          <q-item-section avatar><q-icon name="inventory" /></q-item-section>
          <q-item-section>Товары</q-item-section>
        </q-item>
        <q-item clickable v-ripple :to="'/reminders'" @click="drawer = false">
          <q-item-section avatar><q-icon name="notifications" /></q-item-section>
          <q-item-section>Напоминания</q-item-section>
        </q-item>
        <q-item clickable v-ripple :to="'/stores'" @click="drawer = false">
          <q-item-section avatar><q-icon name="store" /></q-item-section>
          <q-item-section>Магазины</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>
    <q-page-container><router-view /></q-page-container>
    <q-page-sticky v-if="!isShopping" position="bottom-right" :offset="[18, 18]">
      <q-btn round color="primary" size="lg" icon="add" @click="handleFabClick" />
    </q-page-sticky>
    <q-page-sticky position="bottom" class="full-width">
      <q-tabs align="center" active-color="primary" indicator-color="primary" dense no-caps>
        <q-route-tab to="/dashboard" icon="dashboard" label="Бюджет" />
        <q-route-tab to="/shopping" icon="shopping_cart" label="Покупки" />
      </q-tabs>
    </q-page-sticky>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth';
const drawer = ref(false);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isShopping = computed(() => ['/shopping', '/products', '/reminders', '/stores'].some(p => route.path.startsWith(p)));

const handleFabClick = () => {
  if (router.currentRoute.value.path === '/transactions') {
    document.dispatchEvent(new CustomEvent('open-add-transaction'));
  } else {
    router.push('/transactions');
  }
};

const budgetMenuItems = [
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