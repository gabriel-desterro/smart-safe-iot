<template>
  <div>
    <AppNavbar />
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4>Cofres</h4>
        <button class="btn btn-primary btn-sm" @click="abrirModalCriar">+ Novo cofre</button>
      </div>

      <BaseAlert :mensagem="feedback.mensagem" :tipo="feedback.tipo" />

      <BaseSpinner v-if="carregando" />

      <table v-else class="table table-hover table-bordered">
        <thead class="table-light">
          <tr>
            <th>Device ID</th>
            <th>UID NFC</th>
            <th>Dono</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in cofres" :key="c.device_id">
            <td><code>{{ c.device_id }}</code></td>
            <td><code>{{ c.uid_nfc }}</code></td>
            <td>{{ c.dono?.nome || '—' }}</td>
            <td>
              <button class="btn btn-outline-primary btn-sm me-1" @click="abrirModalEditar(c)">Editar</button>
              <button class="btn btn-outline-danger btn-sm" @click="confirmarDelete(c)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <ModalCofre
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
import AppNavbar from '@/components/AppNavbar.vue'
import BaseAlert from '@/components/BaseAlert.vue'
import BaseSpinner from '@/components/BaseSpinner.vue'
import ModalCofre from '@/components/ModalCofre.vue'

const store = useStore()

const cofres = computed(() => store.getters['cofres/cofres'])
const carregando = computed(() => store.getters['cofres/loading'])
const feedback = ref({ mensagem: null, tipo: 'sucesso' })

const modal = ref({
  aberto: false,
  editando: false,
  salvando: false,
  erro: null,
  deviceId: null,
  form: { device_id: '', uid_nfc: '', usuario_id: null }
})

async function carregar() {
  await store.dispatch('cofres/fetchCofres')
}

function abrirModalCriar() {
  modal.value = { 
    aberto: true, 
    editando: false, 
    salvando: false, 
    erro: null, 
    deviceId: null,
    form: { device_id: '', uid_nfc: '', usuario_id: null } }
}

function abrirModalEditar(c) {
  modal.value = { 
    aberto: true, 
    editando: true, 
    salvando: false, 
    erro: null, 
    deviceId: c.device_id,
    form: { device_id: c.device_id, uid_nfc: c.uid_nfc, usuario_id: c.usuario_id } }
}

function fecharModal() { modal.value.aberto = false }

async function salvar() {
  modal.value.salvando = true
  modal.value.erro = null
  try {
    if (modal.value.editando) {
      const resultado = await store.dispatch('cofres/updateCofre', modal.value.form)
      if(!resultado.success){
        modal.value.erro = resultado.message
        return
      }
      await carregar()
      feedback.value = { mensagem: resultado.message, tipo: 'sucesso' }
    } else {
      const resultado = await store.dispatch('cofres/createCofre', modal.value.form)
      if(!resultado.success){
        modal.value.erro = resultado.message
        return
      }
      await carregar()
      feedback.value = { mensagem: resultado.message, tipo: 'sucesso' }
    }
    fecharModal()
  } catch (e) {
    modal.value.erro = e.response?.data?.erro || 'Erro ao salvar.'
  } finally {
    modal.value.salvando = false
  }
}

async function confirmarDelete(c) {
  if (!confirm(`Excluir o cofre "${c.device_id}"?`)) return
  const resultado = await store.dispatch('cofres/deleteCofre', c.device_id)
  feedback.value = { mensagem: resultado.message, tipo: resultado.success ? 'sucesso' : 'erro'}
}

onMounted(carregar)
</script>