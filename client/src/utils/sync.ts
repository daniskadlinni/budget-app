const API_URL = 'https://zxrpluuneassstffzday.supabase.co/functions/v1/sync-data';
const DELETED_KEY = 'budget_deleted_ids';

export const getDeletedIds = () => JSON.parse(localStorage.getItem(DELETED_KEY) || '[]');
export const addDeletedId = (type: string, id: string) => {
  const deleted = getDeletedIds();
  deleted.push({ type, id });
  localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
};

export const trackDeletedId = (type: string, id: string) => {
  const deleted = getDeletedIds();
  if (!deleted.find((d: any) => d.type === type && d.id === id)) {
    deleted.push({ type, id });
    localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
  }
};

export const syncToServer = async () => {
  try {
    const data = {
      accounts: JSON.parse(localStorage.getItem('budget_accounts') || '[]'),
      categories: JSON.parse(localStorage.getItem('budget_categories') || '[]'),
      transactions: JSON.parse(localStorage.getItem('budget_transactions') || '[]'),
      budgets: JSON.parse(localStorage.getItem('budget_limits') || '[]'),
      goals: JSON.parse(localStorage.getItem('budget_goals') || '[]'),
      subscriptions: JSON.parse(localStorage.getItem('budget_subscriptions') || '[]'),
      stores: JSON.parse(localStorage.getItem('budget_stores') || '[]'),
      shopping: JSON.parse(localStorage.getItem('budget_shopping') || '[]'),
      products: JSON.parse(localStorage.getItem('budget_products') || '[]'),
      reminders: JSON.parse(localStorage.getItem('budget_reminders') || '[]'),
      deletedIds: getDeletedIds()
    };
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result) {
      if (result.accounts !== undefined) localStorage.setItem('budget_accounts', JSON.stringify(result.accounts));
      if (result.categories !== undefined) localStorage.setItem('budget_categories', JSON.stringify(result.categories));
      if (result.transactions !== undefined) localStorage.setItem('budget_transactions', JSON.stringify(result.transactions));
      if (result.budgets !== undefined) localStorage.setItem('budget_limits', JSON.stringify(result.budgets));
      if (result.goals !== undefined) localStorage.setItem('budget_goals', JSON.stringify(result.goals));
      if (result.subscriptions !== undefined) localStorage.setItem('budget_subscriptions', JSON.stringify(result.subscriptions));
      if (result.stores !== undefined) localStorage.setItem('budget_stores', JSON.stringify(result.stores));
      if (result.shopping !== undefined) localStorage.setItem('budget_shopping', JSON.stringify(result.shopping));
      if (result.products !== undefined) localStorage.setItem('budget_products', JSON.stringify(result.products));
      if (result.reminders !== undefined) localStorage.setItem('budget_reminders', JSON.stringify(result.reminders));
      if (result.deletedIds !== undefined) localStorage.setItem(DELETED_KEY, JSON.stringify(result.deletedIds));
    }
  } catch (e) {
    console.error('Sync error:', e);
  }
};

export const syncFromServer = async () => {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    const localAccounts = JSON.parse(localStorage.getItem('budget_accounts') || '[]');
    const localCategories = JSON.parse(localStorage.getItem('budget_categories') || '[]');
    const localTransactions = JSON.parse(localStorage.getItem('budget_transactions') || '[]');
    const localBudgets = JSON.parse(localStorage.getItem('budget_limits') || '[]');
    const localGoals = JSON.parse(localStorage.getItem('budget_goals') || '[]');
    const localSubscriptions = JSON.parse(localStorage.getItem('budget_subscriptions') || '[]');
    const localStores = JSON.parse(localStorage.getItem('budget_stores') || '[]');
    const localShopping = JSON.parse(localStorage.getItem('budget_shopping') || '[]');
    const localProducts = JSON.parse(localStorage.getItem('budget_products') || '[]');
    const localReminders = JSON.parse(localStorage.getItem('budget_reminders') || '[]');

    const mergeArrays = (local: any[], server: any[], key: string, type: string) => {
      const deletedIds = getDeletedIds().filter((d: any) => d.type === type).map((d: any) => d.id);
      const deletedSet = new Set(deletedIds);

      const localMap = new Map(local.map(item => [item[key], item]));
      const serverMap = new Map(server.map(item => [item[key], item]));

      const result: any[] = [];

      for (const [id, localItem] of localMap) {
        if (deletedSet.has(id)) continue;
        const serverItem = serverMap.get(id);
        if (serverItem) {
          const localTime = new Date(localItem.updatedAt || 0).getTime();
          const serverTime = new Date(serverItem.updatedAt || 0).getTime();
          result.push(serverTime > localTime ? serverItem : localItem);
        } else {
          result.push(localItem);
        }
      }

      for (const [id, serverItem] of serverMap) {
        if (deletedSet.has(id)) continue;
        if (!localMap.has(id)) {
          result.push(serverItem);
        }
      }

      return result;
    };

    if (data.accounts !== undefined) {
      const merged = mergeArrays(localAccounts, data.accounts, 'id', 'account');
      localStorage.setItem('budget_accounts', JSON.stringify(merged));
    }
    if (data.categories !== undefined) {
      const merged = mergeArrays(localCategories, data.categories, 'id', 'category');
      localStorage.setItem('budget_categories', JSON.stringify(merged));
    }
    if (data.transactions !== undefined) {
      const merged = mergeArrays(localTransactions, data.transactions, 'id', 'transaction');
      localStorage.setItem('budget_transactions', JSON.stringify(merged));
    }
    if (data.budgets !== undefined) {
      const merged = mergeArrays(localBudgets, data.budgets, 'id', 'budget');
      localStorage.setItem('budget_limits', JSON.stringify(merged));
    }
    if (data.goals !== undefined) {
      const merged = mergeArrays(localGoals, data.goals, 'id', 'goal');
      localStorage.setItem('budget_goals', JSON.stringify(merged));
    }
    if (data.subscriptions !== undefined) {
      const merged = mergeArrays(localSubscriptions, data.subscriptions, 'id', 'subscription');
      localStorage.setItem('budget_subscriptions', JSON.stringify(merged));
    }
    if (data.stores !== undefined) {
      const merged = mergeArrays(localStores, data.stores, 'id', 'store');
      localStorage.setItem('budget_stores', JSON.stringify(merged));
    }
    if (data.shopping !== undefined) {
      const merged = mergeArrays(localShopping, data.shopping, 'id', 'shopping');
      localStorage.setItem('budget_shopping', JSON.stringify(merged));
    }
    if (data.products !== undefined) {
      const merged = mergeArrays(localProducts, data.products, 'id', 'product');
      localStorage.setItem('budget_products', JSON.stringify(merged));
    }
    if (data.reminders !== undefined) {
      const merged = mergeArrays(localReminders, data.reminders, 'id', 'reminder');
      localStorage.setItem('budget_reminders', JSON.stringify(merged));
    }
    return data;
  } catch (e) {
    console.error('Fetch error:', e);
    return null;
  }
};

let lastSync = 0;
export const autoSync = () => {
  const now = Date.now();
  if (now - lastSync > 30000) {
    lastSync = now;
    syncToServer();
  }
};

export const clearTransactionsOnServer = async () => {
  try {
    const data = {
      accounts: JSON.parse(localStorage.getItem('budget_accounts') || '[]'),
      categories: JSON.parse(localStorage.getItem('budget_categories') || '[]'),
      transactions: [],
      budgets: JSON.parse(localStorage.getItem('budget_limits') || '[]'),
      goals: JSON.parse(localStorage.getItem('budget_goals') || '[]'),
      subscriptions: JSON.parse(localStorage.getItem('budget_subscriptions') || '[]'),
      stores: JSON.parse(localStorage.getItem('budget_stores') || '[]'),
      shopping: JSON.parse(localStorage.getItem('budget_shopping') || '[]'),
      products: JSON.parse(localStorage.getItem('budget_products') || '[]'),
      reminders: JSON.parse(localStorage.getItem('budget_reminders') || '[]')
    };
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result && result.transactions !== undefined) {
      localStorage.setItem('budget_transactions', JSON.stringify(result.transactions));
    }
  } catch (e) {
    console.error('Clear transactions error:', e);
  }
};