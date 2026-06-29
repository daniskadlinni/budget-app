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
            <div class="text-h6">Импорт PDF Сбербанка</div>
            <p class="text-caption text-grey">Можно выбрать одну или несколько PDF-выписок. Внутренние переводы между своими счетами будут пропущены.</p>
            <q-select v-model="sberAccount" :options="accountOptions" label="Счёт" emit-value map-options filled class="q-mt-sm" />
            <q-input v-model="sberTargetBalance" label="Фактический остаток по выбранным PDF-счетам" filled class="q-mt-sm" inputmode="decimal" clearable />
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
            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-12 col-sm-4">
                <q-card flat bordered>
                  <q-card-section class="q-pa-sm">
                    <div class="text-caption text-grey">Доходы к добавлению</div>
                    <div class="text-positive">+{{ formatPreviewAmount(sberPreviewSummary.income) }}</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-12 col-sm-4">
                <q-card flat bordered>
                  <q-card-section class="q-pa-sm">
                    <div class="text-caption text-grey">Расходы к добавлению</div>
                    <div class="text-negative">-{{ formatPreviewAmount(sberPreviewSummary.expense) }}</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-12 col-sm-4">
                <q-card flat bordered>
                  <q-card-section class="q-pa-sm">
                    <div class="text-caption text-grey">Изменение баланса</div>
                    <div :class="sberPreviewSummary.balance >= 0 ? 'text-positive' : 'text-negative'">{{ formatPreviewAmount(sberPreviewSummary.balance) }}</div>
                  </q-card-section>
                </q-card>
              </div>
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
            <div class="text-h6">Управление PDF-импортом</div>
            <p class="text-caption text-grey">Можно удалить последний импорт Сбера или все операции, которые пришли из PDF.</p>
            <div class="backup-actions q-mt-md">
              <q-btn color="warning" outline icon="undo" label="Удалить последний PDF-импорт" @click="deleteLastPdfImport" />
              <q-btn color="negative" outline icon="delete_sweep" label="Удалить все PDF-операции" @click="deleteAllPdfImports" />
            </div>
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
  getTransactions,
  getAccountBalance
} from 'src/utils/storage';
import { clearTransactionsOnServer, syncToServer } from 'src/utils/sync';
import { v4 as uuidv4 } from 'uuid';

const $q = useQuasar();
const settingsTab = ref('general');
const darkMode = ref($q.dark.isActive);
const fileInput = ref<HTMLInputElement | null>(null);
const sberPdfInput = ref<HTMLInputElement | null>(null);
const sberAccount = ref('general-card');
const sberTargetBalance = ref('');
const sberLoading = ref(false);
const sberPreview = ref<SberTransaction[]>([]);
const currentSberImportBatchId = ref('');

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
  time?: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  sourceCategory: string;
  categoryId: string;
  accountTail?: string;
  isOpening?: boolean;
};

type SberStatementBalance = {
  closing: number;
  closeDate: string;
};

const sberPreviewToAdd = computed(() => {
  const existing = getTransactions();
  return sberPreview.value.filter(item => !isDuplicateTransaction(item, existing));
});

const sberPreviewSummary = computed(() => {
  const income = sberPreviewToAdd.value
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  const expense = sberPreviewToAdd.value
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);
  return { income, expense, balance: income - expense };
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

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

const getTransactionsBalanceDelta = (transactions: SberTransaction[]) =>
  roundMoney(transactions.reduce((sum, transaction) =>
    sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount), 0));

const parseOptionalSberTargetBalance = () => {
  if (!sberTargetBalance.value.trim()) return null;
  const amount = normalizeSberAmount(sberTargetBalance.value);
  return isNaN(amount) ? null : amount;
};

const getTransferCounterparty = (transaction: Pick<SberTransaction, 'sourceCategory' | 'description'>) => {
  if (!transaction.sourceCategory.includes('Перевод')) return '';
  const match = transaction.description.match(/Перевод (?:для|от)\s+(.+?)(?:\. Операция|$)/i);
  return match?.[1]?.replace(/\s+/g, ' ').trim().toLowerCase() || '';
};

const isTransferLike = (transaction: SberTransaction) =>
  transaction.sourceCategory.includes('Перевод') || /перевод|sberbank onl@in/i.test(transaction.description);

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

  const remaining = transactions.filter(transaction => !pairedTransactions.has(transaction));
  const exactGroups = new Map<string, { income: SberTransaction[]; expense: SberTransaction[] }>();

  remaining
    .filter(isTransferLike)
    .forEach(transaction => {
      const key = `${transaction.date}-${transaction.time || ''}-${transaction.amount.toFixed(2)}`;
      const group = exactGroups.get(key) || { income: [], expense: [] };
      group[transaction.type].push(transaction);
      exactGroups.set(key, group);
    });

  exactGroups.forEach(group => {
    const pairCount = Math.min(group.income.length, group.expense.length);
    for (let i = 0; i < pairCount; i++) {
      pairedTransactions.add(group.income[i]);
      pairedTransactions.add(group.expense[i]);
    }
  });

  return transactions.filter(transaction => !pairedTransactions.has(transaction));
};

const makePreviewKeysUnique = (transactions: SberTransaction[]) => {
  const seen = new Map<string, number>();

  return transactions.map(transaction => {
    const count = seen.get(transaction.key) || 0;
    seen.set(transaction.key, count + 1);
    if (count === 0) return transaction;
    return { ...transaction, key: `${transaction.key}#${count + 1}` };
  });
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

const normalizeSberTransaction = (raw: { date: string; time: string; amount: number; type: 'income' | 'expense'; description: string; category: string; accountTail?: string }): SberTransaction | null => {
  let type = raw.type;
  if (raw.category === 'Внесение наличных' || raw.category === 'Заработная плата' || raw.category === 'Компенсации' || raw.category === 'Начальный остаток') {
    type = 'income';
  }

  let categoryId = detectCategory(raw.category, raw.description);
  const mappedCategory = sberCategoryMap[raw.category];
  if (type === 'income' && (!mappedCategory || mappedCategory.type === 'expense') && categoryId === 'cat-other-exp') {
    categoryId = 'cat-other-inc';
  }

  return {
    key: `${raw.date}-${raw.time}-${type}-${raw.amount}-${raw.accountTail || ''}-${raw.description}`,
    date: raw.date,
    time: raw.time,
    amount: raw.amount,
    type,
    description: raw.description,
    sourceCategory: raw.category,
    categoryId,
    accountTail: raw.accountTail
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

const parseStatementBalance = (text: string): SberStatementBalance | null => {
  const balances = [...text.matchAll(/Остаток на\s+(\d{2})\.(\d{2})\.(\d{4})\s+([-+]?\d[\d\s\u00a0]*,\d{2})/g)];
  const closing = balances[balances.length - 1];
  if (!closing) return null;

  const amount = normalizeSberAmount(closing[4]);
  if (isNaN(amount)) return null;

  return {
    closeDate: `${closing[3]}-${closing[2]}-${closing[1]}`,
    closing: amount
  };
};

const parseTransactionLine = (line: string): { date: string; time: string; amount: number; type: 'income' | 'expense'; description: string; category: string; accountTail?: string } | null => {
  const match = line.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2})\s+(.+)$/);
  if (!match) return null;

  const dateStr = `${match[3]}-${match[2]}-${match[1]}`;
  const time = match[4];
  const rest = match[5];

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
  const accountTail = description.match(/Операция по (?:счету|карте)\s+(\d{4})/)?.[1];

  return { date: dateStr, time, amount, type, description, category, accountTail };
};

const getNewSberTransactions = (items: SberTransaction[], existing = getTransactions()) => {
  const seenIncoming = new Set<string>();
  return items.filter(item => {
    const signature = `${item.date}-${item.time || ''}-${item.type}-${item.amount}-${item.accountTail || ''}-${item.description}`;
    if (seenIncoming.has(signature)) return false;
    seenIncoming.add(signature);
    return !isDuplicateTransaction(item, existing);
  });
};

const createBalanceCorrection = (transactions: SberTransaction[], statements: SberStatementBalance[], targetBalance: number | null = null) => {
  if (!statements.length && targetBalance === null) return null;

  const expectedBalance = roundMoney(targetBalance ?? statements.reduce((sum, statement) => sum + statement.closing, 0));
  const balanceAfterImport = roundMoney(getAccountBalance(sberAccount.value) + getTransactionsBalanceDelta(getNewSberTransactions(transactions)));
  const actualBalance = balanceAfterImport;
  const difference = roundMoney(expectedBalance - actualBalance);
  if (Math.abs(difference) < 0.01) return null;

  const date = statements.length
    ? statements.map(statement => statement.closeDate).sort((a, b) => b.localeCompare(a))[0]
    : transactions.map(transaction => transaction.date).sort((a, b) => b.localeCompare(a))[0];
  const type = difference > 0 ? 'income' : 'expense';
  const amount = Math.abs(difference);

  return {
    key: `balance-correction-${date}-${type}-${amount}-${expectedBalance}`,
    date,
    amount,
    type,
    description: `Корректировка остатка Сбер до ${formatPreviewAmount(expectedBalance)}`,
    sourceCategory: 'Корректировка остатка',
    categoryId: type === 'income' ? 'cat-other-inc' : 'cat-other-exp'
  } as SberTransaction;
};

const isDuplicateTransaction = (newT: SberTransaction, existing: any[]) => {
  if (newT.isOpening) {
    return existing.some((t: any) =>
      t.accountId === sberAccount.value &&
      (t.note || '').includes('Начальный остаток Сбер')
    );
  }

  return existing.some((t: any) =>
    t.accountId === sberAccount.value &&
    (
      t.importKey === newT.key ||
      (
        t.date === newT.date &&
        parseFloat(t.amount) === newT.amount &&
        t.type === newT.type &&
        (t.note || '').includes(newT.description.slice(0, 32))
      )
    )
  );
};

const toAppTransaction = (item: SberTransaction) => {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    source: 'sber-pdf',
    importBatchId: currentSberImportBatchId.value,
    importKey: item.key,
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
  currentSberImportBatchId.value = `sber-${Date.now()}`;
  const toAdd = getNewSberTransactions(items, existing);
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
    const rows = new Map<number, Array<{ x: number; text: string }>>();

    items.forEach(item => {
      const y = Math.round(item.transform[5]);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)?.push({ x: item.transform[4], text: item.str });
    });

    [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([, parts]) => {
        const line = parts
          .sort((a, b) => a.x - b.x)
          .map(part => part.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (line) lines.push(line);
      });
  }

  return lines.join('\n');
};

const importSberPdf = async (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files || []);
  if (!files.length) return;

  sberLoading.value = true;
  try {
    const parsed: SberTransaction[] = [];
    const statements: SberStatementBalance[] = [];
    for (const file of files) {
      const text = await extractPdfText(file);
      const statement = parseStatementBalance(text);
      if (statement) statements.push(statement);
      parsed.push(...parseSberText(text));
    }
    const withoutInternalTransfers = removePairedInternalTransfers(parsed);
    const correction = createBalanceCorrection(withoutInternalTransfers, statements, parseOptionalSberTargetBalance());
    const previewItems = correction ? [...withoutInternalTransfers, correction] : withoutInternalTransfers;
    sberPreview.value = makePreviewKeysUnique(previewItems)
      .sort((a, b) => b.date.localeCompare(a.date));
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

const removePdfTransactions = (predicate: (transaction: any) => boolean) => {
  const transactions = getTransactions();
  const toDelete = transactions.filter(predicate);
  if (!toDelete.length) return 0;

  const deleted = JSON.parse(localStorage.getItem('budget_deleted_ids') || '[]');
  toDelete.forEach((transaction: any) => {
    if (!deleted.find((item: any) => item.type === 'transaction' && item.id === transaction.id)) {
      deleted.push({ type: 'transaction', id: transaction.id });
    }
  });
  localStorage.setItem('budget_deleted_ids', JSON.stringify(deleted));
  localStorage.setItem('budget_transactions', JSON.stringify(transactions.filter(transaction => !predicate(transaction))));
  syncToServer();
  return toDelete.length;
};

const deleteLastPdfImport = () => {
  const pdfTransactions = getTransactions().filter((transaction: any) => transaction.source === 'sber-pdf');
  const latest = [...pdfTransactions]
    .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0];

  if (!latest) {
    $q.notify({ message: 'PDF-импортов не найдено', color: 'warning' });
    return;
  }

  $q.dialog({
    title: 'Удалить последний PDF-импорт',
    message: 'Операции из последнего импорта Сбера будут удалены.',
    cancel: true
  }).onOk(() => {
    const removed = removePdfTransactions((transaction: any) => latest.importBatchId
      ? transaction.importBatchId === latest.importBatchId
      : transaction.source === 'sber-pdf' && transaction.createdAt === latest.createdAt);
    $q.notify({ message: `Удалено ${removed} операций`, color: 'positive' });
    setTimeout(() => location.reload(), 700);
  });
};

const deleteAllPdfImports = () => {
  $q.dialog({
    title: 'Удалить все PDF-операции',
    message: 'Будут удалены все операции, импортированные из PDF Сбера.',
    cancel: true,
    persistent: true
  }).onOk(() => {
    const removed = removePdfTransactions((transaction: any) => transaction.source === 'sber-pdf');
    $q.notify({ message: `Удалено ${removed} операций`, color: 'positive' });
    setTimeout(() => location.reload(), 700);
  });
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
      await clearTransactionsOnServer();
      localStorage.setItem('budget_transactions', '[]');
      sberPreview.value = [];
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
