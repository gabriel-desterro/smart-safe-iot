<template>
  <div class="col-6 col-md-3">
    <div :class="`card text-center border-${cor}`">
      <div class="card-body">
        <h2 :class="`text-${cor}`">{{ valor ?? '—' }}</h2>
        <small class="text-muted">{{ label }}</small>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  valor: {
    type: Number,
    default: null
  },
  label: {
    type: String,
    required: true
  },
  cor: {
    type: String,
    default: 'primary'
  }
})
</script>