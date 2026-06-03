import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const api = axios.create({
  baseURL: 'http://localhost:3001'
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('tokens');
  if (stored) {
    const tokens = JSON.parse(stored);
    if (tokens.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
  }
  return config;
});

interface User {
  id: string;
  email: string;
  baseCurrency: string;
}

interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'cash' | 'card' | 'credit' | 'crypto' | 'wallet';
  currency: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date: string;
  note?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  account?: Account;
  category?: Category;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const isAuthenticated = computed(() => !!accessToken.value);

  const setTokens = (access: string, refresh: string) => {
    accessToken.value = access;
    refreshToken.value = refresh;
    localStorage.setItem('tokens', JSON.stringify({ access, refresh }));
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    user.value = response.data.user;
    setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  };

  const register = async (email: string, password: string, baseCurrency = 'USD') => {
    const response = await api.post('/api/auth/register', { email, password, baseCurrency });
    user.value = response.data.user;
    setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  };

  const logout = () => {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem('tokens');
  };

  const initFromStorage = () => {
    const stored = localStorage.getItem('tokens');
    if (stored) {
      const tokens = JSON.parse(stored);
      accessToken.value = tokens.access;
      refreshToken.value = tokens.refresh;
    }
  };

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    login,
    register,
    logout,
    initFromStorage
  };
});

export const useDataStore = defineStore('data', () => {
  const accounts = ref<Account[]>([]);
  const categories = ref<Category[]>([]);
  const transactions = ref<Transaction[]>([]);
  const lastSyncTimestamp = ref<string | null>(null);
  const isSyncing = ref(false);
  const pendingChanges = ref<any[]>([]);

  const generateId = () => uuidv4();

  const loadFromStorage = () => {
    const storedAccounts = localStorage.getItem('accounts');
    const storedCategories = localStorage.getItem('categories');
    const storedTransactions = localStorage.getItem('transactions');
    const storedSync = localStorage.getItem('lastSyncTimestamp');

    if (storedAccounts) accounts.value = JSON.parse(storedAccounts);
    if (storedCategories) categories.value = JSON.parse(storedCategories);
    if (storedTransactions) transactions.value = JSON.parse(storedTransactions);
    if (storedSync) lastSyncTimestamp.value = storedSync;
  };

  const saveToStorage = () => {
    localStorage.setItem('accounts', JSON.stringify(accounts.value));
    localStorage.setItem('categories', JSON.stringify(categories.value));
    localStorage.setItem('transactions', JSON.stringify(transactions.value));
    if (lastSyncTimestamp.value) {
      localStorage.setItem('lastSyncTimestamp', lastSyncTimestamp.value);
    }
  };

  const fetchAccounts = async () => {
    const response = await api.get('/api/accounts');
    accounts.value = response.data;
    saveToStorage();
  };

  const createAccount = async (data: Partial<Account>) => {
    const id = generateId();
    const newAccount: Account = {
      id,
      userId: '',
      name: data.name || '',
      type: data.type || 'cash',
      currency: data.currency || 'RUB',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    accounts.value.unshift(newAccount);
    saveToStorage();
    pendingChanges.value.push({ type: 'account', action: 'create', data: newAccount });

    try {
      await api.post('/api/accounts', { ...newAccount });
    } catch (e) {
      console.log('Offline - will sync later');
    }

    return newAccount;
  };

  const fetchCategories = async () => {
    const response = await api.get('/api/categories');
    categories.value = response.data;
    saveToStorage();
  };

  const createCategory = async (data: Partial<Category>) => {
    const id = generateId();
    const newCategory: Category = {
      id,
      userId: '',
      name: data.name || '',
      type: data.type || 'expense',
      icon: data.icon,
      color: data.color
    };

    categories.value.push(newCategory);
    saveToStorage();
    pendingChanges.value.push({ type: 'category', action: 'create', data: newCategory });

    try {
      await api.post('/api/categories', { ...newCategory });
    } catch (e) {
      console.log('Offline - will sync later');
    }

    return newCategory;
  };

  const fetchTransactions = async (params?: any) => {
    const response = await api.get('/api/transactions', { params });
    transactions.value = response.data.transactions || response.data;
    saveToStorage();
  };

  const createTransaction = async (data: Partial<Transaction>) => {
    const id = generateId();
    const now = new Date().toISOString();
    const newTransaction: Transaction = {
      id,
      userId: '',
      accountId: data.accountId || '',
      categoryId: data.categoryId,
      type: data.type || 'expense',
      amount: data.amount || 0,
      date: data.date || now,
      note: data.note,
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now
    };

    transactions.value.unshift(newTransaction);
    saveToStorage();
    pendingChanges.value.push({ type: 'transaction', action: 'create', data: newTransaction });

    try {
      await api.post('/api/transactions', { ...newTransaction });
    } catch (e) {
      console.log('Offline - will sync later');
    }

    return newTransaction;
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    const index = transactions.value.findIndex(t => t.id === id);
    if (index !== -1) {
      const updated = { ...transactions.value[index], ...data, updatedAt: new Date().toISOString() };
      transactions.value[index] = updated;
      saveToStorage();
      pendingChanges.value.push({ type: 'transaction', action: 'update', data: updated });
    }
  };

  const deleteTransaction = async (id: string) => {
    const index = transactions.value.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions.value[index] = {
        ...transactions.value[index],
        is_deleted: true,
        updatedAt: new Date().toISOString()
      };
      saveToStorage();
      pendingChanges.value.push({ type: 'transaction', action: 'delete', id });
    }
  };

  const sync = async () => {
    if (isSyncing.value) return;
    isSyncing.value = true;

    try {
      const changes = {
        accounts: pendingChanges.value.filter(c => c.type === 'account'),
        categories: pendingChanges.value.filter(c => c.type === 'category'),
        transactions: pendingChanges.value.filter(c => c.type === 'transaction')
      };

      await api.post('/api/sync/push', {
        lastSyncTimestamp: lastSyncTimestamp.value,
        changes
      });

      const pullResponse = await api.get('/api/sync/pull', {
        params: { since: lastSyncTimestamp.value }
      });

      if (pullResponse.data.accounts?.length) {
        pullResponse.data.accounts.forEach((account: Account) => {
          const index = accounts.value.findIndex(a => a.id === account.id);
          if (index === -1) accounts.value.push(account);
          else accounts.value[index] = account;
        });
      }

      if (pullResponse.data.categories?.length) {
        pullResponse.data.categories.forEach((category: Category) => {
          const index = categories.value.findIndex(c => c.id === category.id);
          if (index === -1) categories.value.push(category);
          else categories.value[index] = category;
        });
      }

      if (pullResponse.data.transactions?.length) {
        pullResponse.data.transactions.forEach((transaction: Transaction) => {
          const index = transactions.value.findIndex(t => t.id === transaction.id);
          if (index === -1) transactions.value.push(transaction);
          else transactions.value[index] = transaction;
        });
      }

      lastSyncTimestamp.value = pullResponse.data.serverTimestamp;
      pendingChanges.value = [];
      saveToStorage();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      isSyncing.value = false;
    }
  };

  const getTotalBalance = () => {
    return transactions.value
      .filter(t => t.type !== 'transfer')
      .reduce((sum, t) => {
        return t.type === 'income' ? sum + t.amount : sum - t.amount;
      }, 0);
  };

  return {
    accounts,
    categories,
    transactions,
    lastSyncTimestamp,
    isSyncing,
    pendingChanges,
    loadFromStorage,
    saveToStorage,
    fetchAccounts,
    createAccount,
    fetchCategories,
    createCategory,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    sync,
    getTotalBalance
  };
});