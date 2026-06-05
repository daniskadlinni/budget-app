import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://zxrpluuneassstffzday.supabase.co/functions/v1'
});

interface User {
  id: string;
  email: string;
  baseCurrency: string;
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
    return { user: { id: 'local', email }, accessToken: 'local', refreshToken: 'local' };
  };

  const register = async (email: string, password: string, baseCurrency = 'USD') => {
    return { user: { id: 'local', email }, accessToken: 'local', refreshToken: 'local' };
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

  return { user, accessToken, refreshToken, isAuthenticated, login, register, logout, initFromStorage };
});