const API_URL = 'http://localhost:3001/api/sync';

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
    if (data.accounts) localStorage.setItem('budget_accounts', JSON.stringify(data.accounts));
    if (data.categories) localStorage.setItem('budget_categories', JSON.stringify(data.categories));
    if (data.transactions) localStorage.setItem('budget_transactions', JSON.stringify(data.transactions));
    if (data.budgets) localStorage.setItem('budget_limits', JSON.stringify(data.budgets));
    if (data.goals) localStorage.setItem('budget_goals', JSON.stringify(data.goals));
    if (data.subscriptions) localStorage.setItem('budget_subscriptions', JSON.stringify(data.subscriptions));
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