<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card shadow" style="width: 100%; max-width: 400px">
      <div class="card-body p-4">
        <h4 class="card-title text-center mb-4">Smart Safe</h4>

        <BaseAlert :mensagem="erro" tipo="erro" />

        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input
              v-model="email"
              type="email"
              class="form-control"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div class="mb-3">
            <label class="form-label">Senha</label>
            <input
              v-model="senha"
              type="password"
              class="form-control"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary w-100" :disabled="carregando">
            {{ carregando ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import BaseAlert from '@/components/BaseAlert.vue'

const store = useStore()
const router = useRouter()

const email = ref('')
const senha = ref('')
const erro = ref(null)
const carregando = ref(false)

async function handleLogin() {
  erro.value = null
  carregando.value = true

  const resultado = await store.dispatch('auth/login', { email: email.value, senha: senha.value })

  carregando.value = false

  if (resultado.success) {
    router.push('/dashboard')
  } else {
    erro.value = resultado.message
  }
}
</script>