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
          <div v-if="priceHistory.length" class="row q-col-gutter-sm q-mb-md">
            <div class="col-6 col-sm-3">
              <q-card flat bordered><q-card-section class="q-pa-sm">
                <div class="text-caption text-grey">Минимум</div>
                <div>{{ formatNumber(priceStats.min) }} ₽</div>
              </q-card-section></q-card>
            </div>
            <div class="col-6 col-sm-3">
              <q-card flat bordered><q-card-section class="q-pa-sm">
                <div class="text-caption text-grey">Средняя</div>
                <div>{{ formatNumber(priceStats.avg) }} ₽</div>
              </q-card-section></q-card>
            </div>
            <div class="col-6 col-sm-3">
              <q-card flat bordered><q-card-section class="q-pa-sm">
                <div class="text-caption text-grey">Максимум</div>
                <div>{{ formatNumber(priceStats.max) }} ₽</div>
              </q-card-section></q-card>
            </div>
            <div class="col-6 col-sm-3">
              <q-card flat bordered><q-card-section class="q-pa-sm">
                <div class="text-caption text-grey">Изменение</div>
                <div :class="priceStats.change >= 0 ? 'text-negative' : 'text-positive'">{{ priceStats.changeText }}</div>
              </q-card-section></q-card>
            </div>
          </div>
          <q-banner v-if="priceStats.bestStore" rounded class="bg-blue-1 text-primary q-mb-md">
            Обычно дешевле: {{ priceStats.bestStore }} · {{ formatNumber(priceStats.bestStoreAvg) }} ₽
          </q-banner>
          <q-banner v-if="repeatHint" rounded class="bg-green-1 text-positive q-mb-md">
            {{ repeatHint }}
          </q-banner>
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

const priceStats = computed(() => {
  const points = priceHistory.value;
  if (!points.length) return { min: 0, avg: 0, max: 0, change: 0, changeText: '0%', bestStore: '', bestStoreAvg: 0 };
  const prices = points.map((point: any) => parseFloat(point.price) || 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const latest = points[0]?.price || 0;
  const previous = points[1]?.price || latest;
  const change = previous ? ((latest - previous) / previous) * 100 : 0;

  const storeBuckets = new Map<string, number[]>();
  points.forEach((point: any) => {
    if (!point.storeId) return;
    const bucket = storeBuckets.get(point.storeId) || [];
    bucket.push(parseFloat(point.price) || 0);
    storeBuckets.set(point.storeId, bucket);
  });
  const [bestStoreId, bestStorePrices] = [...storeBuckets.entries()]
    .map(([storeId, storePrices]) => [storeId, storePrices, storePrices.reduce((sum, price) => sum + price, 0) / storePrices.length] as const)
    .sort((a, b) => a[2] - b[2])[0] || ['', [], 0];

  return {
    min,
    avg,
    max,
    change,
    changeText: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
    bestStore: getStoreName(bestStoreId),
    bestStoreAvg: bestStorePrices.length ? bestStorePrices.reduce((sum, price) => sum + price, 0) / bestStorePrices.length : 0
  };
});

const repeatHint = computed(() => {
  const points = [...priceHistory.value].reverse();
  if (points.length < 3) return '';
  const intervals: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const previous = new Date(points[i - 1].date).getTime();
    const current = new Date(points[i].date).getTime();
    const days = Math.round((current - previous) / (24 * 60 * 60 * 1000));
    if (days > 0) intervals.push(days);
  }
  if (!intervals.length) return '';
  const avgDays = Math.round(intervals.reduce((sum, days) => sum + days, 0) / intervals.length);
  const lastDate = new Date(points[points.length - 1].date).getTime();
  const daysSince = Math.round((Date.now() - lastDate) / (24 * 60 * 60 * 1000));
  return `Обычно покупается раз в ${avgDays} дн. · прошло ${daysSince} дн.`;
});

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
