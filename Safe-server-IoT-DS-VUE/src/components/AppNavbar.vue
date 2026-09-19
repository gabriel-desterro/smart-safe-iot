<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">

      <div class="container">
        <RouterLink class="navbar-brand" to="/dashboard">Smart Safe</RouterLink>

          <div class="d-flex align-items-center gap-3">

        
            <RouterLink v-if="isAdm" class="nav-link text-light" to="/usuarios">
              Usuários
            </RouterLink>

            <RouterLink v-if="isAdm" class="nav-link text-light" to="/cofres">
              Cofres
            </RouterLink>

            <RouterLink class="nav-link text-light" to="/dashboard">
              Dashboard
            </RouterLink>

            <RouterLink class="nav-link text-light" to="/auditoria">
              Histórico Completo
            </RouterLink>

            <span v-if="usuario" class="text-light">
              {{ usuario.nome }} ({{ usuario.tipo_usuario }})
            </span>

            <button class="btn btn-outline-light btn-sm" @click="handleLogout">
              Sair
            </button>

      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

const usuario = computed(() => store.getters['auth/user'])

const isAdm = computed(() => store.getters['auth/tipoUsuario'] === 'adm')


function handleLogout() {

  store.dispatch('auth/logout')

  router.push('/login')
}
</script>