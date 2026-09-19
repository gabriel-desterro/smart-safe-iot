import { login as loginApi } from '@/service/api'

const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
}

const mutations = {
  SET_AUTH(state, payload) {
    state.token = payload.token
    state.user = payload.user

    localStorage.setItem('token', payload.token)
    localStorage.setItem('user', JSON.stringify(payload.user)) // precisa virar string pra salvar
  },

  CLEAR_AUTH(state) {
    state.token = null
    state.user = null

    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
}

const actions = {
  async login({ commit }, credentials) {
    try {
      const response = await loginApi(credentials)

      const token = response.data.token
      const user = response.data.usuario

      commit('SET_AUTH', { token, user })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.erro || 'Erro ao realizar login',
      }
    }
  },

  logout({ commit }) {
    commit('CLEAR_AUTH')
  },
}

// GETTERS — formas de "ler" o state de fora do módulo, sempre atualizadas automaticamente
const getters = {
  // !!state.token converte pra boolean: true se token existe, false se for null
  isAuthenticated: (state) => !!state.token,

  // Devolve o token puro (útil se algum lugar precisar dele direto, fora do interceptor)
  token: (state) => state.token,

  // Devolve o objeto usuário completo (ou null, se ninguém logado)
  user: (state) => state.user,

  // Devolve só o tipo_usuario ('adm' ou 'cliente') — usado pelo guard de role no router
  // O "?." evita erro se state.user for null (ex: antes de logar)
  tipoUsuario: (state) => state.user?.tipo_usuario,
}

// Monta e exporta o módulo final, juntando as quatro peças separadas acima
export default {
  namespaced: true, // exige prefixo 'auth/' em todo dispatch/commit/getter desse módulo
  state,
  mutations,
  actions,
  getters,
}