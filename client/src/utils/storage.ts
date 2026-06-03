const STORAGE_KEYS = {
  accounts: 'budget_accounts',
  categories: 'budget_categories',
  transactions: 'budget_transactions'
};

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

export const getAccounts = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.accounts) || '[]');
};

export const getTransactions = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.transactions) || '[]');
};

export const getCategories = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.categories) || '[]');
};

export const saveTransaction = (t) => {
  const transactions = getTransactions();
  transactions.push(t);
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
};

export const deleteTransaction = (id) => {
  const transactions = getTransactions().filter(t => t.id !== id && t.transferToId !== id);
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
};

export const exportData = () => {
  return {
    accounts: getAccounts(),
    categories: getCategories(),
    transactions: getTransactions(),
    exportedAt: new Date().toISOString()
  };
};

export const importData = (data) => {
  if (data.accounts) localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(data.accounts));
  if (data.categories) localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(data.categories));
  if (data.transactions) localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(data.transactions));
};

const STORAGE_KEYS_BUDGET = 'budget_limits';

export const getBudget = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS_BUDGET) || '{}');
};

export const setBudget = (limit: number) => {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const budget = getBudget();
  budget[monthKey] = limit;
  localStorage.setItem(STORAGE_KEYS_BUDGET, JSON.stringify(budget));
};

export const getMonthlySpent = () => {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const transactions = getTransactions();
  return transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(monthKey))
    .reduce((s, t) => s + t.amount, 0);
};

const STORAGE_KEYS_SUBS = 'budget_subscriptions';

export const getSubscriptions = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS_SUBS) || '[]');
};

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
};

export const deleteSubscription = (id: string) => {
  const subs = getSubscriptions().filter((s: any) => s.id !== id);
  localStorage.setItem(STORAGE_KEYS_SUBS, JSON.stringify(subs));
};

export const formatNumber = (num: number) => num.toLocaleString('ru-RU', { minimumFractionDigits: 2 });

export const getAccountBalance = (accountId) => {
  const accounts = getAccounts();
  const transactions = getTransactions();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return 0;

  let balance = acc.balance || 0;

  transactions.forEach(t => {
    if (t.accountId === accountId) {
      if (t.type === 'income') balance += t.amount;
      else if (t.type === 'expense') balance -= t.amount;
      else if (t.type === 'transfer' && t.isTransferFrom) balance -= t.amount;
      else if (t.type === 'transfer' && !t.isTransferFrom) balance += t.amount;
    }
  });

  return balance;
};