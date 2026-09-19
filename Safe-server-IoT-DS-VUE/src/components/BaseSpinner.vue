<template>
  <div class="text-center py-4">
    <div :class="`spinner-border text-${cor}`" role="status">
      <span class="visually-hidden">Carregando...</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  cor: {
    type: String,
    default: 'primary'
  }
})
</script>