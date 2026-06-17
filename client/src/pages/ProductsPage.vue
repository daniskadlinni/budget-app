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
          <q-btn flat round dense icon="show_chart" color="secondary" @click="openPriceHistory(product)" />
          <q-btn flat round dense icon="edit" @click="editProduct(product)" />
          <q-btn flat round dense icon="add_shopping_cart" color="primary" @click="addToShopping(product)" />
          <q-btn flat round dense icon="delete" color="negative" @click="deleteProduct(product.id)" />
        </q-item-section>
      </q-item>
      <q-item v-if="products.length === 0">
        <q-item-section class="text-center q-pa-lg">
          <q-icon name="inventory" size="48px" color="grey" />
          <div class="text-h6 q-mt-sm">Нет товаров</div>
          <q-btn color="primary" icon="add" label="Добавить товар" class="q-mt-md" @click="openAddDialog" />
        </q-item-section>
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

    <q-dialog v-model="showHistoryDialog">
      <q-card style="min-width: min(92vw, 560px)">
        <q-card-section>
          <div class="text-h6">{{ selectedProduct?.name }}</div>
          <div class="text-caption text-grey">Динамика цены</div>
        </q-card-section>
        <q-card-section>
          <div v-if="priceHistory.length" style="height: 260px">
            <Line :data="priceChartData" :options="priceChartOptions" />
          </div>
          <div v-else class="text-grey q-pa-md">Истории цен пока нет</div>
        </q-card-section>
        <q-list v-if="priceHistory.length" separator>
          <q-item v-for="point in priceHistory" :key="point.key">
            <q-item-section>
              <q-item-label>{{ formatDate(point.date) }}</q-item-label>
              <q-item-label caption>{{ getStoreName(point.storeId) }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label>{{ formatNumber(point.price) }} ₽</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-actions align="right">
          <q-btn flat label="Закрыть" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { getProducts, getShoppingItems, saveProduct as sProduct, deleteProduct as dProduct, addProductToShopping, getStores, formatNumber } from 'src/utils/storage';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const $q = useQuasar();

const products = ref<any[]>([]);
const stores = ref<any[]>([]);
const showDialog = ref(false);
const showHistoryDialog = ref(false);
const editing = ref(false);
const form = ref({ id: '', name: '', storeId: '', plannedPrice: '', lastPrice: '' });
const selectedProduct = ref<any>(null);

const getStoreName = (id: string) => stores.value.find(s => s.id === id)?.name || '';
const formatDate = (date: string) => new Date(date).toLocaleDateString('ru-RU');

const priceHistory = computed(() => {
  const history = selectedProduct.value?.priceHistory || [];
  const purchasedItems = getShoppingItems()
    .filter((item: any) => item.productId === selectedProduct.value?.id && item.purchased && item.actualPrice)
    .map((item: any) => ({
      key: `shopping-${item.id}`,
      date: (item.purchasedAt || item.updatedAt || item.createdAt || '').split('T')[0],
      price: item.actualPrice,
      storeId: item.storeId || '',
      shoppingItemId: item.id
    }));
  const unique = new Map([...history, ...purchasedItems].map((point: any) => [point.key, point]));
  return [...unique.values()].sort((a: any, b: any) => b.date.localeCompare(a.date));
});

const priceChartData = computed(() => {
  const points = [...priceHistory.value].reverse();
  return {
    labels: points.map((point: any) => formatDate(point.date)),
    datasets: [{
      label: 'Цена',
      data: points.map((point: any) => point.price),
      borderColor: '#1976D2',
      backgroundColor: '#1976D2',
      tension: 0.25
    }]
  };
});

const priceChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } }
};

const openAddDialog = () => {
  editing.value = false;
  form.value = { id: '', name: '', storeId: '', plannedPrice: '', lastPrice: '' };
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

const openPriceHistory = (product: any) => {
  selectedProduct.value = product;
  showHistoryDialog.value = true;
};

onMounted(() => {
  products.value = getProducts();
  stores.value = getStores();
  window.addEventListener('dataUpdated', () => {
    products.value = getProducts();
    stores.value = getStores();
  });
  window.addEventListener('open-add-product', () => openAddDialog());
});
</script>
