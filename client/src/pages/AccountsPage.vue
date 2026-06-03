<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Счета</div>
    <div class="text-h6 q-mb-md">Общий баланс: {{ formatNumber(totalBalance) }} RUB</div>

    <q-list separator>
      <q-item v-for="acc in accounts" :key="acc.id">
        <q-item-section avatar>
          <q-icon :name="acc.type === 'cash' ? 'payments' : 'credit_card'" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ acc.name }}</q-item-label>
          <q-item-label caption>{{ acc.type === 'cash' ? 'Наличные' : 'Карта' }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label :class="balances[acc.id] >= 0 ? 'text-positive' : 'text-negative'">
            {{ formatNumber(balances[acc.id]) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { initStorage, getAccounts, getAccountBalance, formatNumber } from 'src/utils/storage';

const accounts = ref<any[]>([]);
const version = ref(0);

const balances = computed(() => {
  void version.value;
  return {
    'general-cash': getAccountBalance('general-cash'),
    'general-card': getAccountBalance('general-card'),
    'savings': getAccountBalance('savings')
  };
});

const totalBalance = computed(() => {
  return Object.values(balances.value).reduce((sum, b) => sum + b, 0);
});

onMounted(() => {
  initStorage();
  accounts.value = getAccounts();
  setInterval(() => version.value++, 1000);
});
</script>