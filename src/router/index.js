import { createRouter, createWebHistory } from 'vue-router'
import TransactionsView from '../views/TransactionsView.vue'
import LeasingView from '../views/LeasingView.vue'
import Login from '../views/Login.vue' // create this if not already there

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/transactions',
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionsView,
    },
    {
      path: '/leasing',
      name: 'leasing',
      component: LeasingView,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
  ],
})

const requireAuth = import.meta.env.VITE_REQUIRE_AUTH === 'true'

router.beforeEach((to, from, next) => {
  if (!requireAuth) {
    // dev mode, no auth required
    return next()
  }

  const isLoggedIn = !!localStorage.getItem('auth_token')

  if (!isLoggedIn && to.name !== 'login') {
    // not logged in, redirect to login and remember target path
    return next({
      name: 'login',
      query: { redirect: to.fullPath },
    })
  }

  if (isLoggedIn && to.name === 'login') {
    // already logged in, avoid staying on login
    return next({ name: 'transactions' })
  }

  return next()
})

export default router
