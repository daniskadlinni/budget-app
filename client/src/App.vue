<template>
  <div v-if="loading" class="flex flex-center q-page-container" style="height: 100vh">
    <q-spinner color="primary" size="3em" />
  </div>
  <router-view v-else />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { initStorage } from 'src/utils/storage';
import { syncFromServer } from 'src/utils/sync';

const loading = ref(true);

onMounted(async () => {
  initStorage();
  await syncFromServer();
  loading.value = false;
});
</script>