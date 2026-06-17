<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Главная</div>
    <div class="dashboard-balance q-mb-lg">Баланс: {{ formatNumber(totalBalance) }} RUB</div>

    <div class="row q-col-gutter-sm q-mb-lg">
      <div class="col-6 col-sm-3">
        <q-btn class="full-width" color="negative" icon="remove" label="Расход" @click="openTransaction('expense')" />
      </div>
      <div class="col-6 col-sm-3">
        <q-btn class="full-width" color="positive" icon="add" label="Доход" @click="openTransaction('income')" />
      </div>
      <div class="col-6 col-sm-3">
        <q-btn class="full-width" color="primary" icon="swap_horiz" label="Перевод" @click="openTransaction('transfer')" />
      </div>
      <div class="col-6 col-sm-3">
        <q-btn class="full-width" color="orange" icon="local_gas_station" label="Заправка" @click="openFuel" />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4">
        <q-card>
          <q-card-section><div class="text-h6">Доходы</div></q-card-section>
          <q-card-section class="dashboard-amount text-positive">+{{ formatNumber(totalIncome) }}</q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card>
          <q-card-section><div class="text-h6">Расходы</div></q-card-section>
          <q-card-section class="dashboard-amount text-negative">-{{ formatNumber(totalExpense) }}</q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card>
          <q-card-section><div class="text-h6">Переводы</div></q-card-section>
          <q-card-section class="dashboard-amount text-primary">{{ formatNumber(totalTransfer) }}</q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4">
        <q-card>
          <q-card-section>
            <div class="text-caption text-grey">Расходы сегодня</div>
            <div class="dashboard-metric text-negative">-{{ formatNumber(todayExpense) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card>
          <q-card-section>
            <div class="text-caption text-grey">Осталось по бюджетам</div>
            <div class="dashboard-metric" :class="budgetLeft < 0 ? 'text-negative' : 'text-positive'">{{ formatNumber(budgetLeft) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card>
          <q-card-section>
            <div class="text-caption text-grey">Главная статья</div>
            <div class="dashboard-metric">{{ topExpenseCategory.name }}</div>
            <div class="text-caption text-negative">-{{ formatNumber(topExpenseCategory.amount) }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-banner v-if="overBudget.length" rounded class="bg-negative text-white q-mb-lg">
      Превышен бюджет: {{ overBudget.map(b => b.name).join(', ') }}
    </q-banner>

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
import { useRouter } from 'vue-router';
import { getTransactions, getAccountBalance, formatNumber, getBudgets, getMonthlySpent, getCategories } from 'src/utils/storage';

const router = useRouter();
const transactions = ref<any[]>([]);
const budgets = ref<any[]>([]);
const categories = ref<any[]>([]);

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

const todayExpense = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return transactions.value
    .filter(t => t.type === 'expense' && t.date === today)
    .reduce((s, t) => s + t.amount, 0);
});

const budgetsWithSpent = computed(() =>
  budgets.value.map((budget: any) => ({
    ...budget,
    spent: getMonthlySpent(budget.categoryIds)
  }))
);

const budgetLeft = computed(() =>
  budgetsWithSpent.value.reduce((sum, budget) => sum + ((parseFloat(budget.limit) || 0) - (budget.spent || 0)), 0)
);

const overBudget = computed(() =>
  budgetsWithSpent.value.filter(budget => (budget.spent || 0) > (parseFloat(budget.limit) || 0))
);

const topExpenseCategory = computed(() => {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const byCategory: Record<string, number> = {};

  transactions.value
    .filter(t => t.type === 'expense' && t.date.startsWith(monthKey))
    .forEach(t => {
      const name = categories.value.find(c => c.id === t.categoryId)?.name || 'Прочее';
      byCategory[name] = (byCategory[name] || 0) + t.amount;
    });

  const [name, amount] = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0] || ['Нет расходов', 0];
  return { name, amount };
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

const openTransaction = (type: 'expense' | 'income' | 'transfer') => {
  router.push({ path: '/transactions', query: { add: type } });
};

const openFuel = () => {
  router.push({ path: '/car', query: { add: 'fuel' } });
};

onMounted(() => {
  transactions.value = getTransactions();
  budgets.value = getBudgets();
  categories.value = getCategories();
  window.addEventListener('dataUpdated', () => {
    transactions.value = getTransactions();
    budgets.value = getBudgets();
    categories.value = getCategories();
  });
});
</script>

<style scoped>
.dashboard-balance {
  font-size: 2rem;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.dashboard-amount {
  font-size: 1.5rem;
  line-height: 1.25;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.dashboard-metric {
  font-size: 1.25rem;
  line-height: 1.25;
  overflow-wrap: anywhere;
  word-break: break-word;
}

@media (max-width: 599px) {
  .dashboard-balance {
    font-size: 1.5rem;
  }

  .dashboard-amount {
    font-size: 1.35rem;
  }

  .dashboard-metric {
    font-size: 1.1rem;
  }
}
</style>
