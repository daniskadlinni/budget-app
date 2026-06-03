import { defineStore } from 'pinia';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export const useDataStore = defineStore('data', () => {
  const accounts = ref<any[]>([]);
  const categories = ref<any[]>([]);
  const transactions = ref<any[]>([]);

  const loadFromStorage = () => {
    accounts.value = JSON.parse(localStorage.getItem('accounts') || '[]');
    categories.value = JSON.parse(localStorage.getItem('categories') || '[]');
    transactions.value = JSON.parse(localStorage.getItem('transactions') || '[]');
  };

  const saveToStorage = () => {
    localStorage.setItem('accounts', JSON.stringify(accounts.value));
    localStorage.setItem('categories', JSON.stringify(categories.value));
    localStorage.setItem('transactions', JSON.stringify(transactions.value));
  };

  const addTransaction = (data: any) => {
    const now = new Date().toISOString();
    
    if (data.type === 'transfer' && data.transferToId) {
      const t1 = {
        id: uuidv4(), accountId: data.accountId, type: 'transfer',
        amount: data.amount, date: data.date || now, note: data.note,
        createdAt: now, updatedAt: now, isTransferFrom: true, transferToId: data.transferToId
      };
      const t2 = {
        id: uuidv4(), accountId: data.transferToId, type: 'transfer',
        amount: data.amount, date: data.date || now, note: data.note,
        createdAt: now, updatedAt: now, isTransferFrom: false, transferToId: data.accountId
      };
      transactions.value.push(t1, t2);
      localStorage.setItem('transactions', JSON.stringify(transactions.value));
    } else {
      const t = {
        id: uuidv4(), accountId: data.accountId, categoryId: data.categoryId,
        type: data.type, amount: data.amount, date: data.date || now, note: data.note,
        createdAt: now, updatedAt: now
      };
      transactions.value.push(t);
      localStorage.setItem('transactions', JSON.stringify(transactions.value));
    }
  };

  const getBalance = (accountId: string) => {
    let balance = 0;
    const acc = accounts.value.find(a => a.id === accountId);
    if (acc && acc.balance) balance += acc.balance;

    transactions.value.forEach((t: any) => {
      if (t.accountId === accountId) {
        if (t.type === 'income') balance += t.amount;
        else if (t.type === 'expense') balance -= t.amount;
        else if (t.type === 'transfer' && t.isTransferFrom) balance -= t.amount;
      }
      if (t.transferToId === accountId && t.type === 'transfer' && !t.isTransferFrom) {
        balance += t.amount;
      }
    });

    return balance;
  };

  return { accounts, categories, transactions, loadFromStorage, saveToStorage, addTransaction, getBalance };
});