import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SigmaView from '../views/SigmaView.vue'
import SigmaDefaultView from '../views/SigmaDefaultView.vue'
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
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/sigma',
      name: 'sigma',
      component: SigmaView
    },
    {
      path: '/sigmaDefault',
      name: 'sigmaDefault',
      component: SigmaDefaultView
    },
    {
      path: '/sigmaGrouping',
      name: 'sigmaGrouping',
      component: SigmaGroupingView
    }
  ]
})

export default router
