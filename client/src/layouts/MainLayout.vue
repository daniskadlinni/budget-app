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
        <q-item clickable v-ripple to="/dashboard"><q-item-section avatar><q-icon name="dashboard" /></q-item-section><q-item-section>Дашборд</q-item-section></q-item>
        <q-item clickable v-ripple to="/accounts"><q-item-section avatar><q-icon name="account_balance_wallet" /></q-item-section><q-item-section>Счета</q-item-section></q-item>
        <q-item clickable v-ripple to="/transactions"><q-item-section avatar><q-icon name="receipt_long" /></q-item-section><q-item-section>Операции</q-item-section></q-item>
        <q-item clickable v-ripple to="/categories"><q-item-section avatar><q-icon name="category" /></q-item-section><q-item-section>Категории</q-item-section></q-item>
        <q-item clickable v-ripple to="/analytics"><q-item-section avatar><q-icon name="analytics" /></q-item-section><q-item-section>Аналитика</q-item-section></q-item>
        <q-item clickable v-ripple to="/budget"><q-item-section avatar><q-icon name="savings" /></q-item-section><q-item-section>Бюджет</q-item-section></q-item>
        <q-item clickable v-ripple to="/settings"><q-item-section avatar><q-icon name="settings" /></q-item-section><q-item-section>Настройки</q-item-section></q-item>
      </q-list>
    </q-drawer>
    <q-page-container><router-view /></q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth';
const drawer = ref(false);
const router = useRouter();
const authStore = useAuthStore();
</script>