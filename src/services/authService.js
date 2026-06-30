import api from './api.js'

// سرویس احراز هویت — ورود از طریق JSON Server
export const authService = {
  // بررسی ایمیل/رمز در جدول users
  async login(email, password) {
    // ممکن است کاربر با ایمیل یا شماره موبایل وارد شود
    const users = await api.get('/users', {
      params: {
        email,
        password,
      },
    })
    if (users && users.length > 0) {
      const found = users[0]
      if (!found.isActive) {
        throw new Error('حساب کاربری شما غیرفعال است. با مدیر تماس بگیرید.')
      }
      return found
    }
    // تلاش با شماره موبایل
    const byPhone = await api.get('/users', {
      params: { phone: email, password },
    })
    if (byPhone && byPhone.length > 0) {
      const found = byPhone[0]
      if (!found.isActive) {
        throw new Error('حساب کاربری شما غیرفعال است. با مدیر تماس بگیرید.')
      }
      return found
    }
    throw new Error('ایمیل/شماره یا رمز عبور اشتباه است.')
  },

  async getById(id) {
    return api.get(`/users/${id}`)
  },

  async getAll() {
    return api.get('/users')
  },

  async create(data) {
    return api.post('/users', data)
  },

  async update(id, data) {
    return api.patch(`/users/${id}`, data)
  },

  async updatePassword(id, password) {
    return api.patch(`/users/${id}`, { password })
  },

  async remove(id) {
    return api.delete(`/users/${id}`)
  },
}
