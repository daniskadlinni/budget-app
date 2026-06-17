<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">Операции</div>
      <q-btn color="primary" icon="add" label="Добавить" @click="openDialog" />
    </div>

    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-sm-4 col-md-3">
        <q-input v-model="search" placeholder="Поиск..." dense clearable />
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-select v-model="filterType" :options="filterTypeOptions" label="Тип" dense emit-value map-options clearable />
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-select v-model="filterAccount" :options="accountOpts" label="Счёт" dense emit-value map-options clearable />
      </div>
      <div class="col-12 col-sm-4 col-md-2">
        <q-select v-model="filterCategory" :options="allCatOpts" label="Категория" dense emit-value map-options clearable />
      </div>
      <div class="col-6 col-sm-4 col-md-1">
        <q-input v-model="dateFrom" type="date" label="С" dense clearable />
      </div>
      <div class="col-6 col-sm-4 col-md-1">
        <q-input v-model="dateTo" type="date" label="По" dense clearable />
      </div>
      <div class="col-12 col-sm-4 col-md-1">
        <q-select v-model="sortBy" :options="sortOptions" label="Сорт." dense emit-value map-options />
      </div>
    </div>

    <q-list separator>
      <q-item v-for="t in sortedTransactions" :key="t.id">
        <q-item-section avatar>
          <q-icon :name="t.type === 'income' ? 'arrow_downward' : t.type === 'expense' ? 'arrow_upward' : 'swap_horiz'"
                  :color="t.type === 'income' ? 'positive' : t.type === 'expense' ? 'negative' : 'primary'" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ getLabel(t) }}</q-item-label>
          <q-item-label caption>{{ getCatName(t.categoryId) }}</q-item-label>
          <q-item-label caption v-if="t.note">{{ t.note }}</q-item-label>
          <q-item-label caption>{{ formatDate(t.date) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label :class="t.type === 'income' ? 'text-positive' : t.type === 'expense' ? 'text-negative' : 'text-primary'">
            {{ t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '' }}{{ formatNumber(t.amount) }}
          </q-item-label>
          <q-btn v-if="t.type !== 'transfer'" flat round icon="edit" color="primary" @click.stop="openCategoryDialog(t)" />
          <q-btn flat round icon="delete" color="negative" @click.stop="remove(t.id)" />
        </q-item-section>
      </q-item>
    </q-list>

    <q-dialog v-model="showDialog">
      <q-card style="min-width: 350px">
        <q-card-section><div class="text-h6">Новая операция</div></q-card-section>
        <q-card-section>
          <q-form @submit="save" class="q-gutter-md">
            <q-select v-model="form.type" :options="types" label="Тип" emit-value map-options filled @update:model-value="form.categoryId = ''" />
            <q-select v-if="form.type !== 'transfer'" v-model="form.accountId" :options="accountOpts" label="Счёт" emit-value map-options filled />
            <template v-if="form.type === 'transfer'">
              <q-select v-model="form.fromId" :options="accountOpts" label="Откуда" emit-value map-options filled />
              <q-select v-model="form.toId" :options="accountOpts" label="Куда" emit-value map-options filled />
            </template>
            <q-select v-else v-model="form.categoryId" :options="catOpts" label="Категория" emit-value map-options filled clearable />
            <q-input v-model.number="form.amount" label="Сумма" type="number" filled required />
            <q-input v-model="form.date" type="date" filled />
            <q-input v-model="form.note" label="Заметка" filled />
            <q-btn type="submit" color="primary" label="Сохранить" class="full-width" />
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showCategoryDialog">
      <q-card style="min-width: 320px">
        <q-card-section><div class="text-h6">Категория операции</div></q-card-section>
        <q-card-section>
          <q-select v-model="categoryForm.categoryId" :options="editCatOpts" label="Категория" emit-value map-options filled />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Сохранить" @click="saveCategoryEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import { getTransactions, saveTransaction, updateTransaction, deleteTransaction, getCategories, getAccountBalance, formatNumber } from 'src/utils/storage';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const showDialog = ref(false);
const showCategoryDialog = ref(false);
const transactions = ref<any[]>([]);
const categories = ref<any[]>([]);
const search = ref('');
const filterType = ref('');
const filterAccount = ref('');
const filterCategory = ref('');
const dateFrom = ref('');
const dateTo = ref('');
const sortBy = ref('date-desc');
const sortOptions = [
  { label: 'По дате ↓', value: 'date-desc' },
  { label: 'По дате ↑', value: 'date-asc' },
  { label: 'По сумме ↓', value: 'amount-desc' },
  { label: 'По сумме ↑', value: 'amount-asc' }
];

const form = ref({ type: 'expense', accountId: 'general-cash', fromId: 'general-cash', toId: 'general-card', categoryId: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
const categoryForm = ref({ id: '', type: 'expense', categoryId: '' });

const types = [
  { label: 'Расход', value: 'expense' },
  { label: 'Доход', value: 'income' },
  { label: 'Перевод', value: 'transfer' }
];

const filterTypeOptions = [
  { label: 'Расход', value: 'expense' },
  { label: 'Доход', value: 'income' },
  { label: 'Перевод', value: 'transfer' }
];

const accountOpts = [
  { label: 'Общий — Наличные', value: 'general-cash' },
  { label: 'Общий — Карта', value: 'general-card' },
  { label: 'Накопительный', value: 'savings' }
];

const catOpts = computed(() => {
  return categories.value.filter(c => c.type === form.value.type).map(c => ({ label: c.name, value: c.id }));
});

const allCatOpts = computed(() => categories.value.map(c => ({ label: c.name, value: c.id })));

const editCatOpts = computed(() => {
  return categories.value
    .filter(c => c.type === categoryForm.value.type)
    .map(c => ({ label: c.name, value: c.id }));
});

const matchesTypeFilter = (transaction: any) => {
  if (!filterType.value) return true;
  if (filterType.value === 'transfer') {
    return transaction.type === 'transfer' || transaction.categoryId === 'transfers';
  }
  return transaction.type === filterType.value;
};

const filteredTransactions = computed(() => {
  let list = [...transactions.value];
  if (filterType.value) list = list.filter(matchesTypeFilter);
  if (filterAccount.value) list = list.filter(t => t.accountId === filterAccount.value || t.transferToId === filterAccount.value);
  if (filterCategory.value) list = list.filter(t => t.categoryId === filterCategory.value);
  if (dateFrom.value) list = list.filter(t => t.date >= dateFrom.value);
  if (dateTo.value) list = list.filter(t => t.date <= dateTo.value);
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(t =>
      (t.note && t.note.toLowerCase().includes(q)) ||
      (t.categoryId && categories.value.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(q))
    );
  }
  return list;
});

const sortedTransactions = computed(() => {
  const list = [...filteredTransactions.value];
  if (sortBy.value === 'date-desc') list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  else if (sortBy.value === 'date-asc') list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  else if (sortBy.value === 'amount-desc') list.sort((a, b) => b.amount - a.amount);
  else if (sortBy.value === 'amount-asc') list.sort((a, b) => a.amount - b.amount);
  return list;
});

const getLabel = (t: any) => {
  if (t.type !== 'transfer') return accountOpts.find(a => a.value === t.accountId)?.label || '';
  if (t.isTransferFrom) return `${accountOpts.find(a => a.value === t.accountId)?.label} → ${accountOpts.find(a => a.value === t.transferToId)?.label}`;
  return `← ${accountOpts.find(a => a.value === t.accountId)?.label}`;
};

const getCatName = (id: string) => categories.value.find(c => c.id === id)?.name || '';
const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU');

const save = () => {
  if (!form.value.amount) return;
  const now = new Date().toISOString();

  if (form.value.type === 'expense' && form.value.amount > getAccountBalance(form.value.accountId)) {
    $q.dialog({
      title: 'Недостаточно средств',
      message: `На счёте недостаточно средств. Пополни счёт "${accountOpts.find(a => a.value === form.value.accountId)?.label}"`,
      ok: { label: 'OK', color: 'primary' }
    });
    return;
  }

  if (form.value.type === 'transfer') {
    if (form.value.amount > getAccountBalance(form.value.fromId)) {
      $q.dialog({
        title: 'Недостаточно средств',
        message: `На счёте недостаточно средств. Пополни счёт "${accountOpts.find(a => a.value === form.value.fromId)?.label}"`,
        ok: { label: 'OK', color: 'primary' }
      });
      return;
    }
    const t1 = { id: uuidv4(), accountId: form.value.fromId, type: 'transfer', amount: form.value.amount, date: form.value.date, note: form.value.note, createdAt: now, updatedAt: now, isTransferFrom: true, transferToId: form.value.toId };
    const t2 = { id: uuidv4(), accountId: form.value.toId, type: 'transfer', amount: form.value.amount, date: form.value.date, note: form.value.note, createdAt: now, updatedAt: now, isTransferFrom: false, transferToId: form.value.fromId };
    saveTransaction(t1);
    saveTransaction(t2);
  } else {
    const t = { id: uuidv4(), accountId: form.value.accountId, type: form.value.type, amount: form.value.amount, date: form.value.date, note: form.value.note, categoryId: form.value.categoryId, createdAt: now, updatedAt: now };
    saveTransaction(t);
  }

  transactions.value = getTransactions();
  showDialog.value = false;
};

const remove = (id: string) => {
  deleteTransaction(id);
  transactions.value = getTransactions();
};

const openCategoryDialog = (transaction: any) => {
  categoryForm.value = {
    id: transaction.id,
    type: transaction.type,
    categoryId: transaction.categoryId || ''
  };
  showCategoryDialog.value = true;
};

const saveCategoryEdit = () => {
  if (!categoryForm.value.id) return;
  updateTransaction(categoryForm.value.id, { categoryId: categoryForm.value.categoryId });
  transactions.value = getTransactions();
  showCategoryDialog.value = false;
};

const openDialog = (event?: Event | 'expense' | 'income' | 'transfer') => {
  const eventType = typeof event === 'string' ? event : undefined;
  const detail = typeof event === 'string' ? undefined : (event as CustomEvent<{ type?: 'expense' | 'income' | 'transfer' }>)?.detail;
  form.value = { type: eventType || detail?.type || 'expense', accountId: 'general-cash', fromId: 'general-cash', toId: 'general-card', categoryId: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' };
  showDialog.value = true;
};

const openFromRoute = () => {
  const pendingAdd = sessionStorage.getItem('pending-add-transaction');
  const add = route.query.add || pendingAdd;
  if (add === 'expense' || add === 'income' || add === 'transfer') {
    sessionStorage.removeItem('pending-add-transaction');
    nextTick(() => openDialog(add));
    const query = { ...route.query };
    delete query.add;
    router.replace({ path: route.path, query });
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    openDialog();
  }
};

const handleDataUpdated = () => {
  categories.value = getCategories();
  transactions.value = getTransactions();
};

onMounted(() => {
  categories.value = getCategories();
  transactions.value = getTransactions();
  openFromRoute();

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('open-add-transaction', openDialog);
  window.addEventListener('dataUpdated', handleDataUpdated);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('open-add-transaction', openDialog);
  window.removeEventListener('dataUpdated', handleDataUpdated);
});

watch(() => route.query.add, () => openFromRoute());
</script>
