import { createApp } from 'vue';
import { Quasar, Notify, Dialog, LocalStorage } from 'quasar';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';

import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/dist/quasar.css';
import './css/app.css';

const app = createApp(App);

app.use(Quasar, {
  plugins: { Notify, Dialog, LocalStorage },
  config: {
    dark: true,
    notify: {
      position: 'top',
      timeout: 3000
    }
  }
});

app.use(createPinia());
app.use(router);

app.mount('#app');