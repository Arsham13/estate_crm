import React, { useState, useEffect, useCallback } from 'react'

/**
 * useApi — هوک ساده برای فراخوانی API
 * - loading, data, error
 * - refetch
 * - وابسته به dependency array
 */
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err.message || 'خطا در دریافت اطلاعات')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData, setData }
}
