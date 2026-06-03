<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Настройки</div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Тема</div>
        <q-toggle v-model="darkMode" label="Тёмная тема" @update:model-value="toggleTheme" />
      </q-card-section>
    </q-card>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Резервное копирование</div>
        <q-btn color="primary" label="Экспорт данных" class="q-mt-md" @click="exportData" />
        <q-btn color="secondary" label="Импорт данных" class="q-mt-md q-ml-md" @click="triggerImport" />
        <input ref="fileInput" type="file" accept=".json" style="display:none" @change="importData" />
      </q-card-section>
    </q-card>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 text-negative">Опасная зона</div>
        <q-btn color="negative" label="Сбросить все данные" class="q-mt-md" @click="confirmReset" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { exportData as exp, importData as imp, initStorage } from 'src/utils/storage';

const $q = useQuasar();
const darkMode = ref($q.dark.isActive);
const fileInput = ref<HTMLInputElement | null>(null);

const toggleTheme = () => {
  $q.dark.set(darkMode.value);
  localStorage.setItem('theme', darkMode.value ? 'dark' : 'light');
};

const exportData = () => {
  const data = exp();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `budget-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
};

const triggerImport = () => {
  fileInput.value?.click();
};

const importData = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target?.result as string);
      imp(data);
      $q.notify({ message: 'Данные восстановлены', color: 'positive' });
      setTimeout(() => location.reload(), 1000);
    } catch {
      $q.notify({ message: 'Ошибка файла', color: 'negative' });
    }
  };
  reader.readAsText(file);
};

const confirmReset = () => {
  $q.dialog({
    title: 'Сброс данных',
    message: 'Удалить все данные? Это необратимо.',
    cancel: true,
    persistent: true
  }).onOk(() => {
    localStorage.clear();
    initStorage();
    location.reload();
  });
};
</script>