<template>
  <div>
    <AppNavbar />
    <div class="container mt-4">
      <h4 class="mb-4">Log de auditoria</h4>

      <!-- Filtros -->
      <div class="row g-2 mb-3">
        <div class="col-md-4">
          <select v-model="filtros.evento" class="form-select form-select-sm">
            <option value="">Todos os eventos</option>
            <option v-for="e in eventos" :key="e" :value="e">{{ e }}</option>
          </select>
        </div>
        <div class="col-md-4">
          <input v-model="filtros.device_id" class="form-control form-control-sm" placeholder="Filtrar por Device ID" />
        </div>
        <div class="col-md-2">
          <button class="btn btn-primary btn-sm w-100" @click="aplicarFiltros">Filtrar</button>
        </div>
        <div class="col-md-2">
          <button class="btn btn-outline-secondary btn-sm w-100" @click="limparFiltros">Limpar</button>
        </div>
      </div>

      <BaseAlert :mensagem="erro" tipo="erro" />

      <BaseSpinner v-if="carregando" />

      <table v-else class="table table-sm table-hover table-bordered">
        <thead class="table-light">
          <tr>
            <th>Evento</th>
            <th>Cofre</th>
            <th>Usuário</th>
            <th>PIR</th>
            <th>Ultrassônico</th>
            <th>Data/Hora</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in historico" :key="h.id" :class="classeEvento(h.evento)">
            <td><span :class="badgeEvento(h.evento)">{{ h.evento }}</span></td>
            <td><code>{{ h.cofre?.device_id || '—' }}</code></td>
            <td>{{ h.usuario?.nome || '—' }}</td>
            <td>{{ h.sensor_movimento ? '✅' : '—' }}</td>
            <td>{{ h.sensor_ultrassonico_cm }} cm</td>
            <td>{{ h.timestamp }}</td>
          </tr>
        </tbody>
      </table>

      <p v-if="!carregando" class="text-muted text-end">
        {{ historico.length }} registro(s) encontrado(s)
      </p>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import { getHistorico } from '@/service/api'
  import AppNavbar from '@/components/AppNavbar.vue'
  import BaseAlert from '@/components/BaseAlert.vue'
  import BaseSpinner from '@/components/BaseSpinner.vue'

  const historico = ref([])
  const carregando = ref(false)
  const erro = ref(null)
  const filtros = ref({ evento: '', device_id: '' })

  let intervalo = null
  const INTERVALO_MS = 30000

  const eventos = [
    'SISTEMA_ACORDOU','SISTEMA_STANDBY','NFC_AUTORIZADO','NFC_NEGADO',
    'LIBERACAO_WEB','SENHA_CORRETA','SENHA_INVALIDA','ABERTURA',
    'FECHAMENTO','INTRUSAO','ACESSO_NEGADO'
  ]

  async function carregar() {
    carregando.value = true
    erro.value = null
    try {
      const params = {}
      if (filtros.value.evento) params.evento = filtros.value.evento
      if (filtros.value.device_id) params.device_id = filtros.value.device_id
      const res = await getHistorico(params)
      historico.value = res.data
    } catch {
      erro.value = 'Erro ao carregar histórico.'
    } finally {
      carregando.value = false
    }
  }

  function aplicarFiltros() {
    clearInterval(intervalo)
    carregar()
    intervalo = setInterval(carregar, INTERVALO_MS)
  }

  function limparFiltros() {
    filtros.value = { evento: '', device_id: '' }
    carregar()
  }

  function classeEvento(evento) {
    if (['INTRUSAO', 'ACESSO_NEGADO'].includes(evento)) return 'table-danger'
    if (['NFC_NEGADO', 'SENHA_INVALIDA'].includes(evento)) return 'table-warning'
    if (['ABERTURA', 'SENHA_CORRETA'].includes(evento)) return 'table-success'
    return ''
  }

  function badgeEvento(evento) {
    if (['INTRUSAO', 'ACESSO_NEGADO'].includes(evento)) return 'badge bg-danger'
    if (['NFC_NEGADO', 'SENHA_INVALIDA'].includes(evento)) return 'badge bg-warning text-dark'
    if (['ABERTURA', 'SENHA_CORRETA'].includes(evento)) return 'badge bg-success'
    return 'badge bg-secondary'
  }

  onMounted(() => {
    carregar()
    intervalo = setInterval(carregar, INTERVALO_MS)
  })

  onUnmounted(() => {
    clearInterval(intervalo)
  })
</script>
