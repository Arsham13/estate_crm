import api from './api.js'

export const contractService = {
  getAll(params = {}) {
    return api.get('/contracts', { params })
  },
  getById(id) {
    return api.get(`/contracts/${id}`)
  },
  create(data) {
    return api.post('/contracts', data)
  },
  update(id, data) {
    return api.patch(`/contracts/${id}`, data)
  },
  remove(id) {
    return api.delete(`/contracts/${id}`)
  },
}
