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
        <div class="text-h6">Импорт из CSV</div>
        <p class="text-caption text-grey">Импорт транзакций из банковской выписки (CSV)</p>
        <q-select v-model="csvAccount" :options="accountOptions" label="Счёт для импорта" emit-value map-options filled class="q-mt-sm" />
        <q-btn color="secondary" label="Импорт CSV" class="q-mt-md" @click="triggerCsvImport" />
        <input ref="csvFileInput" type="file" accept=".csv" style="display:none" @change="importCSV" />
      </q-card-section>
    </q-card>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Правила категорий</div>
        <p class="text-caption text-grey">Ключевое слово → Категория при импорте</p>
        <div v-for="(rule, idx) in categoryRules" :key="idx" class="row q-gutter-sm q-mb-sm items-center">
          <q-input v-model="rule.keyword" label="Ключевое слово" dense style="min-width: 120px" />
          <q-select v-model="rule.categoryId" :options="categoryOptions" label="Категория" emit-value map-options dense style="min-width: 150px" />
          <q-btn flat round dense icon="delete" color="negative" @click="removeRule(idx)" />
        </div>
        <q-btn flat color="primary" label="Добавить правило" @click="addRule" />
      </q-card-section>
    </q-card>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Импорт из текста Сбербанка</div>
        <p class="text-caption text-grey">Скопируйте текст из PDF выписки Сбербанка и вставьте сюда</p>
        <q-select v-model="sberAccount" :options="accountOptions" label="Счёт" emit-value map-options filled class="q-mt-sm" />
        <q-input v-model="sberText" type="textarea" label="Вставьте текст из PDF" filled class="q-mt-sm" style="min-height: 150px" />
        <q-btn color="secondary" label="Импортировать" class="q-mt-md" @click="importSberText" :loading="sberLoading" />
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
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { exportData as exp, importData as imp, initStorage, getCategories, getTransactions, saveTransaction } from 'src/utils/storage';
import { clearTransactionsOnServer, syncToServer } from 'src/utils/sync';
import { v4 as uuidv4 } from 'uuid';

const $q = useQuasar();
const darkMode = ref($q.dark.isActive);
const fileInput = ref<HTMLInputElement | null>(null);
const csvFileInput = ref<HTMLInputElement | null>(null);
const csvAccount = ref('general-cash');
const sberText = ref('');
const sberAccount = ref('general-card');
const sberLoading = ref(false);

const accountOptions = [
  { label: 'Общий — Наличные', value: 'general-cash' },
  { label: 'Общий — Карта', value: 'general-card' },
  { label: 'Накопительный', value: 'savings' }
];

const categoryOptions = ref<any[]>([]);
const categoryRules = ref<{ keyword: string; categoryId: string }[]>([]);

const STORAGE_KEY_CATEGORY_RULES = 'budget_category_rules';

onMounted(() => {
  initCategories();
});

const initCategories = () => {
  categoryOptions.value = getCategories().map((c: any) => ({ label: c.name, value: c.id }));
  const savedRules = localStorage.getItem(STORAGE_KEY_CATEGORY_RULES);
  if (savedRules) {
    categoryRules.value = JSON.parse(savedRules);
  }
};

const saveRules = () => {
  localStorage.setItem(STORAGE_KEY_CATEGORY_RULES, JSON.stringify(categoryRules.value));
};

const addRule = () => {
  categoryRules.value.push({ keyword: '', categoryId: '' });
  saveRules();
};

const removeRule = (idx: number) => {
  categoryRules.value.splice(idx, 1);
  saveRules();
};

const findCategoryByKeyword = (description: string): string => {
  const desc = description.toLowerCase();
  for (const rule of categoryRules.value) {
    if (rule.keyword && rule.categoryId && desc.includes(rule.keyword.toLowerCase())) {
      return rule.categoryId;
    }
  }
  return '';
};

const parseSberText = (text: string): { date: string; amount: number; type: 'income' | 'expense'; description: string }[] => {
  const lines = text.split('\n');
  const transactions: { date: string; amount: number; type: 'income' | 'expense'; description: string }[] = [];

  const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})/;
  const amountRegex = /^([\d\s]+,?\d*)\s*([+-]?)/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const dateMatch = trimmed.match(dateRegex);
    if (!dateMatch) continue;

    const day = dateMatch[1];
    const month = dateMatch[2];
    const year = dateMatch[3];
    const dateStr = `${year}-${month}-${day}`;

    const amountMatch = trimmed.match(/([\d\s]+[.,]\d{2})\s*([+-])?/);
    if (!amountMatch) continue;

    let amountStr = amountMatch[1].replace(/\s/g, '').replace(',', '.');
    const sign = amountMatch[2];
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount === 0) continue;

    const type = sign === '+' ? 'income' : 'expense';

    const descMatch = trimmed.match(/\d{2}[.,]\d{2}[.,]\d{4}\s+\d{2}:\d{2}\s+(.+?)([\d\s]+[.,]\d{2})/);
    let description = '';
    if (descMatch) {
      description = descMatch[1].trim();
    } else {
      const parts = trimmed.split(/\s{2,}/);
      if (parts.length > 2) {
        description = parts.slice(1, -1).join(' ').trim();
      }
    }

    description = description.replace(/[*#]/g, '').trim();

    transactions.push({ date: dateStr, amount, type, description });
  }

  return transactions;
};

const importSberText = async () => {
  if (!sberText.value.trim()) {
    $q.notify({ message: 'Вставьте текст из PDF', color: 'negative' });
    return;
  }

  sberLoading.value = true;

  try {
    const parsed = parseSberText(sberText.value);

    if (parsed.length === 0) {
      $q.notify({ message: 'Не удалось распознать транзакции', color: 'negative' });
      sberLoading.value = false;
      return;
    }

    saveRules();

    const existing = getTransactions();
    const newTransactions = parsed.map(t => ({
      id: uuidv4(),
      accountId: sberAccount.value,
      type: t.type,
      amount: t.amount,
      date: t.date,
      note: t.description,
      categoryId: findCategoryByKeyword(t.description),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    const all = [...existing, ...newTransactions];
    localStorage.setItem('budget_transactions', JSON.stringify(all));
    syncToServer();

    sberText.value = '';

    $q.notify({ message: `Импортировано ${newTransactions.length} операций`, color: 'positive' });
    setTimeout(() => location.reload(), 1000);
  } catch (err) {
    $q.notify({ message: 'Ошибка импорта', color: 'negative' });
  }

  sberLoading.value = false;
};

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

const triggerCsvImport = () => {
  initCategories();
  csvFileInput.value?.click();
};

const parseCSV = (text: string): { date: string; amount: number; type: 'income' | 'expense'; description: string }[] => {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase();
  let dateIndex = -1, amountIndex = -1, descIndex = -1;

  const cols = headers.split(/[,;]/);
  cols.forEach((col, i) => {
    const c = col.trim().toLowerCase();
    if (c.includes('дата') || c.includes('date')) dateIndex = i;
    if (c.includes('сумма') || c.includes('amount') || c.includes('sum')) amountIndex = i;
    if (c.includes('описание') || c.includes('desc') || c.includes('назначение')) descIndex = i;
  });

  if (dateIndex === -1 || amountIndex === -1) {
    for (let i = 0; i < cols.length; i++) {
      if (dateIndex === -1) dateIndex = i;
      else if (amountIndex === -1) amountIndex = i;
      else break;
    }
  }

  const transactions: { date: string; amount: number; type: 'income' | 'expense'; description: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[,;]/);
    if (cols.length <= Math.max(dateIndex, amountIndex)) continue;

    let dateStr = cols[dateIndex]?.trim() || '';
    let amountStr = cols[amountIndex]?.trim() || '0';

    const dateMatch = dateStr.match(/(\d{2})[./](\d{2})[./](\d{4})/);
    if (dateMatch) {
      dateStr = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        dateStr = dateStr;
      } else {
        dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    amountStr = amountStr.replace(/[^\d.,-]/g, '').replace(',', '.');
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || isNaN(Date.parse(dateStr))) continue;

    const description = descIndex >= 0 ? cols[descIndex]?.trim() || '' : '';

    transactions.push({
      date: dateStr,
      amount: Math.abs(amount),
      type: amount < 0 ? 'expense' : 'income',
      description
    });
  }

  return transactions;
};

const importCSV = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        $q.notify({ message: 'Не удалось распознать CSV', color: 'negative' });
        return;
      }

      saveRules();

      const existing = getTransactions();
      const newTransactions = parsed.map(t => ({
        id: uuidv4(),
        accountId: csvAccount.value,
        type: t.type,
        amount: t.amount,
        date: t.date,
        note: t.description,
        categoryId: findCategoryByKeyword(t.description),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      const all = [...existing, ...newTransactions];
      localStorage.setItem('budget_transactions', JSON.stringify(all));
      syncToServer();

      $q.notify({ message: `Импортировано ${newTransactions.length} операций`, color: 'positive' });
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      $q.notify({ message: 'Ошибка импорта CSV', color: 'negative' });
    }
  };
  reader.readAsText(file);
};

const confirmReset = () => {
  $q.dialog({
    title: 'Сброс операций',
    message: 'Удалить все операции? Это необратимо.',
    cancel: true,
    persistent: true
  }).onOk(() => {
    $q.dialog({
      title: 'ВНИМАНИЕ',
      message: 'Точно удалить ВСЕ операции? Это действие нельзя отменить!',
      cancel: true,
      persistent: true
    }).onOk(async () => {
      localStorage.setItem('budget_transactions', '[]');
      await clearTransactionsOnServer();
      $q.notify({ message: 'Операции удалены', color: 'positive' });
      setTimeout(() => location.reload(), 1000);
    });
  });
};
</script>