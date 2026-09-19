import { getUsuarios, updateUsuario, deleteUsuario } from '@/service/api'

const state = {
  usuarios: [],
  loading: false,
  error: null,
}

const mutations = {
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  },
  SET_USUARIOS(state, usuarios) {
    state.usuarios = usuarios
  },
  // Não tem ADD_USUARIO aqui — criação de usuário é feita pelo /registrar no auth
  UPDATE_USUARIO(state, usuarioAtualizado) {
    const index = state.usuarios.findIndex(
      (u) => u.usuario_id === usuarioAtualizado.usuario_id  // PK correta
    )
    if (index !== -1) {
      state.usuarios.splice(index, 1, usuarioAtualizado)
    }
  },
  DELETE_USUARIO(state, usuarioId) {
    state.usuarios = state.usuarios.filter(
      (u) => u.usuario_id !== usuarioId  // PK correta
    )
  },
}

const actions = {
  async fetchUsuarios({ commit }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    try {
      const response = await getUsuarios()
      commit('SET_USUARIOS', response.data)
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.erro || 'Erro ao buscar usuários')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async updateUsuario({ commit }, usuario) {
    try {
      const response = await updateUsuario(usuario.usuario_id, {
        nome: usuario.nome,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario,
        ...(usuario.senha ? { senha: usuario.senha } : {})
      })

      
      commit('UPDATE_USUARIO', response.data.usuario)
      return { success: true, message: 'Usuário atualizado com sucesso!' }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.erro || 'Erro ao atualizar usuário',
      }
    }
  },

  async deleteUsuario({ commit }, usuarioId) {
    try {
      await deleteUsuario(usuarioId)
      commit('DELETE_USUARIO', usuarioId)
      return { success: true, message: 'Usuário removido com sucesso!' }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.erro || 'Erro ao remover usuário',
      }
    }
  },
}

const getters = {
  usuarios: (state) => state.usuarios,
  loading: (state) => state.loading,
  error: (state) => state.error,
  quantidadeUsuarios: (state) => state.usuarios.length,
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
}