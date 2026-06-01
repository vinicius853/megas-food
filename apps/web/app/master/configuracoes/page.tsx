'use client'

import * as React from 'react'

import { PageContainer, PageHeader } from '@/components/layout/page-container'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

const savedSettings = {
  name: 'Megas Food',
  contactEmail: 'contato@megastech.com',
  supportEmail: 'suporte@megastech.com',
}

type TenantOption = {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
}

type UploadResponse = {
  url: string
}

const masterTenantSlug = 'megastech-master'
const logoStorageKey = 'masterLogoUrl'

export default function ConfiguracoesPage() {
  const [settings, setSettings] = React.useState(savedSettings)
  const [message, setMessage] = React.useState('')
  const [logoUrl, setLogoUrl] = React.useState('')
  const [masterTenantId, setMasterTenantId] = React.useState('')
  const [loadingLogo, setLoadingLogo] = React.useState(true)
  const [uploadingLogo, setUploadingLogo] = React.useState(false)

  React.useEffect(() => {
    let ignore = false

    async function loadMasterLogo() {
      setLoadingLogo(true)

      try {
        const tenants = await apiFetch<TenantOption[]>('/tenants')
        const masterTenant = tenants.find((tenant) => tenant.slug === masterTenantSlug)

        if (!masterTenant) {
          throw new Error('Tenant master nao encontrado.')
        }

        if (ignore) return

        setMasterTenantId(masterTenant.id)
        setLogoUrl(masterTenant.logoUrl || '')

        if (masterTenant.logoUrl) {
          localStorage.setItem(logoStorageKey, masterTenant.logoUrl)
        } else {
          localStorage.removeItem(logoStorageKey)
        }
      } catch (error) {
        if (!ignore) {
          setLogoUrl(localStorage.getItem(logoStorageKey) || '')
          setMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar a logo do Master.')
        }
      } finally {
        if (!ignore) {
          setLoadingLogo(false)
        }
      }
    }

    loadMasterLogo()

    return () => {
      ignore = true
    }
  }, [])

  function updateSetting(field: keyof typeof savedSettings, value: string) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }))
    setMessage('')
  }

  function handleCancel() {
    setSettings(savedSettings)
    setMessage('Alteracoes descartadas.')
  }

  function handleSave() {
    console.log('Master settings draft', settings)
    setMessage('Configuracoes salvas localmente. Backend de plataforma ainda nao conectado.')
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!masterTenantId) {
      setMessage('Tenant master nao encontrado. Nao foi possivel salvar a logo.')
      event.target.value = ''
      return
    }

    setUploadingLogo(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('image', file)

      const upload = await apiFetch<UploadResponse>('/uploads/menu-image', {
        method: 'POST',
        body: formData,
      })

      await apiFetch<TenantOption>(`/tenants/${masterTenantId}`, {
        method: 'PATCH',
        body: JSON.stringify({ logoUrl: upload.url }),
      })

      localStorage.setItem(logoStorageKey, upload.url)
      setLogoUrl(upload.url)
      window.dispatchEvent(new CustomEvent('master-logo-updated', { detail: upload.url }))
      setMessage('Logo salva no backend com sucesso.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel salvar a logo.')
    } finally {
      setUploadingLogo(false)
      event.target.value = ''
    }
  }

  async function removeLogo() {
    if (!masterTenantId) {
      localStorage.removeItem(logoStorageKey)
      setLogoUrl('')
      window.dispatchEvent(new CustomEvent('master-logo-updated', { detail: '' }))
      setMessage('Logo removida localmente. Tenant master nao encontrado para salvar no backend.')
      return
    }

    setUploadingLogo(true)
    setMessage('')

    try {
      await apiFetch<TenantOption>(`/tenants/${masterTenantId}`, {
        method: 'PATCH',
        body: JSON.stringify({ logoUrl: '' }),
      })

      localStorage.removeItem(logoStorageKey)
      setLogoUrl('')
      window.dispatchEvent(new CustomEvent('master-logo-updated', { detail: '' }))
      setMessage('Logo removida do backend.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel remover a logo.')
    } finally {
      setUploadingLogo(false)
    }
  }

  return (
    <PageContainer size="narrow">
      <PageHeader
        title="Configuracoes"
        description="Preferencias da plataforma."
      />

      {message ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Marca Megas Food</CardTitle>
            <CardDescription>
              Logo exibida na sidebar do painel master.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-28 w-44 items-center justify-center rounded-2xl border border-slate-200 bg-[#080808] p-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Megas Food" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <p className="text-xl font-black text-white">MEGAS</p>
                    <p className="-mt-1 text-lg font-black text-orange-500">FOOD</p>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600">
                  Recomendado: PNG ou SVG com fundo transparente.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF3C00] via-[#FF6A00] to-[#FFB000] px-5 text-sm font-black text-white shadow-lg">
                    {uploadingLogo ? 'Enviando...' : 'Alterar logo'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo || loadingLogo}
                      className="sr-only"
                    />
                  </label>
                  <Button variant="outline" onClick={removeLogo} disabled={uploadingLogo || loadingLogo}>
                    Remover
                  </Button>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  A logo e enviada para o storage e a URL fica salva no tenant master.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados da plataforma</CardTitle>
            <CardDescription>
              Informacoes exibidas em comunicacoes e faturas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Nome
              </label>
              <Input
                value={settings.name}
                onChange={(event) => updateSetting('name', event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Email de contato
              </label>
              <Input
                type="email"
                value={settings.contactEmail}
                onChange={(event) => updateSetting('contactEmail', event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Suporte
              </label>
              <Input
                type="email"
                value={settings.supportEmail}
                onChange={(event) => updateSetting('supportEmail', event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificacoes</CardTitle>
            <CardDescription>
              Como e quando a equipe deve ser avisada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Sera configurado em etapa futura.
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Salvar alteracoes
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}
