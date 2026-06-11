<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">Категории</div>
      <q-btn color="primary" icon="add" label="Добавить" @click="openAdd" />
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
              <q-icon name="circle" :style="{ color: cat.color }" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ cat.name }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn flat round icon="edit" @click="editCategory(cat)" />
              <q-btn flat round icon="delete" color="negative" @click="removeCategory(cat.id)" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-tab-panel>

      <q-tab-panel name="income">
        <q-list separator>
          <q-item v-for="cat in incomeCategories" :key="cat.id">
            <q-item-section avatar>
              <q-icon name="circle" :style="{ color: cat.color }" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ cat.name }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn flat round icon="edit" @click="editCategory(cat)" />
              <q-btn flat round icon="delete" color="negative" @click="removeCategory(cat.id)" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-tab-panel>
    </q-tab-panels>

    <q-dialog v-model="showDialog">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">{{ editing ? 'Редактировать' : 'Новая категория' }}</div></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-input v-model="form.name" label="Название" filled />
            <q-select v-model="form.type" :options="['expense','income']" label="Тип" emit-value map-options filled :disable="!!editing" />
            <div class="row items-center q-gutter-sm">
              <div class="text-caption">Цвет:</div>
              <q-btn v-for="c in colors" :key="c" :style="{ backgroundColor: c }" round size="sm" :flat="form.color !== c" @click="form.color = c" />
            </div>
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
import { getCategories, saveCategory, deleteCategory } from 'src/utils/storage';

const tab = ref('expense');
const showDialog = ref(false);
const editing = ref<any>(null);
const categories = ref<any[]>([]);
const form = ref({ name: '', type: 'expense', color: '#2196F3' });
const colors = ['#FF5722', '#2196F3', '#9C27B0', '#607D8B', '#E91E63', '#F44336', '#3F51B5', '#4CAF50', '#8BC34A', '#CDDC39', '#9E9E9E'];

const expenseCategories = computed(() => categories.value.filter(c => c.type === 'expense'));
const incomeCategories = computed(() => categories.value.filter(c => c.type === 'income'));

const openAdd = () => {
  editing.value = null;
  form.value = { name: '', type: tab.value, color: tab.value === 'expense' ? '#FF5722' : '#4CAF50' };
  showDialog.value = true;
};

const editCategory = (cat: any) => {
  editing.value = cat;
  form.value = { name: cat.name, type: cat.type, color: cat.color };
  showDialog.value = true;
};

const save = () => {
  if (!form.value.name) return;
  saveCategory({ ...form.value, id: editing.value?.id });
  categories.value = getCategories();
  showDialog.value = false;
};

const removeCategory = (id: string) => {
  deleteCategory(id);
  categories.value = getCategories();
};

onMounted(() => {
  categories.value = getCategories();

  window.addEventListener('dataUpdated', () => {
    categories.value = getCategories();
  });
  window.addEventListener('open-add-transaction', () => openAdd());
});
</script>