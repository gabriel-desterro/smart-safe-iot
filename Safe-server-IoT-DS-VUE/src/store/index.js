import { createStore } from 'vuex'

import auth from '@/store/modules/auth'
import cofres from '@/store/modules/cofres'
import usuarios from '@/store/modules/usuarios'

export default createStore({
  modules: {
    auth,
    cofres,
    usuarios,
  },
})