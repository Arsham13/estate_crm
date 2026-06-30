import api from './api.js'

export const taskService = {
  getAll(params = {}) {
    return api.get('/tasks', { params })
  },
  getById(id) {
    return api.get(`/tasks/${id}`)
  },
  create(data) {
    return api.post('/tasks', data)
  },
  update(id, data) {
    return api.patch(`/tasks/${id}`, data)
  },
  remove(id) {
    return api.delete(`/tasks/${id}`)
  },
}
