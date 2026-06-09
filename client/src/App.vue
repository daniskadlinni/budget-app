<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { initStorage } from 'src/utils/storage';
import { syncFromServer } from 'src/utils/sync';

onMounted(async () => {
  initStorage();
  await syncFromServer();
});
</script>