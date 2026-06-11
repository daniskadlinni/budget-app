<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Напоминания</div>

    <q-btn color="primary" icon="add" label="Добавить напоминание" class="q-mb-md" @click="openAddDialog" />

    <q-list separator>
      <q-item v-for="reminder in reminders" :key="reminder.id">
        <q-item-section avatar>
          <q-checkbox :model-value="reminder.active" @update:model-value="toggleActive(reminder.id)" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label :class="{ 'text-grey': !reminder.active }">{{ reminder.title }}</q-item-label>
          <q-item-label caption>{{ formatDate(reminder.date) }} | {{ reminder.repeat ? 'Повторяется' : 'Одноразовое' }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn flat round dense icon="edit" @click="editReminder(reminder)" />
          <q-btn flat round dense icon="delete" color="negative" @click="deleteReminder(reminder.id)" />
        </q-item-section>
      </q-item>
      <q-item v-if="reminders.length === 0">
        <q-item-section class="text-grey">Нет напоминаний</q-item-section>
      </q-item>
    </q-list>

    <q-dialog v-model="showDialog">
      <q-card style="min-width: 350px">
        <q-card-section><div class="text-h6">{{ editing ? 'Редактировать' : 'Добавить напоминание' }}</div></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-input v-model="form.title" label="Название" filled />
            <q-select v-model="form.storeId" :options="storeOptions" label="Магазин" emit-value map-options filled clearable />
            <q-select v-model="form.productId" :options="productOptions" label="Товар" emit-value map-options filled clearable />
            <q-input v-model="form.date" label="Дата и время" type="datetime-local" filled />
            <q-toggle v-model="form.repeat" label="Повторять" />
            <q-select v-if="form.repeat" v-model="form.repeatInterval" :options="intervalOptions" label="Интервал" filled />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Сохранить" @click="saveReminder" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { getReminders, saveReminder as sReminder, deleteReminder as dReminder, toggleReminderActive, getStores, getProducts } from 'src/utils/storage';

const $q = useQuasar();

const reminders = ref<any[]>([]);
const stores = ref<any[]>([]);
const products = ref<any[]>([]);
const showDialog = ref(false);
const editing = ref(false);
const form = ref({ id: '', title: '', date: '', repeat: false, repeatInterval: 'daily', active: true, storeId: '', productId: '' });

const intervalOptions = [
  { label: 'Ежедневно', value: 'daily' },
  { label: 'Еженедельно', value: 'weekly' },
  { label: 'Ежемесячно', value: 'monthly' }
];

const storeOptions = computed(() => stores.value.map(s => ({ label: s.name, value: s.id })));
const productOptions = computed(() => products.value.map(p => ({ label: p.name, value: p.id })));

const formatDate = (d: string) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleString('ru-RU');
};

const openAddDialog = () => {
  editing.value = false;
  const now = new Date();
  now.setDate(now.getDate() + 1);
  now.setHours(9, 0, 0, 0);
  form.value = { id: '', title: '', date: now.toISOString().slice(0, 16), repeat: false, repeatInterval: 'daily', active: true, storeId: '', productId: '' };
  showDialog.value = true;
};

const editReminder = (reminder: any) => {
  editing.value = true;
  form.value = { ...reminder, date: reminder.date?.slice(0, 16) || '' };
  showDialog.value = true;
};

const saveReminder = () => {
  sReminder(form.value);
  reminders.value = getReminders();
  showDialog.value = false;
};

const deleteReminder = (id: string) => {
  $q.dialog({ title: 'Удалить', message: 'Удалить напоминание?', cancel: true }).onOk(() => {
    dReminder(id);
    reminders.value = getReminders();
  });
};

const toggleActive = (id: string) => {
  toggleReminderActive(id);
  reminders.value = getReminders();
};

onMounted(() => {
  reminders.value = getReminders();
  stores.value = getStores();
  products.value = getProducts();
  window.addEventListener('dataUpdated', () => {
    reminders.value = getReminders();
    stores.value = getStores();
    products.value = getProducts();
  });
  window.addEventListener('open-add-reminder', openAddDialog);
});
</script>
