


import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store"; // Import the Vuex store
import { BootstrapVue3 } from 'bootstrap-vue-3';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css';





const app = createApp(App);

app.use(router) // Register Vue Router
   .use(store) // Register Vuex store
   .use(BootstrapVue3)
   
   .mount("#app");
