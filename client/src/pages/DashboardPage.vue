<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Главная</div>
    <div class="text-h4 q-mb-lg">Баланс: {{ formatNumber(totalBalance) }} RUB</div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-4">
        <q-card>
          <q-card-section><div class="text-h6">Доходы</div></q-card-section>
          <q-card-section class="text-positive text-h5">+{{ formatNumber(totalIncome) }}</q-card-section>
        </q-card>
      </div>
      <div class="col-4">
        <q-card>
          <q-card-section><div class="text-h6">Расходы</div></q-card-section>
          <q-card-section class="text-negative text-h5">-{{ formatNumber(totalExpense) }}</q-card-section>
        </q-card>
      </div>
      <div class="col-4">
        <q-card>
          <q-card-section><div class="text-h6">Переводы</div></q-card-section>
          <q-card-section class="text-primary text-h5">{{ formatNumber(totalTransfer) }}</q-card-section>
        </q-card>
      </div>
    </div>

    <div class="text-h6 q-mb-md">Последние операции</div>
    <q-list separator>
      <q-item v-for="t in lastTransactions" :key="t.id">
        <q-item-section avatar>
          <q-icon :name="t.type === 'income' ? 'arrow_downward' : t.type === 'expense' ? 'arrow_upward' : 'swap_horiz'"
                  :color="t.type === 'income' ? 'positive' : t.type === 'expense' ? 'negative' : 'primary'" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ getLabel(t) }}</q-item-label>
          <q-item-label caption>{{ formatDate(t.date) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label :class="t.type === 'income' ? 'text-positive' : t.type === 'expense' ? 'text-negative' : 'text-primary'">
            {{ t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '' }}{{ formatNumber(t.amount) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getTransactions, getAccountBalance, formatNumber } from 'src/utils/storage';

const transactions = ref<any[]>([]);

const totalBalance = computed(() => {
  return getAccountBalance('general-cash') + getAccountBalance('general-card') + getAccountBalance('savings');
});

const totalIncome = computed(() => {
  return transactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
});

const totalExpense = computed(() => {
  return transactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
});

const totalTransfer = computed(() => {
  return transactions.value.filter(t => t.type === 'transfer' && t.isTransferFrom).reduce((s, t) => s + t.amount, 0);
});

const lastTransactions = computed(() => {
  return [...transactions.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
});

const accountOpts = [
  { label: 'Общий — Наличные', value: 'general-cash' },
  { label: 'Общий — Карта', value: 'general-card' },
  { label: 'Накопительный', value: 'savings' }
];

const getLabel = (t: any) => {
  if (t.type !== 'transfer') return accountOpts.find(a => a.value === t.accountId)?.label || '';
  if (t.isTransferFrom) return `${accountOpts.find(a => a.value === t.accountId)?.label} → ${accountOpts.find(a => a.value === t.transferToId)?.label}`;
  return `← ${accountOpts.find(a => a.value === t.accountId)?.label}`;
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU');

onMounted(() => {
  transactions.value = getTransactions();
});
</script>