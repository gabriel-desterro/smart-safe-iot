<template>
  <div v-if="mensagem" :class="['alert', tipoClasse]" role="alert">

    {{ mensagem }}

  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  
  mensagem: {
    type: String,
    default: null,
  },
  tipo: {
    type: String,
    default: 'erro',
  },
})

const tipoClasse = computed(() => {
  // Tabela de tradução: tipo → classe Bootstrap
  const classes = {
    erro: 'alert-danger',    // vermelho
    sucesso: 'alert-success', // verde
    info: 'alert-info',      // azul
  }
  return classes[props.tipo] || 'alert-danger'
})
</script>