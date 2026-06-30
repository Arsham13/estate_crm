import api from './api.js'

export const propertyService = {
  getAll(params = {}) {
    return api.get('/properties', { params })
  },
  getById(id) {
    return api.get(`/properties/${id}`)
  },
  create(data) {
    return api.post('/properties', data)
  },
  update(id, data) {
    return api.patch(`/properties/${id}`, data)
  },
  remove(id) {
    return api.delete(`/properties/${id}`)
  },
  incrementView(id, currentCount) {
    return api.patch(`/properties/${id}`, { viewCount: currentCount + 1 })
  },
  search(term) {
    return api.get('/properties', { params: { q: term, _limit: 10 } })
  },
}
