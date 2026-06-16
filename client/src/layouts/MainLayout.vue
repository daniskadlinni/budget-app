<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round dense icon="menu" @click="drawer = !drawer" />
        <q-toolbar-title :class="{ 'car-toolbar-title': isCar }">{{ tabTitle }}</q-toolbar-title>
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
    <q-drawer v-if="isCar" v-model="drawer" show-if-above bordered>
      <q-list>
        <q-item-label header>Автомобиль</q-item-label>
        <q-item clickable v-ripple :to="'/car'" @click="drawer = false">
          <q-item-section avatar><q-icon name="local_gas_station" /></q-item-section>
          <q-item-section>Заправки</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>
    <q-page-container><router-view /></q-page-container>
    <q-page-sticky v-if="!isShopping && route.path !== '/dashboard'" position="bottom-left" :offset="[18, 18]">
      <q-btn round color="primary" size="lg" icon="add" @click="handleFabClick" />
    </q-page-sticky>
    <q-page-sticky v-if="isShopping" position="bottom-left" :offset="[18, 18]">
      <q-btn round color="primary" size="lg" icon="add" @click="handleShoppingFabClick" />
    </q-page-sticky>
    <q-page-sticky v-if="isCar" position="bottom-left" :offset="[18, 18]">
      <q-btn round color="primary" size="lg" icon="add" @click="handleCarFabClick" />
    </q-page-sticky>
    <q-page-sticky position="bottom" class="full-width">
      <q-tabs align="center" active-color="primary" indicator-color="primary" dense no-caps>
        <q-route-tab to="/dashboard" icon="dashboard" label="Бюджет" />
        <q-route-tab to="/shopping" icon="shopping_cart" label="Покупки" />
        <q-route-tab to="/car" class="car-route-tab">
          <q-icon name="directions_car" class="car-tab-icon" />
          <div class="car-tab-label">Авто</div>
        </q-route-tab>
      </q-tabs>
    </q-page-sticky>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const drawer = ref(false);
const router = useRouter();
const route = useRoute();

const isShopping = computed(() => ['/shopping', '/products', '/reminders', '/stores'].some(p => route.path.startsWith(p)));
const isCar = computed(() => ['/car'].some(p => route.path.startsWith(p)));

const tabTitle = computed(() => {
  if (isShopping.value) return 'Покупки';
  if (isCar.value) return 'Автомобиль';
  return 'НашЛДбюджет';
});

const handleFabClick = () => {
  window.dispatchEvent(new CustomEvent('open-add-transaction'));
};

const handleShoppingFabClick = () => {
  const path = router.currentRoute.value.path;
  if (path === '/shopping') {
    window.dispatchEvent(new CustomEvent('open-add-shopping'));
  } else if (path === '/products') {
    window.dispatchEvent(new CustomEvent('open-add-product'));
  } else if (path === '/reminders') {
    window.dispatchEvent(new CustomEvent('open-add-reminder'));
  } else if (path === '/stores') {
    window.dispatchEvent(new CustomEvent('open-add-store'));
  } else {
    window.dispatchEvent(new CustomEvent('open-add-shopping'));
  }
};

const handleCarFabClick = () => {
  window.dispatchEvent(new CustomEvent('open-add-fuel'));
};

onMounted(() => {
});

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
