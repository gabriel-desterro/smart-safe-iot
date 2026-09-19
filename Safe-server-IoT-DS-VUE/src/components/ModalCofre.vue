<template>
  <div class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5)">
    <div class="modal-dialog">
      <div class="modal-content">

        <div class="modal-header">
          <h5 class="modal-title">{{ editando ? 'Editar cofre' : 'Novo cofre' }}</h5>
          <button class="btn-close" @click="$emit('fechar')"></button>
        </div>

        <div class="modal-body">
          <BaseAlert :mensagem="erro" tipo="erro" />

          <div class="mb-3">
            <label class="form-label">Device ID</label>
            <input :value="form.device_id" @input="atualizar('device_id', $event.target.value)"
              class="form-control" :disabled="editando" />
          </div>
          <div class="mb-3">
            <label class="form-label">UID NFC</label>
            <input :value="form.uid_nfc" @input="atualizar('uid_nfc', $event.target.value)" class="form-control" />
          </div>
          <div class="mb-3">
            <label class="form-label">ID do usuário cliente (dono)</label>
            <input :value="form.usuario_id" @input="atualizar('usuario_id', Number($event.target.value))"
              type="number" class="form-control" />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('fechar')">Cancelar</button>
          <button class="btn btn-primary" @click="$emit('salvar')" :disabled="salvando">
            {{ salvando ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import BaseAlert from '@/components/BaseAlert.vue'

const props = defineProps({
  editando: { type: Boolean, default: false },
  salvando: { type: Boolean, default: false },
  erro: { type: String, default: null  },
  form: { type: Object, required: true },
})

const emit = defineEmits(['fechar', 'salvar', 'update:form'])

function atualizar(campo, valor) {
  emit('update:form', { ...props.form, [campo]: valor })
}
</script>