import axios from 'axios'

// نمونه axios با baseURL و میان‌افزار خطا
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// درخواست‌های تبدیل‌شده از طریق پروکسی Vite به JSON Server می‌روند

// میان‌افزار پاسخ برای مدیریت خطا
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'خطای ناشناخته رخ داد'
    if (error.response) {
      message = error.response.data?.message || `خطای سرور: ${error.response.status}`
    } else if (error.request) {
      message = 'پاسخی از سرور دریافت نشد. لطفاً اتصال خود را بررسی کنید.'
    } else {
      message = error.message
    }
    return Promise.reject(new Error(message))
  }
)

export default api
