<template>
  <div>
    <AppNavbar />
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4>Usuários</h4>
        <button class="btn btn-primary btn-sm" @click="abrirModalCriar">+ Novo usuário</button>
      </div>

      <BaseAlert :mensagem="feedback.mensagem" :tipo="feedback.tipo" />

      <BaseSpinner v-if="carregando" />

      <table v-else class="table table-hover table-bordered">
        <thead class="table-light">
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Tipo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.usuario_id">
            <td>{{ u.usuario_id }}</td>
            <td>{{ u.nome }}</td>
            <td>{{ u.email }}</td>
            <td><span :class="u.tipo_usuario === 'adm' ? 'badge bg-danger' : 'badge bg-secondary'">{{ u.tipo_usuario }}</span></td>
            <td>
              <button class="btn btn-outline-primary btn-sm me-1" @click="abrirModalEditar(u)">Editar</button>
              <button class="btn btn-outline-danger btn-sm" @click="confirmarDelete(u)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal criar/editar -->
    <ModalUsuario
      v-if="modal.aberto"
      :editando="modal.editando"
      :salvando="modal.salvando"
      :erro="modal.erro"
      :form="modal.form"
      @update:form="modal.form = $event"
      @fechar="fecharModal"
      @salvar="salvar"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { registrar } from '@/service/api'
import AppNavbar from '@/components/AppNavbar.vue'
import BaseAlert from '@/components/BaseAlert.vue'
import BaseSpinner from '@/components/BaseSpinner.vue'
import ModalUsuario from '@/components/ModalUsuario.vue'

const store = useStore()

const usuarios = computed(() => store.getters['usuarios/usuarios'])
const carregando = computed(() => store.getters['usuarios/loading'])
const feedback = ref({ mensagem: null, tipo: 'sucesso' })

const modal = ref({
  aberto: false,
  editando: false,
  salvando: false,
  erro: null,
  usuarioId: null,
  form: { nome: '', email: '', senha: '', tipo_usuario: 'cliente' }
})

async function carregar() {
  await store.dispatch('usuarios/fetchUsuarios')
}

function abrirModalCriar() {
  modal.value = { 
    aberto: true, 
    editando: false, 
    salvando: false, 
    erro: null, 
    usuarioId: null,
    form: { nome: '', email: '', senha: '', tipo_usuario: 'cliente' } 
  }
}

function abrirModalEditar(u) {
  modal.value = { 
    aberto: true, 
    editando: true, 
    salvando: false, 
    erro: null, 
    usuarioId: u.usuario_id,
    form: { nome: u.nome, email: u.email, senha: '', tipo_usuario: u.tipo_usuario } 
  }
}

function fecharModal() {
  modal.value.aberto = false
}

async function salvar() {
  modal.value.salvando = true
  modal.value.erro = null
  try {
    if (modal.value.editando) {
      const dados = { ...modal.value.form, usuario_id: modal.value.usuarioId }
      if (!dados.senha) delete dados.senha

      const resultado = await store.dispatch('usuarios/updateUsuario', dados)
      if(!resultado.success) {
        modal.value.erro = resultado.message;
        return
      }
      await carregar()
      feedback.value = { mensagem: resultado.message, tipo: 'sucesso' }
    } else {
      await registrar(modal.value.form)
      await carregar()
      feedback.value = { mensagem: 'Usuário criado com sucesso.', tipo: 'sucesso' }
    }
    fecharModal()
  } catch (e) {
    modal.value.erro = e.response?.data?.erro || 'Erro ao salvar.'
  } finally {
    modal.value.salvando = false
  }
}

async function confirmarDelete(u) {
  if (!confirm(`Excluir o usuário "${u.nome}"?`)) return
  const resultado = await store.dispatch('usuarios/deleteUsuario', u.usuario_id)
  await carregar()
  feedback.value = { mensagem: resultado.message, tipo: resultado.success ? 'sucesso' : 'erro' }
}

onMounted(carregar)
</script>