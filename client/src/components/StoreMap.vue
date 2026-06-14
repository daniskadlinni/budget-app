<template>
  <div ref="mapContainer" style="width: 100%; height: 300px;"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  stores: any[];
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: any = null;
let placemarks: any[] = [];

const initMap = () => {
  if (!mapContainer.value || typeof window.ymaps === 'undefined') return;

  if (map.length === 0) {
    map = new window.ymaps.Map(mapContainer.value, {
      center: [55.755819, 37.617644],
      zoom: 10
    });
  }

  updatePlacemarks();
};

const updatePlacemarks = () => {
  placemarks.forEach(p => map.geoObjects.remove(p));
  placemarks = [];

  props.stores.forEach(store => {
    if (store.coordinates) {
      const placemark = new window.ymaps.Placemark(
        [store.coordinates.lat, store.coordinates.lon],
        {
          balloonContentHeader: store.name,
          balloonContentBody: store.address || '',
        }
      );
      map.geoObjects.add(placemark);
      placemarks.push(placemark);
    }
  });

  if (placemarks.length > 0) {
    map.geoObjects.remove(placemarks);
    map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true });
  }
};

onMounted(() => {
  if (typeof window.ymaps !== 'undefined') {
    window.ymaps.ready(initMap);
  } else {
    window.addEventListener('ymaps.ready', initMap);
  }
});

watch(() => props.stores, updatePlacemarks, { deep: true });
</script>