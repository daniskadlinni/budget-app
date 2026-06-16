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

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-sm">Аналитика</div>
        <div class="row q-gutter-sm">
          <div class="col">
            <div class="text-caption text-grey">Одометр (текущий)</div>
            <q-input v-model.number="totalKm" type="number" dense suffix="км" @blur="saveCarSettings" />
          </div>
        </div>
        <div class="row q-gutter-sm q-mt-sm">
          <div class="col">
            <div class="text-caption text-grey">Расход на 100 км</div>
            <div class="text-h6">{{ consumptionPer100km }} л</div>
          </div>
          <div class="col">
            <div class="text-caption text-grey">Стоимость на 100 км</div>
            <div class="text-h6">{{ costPer100km }} ₽</div>
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
          <q-input v-model="newLiters" type="number" label="Количество литров" suffix="л" @update:model-value="calcAmount" />
          <q-input v-model="newPricePerLiter" type="number" label="Цена за литр" suffix="₽/л" class="q-mt-sm" @update:model-value="calcAmount" />
          <q-input v-model="newMileage" type="number" label="Одометр" suffix="км" class="q-mt-sm" />
          <q-input v-model="newAmount" type="number" label="Сумма" suffix="₽" class="q-mt-sm" readonly />
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
import { getTransactions, deleteTransaction as delTrans, saveTransaction, formatNumber } from 'src/utils/storage';

const showAddDialog = ref(false);
const newAmount = ref(0);
const newLiters = ref(0);
const newPricePerLiter = ref(0);
const newMileage = ref(0);
const newDate = ref(new Date().toISOString().split('T')[0]);
const newNote = ref('');
const refreshKey = ref(0);

const calcAmount = () => {
  newAmount.value = (newLiters.value || 0) * (newPricePerLiter.value || 0);
};

const totalKm = ref(parseInt(localStorage.getItem('car_total_km') || '0', 10));

const totalMileageFromTransactions = computed(() => {
  refreshKey.value;
  const fuelTransactions = getTransactions()
    .filter(t => t.categoryId === 'fuel' && t.mileage)
    .sort((a, b) => a.date.localeCompare(b.date));

  let totalMileage = 0;
  for (let i = 1; i < fuelTransactions.length; i++) {
    const prev = parseFloat(fuelTransactions[i - 1].mileage) || 0;
    const curr = parseFloat(fuelTransactions[i].mileage) || 0;
    if (curr > prev) {
      totalMileage += curr - prev;
    }
  }
  return totalMileage;
});

const consumptionPer100km = computed(() => {
  refreshKey.value;
  const km = totalMileageFromTransactions.value || totalKm.value;

  if (!km) return '0';

  const fuelTransactions = getTransactions().filter(t => t.categoryId === 'fuel');

  const totalFuel = fuelTransactions.reduce((s, t) => s + (parseFloat(t.liters) || 0), 0);
  const totalSpent = fuelTransactions.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

  if (totalFuel > 0) {
    const consumption = (totalFuel / km) * 100;
    return consumption.toFixed(1);
  }

  if (totalSpent > 0 && newPricePerLiter.value > 0) {
    const estimatedLiters = totalSpent / newPricePerLiter.value;
    const consumption = (estimatedLiters / km) * 100;
    return consumption.toFixed(1);
  }

  return '0';
});

const costPer100km = computed(() => {
  refreshKey.value;
  const km = totalMileageFromTransactions.value || totalKm.value;
  if (!km) return '0';
  const cost = monthlySpent.value / km * 100;
  return formatNumber(cost);
});

const saveCarSettings = () => {
  localStorage.setItem('car_total_km', parseInt(totalKm.value.toString(), 10).toString());
};

const fuelTransactions = computed(() => {
  refreshKey.value;
  return getTransactions()
    .filter(t => t.categoryId === 'fuel')
    .sort((a, b) => b.date.localeCompare(a.date));
});

const monthlySpent = computed(() => {
  refreshKey.value;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return getTransactions()
    .filter(t => t.categoryId === 'fuel' && t.type === 'expense' && t.date.startsWith(monthKey))
    .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
});

const weeklySpent = computed(() => {
  refreshKey.value;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekKey = weekAgo.toISOString().split('T')[0];
  return getTransactions()
    .filter(t => t.categoryId === 'fuel' && t.type === 'expense' && t.date >= weekKey)
    .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
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
    mileage: newMileage.value || null,
    liters: newLiters.value || null,
    pricePerLiter: newPricePerLiter.value || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  if (newMileage.value) {
    totalKm.value = parseInt(newMileage.value.toString(), 10);
    saveCarSettings();
  }
  newAmount.value = 0;
  newLiters.value = 0;
  newPricePerLiter.value = 0;
  newMileage.value = 0;
  newNote.value = '';
  showAddDialog.value = false;
  refreshKey.value++;
};

const deleteTransaction = (id: string) => {
  delTrans(id);
  refreshKey.value++;
};

const handleAddFuel = () => {
  refreshKey.value++;
  showAddDialog.value = true;
};

onMounted(() => {
  window.addEventListener('open-add-fuel', handleAddFuel);
});

onUnmounted(() => {
  window.removeEventListener('open-add-fuel', handleAddFuel);
});
</script>
