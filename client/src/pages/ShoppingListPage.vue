<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Список покупок</div>

    <q-btn color="primary" icon="add" label="Добавить" class="q-mb-md" @click="openAddDialog" />
    <q-btn color="secondary" outline icon="playlist_add_check" label="Шаблоны" class="q-mb-md q-ml-sm" @click="openTemplatesDialog" />

    <q-btn-toggle v-model="statusFilter" toggle-color="primary" :options="[
      { label: 'К покупке', value: 'todo' },
      { label: 'Активные', value: 'active' },
      { label: 'Купленные', value: 'purchased' },
      { label: 'Все', value: 'all' }
    ]" class="q-mb-md" />

    <q-select v-if="stores.length > 0" v-model="filterStore" :options="storeOptions" label="Фильтр по магазину" clearable class="q-mb-md" />

    <q-list v-if="statusFilter === 'todo'" separator>
      <q-item v-for="item in todoItems" :key="item.id">
        <q-item-section avatar>
          <q-checkbox :model-value="false" @update:model-value="setChecked(item.id, true)" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ item.name }}</q-item-label>
          <q-item-label caption>{{ getStoreName(item.storeId) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="text-right">
            <div>{{ formatNumber(item.plannedPrice || 0) }} ₽</div>
          </div>
        </q-item-section>
        <q-item-section side>
          <q-btn flat round dense icon="edit" @click="editItem(item)" />
          <q-btn flat round dense icon="delete" color="negative" @click="deleteItem(item.id)" />
        </q-item-section>
      </q-item>
      <q-expansion-item v-if="checkedTodoItems.length" v-model="showCheckedItems" icon="done_all" :label="`Отмеченные (${checkedTodoItems.length})`" header-class="text-grey-7">
        <q-separator />
        <q-item v-for="item in checkedTodoItems" :key="item.id">
          <q-item-section avatar>
            <q-checkbox :model-value="true" @update:model-value="setChecked(item.id, false)" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-strike text-grey-7">{{ item.name }}</q-item-label>
            <q-item-label caption>{{ getStoreName(item.storeId) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <div>{{ formatNumber(item.plannedPrice || 0) }} ₽</div>
          </q-item-section>
          <q-item-section side>
            <q-btn flat round dense icon="edit" @click="editItem(item)" />
            <q-btn flat round dense icon="delete" color="negative" @click="deleteItem(item.id)" />
          </q-item-section>
        </q-item>
      </q-expansion-item>
      <q-item v-if="todoItems.length === 0 && checkedTodoItems.length === 0">
        <q-item-section class="text-center q-pa-lg">
          <q-icon name="shopping_cart" size="48px" color="grey" />
          <div class="text-h6 q-mt-sm">Список пуст</div>
          <q-btn color="primary" icon="add" label="Добавить покупку" class="q-mt-md" @click="openAddDialog" />
        </q-item-section>
      </q-item>
    </q-list>

    <q-list v-else separator>
      <q-item v-for="item in filteredItems" :key="item.id">
        <q-item-section avatar>
          <q-checkbox v-if="!item.purchased" :model-value="!!item.checked" @update:model-value="setChecked(item.id, !item.checked)" color="primary" />
          <q-icon v-else name="check_circle" color="positive" />
        </q-item-section>
        <q-item-section>
          <q-item-label :class="{ 'text-strike': item.purchased, 'text-grey-6': item.purchased }">{{ item.name }}</q-item-label>
          <q-item-label caption>{{ getStoreName(item.storeId) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="text-right">
            <div :class="{ 'text-strike': item.purchased }">{{ formatNumber(item.plannedPrice || 0) }} ₽</div>
            <div v-if="item.purchased && item.actualPrice" class="text-positive text-caption">факт: {{ formatNumber(item.actualPrice) }} ₽</div>
          </div>
        </q-item-section>
        <q-item-section side>
          <q-btn v-if="!item.purchased && statusFilter === 'active'" flat round dense icon="shopping_bag" color="positive" @click="openPurchaseDialog(item)" />
          <q-btn flat round dense icon="edit" @click="editItem(item)" />
          <q-btn flat round dense icon="delete" color="negative" @click="deleteItem(item.id)" />
        </q-item-section>
      </q-item>
      <q-item v-if="filteredItems.length === 0">
        <q-item-section class="text-center q-pa-lg">
          <q-icon name="shopping_cart" size="48px" color="grey" />
          <div class="text-h6 q-mt-sm">Список пуст</div>
          <q-btn color="primary" icon="add" label="Добавить покупку" class="q-mt-md" @click="openAddDialog" />
        </q-item-section>
      </q-item>
    </q-list>

    <q-dialog v-model="showItemDialog">
      <q-card style="min-width: 350px">
        <q-card-section><div class="text-h6">{{ editingItem ? 'Редактировать' : 'Добавить покупку' }}</div></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <div>
              <q-input v-model="itemForm.name" label="Название" filled @update:model-value="onNameInput" />
              <q-list v-if="productSuggestions.length" bordered separator class="q-mt-xs">
                <q-item v-for="product in productSuggestions" :key="product.id" clickable @click="selectProduct(product)">
                  <q-item-section>
                    <q-item-label>{{ product.name }}</q-item-label>
                    <q-item-label caption>{{ getStoreName(product.storeId) }} · {{ formatNumber(product.lastPrice || product.plannedPrice || 0) }} ₽</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
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

    <q-dialog v-model="showTemplatesDialog">
      <q-card style="min-width: min(92vw, 520px)">
        <q-card-section>
          <div class="text-h6">Шаблоны покупок</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="templateName" label="Название шаблона" filled />
          <q-btn color="primary" icon="save" label="Сохранить текущий список" class="q-mt-sm" @click="saveCurrentTemplate" />
        </q-card-section>
        <q-list separator>
          <q-item v-for="template in templates" :key="template.id">
            <q-item-section>
              <q-item-label>{{ template.name }}</q-item-label>
              <q-item-label caption>{{ template.items?.length || 0 }} товаров</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn flat round dense icon="playlist_add" color="primary" @click="applyTemplate(template)" />
              <q-btn flat round dense icon="delete" color="negative" @click="removeTemplate(template.id)" />
            </q-item-section>
          </q-item>
          <q-item v-if="templates.length === 0">
            <q-item-section class="text-grey">Шаблонов пока нет</q-item-section>
          </q-item>
        </q-list>
        <q-card-actions align="right">
          <q-btn flat label="Закрыть" v-close-popup />
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

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  getStores,
  getShoppingItems,
  saveShoppingItem,
  deleteShoppingItem,
  setShoppingItemChecked,
  markShoppingItemPurchased,
  getAccounts,
  formatNumber,
  getProducts,
  saveProduct as sProduct,
  getShoppingTemplates,
  saveShoppingTemplate,
  deleteShoppingTemplate,
  addShoppingTemplateToList
} from 'src/utils/storage';

const $q = useQuasar();

const stores = ref<any[]>([]);
const products = ref<any[]>([]);
const items = ref<any[]>([]);
const templates = ref<any[]>([]);
const filterStore = ref(null);
const statusFilter = ref<'todo' | 'active' | 'purchased' | 'all'>('todo');
const showCheckedItems = ref(true);

const showItemDialog = ref(false);
const showPurchaseDialog = ref(false);
const showTemplatesDialog = ref(false);
const editingItem = ref(false);
const purchasingItem = ref(null);
const templateName = ref('');

const itemForm = ref({ id: '', name: '', storeId: '', plannedPrice: '', productId: '' });
const purchaseForm = ref({ actualPrice: '', accountId: 'general-cash' });
const showProductSuggestions = ref(false);

const storeOptions = computed(() => stores.value.map(s => ({ label: s.name, value: s.id })));
const accountOptions = computed(() => getAccounts().map(a => ({ label: a.name, value: a.id })));

const productSuggestions = computed(() => {
  if (!showProductSuggestions.value) return [];
  const query = itemForm.value.name.trim().toLowerCase();
  if (!query) return [];
  return products.value
    .filter(product => product.name.toLowerCase().includes(query))
    .slice(0, 6);
});

const filteredItems = computed(() => {
  let list = [...items.value];
  if (statusFilter.value === 'active') list = list.filter(i => !i.purchased && i.checked);
  if (statusFilter.value === 'purchased') list = list.filter(i => i.purchased);
  if (filterStore.value) list = list.filter(i => i.storeId === filterStore.value);
  return list;
});

const todoItems = computed(() => {
  let list = items.value.filter(i => !i.purchased && !i.checked);
  if (filterStore.value) list = list.filter(i => i.storeId === filterStore.value);
  return list;
});

const checkedTodoItems = computed(() => {
  let list = items.value.filter(i => !i.purchased && i.checked);
  if (filterStore.value) list = list.filter(i => i.storeId === filterStore.value);
  return list;
});

const getStoreName = (id: string) => stores.value.find(s => s.id === id)?.name || '';

const openAddDialog = () => {
  editingItem.value = false;
  itemForm.value = { id: '', name: '', storeId: stores.value[0]?.id || '', plannedPrice: '', productId: '' };
  showProductSuggestions.value = false;
  showItemDialog.value = true;
};

const onNameInput = () => {
  const exactProduct = products.value.find(product => product.name.toLowerCase() === itemForm.value.name.trim().toLowerCase());
  itemForm.value.productId = exactProduct?.id || '';
  showProductSuggestions.value = true;
};

const selectProduct = (product: any) => {
  itemForm.value.name = product.name;
  itemForm.value.productId = product.id;
  itemForm.value.storeId = product.storeId || itemForm.value.storeId;
  itemForm.value.plannedPrice = product.lastPrice || product.plannedPrice || 0;
  showProductSuggestions.value = false;
};

const editItem = (item: any) => {
  editingItem.value = true;
  itemForm.value = { ...item, productId: item.productId || '' };
  showProductSuggestions.value = false;
  showItemDialog.value = true;
};

const saveItem = () => {
  const name = itemForm.value.name.trim();
  if (!name) return;

  let product = itemForm.value.productId
    ? products.value.find(p => p.id === itemForm.value.productId)
    : products.value.find(p => p.name.toLowerCase() === name.toLowerCase());

  if (!product) {
    product = {
      name,
      storeId: itemForm.value.storeId,
      plannedPrice: itemForm.value.plannedPrice || 0,
      lastPrice: itemForm.value.plannedPrice || 0
    };
    sProduct(product);
    products.value = getProducts();
    product = products.value.find(p => p.name.toLowerCase() === name.toLowerCase());
  }

  itemForm.value.name = name;
  itemForm.value.productId = product?.id || itemForm.value.productId;
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

const setChecked = (id: string, checked: boolean) => {
  setShoppingItemChecked(id, checked);
  items.value = getShoppingItems();
};

const confirmPurchase = () => {
  if (purchasingItem.value) {
    markShoppingItemPurchased(purchasingItem.value.id, purchaseForm.value.actualPrice, purchaseForm.value.accountId);
    items.value = getShoppingItems();
  }
  showPurchaseDialog.value = false;
};

const openTemplatesDialog = () => {
  templates.value = getShoppingTemplates();
  templateName.value = '';
  showTemplatesDialog.value = true;
};

const saveCurrentTemplate = () => {
  const sourceItems = items.value.filter(item => !item.purchased);
  if (!templateName.value.trim() || sourceItems.length === 0) return;
  saveShoppingTemplate({
    name: templateName.value.trim(),
    items: sourceItems.map(item => ({
      name: item.name,
      storeId: item.storeId || '',
      plannedPrice: item.plannedPrice || 0,
      productId: item.productId || ''
    }))
  });
  templates.value = getShoppingTemplates();
  templateName.value = '';
};

const applyTemplate = (template: any) => {
  addShoppingTemplateToList(template);
  items.value = getShoppingItems();
  $q.notify({ message: 'Шаблон добавлен в список', color: 'positive' });
};

const removeTemplate = (id: string) => {
  deleteShoppingTemplate(id);
  templates.value = getShoppingTemplates();
};

onMounted(() => {
  stores.value = getStores();
  products.value = getProducts();
  items.value = getShoppingItems();
  templates.value = getShoppingTemplates();
  window.addEventListener('dataUpdated', () => {
    stores.value = getStores();
    products.value = getProducts();
    items.value = getShoppingItems();
    templates.value = getShoppingTemplates();
  });
  window.addEventListener('open-add-shopping', () => openAddDialog());
});
</script>
