import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('pages/DashboardPage.vue') },
      { path: 'accounts', component: () => import('pages/AccountsPage.vue') },
      { path: 'transactions', component: () => import('pages/TransactionsPage.vue') },
      { path: 'categories', component: () => import('pages/CategoriesPage.vue') },
      { path: 'analytics', component: () => import('pages/AnalyticsPage.vue') },
      { path: 'budget', component: () => import('pages/BudgetPage.vue') },
      { path: 'goals', component: () => import('pages/GoalsPage.vue') },
      { path: 'shopping', component: () => import('pages/ShoppingListPage.vue') },
      { path: 'products', component: () => import('pages/ProductsPage.vue') },
      { path: 'reminders', component: () => import('pages/RemindersPage.vue') },
      { path: 'stores', component: () => import('pages/StoresPage.vue') },
      { path: 'car', component: () => import('pages/CarPage.vue') },
      { path: 'settings', component: () => import('pages/SettingsPage.vue') }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;