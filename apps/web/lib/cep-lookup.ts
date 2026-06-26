export type CepLookupSource = 'brasilapi' | 'viacep'

export type CepLookupResult = {
  cep: string
  street: string
  neighborhood: string
  city: string
  state: string
  source: CepLookupSource
}

type BrasilApiCepResponse = {
  cep?: string
  street?: string
  neighborhood?: string
  city?: string
  state?: string
}

type ViaCepResponse = {
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

const CEP_LOOKUP_TIMEOUT_MS = 2800

export async function lookupCep(value: string): Promise<CepLookupResult | null> {
  const cep = onlyNumbers(value)

  if (cep.length !== 8) {
    return null
  }

  return (await lookupBrasilApi(cep)) ?? (await lookupViaCep(cep))
}

async function lookupBrasilApi(cep: string) {
  const data = await fetchJson<BrasilApiCepResponse>(
    `https://brasilapi.com.br/api/cep/v2/${cep}`,
  )

  if (!data) {
    return null
  }

  return normalizeCepResult({
    cep: data.cep,
    street: data.street,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    source: 'brasilapi',
  })
}

async function lookupViaCep(cep: string) {
  const data = await fetchJson<ViaCepResponse>(
    `https://viacep.com.br/ws/${cep}/json/`,
  )

  if (!data || data.erro) {
    return null
  }

  return normalizeCepResult({
    cep: data.cep,
    street: data.logradouro,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
    source: 'viacep',
  })
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    CEP_LOOKUP_TIMEOUT_MS,
  )

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeCepResult(input: {
  cep?: string
  street?: string
  neighborhood?: string
  city?: string
  state?: string
  source: CepLookupSource
}): CepLookupResult | null {
  const result = {
    cep: String(input.cep ?? '').trim(),
    street: String(input.street ?? '').trim(),
    neighborhood: String(input.neighborhood ?? '').trim(),
    city: String(input.city ?? '').trim(),
    state: String(input.state ?? '').trim().toUpperCase(),
    source: input.source,
  }

  if (!result.cep || !result.city || !result.state) {
    return null
  }

  return result
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, '')
}
