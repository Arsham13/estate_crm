import api from './api.js'

export const reportService = {
  // لیست فعالیت‌ها (برای لاگ فعالیت‌ها)
  getActivities(params = {}) {
    return api.get('/activities', { params })
  },
  createActivity(data) {
    return api.post('/activities', data)
  },
}

export const notificationService = {
  getByUser(userId) {
    return api.get('/notifications', { params: { userId, _sort: 'createdAt', _order: 'desc' } })
  },
  markAsRead(id) {
    return api.patch(`/notifications/${id}`, { isRead: true })
  },
  create(data) {
    return api.post('/notifications', data)
  },
}
