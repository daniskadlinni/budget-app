<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Аналитика</div>

    <div class="row q-col-gutter-sm q-mb-md items-center">
      <div class="col-12 col-sm-auto">
        <q-btn-toggle v-model="period" toggle-color="primary" :options="[
          {label: 'Месяц', value: 'month'},
          {label: 'Квартал', value: 'quarter'},
          {label: 'Год', value: 'year'}
        ]" />
      </div>
      <div v-if="period === 'month'" class="col-12 col-sm-3">
        <q-input v-model="selectedMonth" type="month" label="Месяц" dense filled />
      </div>
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
        <div class="text-h6">Расходы по категориям</div>
      </q-card-section>
      <q-list separator>
        <q-item v-for="item in expenseCategories" :key="item.id" clickable @click="selectedCategoryId = item.id">
          <q-item-section>
            <q-item-label>{{ item.name }}</q-item-label>
            <q-item-label caption>{{ item.count }} операций</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label class="text-negative">-{{ formatNumber(item.amount) }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <q-card v-if="selectedCategory" class="q-mt-md">
      <q-card-section class="row justify-between items-center">
        <div>
          <div class="text-h6">{{ selectedCategory.name }}</div>
          <div class="text-caption text-grey">{{ selectedCategoryTransactions.length }} операций</div>
        </div>
        <q-btn flat round icon="close" @click="selectedCategoryId = ''" />
      </q-card-section>
      <q-list separator>
        <q-item v-for="t in selectedCategoryTransactions" :key="t.id">
          <q-item-section>
            <q-item-label>{{ t.note || getAccountName(t.accountId) }}</q-item-label>
            <q-item-label caption>{{ formatDate(t.date) }} · {{ getAccountName(t.accountId) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label class="text-negative">-{{ formatNumber(t.amount) }}</q-item-label>
            <q-btn flat round dense icon="edit" color="primary" @click="openCategoryDialog(t)" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <q-dialog v-model="showCategoryDialog">
      <q-card style="min-width: 320px">
        <q-card-section><div class="text-h6">Категория операции</div></q-card-section>
        <q-card-section>
          <q-select v-model="categoryForm.categoryId" :options="expenseCategoryOptions" label="Категория" emit-value map-options filled />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Сохранить" @click="saveCategoryEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
import { getTransactions, getCategories, updateTransaction, formatNumber } from 'src/utils/storage';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const transactions = ref<any[]>([]);
const categories = ref<any[]>([]);
const period = ref<'month' | 'quarter' | 'year'>('quarter');
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const selectedCategoryId = ref('');
const showCategoryDialog = ref(false);
const categoryForm = ref({ id: '', categoryId: '' });

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } }
};

const getPeriodRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (period.value === 'month') {
    const [selectedYear, selectedMonthNumber] = selectedMonth.value.split('-').map(Number);
    const start = `${selectedYear}-${String(selectedMonthNumber).padStart(2, '0')}-01`;
    const endDate = new Date(selectedYear, selectedMonthNumber, 0);
    const end = `${selectedYear}-${String(selectedMonthNumber).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    return { start, end };
  } else if (period.value === 'quarter') {
    const quarterStartMonth = Math.floor(month / 3) * 3;
    return {
      start: `${year}-${String(quarterStartMonth + 1).padStart(2, '0')}-01`,
      end: `${year}-${String(quarterStartMonth + 3).padStart(2, '0')}-31`
    };
  }
  return { start: `${year}-01-01`, end: `${year}-12-31` };
};

const filteredTransactions = computed(() =>
  transactions.value.filter(t => {
    const range = getPeriodRange();
    return t.date >= range.start && t.date <= range.end;
  })
);

const totalIncome = computed(() =>
  filteredTransactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
);

const totalExpense = computed(() =>
  filteredTransactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
);

const balance = computed(() => totalIncome.value - totalExpense.value);
const transactionsCount = computed(() => filteredTransactions.value.filter(t => t.type !== 'transfer').length);

const expenseCategories = computed(() => {
  const expenses = filteredTransactions.value.filter(t => t.type === 'expense');
  const byCategory: Record<string, { id: string; name: string; amount: number; count: number }> = {};
  expenses.forEach(t => {
    const cat = categories.value.find(c => c.id === t.categoryId);
    const name = cat?.name || 'Прочее';
    const id = t.categoryId || 'uncategorized';
    byCategory[id] = byCategory[id] || { id, name, amount: 0, count: 0 };
    byCategory[id].amount += t.amount;
    byCategory[id].count += 1;
  });
  return Object.values(byCategory).sort((a, b) => b.amount - a.amount);
});

const selectedCategory = computed(() => expenseCategories.value.find(item => item.id === selectedCategoryId.value));

const selectedCategoryTransactions = computed(() =>
  filteredTransactions.value
    .filter(t => t.type === 'expense' && (t.categoryId || 'uncategorized') === selectedCategoryId.value)
    .sort((a, b) => b.date.localeCompare(a.date))
);

const expenseCategoryOptions = computed(() =>
  categories.value
    .filter(category => category.type === 'expense')
    .map(category => ({ label: category.name, value: category.id }))
);

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

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  let startMonth: number;
  let numMonths: number;
  if (period.value === 'month') {
    startMonth = month;
    numMonths = 1;
  } else if (period.value === 'quarter') {
    startMonth = Math.floor(month / 3) * 3;
    numMonths = 3;
  } else {
    startMonth = 0;
    numMonths = month + 1;
  }

  for (let i = 0; i < numMonths; i++) {
    const m = startMonth + i;
    const d = new Date(year, m, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

const getAccountName = (id: string) => {
  const accountNames: Record<string, string> = {
    'general-cash': 'Общий — Наличные',
    'general-card': 'Общий — Карта',
    'savings': 'Накопительный'
  };
  return accountNames[id] || '';
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU');

const openCategoryDialog = (transaction: any) => {
  categoryForm.value = { id: transaction.id, categoryId: transaction.categoryId || '' };
  showCategoryDialog.value = true;
};

const saveCategoryEdit = () => {
  if (!categoryForm.value.id) return;
  updateTransaction(categoryForm.value.id, { categoryId: categoryForm.value.categoryId });
  transactions.value = getTransactions();
  showCategoryDialog.value = false;
};

onMounted(() => {
  transactions.value = getTransactions();
  categories.value = getCategories();

  window.addEventListener('dataUpdated', () => {
    transactions.value = getTransactions();
  });
});
</script>
