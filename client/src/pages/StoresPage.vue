<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Магазины</div>

    <div v-if="stores.length > 0" class="q-mb-md">
      <div ref="mapContainer" style="width: 100%; height: 300px; border-radius: 10px;"></div>
    </div>

    <q-btn color="primary" icon="add" label="Добавить магазин" class="q-mb-md" @click="openAddDialog" />

    <q-list separator>
      <q-item v-for="store in stores" :key="store.id">
        <q-item-section>
          <q-item-label>{{ store.name }}</q-item-label>
          <q-item-label caption v-if="store.address">{{ store.address }}</q-item-label>
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
      <q-card style="min-width: 350px">
        <q-card-section><div class="text-h6">{{ editing ? 'Редактировать' : 'Добавить магазин' }}</div></q-card-section>
        <q-card-section>
          <q-input v-model="form.name" label="Название магазина" filled />
          <q-input v-model="form.address" label="Адрес" filled class="q-mt-sm" @focus="searchAddress" />
          <div v-if="form.coordinates" class="text-caption text-positive q-mt-sm">
            Координаты: {{ form.coordinates.lat.toFixed(4) }}, {{ form.coordinates.lon.toFixed(4) }}
          </div>
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
import { ref, onMounted, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { getStores, saveStore as sStore, deleteStore as dStore, getProducts } from 'src/utils/storage';

const $q = useQuasar();

const stores = ref<any[]>([]);
const products = ref<any[]>([]);
const showDialog = ref(false);
const editing = ref(false);
const mapContainer = ref<HTMLElement | null>(null);
let map: any = null;
let searchControl: any = null;

const form = ref({ id: '', name: '', address: '', coordinates: null as { lat: number; lon: number } | null });

const getProductCount = (storeId: string) => products.value.filter(p => p.storeId === storeId).length;

const openAddDialog = () => {
  editing.value = false;
  form.value = { id: '', name: '', address: '', coordinates: null };
  showDialog.value = true;
};

const editStore = (store: any) => {
  editing.value = true;
  form.value = { ...store, coordinates: store.coordinates || null };
  showDialog.value = true;
};

const saveStore = () => {
  if (!form.value.name) return;
  sStore(form.value);
  stores.value = getStores();
  showDialog.value = false;
  updateMap();
};

const deleteStore = (id: string) => {
  $q.dialog({ title: 'Удалить', message: 'Удалить магазин?', cancel: true }).onOk(() => {
    dStore(id);
    stores.value = getStores();
    updateMap();
  });
};

const initMap = () => {
  if (!mapContainer.value || typeof window.ymaps === 'undefined') return;

  map = new window.ymaps.Map(mapContainer.value, {
    center: [55.755819, 37.617644],
    zoom: 10
  });

  searchControl = new window.ymaps.control.SearchControl({ options: { noCentering: true } });
  map.controls.add(searchControl);

  updateMap();
};

const updateMap = () => {
  if (!map || typeof window.ymaps === 'undefined') return;

  map.geoObjects.removeAll();

  stores.value.forEach(store => {
    if (store.coordinates) {
      const placemark = new window.ymaps.Placemark(
        [store.coordinates.lat, store.coordinates.lon],
        {
          balloonContentHeader: `<strong>${store.name}</strong>`,
          balloonContentBody: store.address || '',
        },
        { preset: 'islands#blueShoppingIcon' }
      );
      map.geoObjects.add(placemark);
    }
  });

  if (map.geoObjects.getLength() > 0) {
    map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, duration: 300 });
  }
};

const searchAddress = () => {
  if (!showDialog.value || !searchControl) return;

  searchControl.events.add('resultselect', (e: any) => {
    const results = searchControl.getResultsArray();
    const selected = e.get('index');
    if (results[selected]) {
      const coords = results[selected].geometry.getCoordinates();
      form.value.address = results[selected].properties.get('text');
      form.value.coordinates = { lat: coords[0], lon: coords[1] };
    }
  });
};

onMounted(() => {
  stores.value = getStores();
  products.value = getProducts();

  window.addEventListener('dataUpdated', () => {
    stores.value = getStores();
    products.value = getProducts();
    updateMap();
  });
  window.addEventListener('open-add-store', () => openAddDialog());

  if (typeof window.ymaps !== 'undefined') {
    window.ymaps.ready(initMap);
  } else {
    const checkYmaps = setInterval(() => {
      if (typeof window.ymaps !== 'undefined') {
        clearInterval(checkYmaps);
        window.ymaps.ready(initMap);
      }
    }, 100);
  }
});
</script>

<script lang="ts">
declare global {
  interface Window {
    ymaps: any;
  }
}
</script>