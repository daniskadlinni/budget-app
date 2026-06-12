<template>
  <div v-if="loading" class="flex flex-center q-page-container" style="height: 100vh">
    <q-spinner color="primary" size="3em" />
  </div>
  <router-view v-else />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { initStorage } from 'src/utils/storage';
import { syncFromServer } from 'src/utils/sync';

const loading = ref(true);
let syncInterval: number | null = null;

onMounted(async () => {
  initStorage();
  await syncFromServer();
  loading.value = false;
  window.dispatchEvent(new CustomEvent('dataUpdated'));
  syncInterval = setInterval(async () => {
    const oldData = localStorage.getItem('budget_transactions');
    await syncFromServer();
    if (oldData !== localStorage.getItem('budget_transactions')) {
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    }
  }, 10000) as unknown as number;
});

onUnmounted(() => {
  if (syncInterval) clearInterval(syncInterval);
});
</script>