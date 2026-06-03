<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">Операции</div>
      <q-btn color="primary" icon="add" label="Добавить" @click="openDialog" />
    </div>

    <div class="row q-mb-md q-gutter-md">
      <q-input v-model="search" placeholder="Поиск..." dense style="min-width: 200px" clearable />
      <q-select v-model="sortBy" :options="sortOptions" label="Сортировка" dense emit-value map-options style="min-width: 150px" />
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
          <q-item-label caption>{{ formatDate(t.date) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label :class="t.type === 'income' ? 'text-positive' : t.type === 'expense' ? 'text-negative' : 'text-primary'">
            {{ t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '' }}{{ formatNumber(t.amount) }}
          </q-item-label>
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { getAccounts, getTransactions, saveTransaction, deleteTransaction, getCategories, getAccountBalance, formatNumber } from 'src/utils/storage';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const showDialog = ref(false);
const transactions = ref<any[]>([]);
const categories = ref<any[]>([]);
const search = ref('');
const sortBy = ref('date-desc');
const sortOptions = [
  { label: 'По дате ↓', value: 'date-desc' },
  { label: 'По дате ↑', value: 'date-asc' },
  { label: 'По сумме ↓', value: 'amount-desc' },
  { label: 'По сумме ↑', value: 'amount-asc' }
];

const form = ref({ type: 'expense', accountId: 'general-cash', fromId: 'general-cash', toId: 'general-card', categoryId: '', amount: 0, date: new Date().toISOString().split('T')[0], note: '' });

const types = [
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

const filteredTransactions = computed(() => {
  let list = [...transactions.value];
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

const openDialog = () => {
  form.value = { type: 'expense', accountId: 'general-cash', fromId: 'general-cash', toId: 'general-card', categoryId: '', amount: 0, date: new Date().toISOString().split('T')[0], note: '' };
  showDialog.value = true;
};

onMounted(() => {
  categories.value = getCategories();
  transactions.value = getTransactions();

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      openDialog();
    }
  });

  document.addEventListener('open-add-transaction', openDialog);
});

onUnmounted(() => {
  document.removeEventListener('open-add-transaction', openDialog);
});
</script>