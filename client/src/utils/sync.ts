const API_URL = 'https://zxrpluuneassstffzday.supabase.co/functions/v1/sync-data';

export const syncToServer = async () => {
  try {
    const data = {
      accounts: JSON.parse(localStorage.getItem('budget_accounts') || '[]'),
      categories: JSON.parse(localStorage.getItem('budget_categories') || '[]'),
      transactions: JSON.parse(localStorage.getItem('budget_transactions') || '[]'),
      budgets: JSON.parse(localStorage.getItem('budget_limits') || '[]'),
      goals: JSON.parse(localStorage.getItem('budget_goals') || '[]'),
      subscriptions: JSON.parse(localStorage.getItem('budget_subscriptions') || '[]')
    };
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error('Sync error:', e);
  }
};

export const syncFromServer = async () => {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (data.accounts && data.accounts.length > 0) localStorage.setItem('budget_accounts', JSON.stringify(data.accounts));
    if (data.categories && data.categories.length > 0) localStorage.setItem('budget_categories', JSON.stringify(data.categories));
    if (data.transactions && data.transactions.length > 0) localStorage.setItem('budget_transactions', JSON.stringify(data.transactions));
    if (data.budgets && data.budgets.length > 0) localStorage.setItem('budget_limits', JSON.stringify(data.budgets));
    if (data.goals && data.goals.length > 0) localStorage.setItem('budget_goals', JSON.stringify(data.goals));
    if (data.subscriptions && data.subscriptions.length > 0) localStorage.setItem('budget_subscriptions', JSON.stringify(data.subscriptions));
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
      subscriptions: JSON.parse(localStorage.getItem('budget_subscriptions') || '[]')
    };
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error('Clear transactions error:', e);
  }
};