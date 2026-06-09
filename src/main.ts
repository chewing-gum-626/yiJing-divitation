import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import './styles/tailwind.css';
import './styles/variables.css';
import './styles/animation.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
