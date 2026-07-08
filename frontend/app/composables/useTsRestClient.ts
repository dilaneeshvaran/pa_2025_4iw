import { initClient } from '@ts-rest/core'
import { reviewsContract } from '@medicote/shared'
import { useAuthStore } from '~/stores/auth'

export const useTsRestClient = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  return initClient(reviewsContract, {
    baseUrl: config.public.apiBase,
    baseHeaders: {},
    api: async ({ path, method, headers, body }) => {
      if (authStore.isTokenExpired && authStore.refreshToken) {
        try {
          const response = await $fetch<{
            success: boolean
            data: { accessToken: string; refreshToken: string }
          }>('/auth/refresh', {
            baseURL: config.public.apiBase,
            method: 'POST',
            body: { refreshToken: authStore.refreshToken },
          })

          if (response.success && response.data && authStore.user) {
            authStore.setAuth(authStore.user, response.data)
          } else {
            throw new Error('Failed to refresh token')
          }
        } catch {
          authStore.logout()
          navigateTo('/auth/login')
          throw new Error('Session expired. Please login again.')
        }
      }

      const requestHeaders: Record<string, string> = {
        ...headers,
        'Content-Type': 'application/json',
      } as Record<string, string>

      if (authStore.accessToken) {
        requestHeaders['Authorization'] = `Bearer ${authStore.accessToken}`
      }

      try {
        const response = await $fetch.raw(path, {
          baseURL: config.public.apiBase,
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
        })

        return {
          status: response.status,
          body: response._data,
          headers: response.headers,
        }
      } catch (err: any) {
        if (err.response?.status === 401 && authStore.refreshToken) {
          try {
            const refreshResponse = await $fetch<{
              success: boolean
              data: { accessToken: string; refreshToken: string }
            }>('/auth/refresh', {
              baseURL: config.public.apiBase,
              method: 'POST',
              body: { refreshToken: authStore.refreshToken },
            })

            if (refreshResponse.success && refreshResponse.data && authStore.user) {
              authStore.setAuth(authStore.user, refreshResponse.data)

              const retryHeaders = {
                ...requestHeaders,
                'Authorization': `Bearer ${authStore.accessToken}`,
              }
              const response = await $fetch.raw(path, {
                baseURL: config.public.apiBase,
                method,
                headers: retryHeaders,
                body: body ? JSON.stringify(body) : undefined,
              })

              return {
                status: response.status,
                body: response._data,
                headers: response.headers,
              }
            }
          } catch {
            authStore.logout()
            navigateTo('/auth/login')
            throw err
          }
        }

        return {
          status: err.response?.status ?? 500,
          body: err.response?._data ?? { success: false, message: err.message },
          headers: err.response?.headers ?? new Headers(),
        }
      }
    },
  })
}
