<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Финансовые цели</div>

    <q-btn color="primary" icon="add" label="Новая цель" class="q-mb-md" @click="openAdd" />

    <q-list separator>
      <q-item v-for="goal in goals" :key="goal.id">
        <q-item-section avatar>
          <q-icon name="flag" :color="goal.completed ? 'positive' : 'primary'" />
        </q-item-section>
<q-item-section>
              <q-item-label>{{ goal.name }}</q-item-label>
              <q-item-label caption>
                {{ formatNumber(goal.current) }} / {{ formatNumber(goal.target) }} RUB
                {{ goal.deadline ? 'до ' + formatDate(goal.deadline) : '' }}
              </q-item-label>
              <q-linear-progress :value="Math.min(goal.current / goal.target, 1)" color="primary" size="10px" class="q-mt-xs" />
            </q-item-section>
            <q-item-section side>
              <q-btn flat round icon="edit" @click="editGoal(goal)" />
              <q-btn flat round icon="add" color="positive" @click="fundGoal(goal)" />
              <q-btn flat round icon="delete" color="negative" @click="remove(goal.id)" />
        </q-item-section>
      </q-item>
    </q-list>

    <q-dialog v-model="showDialog">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">{{ editing ? 'Редактировать' : 'Новая цель' }}</div></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-input v-model="form.name" label="Название" filled />
            <q-input v-model.number="form.target" label="Цель (RUB)" type="number" filled />
            <q-input v-model.number="form.current" label="Текущая сумма" type="number" filled />
            <q-input v-model="form.deadline" type="date" label="Срок" filled />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Сохранить" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showFund">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Пополнить "{{ fundTarget?.name }}"</div></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-input v-model.number="fundAmount" label="Сумма пополнения" type="number" filled />
            <q-select v-model="fundAccount" :options="accountOpts" label="Счёт списания" emit-value map-options filled />
            <q-btn color="positive" label="Пополнить" class="full-width" @click="doFund" />
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getGoals, saveGoal, deleteGoal, formatNumber, getAccountBalance, saveTransaction } from 'src/utils/storage';
import { v4 as uuidv4 } from 'uuid';

const goals = ref<any[]>([]);
const showDialog = ref(false);
const editing = ref<any>(null);
const form = ref({ name: '', target: 0, current: 0, deadline: '' });

const openAdd = () => {
  editing.value = null;
  form.value = { name: '', target: 0, current: 0, deadline: '' };
  showDialog.value = true;
};

const editGoal = (goal: any) => {
  editing.value = goal;
  form.value = { name: goal.name, target: goal.target, current: goal.current, deadline: goal.deadline || '' };
  showDialog.value = true;
};

const save = () => {
  if (!form.value.name || !form.value.target) return;
  saveGoal({ ...form.value, id: editing.value?.id });
  goals.value = getGoals();
  showDialog.value = false;
};

const remove = (id: string) => {
  deleteGoal(id);
  goals.value = getGoals();
};

const fundGoal = (goal: any) => {
  fundTarget.value = goal;
  fundAmount.value = 0;
  showFund.value = true;
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU');

const showFund = ref(false);
const fundTarget = ref<any>(null);
const fundAmount = ref(0);
const fundAccount = ref('general-cash');

const accountOpts = [
  { label: 'Общий — Наличные', value: 'general-cash' },
  { label: 'Общий — Карта', value: 'general-card' },
  { label: 'Накопительный', value: 'savings' }
];

onMounted(() => {
  goals.value = getGoals();

  window.addEventListener('dataUpdated', () => {
    goals.value = getGoals();
  });
});

const doFund = () => {
  if (!fundAmount.value || fundAmount.value <= 0) return;
  if (fundAmount.value > getAccountBalance(fundAccount.value)) {
    return;
  }
  const now = new Date().toISOString();
  const t = { id: uuidv4(), accountId: fundAccount.value, type: 'expense', amount: fundAmount.value, date: now.split('T')[0], note: `Пополнение цели: ${fundTarget.value.name}`, categoryId: '', createdAt: now, updatedAt: now };
  saveTransaction(t);
  fundTarget.value.current = (fundTarget.value.current || 0) + fundAmount.value;
  if (fundTarget.value.current >= fundTarget.value.target) fundTarget.value.completed = true;
  saveGoal(fundTarget.value);
  goals.value = getGoals();
  showFund.value = false;
};
</script>