<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Аналитика</div>

    <div class="row q-mb-md">
      <q-btn-toggle v-model="period" toggle-color="primary" :options="[
        {label: 'Месяц', value: 'month'},
        {label: 'Квартал', value: 'quarter'},
        {label: 'Год', value: 'year'}
      ]" />
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Расходы по категориям</div>
            <div style="height: 300px">
              <Doughnut v-if="expenseChartData.labels.length" :data="expenseChartData" :options="chartOptions" />
              <div v-else class="text-grey q-pa-md">Нет данных</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Доходы vs Расходы</div>
            <div style="height: 300px">
              <Bar v-if="comparisonChartData.labels.length" :data="comparisonChartData" :options="chartOptions" />
              <div v-else class="text-grey q-pa-md">Нет данных</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card class="q-mt-md">
      <q-card-section>
        <div class="text-h6">Статистика за период</div>
      </q-card-section>
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6 col-md-3">
            <div class="text-caption text-grey">Всего доходов</div>
            <div class="text-h6 text-positive">+{{ formatNumber(totalIncome) }}</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="text-caption text-grey">Всего расходов</div>
            <div class="text-h6 text-negative">-{{ formatNumber(totalExpense) }}</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="text-caption text-grey">Баланс</div>
            <div class="text-h6" :class="balance >= 0 ? 'text-positive' : 'text-negative'">
              {{ formatNumber(balance) }}
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="text-caption text-grey">Операций</div>
            <div class="text-h6">{{ transactionsCount }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card class="q-mt-md">
      <q-card-section>
        <div class="text-h6">Топ категорий расходов</div>
      </q-card-section>
      <q-list separator>
        <q-item v-for="(item, idx) in topExpenseCategories" :key="idx">
          <q-item-section>
            <q-item-label>{{ item.name }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label class="text-negative">-{{ formatNumber(item.amount) }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <q-card class="q-mt-md">
      <q-card-section class="row justify-between items-center">
        <div class="text-h6">Экспорт данных</div>
        <q-btn color="primary" label="Экспорт в CSV" @click="exportCSV" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Doughnut, Bar } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { getTransactions, getCategories, formatNumber } from 'src/utils/storage';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const transactions = ref<any[]>([]);
const categories = ref<any[]>([]);
const period = ref<'month' | 'quarter' | 'year'>('quarter');

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } }
};

const getDateFilter = () => {
  const now = new Date();
  if (period.value === 'month') now.setMonth(now.getMonth() - 1);
  else if (period.value === 'quarter') now.setMonth(now.getMonth() - 3);
  else now.setFullYear(now.getFullYear() - 1);
  return now.toISOString().split('T')[0];
};

const filteredTransactions = computed(() =>
  transactions.value.filter(t => t.date >= getDateFilter())
);

const totalIncome = computed(() =>
  filteredTransactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
);

const totalExpense = computed(() =>
  filteredTransactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
);

const balance = computed(() => totalIncome.value - totalExpense.value);
const transactionsCount = computed(() => filteredTransactions.value.filter(t => t.type !== 'transfer').length);

const topExpenseCategories = computed(() => {
  const expenses = filteredTransactions.value.filter(t => t.type === 'expense');
  const byCategory: Record<string, number> = {};
  expenses.forEach(t => {
    const cat = categories.value.find(c => c.id === t.categoryId);
    const name = cat?.name || 'Прочее';
    byCategory[name] = (byCategory[name] || 0) + t.amount;
  });
  return Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));
});

const expenseChartData = computed(() => {
  const expenses = filteredTransactions.value.filter(t => t.type === 'expense');
  const byCategory: Record<string, number> = {};
  expenses.forEach(t => {
    const cat = categories.value.find(c => c.id === t.categoryId);
    const name = cat?.name || 'Прочее';
    byCategory[name] = (byCategory[name] || 0) + t.amount;
  });

  return {
    labels: Object.keys(byCategory),
    datasets: [{ data: Object.values(byCategory), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] }]
  };
});

const comparisonChartData = computed(() => {
  const months: string[] = [];
  const incomeData: number[] = [];
  const expenseData: number[] = [];

  let numMonths = period.value === 'month' ? 1 : period.value === 'quarter' ? 3 : 12;

  for (let i = numMonths - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push(monthKey);
    const monthTransactions = filteredTransactions.value.filter(t => t.date.startsWith(monthKey));
    incomeData.push(monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
    expenseData.push(monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
  }

  return {
    labels: months,
    datasets: [
      { label: 'Доходы', data: incomeData, backgroundColor: '#4CAF50' },
      { label: 'Расходы', data: expenseData, backgroundColor: '#FF5722' }
    ]
  };
});

const exportCSV = () => {
  const headers = ['Дата', 'Тип', 'Сумма', 'Категория', 'Счёт', 'Заметка'];
  const rows = transactions.value.map(t => {
    const cat = categories.value.find(c => c.id === t.categoryId);
    const accountNames: Record<string, string> = {
      'general-cash': 'Общий — Наличные',
      'general-card': 'Общий — Карта',
      'savings': 'Накопительный'
    };
    return [
      t.date,
      t.type === 'income' ? 'Доход' : t.type === 'expense' ? 'Расход' : 'Перевод',
      t.amount,
      cat?.name || '',
      accountNames[t.accountId] || '',
      t.note || ''
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'transactions.csv';
  link.click();
};

onMounted(() => {
  transactions.value = getTransactions();
  categories.value = getCategories();
});
</script>