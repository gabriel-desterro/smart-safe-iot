import axios from 'axios'

const api = axios.create({
    baseURL: 'http://127.0.0.1:3000',
    headers: {
        'Content-Type': 'application/json'
    }
})

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')

            if (router.currentRoute.value.path !== '/login') {
                router.push('/login')
            }
        }
        return Promise.reject(error)
    }
)

// AUTH
export function login(credentials) {
    return api.post('/auth/login', credentials)
}
export function registrar(dados) {
    return api.post('/auth/registrar', dados)  // rota de registro que existe no authRouter
}

// USUÁRIOS — PK é usuario_id
export function getUsuarios() {
    return api.get('/usuarios')
}
export function updateUsuario(usuarioId, dados) {
    return api.put(`/usuarios/${usuarioId}`, dados)
}
export function deleteUsuario(usuarioId) {
    return api.delete(`/usuarios/${usuarioId}`)
}

// COFRES — PK é device_id
export function getCofres() {
    return api.get('/cofres')
}
export function createCofre(dados) {
    return api.post('/cofres', dados)
}
export function updateCofre(deviceId, dados) {
    return api.put(`/cofres/${deviceId}`, dados)
}
export function deleteCofre(deviceId) {
    return api.delete(`/cofres/${deviceId}`)
}

// HISTÓRICO
export function getHistorico(params = {}) {
    return api.get('/historico', { params })
}
export function getHistoricoAlertas() {
    return api.get('/historico/alertas')
}
export function getHistoricoResumo() {
    return api.get('/historico/resumo')
}

export default api