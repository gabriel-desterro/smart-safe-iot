import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import UsuariosView from '@/views/UsuariosView.vue'
import CofresView from '@/views/CofresView.vue'
import AuditoriaView from '@/views/AuditoriaView.vue'
import NotFoundView from '@/views/NotFoundView.vue' 

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      requiresGuest: true,
    },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/usuarios',
    name: 'Usuarios',
    component: UsuariosView,
    meta: {
      requiresAuth: true,
      role: 'adm',
    },
  },
  {
    path: '/cofres',
    name: 'Cofres',
    component: CofresView,
    meta: {
      requiresAuth: true,
      role: 'adm',
    },
  },
  {
    path: '/auditoria',
    name: 'Auditoria',
    component: AuditoriaView,
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters['auth/isAuthenticated']

  const tipoUsuario = store.getters['auth/tipoUsuario']

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login') 
    return
  }

  if (to.meta.role && tipoUsuario !== to.meta.role) {
    next('/dashboard') 
    return
  }

  if (to.meta.requiresGuest && isAuthenticated) {
    next('/dashboard')
    return
  }

  next()
})

export default router