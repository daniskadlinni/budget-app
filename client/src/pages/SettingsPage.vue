<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Настройки</div>

    <q-tabs v-model="settingsTab" dense active-color="primary" indicator-color="primary" align="justify" class="q-mb-md">
      <q-tab name="general" icon="tune" label="Общие" />
      <q-tab name="backup" icon="backup" label="Копия" />
      <q-tab name="import" icon="upload_file" label="Импорт" />
      <q-tab name="rules" icon="rule" label="Правила" />
      <q-tab name="danger" icon="warning" label="Сброс" />
    </q-tabs>

    <q-tab-panels v-model="settingsTab" animated>
      <q-tab-panel name="general" class="q-pa-none">
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6">Тема</div>
            <q-toggle v-model="darkMode" label="Тёмная тема" @update:model-value="toggleTheme" />
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="backup" class="q-pa-none">
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6">Резервное копирование</div>
            <div class="backup-actions q-mt-md">
              <q-btn color="primary" icon="archive" label="Полная копия" @click="exportData" />
              <q-btn color="primary" outline icon="payments" label="Только числа" @click="exportNumericData" />
              <q-btn color="primary" outline icon="account_tree" label="Только структура" @click="exportStructureData" />
              <q-btn color="secondary" icon="restore" label="Восстановить" @click="triggerImport" />
            </div>
            <input ref="fileInput" type="file" accept=".json" style="display:none" @change="importData" />
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="import" class="q-pa-none">
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
            <div class="text-h6">Импорт PDF Сбербанка</div>
            <p class="text-caption text-grey">Можно выбрать одну или несколько PDF-выписок. Внутренние переводы между своими счетами будут пропущены.</p>
            <q-select v-model="sberAccount" :options="accountOptions" label="Счёт" emit-value map-options filled class="q-mt-sm" />
            <q-btn color="primary" label="Выбрать PDF" class="q-mt-md" @click="triggerSberPdfImport" :loading="sberLoading" />
            <input ref="sberPdfInput" type="file" accept=".pdf,application/pdf" multiple style="display:none" @change="importSberPdf" />
          </q-card-section>
        </q-card>

        <q-card v-if="sberPreview.length" class="q-mb-md">
          <q-card-section>
            <div class="row justify-between items-center q-mb-sm">
              <div class="text-h6">Предпросмотр</div>
              <q-btn color="positive" label="Импортировать" @click="confirmSberPreviewImport" />
            </div>
            <div class="text-caption text-grey q-mb-sm">
              Найдено: {{ sberPreview.length }} · будет добавлено: {{ sberPreviewToAdd.length }} · дублей: {{ sberPreview.length - sberPreviewToAdd.length }}
            </div>
            <q-list bordered separator style="max-height: 360px; overflow: auto">
              <q-item v-for="item in sberPreview.slice(0, 80)" :key="item.key">
                <q-item-section>
                  <q-item-label>{{ item.description }}</q-item-label>
                  <q-item-label caption>{{ item.date }} · {{ getCategoryName(item.categoryId) }} · {{ item.sourceCategory }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label :class="item.type === 'income' ? 'text-positive' : 'text-negative'">
                    {{ item.type === 'income' ? '+' : '-' }}{{ formatPreviewAmount(item.amount) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6">Импорт из текста Сбербанка</div>
            <p class="text-caption text-grey">Запасной вариант: скопируйте текст из PDF выписки Сбербанка и вставьте сюда</p>
            <q-input v-model="sberText" type="textarea" label="Вставьте текст из PDF" filled class="q-mt-sm" style="min-height: 150px" />
            <q-btn color="secondary" label="Импортировать" class="q-mt-md" @click="importSberText" :loading="sberLoading" />
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="rules" class="q-pa-none">
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
      </q-tab-panel>

      <q-tab-panel name="danger" class="q-pa-none">
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6 text-negative">Опасная зона</div>
            <q-btn color="negative" label="Сбросить все данные" class="q-mt-md" @click="confirmReset" />
          </q-card-section>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  exportData as exp,
  exportNumericData as expNumeric,
  exportStructureData as expStructure,
  importData as imp,
  getCategories,
  getTransactions
} from 'src/utils/storage';
import { clearTransactionsOnServer, syncToServer } from 'src/utils/sync';
import { v4 as uuidv4 } from 'uuid';

const $q = useQuasar();
const settingsTab = ref('general');
const darkMode = ref($q.dark.isActive);
const fileInput = ref<HTMLInputElement | null>(null);
const csvFileInput = ref<HTMLInputElement | null>(null);
const sberPdfInput = ref<HTMLInputElement | null>(null);
const csvAccount = ref('general-cash');
const sberText = ref('');
const sberAccount = ref('general-card');
const sberLoading = ref(false);
const sberPreview = ref<SberTransaction[]>([]);

const accountOptions = [
  { label: 'Общий — Наличные', value: 'general-cash' },
  { label: 'Общий — Карта', value: 'general-card' },
  { label: 'Накопительный', value: 'savings' }
];

const categoryOptions = ref<any[]>([]);
const categoryRules = ref<{ keyword: string; categoryId: string }[]>([]);

const STORAGE_KEY_CATEGORY_RULES = 'budget_category_rules';

type SberTransaction = {
  key: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  sourceCategory: string;
  categoryId: string;
  isOpening?: boolean;
};

const sberPreviewToAdd = computed(() => {
  const existing = getTransactions();
  return sberPreview.value.filter(item => !isDuplicateTransaction(item, existing));
});

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

const knownSberCategories = [
  'Здоровье и красота',
  'Одежда и аксессуары',
  'Оплата по QR–коду СБП',
  'Рестораны и кафе',
  'Перевод с карты',
  'Перевод на карту',
  'Прочие операции',
  'Прочие расходы',
  'Внесение наличных',
  'Заработная плата',
  'Супермаркеты',
  'Все для дома',
  'Компенсации',
  'Автомобиль',
  'Перевод СБП',
  'Транспорт'
].sort((a, b) => b.length - a.length);

const sberCategoryMap: Record<string, { id: string; type: 'income' | 'expense'; name: string; color: string }> = {
  'Транспорт': { id: 'cat-transport', type: 'expense', name: 'Транспорт', color: '#2196F3' },
  'Супермаркеты': { id: 'cat-food', type: 'expense', name: 'Продукты', color: '#FF5722' },
  'Рестораны и кафе': { id: 'cat-restaurants', type: 'expense', name: 'Кафе и рестораны', color: '#FFC107' },
  'Автомобиль': { id: 'fuel', type: 'expense', name: 'Бензин', color: '#FF5722' },
  'Все для дома': { id: 'cat-home', type: 'expense', name: 'Дом', color: '#795548' },
  'Здоровье и красота': { id: 'cat-health', type: 'expense', name: 'Здоровье', color: '#F44336' },
  'Одежда и аксессуары': { id: 'cat-shopping', type: 'expense', name: 'Покупки', color: '#E91E63' },
  'Прочие расходы': { id: 'cat-other-exp', type: 'expense', name: 'Прочее', color: '#9E9E9E' },
  'Прочие операции': { id: 'cat-other-exp', type: 'expense', name: 'Прочее', color: '#9E9E9E' },
  'Оплата по QR–коду СБП': { id: 'cat-other-exp', type: 'expense', name: 'Прочее', color: '#9E9E9E' },
  'Внесение наличных': { id: 'cat-other-inc', type: 'income', name: 'Прочее', color: '#9E9E9E' },
  'Заработная плата': { id: 'cat-salary', type: 'income', name: 'Зарплата', color: '#4CAF50' },
  'Компенсации': { id: 'cat-other-inc', type: 'income', name: 'Прочее', color: '#9E9E9E' },
  'Начальный остаток': { id: 'cat-other-inc', type: 'income', name: 'Прочее', color: '#9E9E9E' },
  'Перевод с карты': { id: 'transfers', type: 'expense', name: 'Переводы', color: '#90A4AE' },
  'Перевод на карту': { id: 'transfers', type: 'income', name: 'Переводы', color: '#90A4AE' },
  'Перевод СБП': { id: 'transfers', type: 'expense', name: 'Переводы', color: '#90A4AE' }
};

const ensureSberCategories = () => {
  const existingCategories = getCategories();
  const existingCategoryIds = new Set(existingCategories.map((category: any) => category.id));

  Object.values(sberCategoryMap).forEach(category => {
    if (!existingCategoryIds.has(category.id)) {
      existingCategories.push({
        id: category.id,
        name: category.name,
        type: category.type,
        color: category.color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });

  localStorage.setItem('budget_categories', JSON.stringify(existingCategories));
};

const normalizeSberAmount = (value: string) =>
  parseFloat(value.replace(/\s/g, '').replace(/\u00a0/g, '').replace(',', '.'));

const formatPreviewAmount = (amount: number) => amount.toLocaleString('ru-RU', { minimumFractionDigits: 2 });

const getCategoryName = (id: string) => getCategories().find((category: any) => category.id === id)?.name || 'Прочее';

const getTransferCounterparty = (transaction: Pick<SberTransaction, 'sourceCategory' | 'description'>) => {
  if (!transaction.sourceCategory.includes('Перевод')) return '';
  const match = transaction.description.match(/Перевод (?:для|от)\s+(.+?)(?:\. Операция|$)/i);
  return match?.[1]?.replace(/\s+/g, ' ').trim().toLowerCase() || '';
};

const removePairedInternalTransfers = (transactions: SberTransaction[]) => {
  const grouped = new Map<string, { income: SberTransaction[]; expense: SberTransaction[] }>();

  transactions.forEach(transaction => {
    const counterparty = getTransferCounterparty(transaction);
    if (!counterparty) return;

    const key = `${transaction.date}-${transaction.amount.toFixed(2)}-${counterparty}`;
    const group = grouped.get(key) || { income: [], expense: [] };
    group[transaction.type].push(transaction);
    grouped.set(key, group);
  });

  const pairedTransactions = new Set<SberTransaction>();
  grouped.forEach(group => {
    const pairCount = Math.min(group.income.length, group.expense.length);
    for (let i = 0; i < pairCount; i++) {
      pairedTransactions.add(group.income[i]);
      pairedTransactions.add(group.expense[i]);
    }
  });

  return transactions.filter(transaction => !pairedTransactions.has(transaction));
};

const detectCategory = (sourceCategory: string, description: string) => {
  const descUpper = description.toUpperCase();
  const keywordCategory = findCategoryByKeyword(description);
  if (keywordCategory) return keywordCategory;

  if (['AZS', 'АЗС', 'ЛУКОЙЛ', 'РОСНЕФТЬ', 'ГАЗПРОМНЕФТЬ', 'ЗАПРАВКА'].some(keyword => descUpper.includes(keyword))) {
    return 'fuel';
  }
  if (['AMPP', 'ПАРКОВК'].some(keyword => descUpper.includes(keyword))) {
    return 'parking';
  }
  if (['PYATEROCHKA', 'ПЯТЕРОЧКА', 'LENTA', 'ЛЕНТА', 'MAGNIT', 'МАГНИТ', 'KUPER', 'СВЕТОФОР', 'SVETOFOR', 'MYASNOY'].some(keyword => descUpper.includes(keyword))) {
    return 'cat-food';
  }
  if (['KAFE', 'CAFE', 'COFIX', 'STOLOVAYA', 'VERANDA', 'РЕСТОРАН'].some(keyword => descUpper.includes(keyword))) {
    return 'cat-restaurants';
  }
  if (['OZON', 'YANDEX*4215*DOSTAVKA', 'YSPLIT', 'LEMANAPRO'].some(keyword => descUpper.includes(keyword))) {
    return 'cat-shopping';
  }

  return sberCategoryMap[sourceCategory]?.id || 'cat-other-exp';
};

const normalizeSberTransaction = (raw: { date: string; amount: number; type: 'income' | 'expense'; description: string; category: string }): SberTransaction | null => {
  let type = raw.type;
  if (raw.category === 'Внесение наличных' || raw.category === 'Заработная плата' || raw.category === 'Компенсации' || raw.category === 'Начальный остаток') {
    type = 'income';
  }

  const categoryId = detectCategory(raw.category, raw.description);
  return {
    key: `${raw.date}-${type}-${raw.amount}-${raw.description}`,
    date: raw.date,
    amount: raw.amount,
    type,
    description: raw.description,
    sourceCategory: raw.category,
    categoryId
  };
};

const parseSberText = (text: string): SberTransaction[] => {
  const transactions: SberTransaction[] = [];
  transactions.push(...parseOpeningBalances(text));

  const lines = text.split('\n');

  let currentTransaction = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const dateMatch = line.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+\d{2}:\d{2}/);

    if (dateMatch) {
      if (currentTransaction) {
        const parsed = parseTransactionLine(currentTransaction);
        if (parsed) {
          const normalized = normalizeSberTransaction(parsed);
          if (normalized) transactions.push(normalized);
        }
      }
      currentTransaction = line;
    } else {
      currentTransaction += ' ' + line;
    }
  }

  if (currentTransaction) {
    const parsed = parseTransactionLine(currentTransaction);
    if (parsed) {
      const normalized = normalizeSberTransaction(parsed);
      if (normalized) transactions.push(normalized);
    }
  }

  return transactions;
};

const parseOpeningBalances = (text: string): SberTransaction[] => {
  const match = text.match(/Остаток на\s+(\d{2})\.(\d{2})\.(\d{4})\s+([-+]?\d[\d\s\u00a0]*,\d{2})/);
  if (!match) return [];

  const amount = normalizeSberAmount(match[4]);
  if (isNaN(amount) || amount <= 0) return [];

  const date = `${match[3]}-${match[2]}-${match[1]}`;
  return [{
    key: `opening-${date}-${amount}`,
    date,
    amount,
    type: 'income',
    description: 'Начальный остаток Сбер',
    sourceCategory: 'Начальный остаток',
    categoryId: 'cat-other-inc',
    isOpening: true
  }];
};

const parseTransactionLine = (line: string): { date: string; amount: number; type: 'income' | 'expense'; description: string; category: string } | null => {
  const match = line.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+\d{2}:\d{2}\s+(.+)$/);
  if (!match) return null;

  const dateStr = `${match[3]}-${match[2]}-${match[1]}`;
  const rest = match[4];

  const amountMatch = rest.match(/([+-]?)\s*(\d+(?:[\s\u00a0]\d{3})*,\d{2})(?:\s|$)/);
  if (!amountMatch) return null;

  const sign = amountMatch[1] || '';
  const amount = normalizeSberAmount(amountMatch[2]);
  if (isNaN(amount) || amount < 1) return null;

  const type = sign === '+' ? 'income' : 'expense';

  const beforeAmount = rest.substring(0, rest.indexOf(amountMatch[0])).trim();
  const afterAmount = rest.substring(rest.indexOf(amountMatch[0]) + amountMatch[0].length);

  let category = 'Прочие операции';
  let description = beforeAmount;

  for (const cat of knownSberCategories) {
    if (beforeAmount.includes(cat)) {
      category = cat;
      description = beforeAmount.replace(cat, '').trim();
      break;
    }
  }

  const details = afterAmount
    .replace(/^\s*\d+(?:[\s\u00a0]\d{3})*,\d{2}\s*/, '')
    .replace(/\b\d{2}\.\d{2}\.\d{4}\s+\d{4,6}\s*/g, '')
    .trim();
  description = `${description} ${details}`.trim() || category;
  description = description.replace(/[*#]/g, '').replace(/\s+/g, ' ').trim();

  return { date: dateStr, amount, type, description, category };
};

const isDuplicateTransaction = (newT: SberTransaction, existing: any[]) => {
  if (newT.isOpening) {
    return existing.some((t: any) =>
      t.accountId === sberAccount.value &&
      (t.note || '').includes('Начальный остаток Сбер')
    );
  }

  return existing.some((t: any) =>
    t.date === newT.date &&
    parseFloat(t.amount) === newT.amount &&
    t.type === newT.type &&
    t.accountId === sberAccount.value &&
    (t.note || '').includes(newT.description.slice(0, 32))
  );
};

const toAppTransaction = (item: SberTransaction) => {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    accountId: sberAccount.value,
    type: item.type,
    amount: item.amount,
    date: item.date,
    note: `${item.description} [${getCategoryName(item.categoryId)}]`,
    categoryId: item.categoryId,
    createdAt: now,
    updatedAt: now
  };
};

const importSberTransactions = (items: SberTransaction[]) => {
  saveRules();
  ensureSberCategories();

  const existing = getTransactions();
  const toAdd = items.filter(item => !isDuplicateTransaction(item, existing));
  const all = [...existing, ...toAdd.map(toAppTransaction)];
  localStorage.setItem('budget_transactions', JSON.stringify(all));
  syncToServer();
  return { added: toAdd.length, skipped: items.length - toAdd.length };
};

const triggerSberPdfImport = () => {
  sberPdfInput.value?.click();
};

const extractPdfText = async (file: File) => {
  const pdfjs = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str: string; transform: number[] }>;
    const rows = new Map<number, string[]>();

    items.forEach(item => {
      const y = Math.round(item.transform[5]);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)?.push(item.str);
    });

    [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([, parts]) => lines.push(parts.join(' ').replace(/\s+/g, ' ').trim()));
  }

  return lines.join('\n');
};

const importSberPdf = async (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files || []);
  if (!files.length) return;

  sberLoading.value = true;
  try {
    const parsed: SberTransaction[] = [];
    for (const file of files) {
      const text = await extractPdfText(file);
      parsed.push(...parseSberText(text));
    }
    const withoutInternalTransfers = removePairedInternalTransfers(parsed);
    const unique = new Map(withoutInternalTransfers.map(item => [item.key, item]));
    sberPreview.value = [...unique.values()].sort((a, b) => b.date.localeCompare(a.date));
    if (!sberPreview.value.length) {
      $q.notify({ message: 'Не удалось найти операции в PDF', color: 'negative' });
    }
  } catch (err) {
    $q.notify({ message: 'Не удалось прочитать PDF. Попробуйте текстовый импорт.', color: 'negative' });
  } finally {
    sberLoading.value = false;
    if (sberPdfInput.value) sberPdfInput.value.value = '';
  }
};

const confirmSberPreviewImport = () => {
  const result = importSberTransactions(sberPreview.value);
  sberPreview.value = [];
  $q.notify({ message: `Импортировано ${result.added} операций, дублей пропущено: ${result.skipped}`, color: 'positive' });
  setTimeout(() => location.reload(), 1000);
};

const importSberText = async () => {
  if (!sberText.value.trim()) {
    $q.notify({ message: 'Вставьте текст из PDF', color: 'negative' });
    return;
  }

  sberLoading.value = true;

  try {
    const parsed = removePairedInternalTransfers(parseSberText(sberText.value));

    if (parsed.length === 0) {
      $q.notify({ message: 'Не удалось распознать транзакции', color: 'negative' });
      sberLoading.value = false;
      return;
    }

    const result = importSberTransactions(parsed);
    sberText.value = '';

    $q.notify({ message: `Импортировано ${result.added} операций, дублей пропущено: ${result.skipped}`, color: 'positive' });
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

const downloadBackup = (data: unknown, filePrefix: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filePrefix}-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const exportData = () => {
  downloadBackup(exp(), 'budget-backup-full');
};

const exportNumericData = () => {
  downloadBackup(expNumeric(), 'budget-backup-numbers');
};

const exportStructureData = () => {
  downloadBackup(expStructure(), 'budget-backup-structure');
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
      if (parts[0].length !== 4) {
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

<style scoped>
.backup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.backup-actions .q-btn {
  min-width: 160px;
}

@media (max-width: 600px) {
  .backup-actions {
    flex-direction: column;
  }

  .backup-actions .q-btn {
    width: 100%;
  }
}
</style>
