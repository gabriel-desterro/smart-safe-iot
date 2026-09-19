<template>
  <div>
    <AppNavbar />
    <div class="container mt-4">
      <h4 class="mb-4">Dashboard de segurança</h4>

      <BaseAlert :mensagem="erro" tipo="erro" />

      <!-- Cards de resumo -->
      <div class="row g-3 mb-4">
        <ResumoCard :valor="resumo.total_eventos" label="Total de eventos" cor="primary" />
        <ResumoCard :valor="resumo.aberturas"     label="Aberturas"        cor="success" />
        <ResumoCard :valor="resumo.intrusoes"     label="Intrusões"        cor="danger"  />
        <ResumoCard :valor="resumo.nfc_negados"   label="NFC negados"      cor="warning" />
      </div>

      
      <div class="row g-4">
        <div class="col-md-5">
          <div class="card p-4 h-100">
            <BaseSpinner v-if="carregando" />
            <GraficoEventos v-if="!carregando && resumo.total_eventos > 0" :resumo="resumo" />
            <p v-if="!carregando && !resumo.total_eventos" class="text-muted text-center mt-3">
              Sem dados suficientes para gerar o gráfico
            </p>
          </div>
        </div>
      
        <div class="col-md-7">
          <div class="card p-4 h-100">
            <!-- Alertas recentes -->
            <h5 class="mb-3">Alertas recentes</h5>

            <BaseSpinner v-if="carregando" />

            <div v-else-if="alertas.length === 0" class="alert alert-success">
              Nenhum alerta registrado.
            </div>

            <table v-else class="table table-hover table-bordered">
              <thead class="table-danger">
                <tr>
                  <th>Evento</th>
                  <th>Cofre</th>
                  <th>Usuário</th>
                  <th>Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in alertas" :key="a.id">
                  <td><span class="badge bg-danger">{{ a.evento }}</span></td>
                  <td><code>{{ a.cofre?.device_id || '—' }}</code></td>
                  <td>{{ a.usuario?.nome || '—' }}</td>
                  <td>{{ a.timestamp }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="text-end mt-2">
          <RouterLink to="/auditoria" class="btn btn-outline-primary btn-sm">
            Ver histórico completo →
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppNavbar from '@/components/AppNavbar.vue'
import BaseAlert from '@/components/BaseAlert.vue'
import BaseSpinner from '@/components/BaseSpinner.vue'
import ResumoCard from '@/components/ResumoCard.vue'
import GraficoEventos from '@/components/GraficoEventos.vue'
import { getHistoricoResumo, getHistoricoAlertas } from '@/service/api'

const resumo = ref({})
const alertas = ref([])
const carregando = ref(false)
const erro = ref(null)

let intervalo = null
const INTERVALO_MS = 30000 //15 segundos

async function carregar() {
  carregando.value = true
  try {
    const [resResumo, resAlertas] = await Promise.all([
      getHistoricoResumo(),
      getHistoricoAlertas()
    ])
    resumo.value = resResumo.data
    alertas.value = resAlertas.data
  } catch {
    erro.value = 'Erro ao carregar dados do dashboard.'
  } finally {
    carregando.value = false
  }
}

onMounted(() => {
  carregar()
  intervalo = setInterval(carregar, INTERVALO_MS)
})

onUnmounted(() => {
  clearInterval(intervalo)
})
</script>