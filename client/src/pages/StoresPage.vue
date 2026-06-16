<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Магазины</div>

    <div v-if="stores.length > 0" class="q-mb-md">
      <div ref="mapContainer" style="width: 100%; height: 300px; border-radius: 10px;"></div>
      <div v-if="userLocation" class="text-caption text-grey q-mt-sm">
        Вы здесь: {{ userLocation.lat.toFixed(4) }}, {{ userLocation.lon.toFixed(4) }}
        <q-btn flat dense size="sm" label="Обновить" @click="getUserLocation" />
      </div>
      <div v-else class="q-mt-sm">
        <q-btn flat dense color="primary" label="Показать ближайшие" @click="getUserLocation" />
      </div>
    </div>

    <div class="q-mb-md q-gutter-sm">
      <q-btn color="primary" icon="add" label="Добавить магазин" @click="openAddDialog" />
      <q-btn color="secondary" icon="my_location" label="Добавить здесь" @click="addAtCurrentLocation" :disable="!userLocation" />
    </div>

    <q-list separator>
      <q-item v-for="store in sortedStores" :key="store.id">
        <q-item-section avatar>
          <q-icon name="store" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ store.name }}</q-item-label>
          <q-item-label caption v-if="store.address">{{ store.address }}</q-item-label>
          <q-item-label caption v-if="store.distance !== undefined" class="text-positive">
            ~{{ formatDistance(store.distance) }}
          </q-item-label>
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
          <q-select
            v-model="form.address"
            label="Адрес"
            filled
            class="q-mt-sm"
            use-input
            hide-selected
            fill-input
            input-debounce="500"
            :options="addressOptions"
            @filter="searchAddress"
            @update:model-value="selectAddress"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">Введите адрес для поиска</q-item-section>
              </q-item>
            </template>
          </q-select>
          <div v-if="form.coordinates" class="text-caption text-positive q-mt-sm">
            Найдено: {{ form.coordinates.lat.toFixed(4) }}, {{ form.coordinates.lon.toFixed(4) }}
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
import { ref, computed, onMounted, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { getStores, saveStore as sStore, deleteStore as dStore, getProducts } from 'src/utils/storage';

const $q = useQuasar();

const stores = ref<any[]>([]);
const products = ref<any[]>([]);
const showDialog = ref(false);
const editing = ref(false);
const mapContainer = ref<HTMLElement | null>(null);
const addressOptions = ref<string[]>([]);
let map: any = null;
let searchControl: any = null;
let userLocation = ref<{ lat: number; lon: number } | null>(null);

const form = ref({ id: '', name: '', address: '', coordinates: null as { lat: number; lon: number } | null });

const getProductCount = (storeId: string) => products.value.filter(p => p.storeId === storeId).length;

const sortedStores = computed(() => {
  if (!userLocation.value) return stores.value;

  const storesWithDistance = stores.value.map(store => {
    if (store.coordinates) {
      const dx = store.coordinates.lat - userLocation.value!.lat;
      const dy = store.coordinates.lon - userLocation.value!.lon;
      store.distance = Math.sqrt(dx * dx + dy * dy) * 111;
    }
    return store;
  });

  return storesWithDistance.sort((a, b) => (a.distance || 999) - (b.distance || 999));
});

const formatDistance = (km: number) => {
  if (km < 1) return `${Math.round(km * 1000)} м`;
  return `${km.toFixed(1)} км`;
};

const getUserLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        updateMap();
      },
      (error) => {
        $q.notify({ message: 'Не удалось определить местоположение', color: 'negative' });
      }
    );
  } else {
    $q.notify({ message: 'Геолокация не поддерживается', color: 'negative' });
  }
};

const openAddDialog = () => {
  editing.value = false;
  form.value = { id: '', name: '', address: '', coordinates: null };
  showDialog.value = true;
};

const addAtCurrentLocation = () => {
  if (!userLocation.value) return;
  editing.value = false;
  form.value = {
    id: '',
    name: '',
    address: '',
    coordinates: { lat: userLocation.value.lat, lon: userLocation.value.lon }
  };
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
  nextTick(updateMap);
};

const deleteStore = (id: string) => {
  $q.dialog({ title: 'Удалить', message: 'Удалить магазин?', cancel: true }).onOk(() => {
    dStore(id);
    stores.value = getStores();
    nextTick(updateMap);
  });
};

const searchAddress = (val: string, update: (callback: () => void) => void) => {
  if (!val || val.length < 3) {
    update(() => { addressOptions.value = []; });
    return;
  }

  if (typeof window.ymaps !== 'undefined') {
    window.ymaps.geocode(val, { results: 5 }).then((res: any) => {
      const results = res.geoObjects.items.map((item: any) => ({
        value: item.properties.get('text'),
        data: item
      }));
      update(() => {
        addressOptions.value = results.map((r: any) => r.value);
      });
    });
  }
};

const selectAddress = (address: string) => {
  if (typeof window.ymaps !== 'undefined' && address) {
    window.ymaps.geocode(address).then((res: any) => {
      const first = res.geoObjects.get(0);
      if (first) {
        const coords = first.geometry.getCoordinates();
        form.value.coordinates = { lat: coords[0], lon: coords[1] };
      }
    });
  }
};

const initMap = () => {
  if (!mapContainer.value || typeof window.ymaps === 'undefined') return;

  map = new window.ymaps.Map(mapContainer.value, {
    center: userLocation.value ? [userLocation.value.lat, userLocation.value.lon] : [55.755819, 37.617644],
    zoom: 12
  });

  searchControl = new window.ymaps.control.SearchControl({ options: { noCentering: true } });
  map.controls.add(searchControl);

  map.geoObjects.events.add('click', (e: any) => {
    const target = e.get('target');
    if (target && target.properties && userLocation.value) {
      const coords = target.geometry.getCoordinates();
      showRoute(coords);
    }
  });

  updateMap();
};

const showRoute = (toCoords: [number, number]) => {
  if (!userLocation.value || !map) return;

  map.geoObjects.removeAll();

  const userPlacemark = new window.ymaps.Placemark(
    [userLocation.value.lat, userLocation.value.lon],
    { balloonContentHeader: 'Вы здесь' },
    { preset: 'islands#redPersonIcon' }
  );

  const storePlacemark = new window.ymaps.Placemark(toCoords, { preset: 'islands#blueShoppingIcon' });

  map.geoObjects.add(userPlacemark);
  map.geoObjects.add(storePlacemark);

  if (typeof window.ymaps !== 'undefined') {
    window.ymaps.route([toCoords, [userLocation.value.lat, userLocation.value.lon]], {
      mapStateAutoApply: true
    }).then((route: any) => {
      map.geoObjects.add(route.getPath());
      const points = route.getWayPoints();
      points.get(0).properties.set('iconColor', '#FF0000');
      points.get(1).properties.set('iconColor', '#1E98FF');

      const info = route.getHumanLength();
      $q.notify({ message: `Расстояние: ${info}`, color: 'positive', timeout: 3000 });
    });
  }
};

const updateMap = () => {
  if (!map || typeof window.ymaps === 'undefined') return;

  map.geoObjects.removeAll();

  if (userLocation.value) {
    const userPlacemark = new window.ymaps.Placemark(
      [userLocation.value.lat, userLocation.value.lon],
      { balloonContentHeader: 'Вы здесь' },
      { preset: 'islands#redPersonIcon' }
    );
    map.geoObjects.add(userPlacemark);
  }

  stores.value.forEach(store => {
    if (store.coordinates) {
      const placemark = new window.ymaps.Placemark(
        [store.coordinates.lat, store.coordinates.lon],
        {
          balloonContentHeader: `<strong>${store.name}</strong>`,
          balloonContentBody: (store.address || '') + (userLocation.value ? '<br><small>Нажмите для маршрута</small>' : ''),
        },
        { preset: 'islands#blueShoppingIcon' }
      );
      placemark.events.add('click', () => {
        if (userLocation.value) {
          showRoute([store.coordinates.lat, store.coordinates.lon]);
        }
      });
      map.geoObjects.add(placemark);
    }
  });

  if (map.geoObjects.getLength() > 0) {
    map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, duration: 300 });
  }
};

onMounted(() => {
  stores.value = getStores();
  products.value = getProducts();

  window.addEventListener('dataUpdated', () => {
    stores.value = getStores();
    products.value = getProducts();
    nextTick(updateMap);
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
