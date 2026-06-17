<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Список покупок</div>

    <q-btn color="primary" icon="add" label="Добавить" class="q-mb-md" @click="openAddDialog" />
    <q-btn v-if="selectedItems.length > 0" color="positive" icon="check" :label="`Куплено (${selectedItems.length})`" class="q-mb-md" @click="openBatchPurchaseDialog" />

    <q-btn-toggle v-model="statusFilter" toggle-color="primary" :options="[
      { label: 'Активные', value: 'active' },
      { label: 'Купленные', value: 'purchased' },
      { label: 'Все', value: 'all' }
    ]" class="q-mb-md" />

    <q-select v-if="stores.length > 0" v-model="filterStore" :options="storeOptions" label="Фильтр по магазину" clearable class="q-mb-md" />

    <q-list separator>
      <q-item v-for="item in filteredItems" :key="item.id">
        <q-item-section avatar>
          <q-checkbox v-if="!item.purchased" :model-value="selectedItems.includes(item.id)" @update:model-value="toggleSelect(item.id)" color="positive" />
          <q-icon v-else name="check_circle" color="positive" />
        </q-item-section>
        <q-item-section>
          <q-item-label :class="{ 'text-strike': item.purchased, 'text-grey-6': item.purchased }">{{ item.name }}</q-item-label>
          <q-item-label caption>{{ getStoreName(item.storeId) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="text-right">
            <div :class="{ 'text-strike': item.purchased }">{{ formatNumber(item.plannedPrice) }} ₽</div>
            <div v-if="item.purchased && item.actualPrice" class="text-positive text-caption">факт: {{ formatNumber(item.actualPrice) }} ₽</div>
          </div>
        </q-item-section>
        <q-item-section side>
          <q-btn v-if="!item.purchased" flat round dense icon="check" color="positive" @click="openPurchaseDialog(item)" />
          <q-btn flat round dense icon="edit" @click="editItem(item)" />
          <q-btn flat round dense icon="delete" color="negative" @click="deleteItem(item.id)" />
        </q-item-section>
      </q-item>
      <q-item v-if="filteredItems.length === 0">
        <q-item-section class="text-grey">Список пуст</q-item-section>
      </q-item>
    </q-list>

    <q-dialog v-model="showItemDialog">
      <q-card style="min-width: 350px">
        <q-card-section><div class="text-h6">{{ editingItem ? 'Редактировать' : 'Добавить покупку' }}</div></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-select v-model="itemForm.productId" :options="productOptions" label="Выбрать товар" emit-value map-options filled clearable @update:model-value="onProductSelect" />
            <q-input v-model="itemForm.name" label="Название" filled />
            <q-select v-model="itemForm.storeId" :options="storeOptions" label="Магазин" emit-value map-options filled />
            <q-input v-model.number="itemForm.plannedPrice" label="План. цена" type="number" filled />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Сохранить" @click="saveItem" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showPurchaseDialog">
      <q-card style="min-width: 350px">
        <q-card-section><div class="text-h6">Отметить как купленное</div></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <div>Покупка: {{ purchasingItem?.name }}</div>
            <q-input v-model.number="purchaseForm.actualPrice" label="Факт. цена" type="number" filled />
            <q-select v-model="purchaseForm.accountId" :options="accountOptions" label="Счёт" emit-value map-options filled />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="positive" label="Куплено" @click="confirmPurchase" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showBatchPurchaseDialog">
      <q-card style="min-width: 350px">
        <q-card-section><div class="text-h6">Отметить как купленное ({{ selectedItems.length }} шт.)</div></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-input v-model.number="batchPurchaseForm.actualPrice" label="Факт. цена (для всех)" type="number" filled />
            <q-select v-model="batchPurchaseForm.accountId" :options="accountOptions" label="Счёт" emit-value map-options filled />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="positive" label="Куплено" @click="confirmBatchPurchase" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { getStores, getShoppingItems, saveShoppingItem, deleteShoppingItem, markShoppingItemPurchased, getAccounts, formatNumber, getProducts } from 'src/utils/storage';

const $q = useQuasar();

const stores = ref<any[]>([]);
const products = ref<any[]>([]);
const items = ref<any[]>([]);
const filterStore = ref(null);
const statusFilter = ref<'active' | 'purchased' | 'all'>('active');
const selectedItems = ref<string[]>([]);

const showItemDialog = ref(false);
const showPurchaseDialog = ref(false);
const showBatchPurchaseDialog = ref(false);
const editingItem = ref(false);
const purchasingItem = ref(null);

const itemForm = ref({ id: '', name: '', storeId: '', plannedPrice: '', productId: '' });
const purchaseForm = ref({ actualPrice: '', accountId: 'general-cash' });
const batchPurchaseForm = ref({ actualPrice: '', accountId: 'general-cash' });

const storeOptions = computed(() => stores.value.map(s => ({ label: s.name, value: s.id })));
const productOptions = computed(() => products.value.map(p => ({ label: p.name, value: p.id })));
const accountOptions = computed(() => getAccounts().map(a => ({ label: a.name, value: a.id })));

const filteredItems = computed(() => {
  let list = [...items.value];
  if (statusFilter.value === 'active') list = list.filter(i => !i.purchased);
  if (statusFilter.value === 'purchased') list = list.filter(i => i.purchased);
  if (filterStore.value) list = list.filter(i => i.storeId === filterStore.value);
  return list;
});

const getStoreName = (id: string) => stores.value.find(s => s.id === id)?.name || '';

const openAddDialog = () => {
  editingItem.value = false;
  itemForm.value = { id: '', name: '', storeId: stores.value[0]?.id || '', plannedPrice: '', productId: '' };
  showItemDialog.value = true;
};

const onProductSelect = (productId: string) => {
  if (productId) {
    const product = products.value.find(p => p.id === productId);
    if (product) {
      itemForm.value.name = product.name;
      itemForm.value.storeId = product.storeId || itemForm.value.storeId;
      itemForm.value.plannedPrice = product.lastPrice || product.plannedPrice || 0;
    }
  }
};

const editItem = (item: any) => {
  editingItem.value = true;
  itemForm.value = { ...item, productId: item.productId || '' };
  showItemDialog.value = true;
};

const saveItem = () => {
  saveShoppingItem(itemForm.value);
  items.value = getShoppingItems();
  showItemDialog.value = false;
};

const deleteItem = (id: string) => {
  $q.dialog({ title: 'Удалить', message: 'Удалить покупку?', cancel: true }).onOk(() => {
    deleteShoppingItem(id);
    items.value = getShoppingItems();
  });
};

const openPurchaseDialog = (item: any) => {
  purchasingItem.value = item;
  purchaseForm.value = { actualPrice: item.plannedPrice || '', accountId: 'general-cash' };
  showPurchaseDialog.value = true;
};

const toggleSelect = (id: string) => {
  const idx = selectedItems.value.indexOf(id);
  if (idx >= 0) selectedItems.value.splice(idx, 1);
  else selectedItems.value.push(id);
};

const openBatchPurchaseDialog = () => {
  batchPurchaseForm.value = { actualPrice: '', accountId: 'general-cash' };
  showBatchPurchaseDialog.value = true;
};

const confirmBatchPurchase = () => {
  selectedItems.value.forEach(id => {
    markShoppingItemPurchased(id, batchPurchaseForm.value.actualPrice, batchPurchaseForm.value.accountId);
  });
  selectedItems.value = [];
  items.value = getShoppingItems();
  showBatchPurchaseDialog.value = false;
};

const confirmPurchase = () => {
  if (purchasingItem.value) {
    markShoppingItemPurchased(purchasingItem.value.id, purchaseForm.value.actualPrice, purchaseForm.value.accountId);
    items.value = getShoppingItems();
  }
  showPurchaseDialog.value = false;
};

onMounted(() => {
  stores.value = getStores();
  products.value = getProducts();
  items.value = getShoppingItems();
  window.addEventListener('dataUpdated', () => {
    stores.value = getStores();
    products.value = getProducts();
    items.value = getShoppingItems();
    selectedItems.value = [];
  });
  window.addEventListener('open-add-shopping', () => openAddDialog());
});
</script>
