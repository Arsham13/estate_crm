import api from './api.js'

// سرویس مشتریان
export const customerService = {
  getAll(params = {}) {
    return api.get('/customers', { params })
  },
  getById(id) {
    return api.get(`/customers/${id}`)
  },
  create(data) {
    return api.post('/customers', data)
  },
  update(id, data) {
    return api.patch(`/customers/${id}`, data)
  },
  remove(id) {
    return api.delete(`/customers/${id}`)
  },
  search(term) {
    return api.get('/customers', { params: { q: term, _limit: 10 } })
  },
}
