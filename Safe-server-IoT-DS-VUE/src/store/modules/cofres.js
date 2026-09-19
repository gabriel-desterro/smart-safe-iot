import { getCofres, createCofre, updateCofre, deleteCofre } from '@/service/api'

const state = {
  cofres: [],
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
  SET_COFRES(state, cofres) {
    state.cofres = cofres
  },
  ADD_COFRE(state, cofre) {
    state.cofres.push(cofre)
  },
  UPDATE_COFRE(state, cofreAtualizado) {
    const index = state.cofres.findIndex(
      (c) => c.device_id === cofreAtualizado.device_id
    )
    if (index !== -1) {
      state.cofres.splice(index, 1, cofreAtualizado)
    }
  },
  DELETE_COFRE(state, deviceId) {
    state.cofres = state.cofres.filter(
      (c) => c.device_id !== deviceId
    )
  },
}

const actions = {
  async fetchCofres({ commit }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    try {
      const response = await getCofres()
      commit('SET_COFRES', response.data)
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.erro || 'Erro ao buscar cofres')
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createCofre({ commit }, cofre) {
    try {
      const response = await createCofre({
        device_id: cofre.device_id,
        uid_nfc: cofre.uid_nfc,
        usuario_id: cofre.usuario_id,  // FK correta
      })
      commit('ADD_COFRE', response.data.cofre)
      return { success: true, message: 'Cofre cadastrado com sucesso!' }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.erro || 'Erro ao cadastrar cofre',
      }
    }
  },

  async updateCofre({ commit }, cofre) {
    try {
      const response = await updateCofre(cofre.device_id, {
        uid_nfc: cofre.uid_nfc,
        usuario_id: cofre.usuario_id,  // FK correta
      })

      commit('UPDATE_COFRE', response.data)
      return { success: true, message: 'Cofre atualizado com sucesso!' }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.erro || 'Erro ao atualizar cofre',
      }
    }
  },

  async deleteCofre({ commit }, deviceId) {
    try {
      await deleteCofre(deviceId)
      commit('DELETE_COFRE', deviceId)
      return { success: true, message: 'Cofre removido com sucesso!' }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.erro || 'Erro ao remover cofre',
      }
    }
  },
}

const getters = {
  cofres: (state) => state.cofres,
  loading: (state) => state.loading,
  error: (state) => state.error,
  quantidadeCofres: (state) => state.cofres.length,
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
}