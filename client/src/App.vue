<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { initStorage } from 'src/utils/storage';

onMounted(() => {
  initStorage();
});
</script>