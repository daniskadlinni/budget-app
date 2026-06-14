const API_URL = 'https://zxrpluuneassstffzday.supabase.co/functions/v1/sync-data';

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
      reminders: JSON.parse(localStorage.getItem('budget_reminders') || '[]')
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
    }
  } catch (e) {
    console.error('Sync error:', e);
  }
};

export const syncFromServer = async () => {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (data.accounts !== undefined) localStorage.setItem('budget_accounts', JSON.stringify(data.accounts));
    if (data.categories !== undefined) localStorage.setItem('budget_categories', JSON.stringify(data.categories));
    if (data.transactions !== undefined) localStorage.setItem('budget_transactions', JSON.stringify(data.transactions));
    if (data.budgets !== undefined) localStorage.setItem('budget_limits', JSON.stringify(data.budgets));
    if (data.goals !== undefined) localStorage.setItem('budget_goals', JSON.stringify(data.goals));
    if (data.subscriptions !== undefined) localStorage.setItem('budget_subscriptions', JSON.stringify(data.subscriptions));
    if (data.stores !== undefined) localStorage.setItem('budget_stores', JSON.stringify(data.stores));
    if (data.shopping !== undefined) localStorage.setItem('budget_shopping', JSON.stringify(data.shopping));
    if (data.products !== undefined) localStorage.setItem('budget_products', JSON.stringify(data.products));
    if (data.reminders !== undefined) localStorage.setItem('budget_reminders', JSON.stringify(data.reminders));
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