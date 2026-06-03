<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">Категории</div>
    </div>

    <q-tabs v-model="tab" class="q-mb-md" align="justify">
      <q-tab name="expense" label="Расходы" />
      <q-tab name="income" label="Доходы" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="expense">
        <q-list separator>
          <q-item v-for="cat in expenseCategories" :key="cat.id">
            <q-item-section avatar>
              <q-icon name="circle" :style="{ color: cat.color || '#2196f3' }" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ cat.name }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-tab-panel>

      <q-tab-panel name="income">
        <q-list separator>
          <q-item v-for="cat in incomeCategories" :key="cat.id">
            <q-item-section avatar>
              <q-icon name="circle" :style="{ color: cat.color || '#4CAF50' }" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ cat.name }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDataStore } from 'stores/data';

const dataStore = useDataStore();
const tab = ref('expense');

const expenseCategories = computed(() => dataStore.categories.filter(c => c.type === 'expense'));
const incomeCategories = computed(() => dataStore.categories.filter(c => c.type === 'income'));

const initCategories = () => {
  const defaultCategories = [
    { id: 'cat-food', name: 'Продукты', type: 'expense', color: '#FF5722' },
    { id: 'cat-transport', name: 'Транспорт', type: 'expense', color: '#2196F3' },
    { id: 'cat-entertainment', name: 'Развлечения', type: 'expense', color: '#9C27B0' },
    { id: 'cat-utilities', name: 'Коммунальные', type: 'expense', color: '#607D8B' },
    { id: 'cat-shopping', name: 'Покупки', type: 'expense', color: '#E91E63' },
    { id: 'cat-health', name: 'Здоровье', type: 'expense', color: '#F44336' },
    { id: 'cat-education', name: 'Образование', type: 'expense', color: '#3F51B5' },
    { id: 'cat-other-exp', name: 'Прочее', type: 'expense', color: '#9E9E9E' },
    { id: 'cat-salary', name: 'Зарплата', type: 'income', color: '#4CAF50' },
    { id: 'cat-bonus', name: 'Премия', type: 'income', color: '#8BC34A' },
    { id: 'cat-freelance', name: 'Левак', type: 'income', color: '#CDDC39' },
    { id: 'cat-other-inc', name: 'Прочее', type: 'income', color: '#9E9E9E' }
  ];

  defaultCategories.forEach(cat => {
    let existing = dataStore.categories.find(c => c.id === cat.id);
    if (!existing) {
      dataStore.categories.push({
        id: cat.id, userId: '', name: cat.name, type: cat.type as 'income' | 'expense',
        icon: undefined, color: cat.color
      });
    }
  });
};

onMounted(() => {
  dataStore.loadFromStorage();
  initCategories();
  dataStore.saveToStorage();
});
</script>