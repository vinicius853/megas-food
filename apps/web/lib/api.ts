import { clearAuthSession } from './auth-session'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function buildUrl(endpoint: string) {
  if (!API_URL) {
    return endpoint
  }

  const baseUrl = API_URL.replace(/\/$/, '')
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`

  return `${baseUrl}${normalizedEndpoint}`
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null

  let response: Response

  try {
    const isFormData =
      typeof FormData !== 'undefined' && options.body instanceof FormData

    response = await fetch(buildUrl(endpoint), {
      ...options,
      headers: {
        ...(!isFormData && {
          'Content-Type': 'application/json',
        }),

        ...(token && {
          Authorization: `Bearer ${token}`,
        }),

        ...(options.headers || {}),
      },
    })
  } catch {
    throw new Error(
      'Nao foi possivel conectar na API. Verifique se o backend esta rodando em http://localhost:3001.',
    )
  }

  if (!response.ok) {
    const errorText = await response.text()
    const isHtmlResponse = errorText.trim().startsWith('<!DOCTYPE')

    if (response.status === 413) {
      throw new Error(
        'Imagem muito grande. Envie um arquivo de até 10 MB.',
      )
    }

    if (response.status === 401 && token) {
      clearAuthSession()
      window.location.replace('/login')
    }

    throw new Error(
      isHtmlResponse
        ? 'API indisponivel ou rota nao encontrada. Verifique se o backend esta rodando.'
        : errorText || 'Erro na API',
    )
  }

  return response.json()
}
