import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SigmaView from '../views/SigmaView.vue'
import SigmaGroupingView from '../views/SigmaGroupingView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/home',
      name: 'home',
      component: HomeView
    },
    {
      path: '/sigma',
      name: 'sigma',
      component: SigmaView
    },
    {
      path: '/sigmaGrouping',
      name: 'sigmaGrouping',
      component: SigmaGroupingView
    }
  ]
})

export default router
