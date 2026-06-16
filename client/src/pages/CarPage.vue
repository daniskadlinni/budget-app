<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Заправки</div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Статистика</div>
        <div class="row q-gutter-sm">
          <div class="col">
            <div class="text-caption text-grey">За месяц</div>
            <div class="text-h6">{{ formatNumber(monthlySpent) }} ₽</div>
          </div>
          <div class="col">
            <div class="text-caption text-grey">За неделю</div>
            <div class="text-h6">{{ formatNumber(weeklySpent) }} ₽</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section>
        <div class="text-h6 q-mb-md">Операции</div>
        <q-list v-if="fuelTransactions.length > 0" separator>
          <q-item v-for="t in fuelTransactions" :key="t.id">
            <q-item-section>
              <q-item-label>{{ formatNumber(t.amount) }} ₽</q-item-label>
              <q-item-label caption>{{ t.date }} {{ t.note ? '— ' + t.note : '' }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn flat round dense icon="delete" color="negative" @click="deleteTransaction(t.id)" />
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-center text-grey q-pa-md">Нет операций</div>
      </q-card-section>
    </q-card>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn round color="primary" size="lg" icon="add" @click="showAddDialog = true" />
    </q-page-sticky>

    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Добавить заправку</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="newAmount" type="number" label="Сумма" />
          <q-input v-model="newDate" type="date" label="Дата" class="q-mt-sm" />
          <q-input v-model="newNote" label="Примечание" class="q-mt-sm" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Добавить" @click="addFuel" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getTransactions, deleteTransaction as delTrans, saveTransaction, getAccountBalance } from 'src/utils/storage';
import { formatNumber } from 'src/utils/storage';

const showAddDialog = ref(false);
const newAmount = ref(0);
const newDate = ref(new Date().toISOString().split('T')[0]);
const newNote = ref('');

const fuelTransactions = computed(() => {
  return getTransactions()
    .filter(t => t.categoryId === 'fuel')
    .sort((a, b) => b.date.localeCompare(a.date));
});

const monthlySpent = computed(() => {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return getTransactions()
    .filter(t => t.categoryId === 'fuel' && t.type === 'expense' && t.date.startsWith(monthKey))
    .reduce((s, t) => s + t.amount, 0);
});

const weeklySpent = computed(() => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekKey = weekAgo.toISOString().split('T')[0];
  return getTransactions()
    .filter(t => t.categoryId === 'fuel' && t.type === 'expense' && t.date >= weekKey)
    .reduce((s, t) => s + t.amount, 0);
});

const addFuel = () => {
  if (!newAmount.value) return;
  saveTransaction({
    id: 'fuel-' + Date.now(),
    accountId: 'general-card',
    type: 'expense',
    amount: parseFloat(newAmount.value.toString()),
    date: newDate.value,
    note: newNote.value,
    categoryId: 'fuel',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  newAmount.value = 0;
  newNote.value = '';
  showAddDialog.value = false;
  window.dispatchEvent(new CustomEvent('dataUpdated'));
};

const deleteTransaction = (id: string) => {
  delTrans(id);
  window.dispatchEvent(new CustomEvent('dataUpdated'));
};

const handleAddFuel = () => {
  showAddDialog.value = true;
};

onMounted(() => {
  window.addEventListener('open-add-fuel', handleAddFuel);
});

onUnmounted(() => {
  window.removeEventListener('open-add-fuel', handleAddFuel);
});
</script>
