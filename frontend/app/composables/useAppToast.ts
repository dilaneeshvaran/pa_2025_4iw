type ToastApi = {
  error: (message: string) => void
  success: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

let toastPromise: Promise<ToastApi | null> | null = null

async function resolveToast(): Promise<ToastApi | null> {
  if (!import.meta.client) {
    return null
  }

  const mod = await import('vue-toastification')
  const toast = mod.useToast()

  return {
    error: (message: string) => toast.error(message),
    success: (message: string) => toast.success(message),
    info: (message: string) => toast.info(message),
    warning: (message: string) => toast.warning(message),
  }
}

function getToast(): Promise<ToastApi | null> {
  if (!toastPromise) {
    toastPromise = resolveToast()
  }

  return toastPromise
}

export function useAppToast(): ToastApi {
  const run = (method: keyof ToastApi, message: string) => {
    void getToast().then((toast) => toast?.[method](message))
  }

  return {
    error: (message: string) => run('error', message),
    success: (message: string) => run('success', message),
    info: (message: string) => run('info', message),
    warning: (message: string) => run('warning', message),
  }
}