<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Товары</div>

    <q-btn color="primary" icon="add" label="Добавить товар" class="q-mb-md" @click="openAddDialog" />

    <q-list separator>
      <q-item v-for="product in products" :key="product.id">
        <q-item-section>
          <q-item-label>{{ product.name }}</q-item-label>
          <q-item-label caption>{{ getStoreName(product.storeId) }} | Цена: {{ formatNumber(product.lastPrice || product.plannedPrice || 0) }} ₽</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn flat round dense icon="edit" @click="editProduct(product)" />
          <q-btn flat round dense icon="add_shopping_cart" color="primary" @click="addToShopping(product)" />
          <q-btn flat round dense icon="delete" color="negative" @click="deleteProduct(product.id)" />
        </q-item-section>
      </q-item>
      <q-item v-if="products.length === 0">
        <q-item-section class="text-grey">Нет товаров</q-item-section>
      </q-item>
    </q-list>

    <q-dialog v-model="showDialog">
      <q-card style="min-width: 350px">
        <q-card-section><div class="text-h6">{{ editing ? 'Редактировать' : 'Добавить товар' }}</div></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-input v-model="form.name" label="Название" filled />
            <q-input v-model.number="form.plannedPrice" label="План. цена" type="number" filled />
            <q-input v-model.number="form.lastPrice" label="Последняя цена" type="number" filled />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Сохранить" @click="saveProduct" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { getProducts, saveProduct as sProduct, deleteProduct as dProduct, addProductToShopping, getStores, formatNumber } from 'src/utils/storage';

const $q = useQuasar();

const products = ref<any[]>([]);
const stores = ref<any[]>([]);
const showDialog = ref(false);
const editing = ref(false);
const form = ref({ id: '', name: '', storeId: '', plannedPrice: 0, lastPrice: 0 });

const storeOptions = computed(() => stores.value.map(s => ({ label: s.name, value: s.id })));

const getStoreName = (id: string) => stores.value.find(s => s.id === id)?.name || '';

const openAddDialog = () => {
  editing.value = false;
  form.value = { id: '', name: '', plannedPrice: 0, lastPrice: 0 };
  showDialog.value = true;
};

const editProduct = (product: any) => {
  editing.value = true;
  form.value = { ...product };
  showDialog.value = true;
};

const saveProduct = () => {
  sProduct(form.value);
  products.value = getProducts();
  showDialog.value = false;
};

const deleteProduct = (id: string) => {
  $q.dialog({ title: 'Удалить', message: 'Удалить товар?', cancel: true }).onOk(() => {
    dProduct(id);
    products.value = getProducts();
  });
};

const addToShopping = (product: any) => {
  addProductToShopping(product.id, product.storeId, product.lastPrice || product.plannedPrice);
  $q.notify({ message: 'Добавлено в список покупок', color: 'positive' });
};

onMounted(() => {
  products.value = getProducts();
  stores.value = getStores();
  window.addEventListener('dataUpdated', () => {
    products.value = getProducts();
    stores.value = getStores();
  });
});
</script>
