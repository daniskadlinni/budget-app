import { createApp } from 'vue';
import { Quasar, Notify, Dialog, LocalStorage } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/dist/quasar.css';
import App from './App.vue';
import router from './router/index.ts';

const storedTheme = localStorage.getItem('theme');
const isDark = storedTheme ? storedTheme === 'dark' : true;

const app = createApp(App);
app.use(Quasar, { plugins: { Notify, Dialog, LocalStorage }, config: { dark: isDark } });
app.use(router);
app.mount('#app');