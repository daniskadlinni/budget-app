const STORAGE_KEYS = {
  accounts: 'budget_accounts',
  categories: 'budget_categories',
  transactions: 'budget_transactions'
};

const DELETED_IDS_KEY = 'budget_deleted_ids';
const getDeletedIds = () => JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]');
const CATEGORY_RULES_KEY = 'budget_category_rules';

const API_URL = 'https://zxrpluuneassstffzday.supabase.co/functions/v1/sync-data';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4cnBsdXVuZWFzc3N0ZmZ6ZGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTI5MDMsImV4cCI6MjA5NjA2ODkwM30.sjXnnVnF1cyENt5x9yTH1_v7SPXul4603aSZmXuqmgc';

const defaultAccounts = [
  { id: 'general-cash', name: 'Общий — Наличные', type: 'cash', balance: 0, currency: 'RUB' },
  { id: 'general-card', name: 'Общий — Карта', type: 'card', balance: 0, currency: 'RUB' },
  { id: 'savings', name: 'Накопительный', type: 'card', balance: 0, currency: 'RUB' }
];

const defaultCategories = [
  { id: 'cat-food', name: 'Продукты', type: 'expense', color: '#FF5722' },
  { id: 'cat-transport', name: 'Транспорт', type: 'expense', color: '#2196F3' },
  { id: 'cat-restaurants', name: 'Кафе и рестораны', type: 'expense', color: '#FFC107' },
  { id: 'cat-entertainment', name: 'Развлечения', type: 'expense', color: '#9C27B0' },
  { id: 'cat-utilities', name: 'Коммунальные', type: 'expense', color: '#607D8B' },
  { id: 'cat-shopping', name: 'Покупки', type: 'expense', color: '#E91E63' },
  { id: 'cat-home', name: 'Дом', type: 'expense', color: '#795548' },
  { id: 'fuel', name: 'Бензин', type: 'expense', color: '#FF5722' },
  { id: 'car-service', name: 'Обслуживание авто', type: 'expense', color: '#795548' },
  { id: 'parking', name: 'Парковка', type: 'expense', color: '#607D8B' },
  { id: 'transfers', name: 'Переводы', type: 'expense', color: '#90A4AE' },
  { id: 'subscriptions', name: 'Регулярные платежи', type: 'expense', color: '#00BCD4' },
  { id: 'cat-health', name: 'Здоровье', type: 'expense', color: '#F44336' },
  { id: 'cat-education', name: 'Образование', type: 'expense', color: '#3F51B5' },
  { id: 'cat-other-exp', name: 'Прочее', type: 'expense', color: '#9E9E9E' },
  { id: 'cat-salary', name: 'Зарплата', type: 'income', color: '#4CAF50' },
  { id: 'cat-bonus', name: 'Премия', type: 'income', color: '#8BC34A' },
  { id: 'cat-freelance', name: 'Левак', type: 'income', color: '#CDDC39' },
  { id: 'cat-other-inc', name: 'Прочее', type: 'income', color: '#9E9E9E' }
];

const syncToServer = async () => {
  try {
    const data = {
      accounts: getAccounts(),
      categories: getCategories(),
      transactions: getTransactions(),
      budgets: getBudgets(),
      goals: getGoals(),
      subscriptions: getSubscriptions(),
      stores: getStores(),
      shopping: getShoppingItems(),
      products: getProducts(),
      reminders: getReminders(),
      deletedIds: getDeletedIds()
    };
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error('Sync error:', e);
  }
};

const syncFromServer = async () => {
  try {
    const res = await fetch(API_URL, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const data = await res.json();

    const localAccounts = getAccounts();
    const localCategories = getCategories();
    const localTransactions = getTransactions();
    const localBudgets = getBudgets();
    const localGoals = getGoals();
    const localStores = getStores();
    const localShopping = getShoppingItems();
    const localProducts = getProducts();
    const localReminders = getReminders();

    const mergeById = (local: any[], server: any[]) => {
      const map = new Map();
      [...local, ...server].forEach((item) => {
        if (item?.id) map.set(item.id, item);
      });
      return Array.from(map.values());
    };

    if (data.accounts) {
      const localIds = new Set(localAccounts.map(a => a.id));
      const newFromServer = data.accounts.filter(a => !localIds.has(a.id));
      const merged = [...localAccounts, ...newFromServer];
      localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(merged));
    }
    if (data.categories) {
      const localIds = new Set(localCategories.map(c => c.id));
      const newFromServer = data.categories.filter(c => !localIds.has(c.id));
      const merged = [...localCategories, ...newFromServer];
      localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(merged));
    }
    if (data.transactions) {
      const localIds = new Set(localTransactions.map(t => t.id));
      const newFromServer = data.transactions.filter(t => !localIds.has(t.id));
      const merged = [...localTransactions, ...newFromServer];
      localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(merged));
    }
    if (data.budgets) {
      const localIds = new Set(localBudgets.map(b => b.id));
      const newFromServer = data.budgets.filter(b => !localIds.has(b.id));
      const merged = [...localBudgets, ...newFromServer];
      localStorage.setItem('budget_limits', JSON.stringify(merged));
    }
    if (data.goals) {
      const localIds = new Set(localGoals.map(g => g.id));
      const newFromServer = data.goals.filter(g => !localIds.has(g.id));
      const merged = [...localGoals, ...newFromServer];
      localStorage.setItem('budget_goals', JSON.stringify(merged));
    }
    if (data.subscriptions) {
      const localSubs = getSubscriptions();
      localStorage.setItem('budget_subscriptions', JSON.stringify(mergeById(localSubs, data.subscriptions)));
    }
    if (data.stores) {
      localStorage.setItem('budget_stores', JSON.stringify(mergeById(localStores, data.stores)));
    }
    if (data.shopping) {
      localStorage.setItem('budget_shopping', JSON.stringify(mergeById(localShopping, data.shopping)));
    }
    if (data.products) {
      localStorage.setItem('budget_products', JSON.stringify(mergeById(localProducts, data.products)));
    }
    if (data.reminders) {
      localStorage.setItem('budget_reminders', JSON.stringify(mergeById(localReminders, data.reminders)));
    }
    if (data.deletedIds) {
      localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(data.deletedIds));
    }
    return data;
  } catch (e) {
    console.error('Fetch error:', e);
    return null;
  }
};

export const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.accounts)) {
    localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(defaultAccounts));
  }
  if (!localStorage.getItem(STORAGE_KEYS.categories)) {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(defaultCategories));
  } else {
    const categories = getCategories();
    const ids = new Set(categories.map((category: any) => category.id));
    const missing = defaultCategories.filter(category => !ids.has(category.id));
    if (missing.length) {
      localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify([...categories, ...missing]));
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.transactions)) {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify([]));
  }
};

export const getAccounts = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.accounts) || '[]');
export const getTransactions = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.transactions) || '[]');
export const getCategories = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.categories) || '[]');

export const saveTransaction = (t) => {
  const transactions = getTransactions();
  transactions.push(t);
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  syncToServer();
};

export const deleteTransaction = (id) => {
  const transactions = getTransactions().filter(t => t.id !== id && t.transferToId !== id);
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  const deleted = getDeletedIds();
  deleted.push({ type: 'transaction', id });
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deleted));
  syncToServer();
};

const exportedAt = () => new Date().toISOString();

const getDeletedIdsByType = (types: string[]) => {
  const allowed = new Set(types);
  return getDeletedIds().filter((item: any) => allowed.has(item.type));
};

const mergeDeletedIdsForImport = (incoming: any[], affectedTypes?: string[]) => {
  if (!affectedTypes) return incoming;

  const affected = new Set(affectedTypes);
  const kept = getDeletedIds().filter((item: any) => !affected.has(item.type));
  const unique = new Map<string, any>();
  [...kept, ...incoming].forEach((item: any) => {
    if (item?.type && item?.id) unique.set(`${item.type}-${item.id}`, item);
  });
  return [...unique.values()];
};

export const exportData = () => ({
  backupType: 'full',
  accounts: getAccounts(),
  categories: getCategories(),
  transactions: getTransactions(),
  budgets: getBudgets(),
  goals: getGoals(),
  subscriptions: getSubscriptions(),
  stores: getStores(),
  shopping: getShoppingItems(),
  products: getProducts(),
  reminders: getReminders(),
  categoryRules: JSON.parse(localStorage.getItem(CATEGORY_RULES_KEY) || '[]'),
  deletedIds: getDeletedIds(),
  exportedAt: exportedAt()
});

export const exportNumericData = () => ({
  backupType: 'numeric',
  transactions: getTransactions(),
  budgets: getBudgets(),
  goals: getGoals(),
  deletedIds: getDeletedIdsByType(['transaction', 'budget', 'goal']),
  exportedAt: exportedAt()
});

export const exportStructureData = () => ({
  backupType: 'structure',
  accounts: getAccounts(),
  categories: getCategories(),
  subscriptions: getSubscriptions(),
  stores: getStores(),
  shopping: getShoppingItems(),
  products: getProducts(),
  reminders: getReminders(),
  categoryRules: JSON.parse(localStorage.getItem(CATEGORY_RULES_KEY) || '[]'),
  deletedIds: getDeletedIdsByType(['account', 'category', 'subscription', 'store', 'shopping', 'product', 'reminder']),
  exportedAt: exportedAt()
});

export const importData = (data) => {
  if (data.accounts) localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(data.accounts));
  if (data.categories) localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(data.categories));
  if (data.transactions) localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(data.transactions));
  if (data.budgets) localStorage.setItem('budget_limits', JSON.stringify(data.budgets));
  if (data.goals) localStorage.setItem('budget_goals', JSON.stringify(data.goals));
  if (data.subscriptions) localStorage.setItem('budget_subscriptions', JSON.stringify(data.subscriptions));
  if (data.stores) localStorage.setItem('budget_stores', JSON.stringify(data.stores));
  if (data.shopping) localStorage.setItem('budget_shopping', JSON.stringify(data.shopping));
  if (data.products) localStorage.setItem('budget_products', JSON.stringify(data.products));
  if (data.reminders) localStorage.setItem('budget_reminders', JSON.stringify(data.reminders));
  if (data.categoryRules) localStorage.setItem(CATEGORY_RULES_KEY, JSON.stringify(data.categoryRules));
  if (data.deletedIds) {
    const numericTypes = ['transaction', 'budget', 'goal'];
    const structureTypes = ['account', 'category', 'subscription', 'store', 'shopping', 'product', 'reminder'];
    const affectedTypes = data.backupType === 'numeric'
      ? numericTypes
      : data.backupType === 'structure'
        ? structureTypes
        : undefined;
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(mergeDeletedIdsForImport(data.deletedIds, affectedTypes)));
  }
  syncToServer();
};

const STORAGE_KEYS_BUDGET = 'budget_limits';
export const getBudgets = () => JSON.parse(localStorage.getItem(STORAGE_KEYS_BUDGET) || '[]');

export const saveBudget = (budget: any) => {
  const budgets = getBudgets();
  const now = new Date().toISOString();
  budget.id = budget.id || 'budget-' + Date.now();
  budget.createdAt = budget.createdAt || now;
  budget.updatedAt = now;
  const idx = budgets.findIndex((b: any) => b.id === budget.id);
  if (idx >= 0) budgets[idx] = budget;
  else budgets.push(budget);
  localStorage.setItem(STORAGE_KEYS_BUDGET, JSON.stringify(budgets));
  syncToServer();
};

export const deleteBudget = (id: string) => {
  const budgets = getBudgets().filter((b: any) => b.id !== id);
  localStorage.setItem(STORAGE_KEYS_BUDGET, JSON.stringify(budgets));
  const deleted = getDeletedIds();
  deleted.push({ type: 'budget', id });
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deleted));
  syncToServer();
};

export const getMonthlySpent = (categoryIds?: string[]) => {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return getTransactions()
    .filter(t => {
      if (t.type !== 'expense') return false;
      if (!t.date.startsWith(monthKey)) return false;
      if (categoryIds && categoryIds.length > 0 && !categoryIds.includes(t.categoryId)) return false;
      return true;
    })
    .reduce((s, t) => s + t.amount, 0);
};

const STORAGE_KEYS_SUBS = 'budget_subscriptions';
export const getSubscriptions = () => JSON.parse(localStorage.getItem(STORAGE_KEYS_SUBS) || '[]');

export const saveSubscription = (sub: any) => {
  const subs = getSubscriptions();
  const now = new Date().toISOString();
  sub.id = sub.id || Date.now().toString();
  sub.createdAt = now;
  sub.updatedAt = now;
  const idx = subs.findIndex((s: any) => s.id === sub.id);
  if (idx >= 0) subs[idx] = sub;
  else subs.push(sub);
  localStorage.setItem(STORAGE_KEYS_SUBS, JSON.stringify(subs));
  syncToServer();
};

export const deleteSubscription = (id: string) => {
  const subs = getSubscriptions().filter((s: any) => s.id !== id);
  localStorage.setItem(STORAGE_KEYS_SUBS, JSON.stringify(subs));
  const deleted = getDeletedIds();
  deleted.push({ type: 'subscription', id });
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deleted));
  syncToServer();
};

export const saveCategory = (cat: any) => {
  const categories = getCategories();
  const now = new Date().toISOString();
  cat.id = cat.id || 'cat-' + Date.now();
  cat.createdAt = cat.createdAt || now;
  cat.updatedAt = now;
  const idx = categories.findIndex(c => c.id === cat.id);
  if (idx >= 0) categories[idx] = cat;
  else categories.push(cat);
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
  syncToServer();
};

export const deleteCategory = (id: string) => {
  const categories = getCategories().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
  const deleted = getDeletedIds();
  deleted.push({ type: 'category', id });
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deleted));
  syncToServer();
};

const STORAGE_KEYS_GOALS = 'budget_goals';
export const getGoals = () => JSON.parse(localStorage.getItem(STORAGE_KEYS_GOALS) || '[]');

export const saveGoal = (goal: any) => {
  const goals = getGoals();
  const now = new Date().toISOString();
  goal.id = goal.id || 'goal-' + Date.now();
  goal.createdAt = goal.createdAt || now;
  goal.updatedAt = now;
  const idx = goals.findIndex((g: any) => g.id === goal.id);
  if (idx >= 0) goals[idx] = goal;
  else goals.push(goal);
  localStorage.setItem(STORAGE_KEYS_GOALS, JSON.stringify(goals));
  syncToServer();
};

export const deleteGoal = (id: string) => {
  const goals = getGoals().filter((g: any) => g.id !== id);
  localStorage.setItem(STORAGE_KEYS_GOALS, JSON.stringify(goals));
  const deleted = getDeletedIds();
  deleted.push({ type: 'goal', id });
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deleted));
  syncToServer();
};

export const formatNumber = (num: number) => num.toLocaleString('ru-RU', { minimumFractionDigits: 2 });

export const getAccountBalance = (accountId: string) => {
  const transactions = getTransactions();
  let balance = 0;
  transactions.forEach((t: any) => {
    if (t.accountId === accountId) {
      if (t.type === 'income') balance += t.amount;
      else if (t.type === 'expense') balance -= t.amount;
      else if (t.type === 'transfer' && t.isTransferFrom) balance -= t.amount;
      else if (t.type === 'transfer' && !t.isTransferFrom) balance += t.amount;
    }
  });
  return balance;
};

const STORAGE_KEYS_STORES = 'budget_stores';
export const getStores = () => JSON.parse(localStorage.getItem(STORAGE_KEYS_STORES) || '[]');

export const saveStore = (store: any) => {
  const stores = getStores();
  const now = new Date().toISOString();
  store.id = store.id || 'store-' + Date.now();
  store.createdAt = store.createdAt || now;
  store.updatedAt = now;
  const idx = stores.findIndex((s: any) => s.id === store.id);
  if (idx >= 0) stores[idx] = store;
  else stores.push(store);
  localStorage.setItem(STORAGE_KEYS_STORES, JSON.stringify(stores));
  syncToServer();
};

export const deleteStore = (id: string) => {
  const stores = getStores().filter((s: any) => s.id !== id);
  localStorage.setItem(STORAGE_KEYS_STORES, JSON.stringify(stores));
  const deleted = getDeletedIds();
  deleted.push({ type: 'store', id });
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deleted));
  syncToServer();
};

const STORAGE_KEYS_SHOPPING = 'budget_shopping';
export const getShoppingItems = () => JSON.parse(localStorage.getItem(STORAGE_KEYS_SHOPPING) || '[]');

export const saveShoppingItem = (item: any) => {
  const items = getShoppingItems();
  const now = new Date().toISOString();
  item.id = item.id || 'shop-' + Date.now();
  item.createdAt = item.createdAt || now;
  item.updatedAt = now;
  const idx = items.findIndex((i: any) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  localStorage.setItem(STORAGE_KEYS_SHOPPING, JSON.stringify(items));
  syncToServer();
};

export const deleteShoppingItem = (id: string) => {
  const items = getShoppingItems().filter((i: any) => i.id !== id);
  localStorage.setItem(STORAGE_KEYS_SHOPPING, JSON.stringify(items));
  const deleted = getDeletedIds();
  deleted.push({ type: 'shopping', id });
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deleted));
  syncToServer();
};

export const markShoppingItemPurchased = (id: string, actualPrice: number, accountId: string) => {
  const items = getShoppingItems();
  const idx = items.findIndex((i: any) => i.id === id);
  if (idx >= 0) {
    items[idx].purchased = true;
    items[idx].actualPrice = actualPrice;
    items[idx].purchasedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS_SHOPPING, JSON.stringify(items));

    const transaction = {
      id: 't-' + Date.now(),
      accountId,
      type: 'expense',
      amount: actualPrice,
      date: new Date().toISOString().split('T')[0],
      note: items[idx].name,
      categoryId: 'cat-shopping',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveTransaction(transaction);
  }
  syncToServer();
};

const STORAGE_KEYS_PRODUCTS = 'budget_products';
export const getProducts = () => JSON.parse(localStorage.getItem(STORAGE_KEYS_PRODUCTS) || '[]');

export const saveProduct = (product: any) => {
  const products = getProducts();
  const now = new Date().toISOString();
  product.id = product.id || 'prod-' + Date.now();
  product.createdAt = product.createdAt || now;
  product.updatedAt = now;
  const idx = products.findIndex((p: any) => p.id === product.id);
  if (idx >= 0) products[idx] = product;
  else products.push(product);
  localStorage.setItem(STORAGE_KEYS_PRODUCTS, JSON.stringify(products));
  syncToServer();
};

export const deleteProduct = (id: string) => {
  const products = getProducts().filter((p: any) => p.id !== id);
  localStorage.setItem(STORAGE_KEYS_PRODUCTS, JSON.stringify(products));
  const deleted = getDeletedIds();
  deleted.push({ type: 'product', id });
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deleted));
  syncToServer();
};

export const addProductToShopping = (productId: string, storeId: string, plannedPrice: number) => {
  const product = getProducts().find((p: any) => p.id === productId);
  if (product) {
    saveShoppingItem({
      name: product.name,
      storeId: storeId || product.storeId,
      plannedPrice: plannedPrice || product.lastPrice,
      productId: product.id
    });
  }
};

const STORAGE_KEYS_REMINDERS = 'budget_reminders';
export const getReminders = () => JSON.parse(localStorage.getItem(STORAGE_KEYS_REMINDERS) || '[]');

export const saveReminder = (reminder: any) => {
  const reminders = getReminders();
  const now = new Date().toISOString();
  reminder.id = reminder.id || 'rem-' + Date.now();
  reminder.createdAt = reminder.createdAt || now;
  reminder.updatedAt = now;
  const idx = reminders.findIndex((r: any) => r.id === reminder.id);
  if (idx >= 0) reminders[idx] = reminder;
  else reminders.push(reminder);
  localStorage.setItem(STORAGE_KEYS_REMINDERS, JSON.stringify(reminders));
  syncToServer();
};

export const deleteReminder = (id: string) => {
  const reminders = getReminders().filter((r: any) => r.id !== id);
  localStorage.setItem(STORAGE_KEYS_REMINDERS, JSON.stringify(reminders));
  const deleted = getDeletedIds();
  deleted.push({ type: 'reminder', id });
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deleted));
  syncToServer();
};

export const toggleReminderActive = (id: string) => {
  const reminders = getReminders();
  const idx = reminders.findIndex((r: any) => r.id === id);
  if (idx >= 0) {
    reminders[idx].active = !reminders[idx].active;
    localStorage.setItem(STORAGE_KEYS_REMINDERS, JSON.stringify(reminders));
    syncToServer();
  }
};

export { syncFromServer };
