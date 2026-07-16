const API_URL = 'https://zxrpluuneassstffzday.supabase.co/functions/v1/sync-data';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4cnBsdXVuZWFzc3N0ZmZ6ZGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTI5MDMsImV4cCI6MjA5NjA2ODkwM30.sjXnnVnF1cyENt5x9yTH1_v7SPXul4603aSZmXuqmgc';
const DELETED_KEY = 'budget_deleted_ids';

const syncHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`
};

const dataKeys = {
  accounts: 'budget_accounts',
  categories: 'budget_categories',
  transactions: 'budget_transactions',
  budgets: 'budget_limits',
  goals: 'budget_goals',
  subscriptions: 'budget_subscriptions',
  stores: 'budget_stores',
  shopping: 'budget_shopping',
  shoppingTemplates: 'budget_shopping_templates',
  products: 'budget_products',
  reminders: 'budget_reminders'
};

const readArray = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const mergeById = (local: any[], server: any[]) => {
  const map = new Map<string, any>();
  server.forEach(item => item?.id && map.set(item.id, item));
  local.forEach(item => {
    if (!item?.id) return;
    const serverItem = map.get(item.id);
    if (!serverItem) {
      map.set(item.id, item);
      return;
    }

    const localTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
    const serverTime = new Date(serverItem.updatedAt || serverItem.createdAt || 0).getTime();
    map.set(item.id, localTime >= serverTime ? item : serverItem);
  });
  return Array.from(map.values());
};

const mergeDeletedIds = (localDeleted: any[], serverDeleted: any[], data: Record<string, any[]>) => {
  const active = new Set<string>();
  Object.entries({
    account: data.accounts,
    category: data.categories,
    transaction: data.transactions,
    budget: data.budgets,
    goal: data.goals,
    subscription: data.subscriptions,
    store: data.stores,
    shopping: data.shopping,
    shoppingTemplate: data.shoppingTemplates,
    product: data.products,
    reminder: data.reminders
  }).forEach(([type, items]) => {
    items.forEach((item: any) => item?.id && active.add(`${type}:${item.id}`));
  });

  return Array.from(
    new Map([...serverDeleted, ...localDeleted]
      .filter((item: any) => item?.type && item?.id && !active.has(`${item.type}:${item.id}`))
      .map((item: any) => [`${item.type}:${item.id}`, item]))
      .values()
  );
};

const readLocalData = () => ({
  accounts: readArray(dataKeys.accounts),
  categories: readArray(dataKeys.categories),
  transactions: readArray(dataKeys.transactions),
  budgets: readArray(dataKeys.budgets),
  goals: readArray(dataKeys.goals),
  subscriptions: readArray(dataKeys.subscriptions),
  stores: readArray(dataKeys.stores),
  shopping: readArray(dataKeys.shopping),
  shoppingTemplates: readArray(dataKeys.shoppingTemplates),
  products: readArray(dataKeys.products),
  reminders: readArray(dataKeys.reminders)
});

const writeLocalData = (data: Record<string, any[]>) => {
  Object.entries(dataKeys).forEach(([name, key]) => {
    if (data[name] !== undefined) localStorage.setItem(key, JSON.stringify(data[name]));
  });
};

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
    const local = readLocalData();
    const serverResponse = await fetch(API_URL, { headers: syncHeaders });
    const server = serverResponse.ok ? await serverResponse.json() : {};
    const data: Record<string, any> = {};
    Object.keys(dataKeys).forEach(key => {
      data[key] = mergeById(local[key as keyof typeof local] || [], server[key] || []);
    });
    data.deletedIds = mergeDeletedIds(getDeletedIds(), server.deletedIds || [], data);

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: syncHeaders,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
    const result = await res.json();
    if (result) {
      writeLocalData(result);
      if (result.deletedIds !== undefined) localStorage.setItem(DELETED_KEY, JSON.stringify(result.deletedIds));
    }
  } catch (e) {
    console.error('Sync error:', e);
  }
};

export const syncFromServer = async () => {
  try {
    const res = await fetch(API_URL, { headers: syncHeaders });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const data = await res.json();

    const localAccounts = JSON.parse(localStorage.getItem('budget_accounts') || '[]');
    const localCategories = JSON.parse(localStorage.getItem('budget_categories') || '[]');
    const localTransactions = JSON.parse(localStorage.getItem('budget_transactions') || '[]');
    const localBudgets = JSON.parse(localStorage.getItem('budget_limits') || '[]');
    const localGoals = JSON.parse(localStorage.getItem('budget_goals') || '[]');
    const localSubscriptions = JSON.parse(localStorage.getItem('budget_subscriptions') || '[]');
    const localStores = JSON.parse(localStorage.getItem('budget_stores') || '[]');
    const localShopping = JSON.parse(localStorage.getItem('budget_shopping') || '[]');
    const localShoppingTemplates = JSON.parse(localStorage.getItem('budget_shopping_templates') || '[]');
    const localProducts = JSON.parse(localStorage.getItem('budget_products') || '[]');
    const localReminders = JSON.parse(localStorage.getItem('budget_reminders') || '[]');

    const mergeArrays = (local: any[], server: any[], key: string, type: string) => {
      const deletedIds = getDeletedIds().filter((d: any) => d.type === type).map((d: any) => d.id);
      const deletedSet = new Set(deletedIds);

      const localMap = new Map(local.map(item => [item[key], item]));
      const serverMap = new Map(server.map(item => [item[key], item]));

      const result: any[] = [];

      for (const [id, localItem] of localMap) {
        const serverItem = serverMap.get(id);
        if (serverItem) {
          const localTime = new Date(localItem.updatedAt || 0).getTime();
          const serverTime = new Date(serverItem.updatedAt || 0).getTime();
          result.push(serverTime > localTime ? serverItem : localItem);
        } else if (!deletedSet.has(id)) {
          result.push(localItem);
        }
      }

      for (const [id, serverItem] of serverMap) {
        if (!localMap.has(id)) {
          result.push(serverItem);
        }
      }

      console.log(`sync ${type}: local=${local.length}, server=${server.length}, merged=${result.length}`);
      return result;
    };

    const mergedData: Record<string, any[]> = {};

    if (data.accounts !== undefined) {
      const merged = mergeArrays(localAccounts, data.accounts, 'id', 'account');
      mergedData.accounts = merged;
      localStorage.setItem('budget_accounts', JSON.stringify(merged));
    }
    if (data.categories !== undefined) {
      const merged = mergeArrays(localCategories, data.categories, 'id', 'category');
      mergedData.categories = merged;
      localStorage.setItem('budget_categories', JSON.stringify(merged));
    }
    if (data.transactions !== undefined) {
      const merged = mergeArrays(localTransactions, data.transactions, 'id', 'transaction');
      mergedData.transactions = merged;
      localStorage.setItem('budget_transactions', JSON.stringify(merged));
    }
    if (data.budgets !== undefined) {
      const merged = mergeArrays(localBudgets, data.budgets, 'id', 'budget');
      mergedData.budgets = merged;
      localStorage.setItem('budget_limits', JSON.stringify(merged));
    }
    if (data.goals !== undefined) {
      const merged = mergeArrays(localGoals, data.goals, 'id', 'goal');
      mergedData.goals = merged;
      localStorage.setItem('budget_goals', JSON.stringify(merged));
    }
    if (data.subscriptions !== undefined) {
      const merged = mergeArrays(localSubscriptions, data.subscriptions, 'id', 'subscription');
      mergedData.subscriptions = merged;
      localStorage.setItem('budget_subscriptions', JSON.stringify(merged));
    }
    if (data.stores !== undefined) {
      const merged = mergeArrays(localStores, data.stores, 'id', 'store');
      mergedData.stores = merged;
      localStorage.setItem('budget_stores', JSON.stringify(merged));
    }
    if (data.shopping !== undefined) {
      const merged = mergeArrays(localShopping, data.shopping, 'id', 'shopping');
      mergedData.shopping = merged;
      localStorage.setItem('budget_shopping', JSON.stringify(merged));
    }
    if (data.shoppingTemplates !== undefined) {
      const merged = mergeArrays(localShoppingTemplates, data.shoppingTemplates, 'id', 'shoppingTemplate');
      mergedData.shoppingTemplates = merged;
      localStorage.setItem('budget_shopping_templates', JSON.stringify(merged));
    }
    if (data.products !== undefined) {
      const merged = mergeArrays(localProducts, data.products, 'id', 'product');
      mergedData.products = merged;
      localStorage.setItem('budget_products', JSON.stringify(merged));
    }
    if (data.reminders !== undefined) {
      const merged = mergeArrays(localReminders, data.reminders, 'id', 'reminder');
      mergedData.reminders = merged;
      localStorage.setItem('budget_reminders', JSON.stringify(merged));
    }

    const shouldRestoreServer = Object.keys(dataKeys).some(key =>
      (mergedData[key]?.length || 0) > (data[key]?.length || 0)
    );

    if (shouldRestoreServer) {
      const restorePayload = {
        ...readLocalData(),
        deletedIds: mergeDeletedIds(getDeletedIds(), data.deletedIds || [], readLocalData())
      };
      const restoreRes = await fetch(API_URL, {
        method: 'POST',
        headers: syncHeaders,
        body: JSON.stringify(restorePayload)
      });
      if (!restoreRes.ok) throw new Error(`Restore failed: ${restoreRes.status}`);
    }

    return {
      transactions: mergedData.transactions?.length ?? localTransactions.length,
      serverTransactions: data.transactions?.length || 0,
      restoredServer: shouldRestoreServer,
      synced: true
    };
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
    const transactionsToDelete = JSON.parse(localStorage.getItem('budget_transactions') || '[]');
    const deletedIds = [
      ...getDeletedIds(),
      ...transactionsToDelete
        .filter((transaction: any) => transaction?.id)
        .map((transaction: any) => ({ type: 'transaction', id: transaction.id }))
    ];
    const uniqueDeletedIds = Array.from(
      new Map(deletedIds.map((item: any) => [`${item.type}:${item.id}`, item])).values()
    );

    localStorage.setItem(DELETED_KEY, JSON.stringify(uniqueDeletedIds));

    const data = {
      accounts: JSON.parse(localStorage.getItem('budget_accounts') || '[]'),
      categories: JSON.parse(localStorage.getItem('budget_categories') || '[]'),
      transactions: [],
      budgets: JSON.parse(localStorage.getItem('budget_limits') || '[]'),
      goals: JSON.parse(localStorage.getItem('budget_goals') || '[]'),
      subscriptions: JSON.parse(localStorage.getItem('budget_subscriptions') || '[]'),
      stores: JSON.parse(localStorage.getItem('budget_stores') || '[]'),
      shopping: JSON.parse(localStorage.getItem('budget_shopping') || '[]'),
      shoppingTemplates: JSON.parse(localStorage.getItem('budget_shopping_templates') || '[]'),
      products: JSON.parse(localStorage.getItem('budget_products') || '[]'),
      reminders: JSON.parse(localStorage.getItem('budget_reminders') || '[]'),
      deletedIds: uniqueDeletedIds
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
