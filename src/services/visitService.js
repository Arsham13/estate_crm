import api from './api.js'

export const visitService = {
  getAll(params = {}) {
    return api.get('/visits', { params })
  },
  getById(id) {
    return api.get(`/visits/${id}`)
  },
  create(data) {
    return api.post('/visits', data)
  },
  update(id, data) {
    return api.patch(`/visits/${id}`, data)
  },
  remove(id) {
    return api.delete(`/visits/${id}`)
  },
}
