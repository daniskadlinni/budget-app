<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Бюджет</div>

    <div class="text-h6 q-mb-md">Общий месячный лимит: {{ formatNumber(totalBudget) }} RUB</div>

    <q-btn color="primary" icon="add" label="Добавить бюджет" class="q-mb-md" @click="openAdd" />

    <q-card v-for="budget in budgets" :key="budget.id" class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="text-h6">{{ budget.name }}</div>
          <div class="row items-center q-gutter-sm">
            <q-btn flat round icon="edit" @click="editBudget(budget)" />
            <q-btn flat round icon="delete" color="negative" @click="remove(budget.id)" />
          </div>
        </div>
        <div class="row q-mt-sm items-center">
          <div class="col">
            <q-linear-progress :value="Math.min(budget.spent / budget.limit, 1)" :color="budget.spent > budget.limit ? 'negative' : 'primary'" size="15px" class="q-mr-sm" />
          </div>
          <div class="text-caption q-ml-sm" :class="budget.spent > budget.limit ? 'text-negative' : 'text-grey'">
            {{ formatNumber(budget.spent) }} / {{ formatNumber(budget.limit) }}
          </div>
        </div>
        <div v-if="budget.spent > budget.limit" class="text-negative q-mt-xs text-caption">
          Превышен на {{ formatNumber(budget.spent - budget.limit) }} RUB
        </div>
      </q-card-section>
    </q-card>

    <q-dialog v-model="showDialog">
      <q-card style="min-width: 350px">
        <q-card-section><div class="text-h6">{{ editing ? 'Редактировать' : 'Новый бюджет' }}</div></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-input v-model="form.name" label="Название" filled />
            <q-input v-model.number="form.limit" label="Лимит (RUB)" type="number" filled />
            <q-select v-model="form.categoryIds" :options="categoryOpts" label="Категории" multiple emit-value map-options filled clearable />
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
import { ref, computed, onMounted } from 'vue';
import { getBudgets, saveBudget, deleteBudget, getMonthlySpent, getCategories, formatNumber } from 'src/utils/storage';

const budgets = ref<any[]>([]);
const categories = ref<any[]>([]);
const showDialog = ref(false);
const editing = ref<any>(null);
const form = ref({ name: '', limit: '', categoryIds: [] as string[] });

const categoryOpts = computed(() =>
  categories.value
    .filter(c => c.type === 'expense')
    .map(c => ({ label: c.name, value: c.id }))
);

const totalBudget = computed(() => budgets.value.reduce((s, b) => s + b.limit, 0));

const loadBudgets = () => {
  const stored = getBudgets();

  budgets.value = stored.map((b: any) => ({
    ...b,
    spent: getMonthlySpent(b.categoryIds)
  }));
};

const openAdd = () => {
  editing.value = null;
  form.value = { name: '', limit: '', categoryIds: [] };
  showDialog.value = true;
};

const editBudget = (budget: any) => {
  editing.value = budget;
  form.value = { name: budget.name, limit: budget.limit, categoryIds: budget.categoryIds || [] };
  showDialog.value = true;
};

const save = () => {
  if (!form.value.name || !form.value.limit) return;
  saveBudget({ ...form.value, id: editing.value?.id });
  loadBudgets();
  showDialog.value = false;
};

const remove = (id: string) => {
  deleteBudget(id);
  loadBudgets();
};

onMounted(() => {
  categories.value = getCategories();
  loadBudgets();

  window.addEventListener('dataUpdated', () => {
    budgets.value = getBudgets();
  });
  window.addEventListener('open-add-transaction', () => openAdd());
});
</script>
