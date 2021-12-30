import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import App from "@/App.vue";
import router from "@/router";
import store from "@/store";
import Auth from "@aws-amplify/auth";
import AuthConfig from "@/aws-exports";
import axios from "axios";

Auth.configure(AuthConfig);

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

Vue.config.productionTip = false;
Vue.prototype.$http = axios;

new Vue({
  router,
  store,
  el: "#app",
  render: h => h(App)
});
