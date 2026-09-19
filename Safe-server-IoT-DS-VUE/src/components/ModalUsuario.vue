<template>
  <div class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5)">
    <div class="modal-dialog">
      <div class="modal-content">

        <div class="modal-header">
          <h5 class="modal-title">{{ editando ? 'Editar usuário' : 'Novo usuário' }}</h5>
          <button class="btn-close" @click="$emit('fechar')"></button>
        </div>

        <div class="modal-body">
          <BaseAlert :mensagem="erro" tipo="erro" />

          <div class="mb-3">
            <label class="form-label">Nome</label>
            <input :value="form.nome" @input="atualizar('nome', $event.target.value)" class="form-control" />
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input :value="form.email" @input="atualizar('email', $event.target.value)" type="email" class="form-control" />
          </div>
          <div class="mb-3">
            <label class="form-label">{{ editando ? 'Nova senha (deixe vazio para manter)' : 'Senha' }}</label>
            <input :value="form.senha" @input="atualizar('senha', $event.target.value)" type="password" class="form-control" />
          </div>
          <div class="mb-3">
            <label class="form-label">Tipo</label>
            <select :value="form.tipo_usuario" @change="atualizar('tipo_usuario', $event.target.value)" class="form-select">
              <option value="cliente">cliente</option>
              <option value="adm">adm</option>
            </select>
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
  erro:     { type: String,  default: null  },
  form:     { type: Object,  required: true }
})

const emit = defineEmits(['fechar', 'salvar', 'update:form'])

function atualizar(campo, valor) {
  emit('update:form', { ...props.form, [campo]: valor })
}
</script>