import {
  ImagePlus,
  Loader2,
  Trash2,
} from 'lucide-react'
import { useRef, useState } from 'react'

import { apiFetch } from '@/lib/api'

type UploadResponse = {
  url: string
  publicId?: string | null
}

export function ImageUploadField({
  imageUrl,
  label,
  onChange,
  compact = false,
}: {
  imageUrl?: string | null
  label: string
  onChange: (value: string | null, publicId?: string | null) => void
  compact?: boolean
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    try {
      setUploading(true)
      setError('')

      const formData = new FormData()
      formData.append('image', file)

      const response = await apiFetch<UploadResponse>(
        '/uploads/menu-image',
        {
          method: 'POST',
          body: formData,
        },
      )

      onChange(response.url, response.publicId ?? null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao enviar imagem.',
      )
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className={`flex min-w-0 ${compact ? 'gap-2' : 'gap-3'}`}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 transition hover:border-orange-300 hover:text-orange-600 ${
          compact ? 'h-[72px] w-[72px]' : 'h-20 w-20'
        }`}
        aria-label={`Enviar foto de ${label}`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <ImagePlus className="h-6 w-6" />
          </span>
        )}

        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/75">
            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`inline-flex h-9 items-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:opacity-60 ${
              compact ? 'px-2.5' : 'px-3'
            }`}
          >
            <ImagePlus className="h-4 w-4" />
            Foto
          </button>

          {imageUrl && (
            <button
              type="button"
              onClick={() => onChange(null, null)}
              disabled={uploading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
              aria-label={`Remover foto de ${label}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {error && (
          <p className="mt-2 max-w-[220px] text-xs font-bold leading-relaxed text-red-600">
            {error}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
