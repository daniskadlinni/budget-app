<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Счета</div>
    <div class="text-h6 q-mb-md">Общий баланс: {{ formatNumber(totalBalance) }} RUB</div>

    <q-btn color="primary" icon="swap_horiz" label="Перевести" class="q-mb-md" @click="showTransfer = true" />

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

    <q-dialog v-model="showTransfer">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Перевод между счетами</div></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-select v-model="transfer.from" :options="accountOpts" label="Откуда" emit-value map-options filled />
            <q-select v-model="transfer.to" :options="accountOpts.filter(a => a.value !== transfer.from)" label="Куда" emit-value map-options filled />
            <q-input v-model.number="transfer.amount" label="Сумма" type="number" filled />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Перевести" @click="doTransfer" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { initStorage, getAccounts, getAccountBalance, formatNumber } from 'src/utils/storage';
import { syncToServer } from 'src/utils/sync';
import { useQuasar } from 'quasar';
import { v4 as uuidv4 } from 'uuid';

const $q = useQuasar();
const accounts = ref<any[]>([]);
const version = ref(0);
const showTransfer = ref(false);
const transfer = ref({ from: 'general-cash', to: 'general-card', amount: '' });
let balanceTimer: number | null = null;

const accountOpts = [
  { label: 'Общий — Наличные', value: 'general-cash' },
  { label: 'Общий — Карта', value: 'general-card' },
  { label: 'Накопительный', value: 'savings' }
];

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

const doTransfer = () => {
  if (!transfer.value.amount || transfer.value.amount <= 0) return;
  if (transfer.value.amount > getAccountBalance(transfer.value.from)) {
    $q.dialog({ title: 'Недостаточно средств', message: 'Недостаточно средств на счёте', ok: { label: 'OK', color: 'primary' } });
    return;
  }
  const now = new Date().toISOString();
  const t1 = { id: uuidv4(), accountId: transfer.value.from, type: 'transfer', amount: transfer.value.amount, date: now.split('T')[0], note: '', createdAt: now, updatedAt: now, isTransferFrom: true, transferToId: transfer.value.to };
  const t2 = { id: uuidv4(), accountId: transfer.value.to, type: 'transfer', amount: transfer.value.amount, date: now.split('T')[0], note: '', createdAt: now, updatedAt: now, isTransferFrom: false, transferToId: transfer.value.from };
  const transactions = JSON.parse(localStorage.getItem('budget_transactions') || '[]');
  transactions.push(t1);
  transactions.push(t2);
  localStorage.setItem('budget_transactions', JSON.stringify(transactions));
  syncToServer();
  version.value++;
  showTransfer.value = false;
  $q.notify({ message: 'Перевод выполнен', color: 'positive' });
};

const handleDataUpdated = () => {
  accounts.value = getAccounts();
};

onMounted(() => {
  initStorage();
  accounts.value = getAccounts();
  balanceTimer = window.setInterval(() => version.value++, 1000);

  window.addEventListener('dataUpdated', handleDataUpdated);
});

onUnmounted(() => {
  if (balanceTimer) window.clearInterval(balanceTimer);
  window.removeEventListener('dataUpdated', handleDataUpdated);
});
</script>
