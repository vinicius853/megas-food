type ApiErrorPayload = {
  message?: string | string[]
}

export function getLoginErrorMessage(error: unknown) {
  if (!(error instanceof Error) || !error.message) {
    return 'Email ou senha inválidos.'
  }

  try {
    const payload = JSON.parse(error.message) as ApiErrorPayload

    if (Array.isArray(payload.message)) {
      return payload.message.join(', ')
    }

    return payload.message || 'Email ou senha inválidos.'
  } catch {
    return error.message
  }
}
