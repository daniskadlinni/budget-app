<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Бюджет на месяц</div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="col">
            <div class="text-caption text-grey">Лимит</div>
            <div class="text-h6">{{ formatNumber(budgetLimit) }} RUB</div>
          </div>
          <q-btn flat color="primary" icon="edit" @click="editLimit = true" />
        </div>

        <q-linear-progress :value="progress" color="negative" size="20px" class="q-mb-sm" />
        <div class="row justify-between">
          <span class="text-negative">{{ formatNumber(spent) }} потрачено</span>
          <span class="text-grey">{{ formatNumber(remaining) }} осталось</span>
        </div>
      </q-card-section>
    </q-card>

    <q-dialog v-model="editLimit">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Лимит бюджета</div></q-card-section>
        <q-card-section>
          <q-input v-model.number="newLimit" type="number" label="Сумма" filled />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Сохранить" @click="saveLimit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-card>
      <q-card-section>
        <div class="text-h6">Подписки и автоплатежи</div>
      </q-card-section>
      <q-card-section>
        <q-list separator>
          <q-item v-for="sub in subscriptions" :key="sub.id">
            <q-item-section avatar>
              <q-icon name="repeat" :color="sub.active ? 'primary' : 'grey'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ sub.name }}</q-item-label>
              <q-item-label caption>{{ sub.amount }} {{ sub.currency }} — каждые {{ sub.interval }} дней</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn flat round icon="delete" color="negative" @click="remove(sub.id)" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-section>
        <q-btn color="primary" icon="add" label="Добавить подписку" @click="showAdd = true" />
      </q-card-section>
    </q-card>

    <q-dialog v-model="showAdd">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Новая подписка</div></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-input v-model="form.name" label="Название" filled />
            <q-input v-model.number="form.amount" label="Сумма" type="number" filled />
            <q-select v-model="form.currency" :options="['RUB','USD','EUR']" label="Валюта" filled />
            <q-input v-model.number="form.interval" label="Интервал (дней)" type="number" filled />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Сохранить" @click="addSub" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getBudget, setBudget, getMonthlySpent, getSubscriptions, saveSubscription, deleteSubscription, formatNumber } from 'src/utils/storage';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const editLimit = ref(false);
const showAdd = ref(false);
const newLimit = ref(0);
const budgetLimit = ref(0);
const spent = ref(0);

const form = ref({ name: '', amount: 0, currency: 'RUB', interval: 30 });
const subscriptions = ref<any[]>([]);

const progress = computed(() => {
  if (!budgetLimit.value) return 0;
  const p = spent.value / budgetLimit.value;
  return p > 1 ? 1 : p;
});

const remaining = computed(() => Math.max(0, budgetLimit.value - spent.value));

const saveLimit = () => {
  setBudget(newLimit.value);
  budgetLimit.value = newLimit.value;
  editLimit.value = false;
  $q.notify({ message: 'Лимит сохранён', color: 'positive' });
};

const addSub = () => {
  if (!form.value.name || !form.value.amount) return;
  saveSubscription({ ...form.value, active: true });
  subscriptions.value = getSubscriptions();
  showAdd.value = false;
  form.value = { name: '', amount: 0, currency: 'RUB', interval: 30 };
};

const remove = (id: string) => {
  deleteSubscription(id);
  subscriptions.value = getSubscriptions();
};

onMounted(() => {
  const budget = getBudget();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  budgetLimit.value = budget[monthKey] || 0;
  newLimit.value = budgetLimit.value;
  spent.value = getMonthlySpent();
  subscriptions.value = getSubscriptions();
});
</script>