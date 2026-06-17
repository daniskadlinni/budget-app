<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">Регулярные платежи</div>
      <q-btn color="primary" icon="add" label="Добавить" @click="openAdd" />
    </div>

    <q-banner v-if="dueSubscriptions.length" rounded class="bg-warning text-dark q-mb-md">
      К оплате: {{ dueSubscriptions.length }} платеж(а)
    </q-banner>

    <q-list v-if="subscriptions.length" separator>
      <q-item v-for="sub in sortedSubscriptions" :key="sub.id">
        <q-item-section avatar>
          <q-icon :name="sub.active ? 'event_repeat' : 'pause_circle'" :color="sub.active ? 'primary' : 'grey'" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ sub.name }}</q-item-label>
          <q-item-label caption>
            {{ formatNumber(sub.amount) }} ₽ · {{ intervalLabel(sub.interval) }} · следующее списание {{ formatDate(sub.nextDate) }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row no-wrap q-gutter-xs">
            <q-btn flat round dense icon="payments" color="positive" @click="paySubscription(sub)" />
            <q-btn flat round dense icon="edit" @click="editSubscription(sub)" />
            <q-btn flat round dense icon="delete" color="negative" @click="remove(sub.id)" />
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <div v-else class="empty-state q-pa-lg text-center">
      <q-icon name="event_repeat" size="48px" color="grey" />
      <div class="text-h6 q-mt-sm">Нет регулярных платежей</div>
      <q-btn color="primary" icon="add" label="Добавить первый" class="q-mt-md" @click="openAdd" />
    </div>

    <q-dialog v-model="showDialog">
      <q-card style="min-width: 350px">
        <q-card-section><div class="text-h6">{{ editing ? 'Редактировать' : 'Новый платеж' }}</div></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-input v-model="form.name" label="Название" filled />
            <q-input v-model.number="form.amount" label="Сумма" type="number" filled />
            <q-select v-model="form.accountId" :options="accountOptions" label="Счёт" emit-value map-options filled />
            <q-select v-model="form.categoryId" :options="categoryOptions" label="Категория" emit-value map-options filled clearable />
            <q-select v-model="form.interval" :options="intervalOptions" label="Повтор" emit-value map-options filled />
            <q-input v-model="form.nextDate" type="date" label="Следующее списание" filled />
            <q-toggle v-model="form.active" label="Активен" />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Сохранить" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { v4 as uuidv4 } from 'uuid';
import { deleteSubscription, formatNumber, getCategories, getSubscriptions, saveSubscription, saveTransaction } from 'src/utils/storage';

const $q = useQuasar();
const subscriptions = ref<any[]>([]);
const showDialog = ref(false);
const editing = ref<any>(null);
const form = ref({
  id: '',
  name: '',
  amount: '',
  accountId: 'general-card',
  categoryId: 'subscriptions',
  interval: 'monthly',
  nextDate: new Date().toISOString().split('T')[0],
  active: true
});

const accountOptions = [
  { label: 'Общий — Наличные', value: 'general-cash' },
  { label: 'Общий — Карта', value: 'general-card' },
  { label: 'Накопительный', value: 'savings' }
];

const intervalOptions = [
  { label: 'Еженедельно', value: 'weekly' },
  { label: 'Ежемесячно', value: 'monthly' },
  { label: 'Ежегодно', value: 'yearly' }
];

const categoryOptions = computed(() =>
  getCategories()
    .filter((category: any) => category.type === 'expense')
    .map((category: any) => ({ label: category.name, value: category.id }))
);

const sortedSubscriptions = computed(() =>
  [...subscriptions.value].sort((a, b) => (a.nextDate || '').localeCompare(b.nextDate || ''))
);

const dueSubscriptions = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return subscriptions.value.filter(sub => sub.active && sub.nextDate <= today);
});

const intervalLabel = (interval: string) => {
  if (interval === 'weekly') return 'еженедельно';
  if (interval === 'yearly') return 'ежегодно';
  return 'ежемесячно';
};

const formatDate = (date: string) => new Date(date).toLocaleDateString('ru-RU');

const addInterval = (date: string, interval: string) => {
  const next = new Date(date);
  if (interval === 'weekly') next.setDate(next.getDate() + 7);
  else if (interval === 'yearly') next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next.toISOString().split('T')[0];
};

const load = () => {
  subscriptions.value = getSubscriptions();
};

const openAdd = () => {
  editing.value = null;
  form.value = {
    id: '',
    name: '',
    amount: '',
    accountId: 'general-card',
    categoryId: 'subscriptions',
    interval: 'monthly',
    nextDate: new Date().toISOString().split('T')[0],
    active: true
  };
  showDialog.value = true;
};

const editSubscription = (sub: any) => {
  editing.value = sub;
  form.value = { ...sub };
  showDialog.value = true;
};

const save = () => {
  if (!form.value.name || !form.value.amount || !form.value.nextDate) return;
  saveSubscription({ ...form.value, id: editing.value?.id || form.value.id });
  load();
  showDialog.value = false;
};

const remove = (id: string) => {
  $q.dialog({ title: 'Удалить', message: 'Удалить регулярный платеж?', cancel: true }).onOk(() => {
    deleteSubscription(id);
    load();
  });
};

const paySubscription = (sub: any) => {
  const now = new Date().toISOString();
  saveTransaction({
    id: uuidv4(),
    accountId: sub.accountId || 'general-card',
    type: 'expense',
    amount: parseFloat(sub.amount),
    date: new Date().toISOString().split('T')[0],
    note: sub.name,
    categoryId: sub.categoryId || 'subscriptions',
    createdAt: now,
    updatedAt: now
  });
  saveSubscription({ ...sub, nextDate: addInterval(sub.nextDate, sub.interval), updatedAt: now });
  load();
  $q.notify({ message: 'Платеж добавлен в операции', color: 'positive' });
};

onMounted(() => {
  load();
  window.addEventListener('dataUpdated', load);
  window.addEventListener('open-add-subscription', openAdd);
});
</script>
