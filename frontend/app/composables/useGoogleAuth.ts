export const useGoogleAuth = () => {
  const config = useRuntimeConfig()

  /**
   * Redirige le navigateur vers le backend pour initier le flux Google OAuth
   */
  const login = (redirectUrl?: string) => {
    const params = redirectUrl
      ? `?redirect=${encodeURIComponent(redirectUrl)}`
      : ''
    window.location.href = `${config.public.apiBase}/oauth/google${params}`
  }

  /**
   * Traite les paramètres du callback Google OAuth
   * Parse les tokens et l'utilisateur depuis les query params
   */
  const handleCallback = (query: {
    accessToken?: string
    refreshToken?: string
    user?: string
    redirect?: string
    error?: string
  }) => {
    if (query.error) {
      throw new Error(query.error)
    }

    if (!query.accessToken || !query.refreshToken || !query.user) {
      throw new Error('Données d\'authentification Google manquantes')
    }

    const user = JSON.parse(query.user)
    const tokens = {
      accessToken: query.accessToken,
      refreshToken: query.refreshToken,
    }

    return { user, tokens, redirect: query.redirect || '' }
  }

  return { login, handleCallback }
}
