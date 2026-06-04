const STORAGE_KEYS = {
  accounts: 'budget_accounts',
  categories: 'budget_categories',
  transactions: 'budget_transactions'
};

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
  { id: 'cat-entertainment', name: 'Развлечения', type: 'expense', color: '#9C27B0' },
  { id: 'cat-utilities', name: 'Коммунальные', type: 'expense', color: '#607D8B' },
  { id: 'cat-shopping', name: 'Покупки', type: 'expense', color: '#E91E63' },
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
      subscriptions: getSubscriptions()
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
    if (data.accounts) localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(data.accounts));
    if (data.categories) localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(data.categories));
    if (data.transactions) localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(data.transactions));
    if (data.budgets) localStorage.setItem('budget_limits', JSON.stringify(data.budgets));
    if (data.goals) localStorage.setItem('budget_goals', JSON.stringify(data.goals));
    if (data.subscriptions) localStorage.setItem('budget_subscriptions', JSON.stringify(data.subscriptions));
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
  syncToServer();
};

export const exportData = () => ({
  accounts: getAccounts(),
  categories: getCategories(),
  transactions: getTransactions(),
  exportedAt: new Date().toISOString()
});

export const importData = (data) => {
  if (data.accounts) localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(data.accounts));
  if (data.categories) localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(data.categories));
  if (data.transactions) localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(data.transactions));
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

export { syncFromServer };
