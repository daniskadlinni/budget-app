<template>
  <div v-if="loading" class="flex flex-center q-page-container" style="height: 100vh">
    <q-spinner color="primary" size="3em" />
  </div>
  <router-view v-else />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { initStorage } from 'src/utils/storage';
import { syncFromServer } from 'src/utils/sync';

const $q = useQuasar();
const loading = ref(true);
let syncInterval: number | null = null;

const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    await syncFromServer();
    window.dispatchEvent(new CustomEvent('dataUpdated'));
  }
};

onMounted(async () => {
  initStorage();
  const result = await syncFromServer();
  loading.value = false;
  window.dispatchEvent(new CustomEvent('dataUpdated'));

  if (result?.synced) {
    $q.notify({ message: `Синхронизировано. Локально: ${result.transactions}, на сервере: ${result.serverTransactions}`, color: 'positive', timeout: 3000 });
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  if (syncInterval) window.clearInterval(syncInterval);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>
