<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Магазины</div>

    <q-btn color="primary" icon="add" label="Добавить магазин" class="q-mb-md" @click="openAddDialog" />

    <q-list separator>
      <q-item v-for="store in stores" :key="store.id">
        <q-item-section>
          <q-item-label>{{ store.name }}</q-item-label>
          <q-item-label caption>Товаров: {{ getProductCount(store.id) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn flat round dense icon="edit" @click="editStore(store)" />
          <q-btn flat round dense icon="delete" color="negative" @click="deleteStore(store.id)" />
        </q-item-section>
      </q-item>
      <q-item v-if="stores.length === 0">
        <q-item-section class="text-grey">Нет магазинов</q-item-section>
      </q-item>
    </q-list>

    <q-dialog v-model="showDialog">
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">{{ editing ? 'Редактировать' : 'Добавить магазин' }}</div></q-card-section>
        <q-card-section>
          <q-input v-model="form.name" label="Название магазина" filled />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Сохранить" @click="saveStore" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { getStores, saveStore as sStore, deleteStore as dStore, getProducts } from 'src/utils/storage';

const $q = useQuasar();

const stores = ref<any[]>([]);
const products = ref<any[]>([]);
const showDialog = ref(false);
const editing = ref(false);
const form = ref({ id: '', name: '' });

const getProductCount = (storeId: string) => products.value.filter(p => p.storeId === storeId).length;

const openAddDialog = () => {
  editing.value = false;
  form.value = { id: '', name: '' };
  showDialog.value = true;
};

const editStore = (store: any) => {
  editing.value = true;
  form.value = { ...store };
  showDialog.value = true;
};

const saveStore = () => {
  sStore(form.value);
  stores.value = getStores();
  showDialog.value = false;
};

const deleteStore = (id: string) => {
  $q.dialog({ title: 'Удалить', message: 'Удалить магазин?', cancel: true }).onOk(() => {
    dStore(id);
    stores.value = getStores();
  });
};

onMounted(() => {
  stores.value = getStores();
  products.value = getProducts();
  window.addEventListener('dataUpdated', () => {
    stores.value = getStores();
    products.value = getProducts();
  });
});
</script>
