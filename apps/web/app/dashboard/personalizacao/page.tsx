'use client'

import Link from 'next/link'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Eye,
  ImageIcon,
  Monitor,
  Save,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'

type Palette = {
  id: string
  name: string
  colors: string[]
}

type CustomizationSettings = {
  logoUrl: string
  coverUrl: string
  paletteId: string
  brandName: string
  tagline: string
}

const palettes: Palette[] = [
  { id: 'classic-pizza', name: 'Pizza Classica', colors: ['#D90416', '#FF4A00', '#FDBA21', '#FFF4DC'] },
  { id: 'hot-spicy', name: 'Quente & Apimentado', colors: ['#5F0208', '#C1121F', '#F97316', '#FACC15'] },
  { id: 'fresh-healthy', name: 'Fresco & Saudavel', colors: ['#14532D', '#16A34A', '#BBF7D0', '#FFFFFF'] },
  { id: 'burger-grill', name: 'Burger & Grill', colors: ['#4A2C17', '#C05621', '#111827', '#FFF7ED'] },
  { id: 'elegant', name: 'Elegante', colors: ['#0F172A', '#164E63', '#CBD5E1', '#FFFFFF'] },
  { id: 'sweet-warm', name: 'Doce & Aconchego', colors: ['#F5E7D3', '#FDBA9B', '#FDA4AF', '#FFF7ED'] },
]

const fallbackSettings: CustomizationSettings = {
  logoUrl: '',
  coverUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1400&q=85',
  paletteId: 'classic-pizza',
  brandName: 'Parada Pizza',
  tagline: 'As melhores pizzas da regiao!',
}

const tabs = ['Identidade visual', 'Capa e imagens', 'Previa do cardapio']

export default function PersonalizacaoPage() {
  const [settings, setSettings] = useState<CustomizationSettings>(fallbackSettings)
  const [tenantSlug, setTenantSlug] = useState('parada-pizza')
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState<'logoUrl' | 'coverUrl' | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedPalette = useMemo(
    () => palettes.find((palette) => palette.id === settings.paletteId) ?? palettes[0],
    [settings.paletteId],
  )

  async function loadSettings() {
    try {
      setLoading(true)
      setError('')
      setMessage('')

      const [customization, tenant] = await Promise.all([
        apiFetch<CustomizationSettings>('/dashboard-settings/customization'),
        apiFetch<{ slug: string; name: string; logoUrl?: string | null }>('/tenants/me'),
      ])

      setSettings({
        ...fallbackSettings,
        ...customization,
        brandName: customization.brandName || tenant.name || fallbackSettings.brandName,
        logoUrl: customization.logoUrl || tenant.logoUrl || '',
      })
      setTenantSlug(tenant.slug || 'parada-pizza')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar personalizacao.')
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      await apiFetch('/dashboard-settings/customization', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })

      window.dispatchEvent(new Event('dashboard-brand-updated'))
      setMessage('Personalizacao salva com sucesso.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar personalizacao.')
    } finally {
      setSaving(false)
    }
  }

  async function handleFile(field: 'logoUrl' | 'coverUrl', event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingField(field)
      setError('')
      setMessage('')

      const formData = new FormData()
      formData.append('image', file)

      const response = await apiFetch<{ url: string }>('/uploads/menu-image', {
        method: 'POST',
        body: formData,
      })

      setSettings((current) => ({
        ...current,
        [field]: response.url,
      }))

      setMessage(
        field === 'logoUrl'
          ? 'Logo enviada com sucesso. Clique em salvar alteracoes para publicar.'
          : 'Imagem de capa enviada com sucesso. Clique em salvar alteracoes para publicar.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem.')
    } finally {
      setUploadingField(null)
      event.target.value = ''
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return (
    <PageContainer>
      <PageHeader
        title="Personalizacao do cardapio digital"
        description="Deixe seu cardapio com a cara da sua marca e ofereca uma experiencia unica aos seus clientes."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/c/${tenantSlug}`} target="_blank">
                <Eye className="h-4 w-4" />
                Ver cardapio publico
              </Link>
            </Button>

            <Button onClick={saveSettings} disabled={saving || loading} variant="primary" size="sm">
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar alteracoes'}
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {message}
        </div>
      )}

      <div className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-5 py-4 text-sm font-black transition ${
              activeTab === tab
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_520px]">
        <div className="space-y-5">
          {(activeTab === 'Identidade visual' || activeTab === 'Previa do cardapio') && (
            <>
              <LogoCard
                logoUrl={settings.logoUrl}
                onChange={(event) => handleFile('logoUrl', event)}
                onRemove={() => setSettings((current) => ({ ...current, logoUrl: '' }))}
                uploading={uploadingField === 'logoUrl'}
              />

              <PaletteCard
                selectedId={settings.paletteId}
                onSelect={(paletteId) => setSettings((current) => ({ ...current, paletteId }))}
              />
            </>
          )}

          {(activeTab === 'Capa e imagens' || activeTab === 'Previa do cardapio') && (
            <CoverCard
              coverUrl={settings.coverUrl}
              onChange={(event) => handleFile('coverUrl', event)}
              onRemove={() => setSettings((current) => ({ ...current, coverUrl: '' }))}
              uploading={uploadingField === 'coverUrl'}
            />
          )}
        </div>

        <Card className="xl:sticky xl:top-6 xl:self-start">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Previa do seu cardapio</CardTitle>
                <CardDescription>
                  Veja como a identidade aparece para o cliente.
                </CardDescription>
              </div>

              <div className="flex rounded-2xl bg-slate-100 p-1">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`rounded-xl p-2 ${previewDevice === 'desktop' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`rounded-xl p-2 ${previewDevice === 'mobile' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <MenuPreview
              settings={settings}
              palette={selectedPalette}
              mode={previewDevice}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

function LogoCard({
  logoUrl,
  onChange,
  onRemove,
  uploading,
}: {
  logoUrl: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
  uploading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Logo da sua marca</CardTitle>
        <CardDescription>Esse logo aparecera no cabecalho do seu cardapio.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-12 w-12 text-orange-500" />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <FileButton
              label={uploading ? 'Enviando...' : 'Alterar logo'}
              onChange={onChange}
              disabled={uploading}
            />
            <Button type="button" variant="outline" onClick={onRemove} disabled={uploading}>
              <Trash2 className="h-4 w-4 text-red-600" />
              Remover
            </Button>
          </div>
        </div>

        <p className="mt-3 text-xs font-medium text-slate-500">
          Recomendado: 512x512px (PNG ou SVG)
        </p>
      </CardContent>
    </Card>
  )
}

function PaletteCard({
  selectedId,
  onSelect,
}: {
  selectedId: string
  onSelect: (paletteId: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Cores do seu cardapio</CardTitle>
        <CardDescription>Escolha uma paleta de cores que combine com sua marca.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {palettes.map((palette) => {
          const selected = selectedId === palette.id
          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => onSelect(palette.id)}
              className={`relative rounded-3xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                selected ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white'
              }`}
            >
              {selected && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <div className="flex overflow-hidden rounded-2xl">
                {palette.colors.map((color) => (
                  <span key={color} className="h-9 flex-1" style={{ backgroundColor: color }} />
                ))}
              </div>
              <p className="mt-3 text-sm font-black text-slate-800">{palette.name}</p>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}

function CoverCard({
  coverUrl,
  onChange,
  onRemove,
  uploading,
}: {
  coverUrl: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
  uploading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Imagem de capa</CardTitle>
        <CardDescription>Essa imagem sera exibida no topo do seu cardapio.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-[3/1] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
          {coverUrl ? (
            <img src={coverUrl} alt="Capa" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <FileButton
            label={uploading ? 'Enviando...' : 'Alterar imagem'}
            onChange={onChange}
            disabled={uploading}
          />
          <Button type="button" variant="outline" onClick={onRemove} disabled={uploading}>
            <Trash2 className="h-4 w-4 text-red-600" />
            Remover
          </Button>
        </div>
        <p className="mt-3 text-xs font-medium text-slate-500">
          Recomendado: 1920x600px
        </p>
      </CardContent>
    </Card>
  )
}

function FileButton({
  label,
  onChange,
  disabled = false,
}: {
  label: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
}) {
  return (
    <label
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-orange-50 ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
    >
      <Upload className="h-4 w-4" />
      {label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  )
}

function MenuPreview({
  settings,
  palette,
  mode,
}: {
  settings: CustomizationSettings
  palette: Palette
  mode: 'desktop' | 'mobile'
}) {
  const [primary, secondary, accent, soft] = palette.colors
  const products = ['Calabresa', 'Portuguesa', 'Frango com Catupiry']

  return (
    <div className={mode === 'mobile' ? 'mx-auto max-w-[300px]' : ''}>
      <div className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-lg ${mode === 'mobile' ? 'min-h-[560px]' : ''}`}>
        <div
          className="relative min-h-44 bg-slate-900 p-5 text-white"
          style={{
            backgroundImage: `linear-gradient(90deg, ${primary}dd, #00000066), url(${settings.coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/90">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-7 w-7" style={{ color: secondary }} />
              )}
            </div>
            <div>
              <p className="text-lg font-black">{settings.brandName}</p>
              <p className="text-xs font-semibold text-white/80">{settings.tagline}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {['Pizzas Salgadas', 'Pizzas Doces', 'Bebidas', 'Combos'].map((item, index) => (
              <span
                key={item}
                className="rounded-full px-3 py-2 text-xs font-black"
                style={{
                  backgroundColor: index === 0 ? secondary : '#ffffff22',
                  color: index === 0 ? '#fff' : '#fff',
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-950">Destaques</h3>
            <span className="text-xs font-bold" style={{ color: primary }}>Ver todos</span>
          </div>

          <div className={mode === 'mobile' ? 'space-y-3' : 'grid grid-cols-3 gap-3'}>
            {products.map((product, index) => (
              <div key={product} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div
                  className="h-24"
                  style={{
                    background:
                      index === 0
                        ? `linear-gradient(135deg, ${accent}, ${soft})`
                        : `linear-gradient(135deg, ${secondary}, ${primary})`,
                  }}
                />
                <div className="p-3">
                  <p className="text-xs font-black text-slate-950">{product}</p>
                  <p className="mt-1 text-xs font-bold" style={{ color: primary }}>
                    R$ {index === 0 ? '49,90' : index === 1 ? '52,90' : '54,90'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
        A previa pode nao representar 100% do resultado final.
      </p>
    </div>
  )
}
