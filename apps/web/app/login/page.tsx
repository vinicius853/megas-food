'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BarChart3, Eye, EyeOff, Headphones, Lock, ShieldCheck, ShoppingBag, TrendingUp, User, Zap } from 'lucide-react'

import { apiFetch } from '@/lib/api'

import logoImage from './imagens/megas-food-logo.png'
import restaurantImage from './imagens/login-restaurante-bg.png'
import { clearAuthSession } from '@/lib/auth-session'
import type { TenantSegment } from '@/lib/segments/segment-types'
import { getLoginErrorMessage } from './login-error'

type LoginResponse = {
  accessToken: string
  user: {
    id: string
    name: string
    email: string
    role: string
    permissions?: string[]
  }
  tenant: {
    id: string
    name: string
    slug: string
    enabledSegments?: TenantSegment[]
  }
}

const highlights = [
  {
    icon: ShoppingBag,
    title: 'Pedidos online',
  },
  {
    icon: BarChart3,
    title: 'Gestão inteligente',
  },
  {
    icon: TrendingUp,
    title: 'Crescimento contínuo',
  },
]

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Segurança',
    description: 'Seus dados protegidos com tecnologia de ponta.',
  },
  {
    icon: Zap,
    title: 'Performance',
    description: 'Sistema rápido, estável e sempre disponível.',
  },
  {
    icon: BarChart3,
    title: 'Resultados',
    description: 'Mais controle, mais vendas, mais lucro.',
  },
  {
    icon: Headphones,
    title: 'Suporte',
    description: 'Time especialista pronto para te ajudar.',
  },
]

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    try {
      setLoading(true)
      setError('')

      clearAuthSession()

      const response = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const token = response.accessToken

      if (!token) {
        throw new Error('Token não retornado pela API')
      }

      localStorage.setItem('token', token)
      localStorage.setItem('tenantId', response.tenant.id)
      localStorage.setItem('tenantSlug', response.tenant.slug)
      localStorage.setItem('tenantName', response.tenant.name)
      localStorage.setItem(
        'tenantSegments',
        JSON.stringify(response.tenant.enabledSegments || ['PIZZARIA']),
      )
      localStorage.setItem('userName', response.user.name)
      localStorage.setItem('userRole', response.user.role)
      localStorage.setItem('userPermissions', JSON.stringify(response.user.permissions || []))

      if (response.user.role === 'MASTER_OWNER' || response.user.role === 'MASTER_ADMIN') {
        router.push('/master')
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError(getLoginErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-8 font-sans text-white sm:px-6 lg:px-10">
      <div
        className="absolute inset-x-0 bottom-0 h-[52vh] opacity-35"
        style={{
          backgroundImage: `linear-gradient(180deg, #050505 0%, #050505cc 35%, #050505 100%), url(${restaurantImage.src})`,
          backgroundPosition: 'center bottom',
          backgroundSize: 'cover',
        }}
      />
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-orange-600/10 blur-3xl" />
      <div className="absolute bottom-24 right-0 h-80 w-80 rounded-full bg-red-600/10 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_430px]">
          <div className="mx-auto w-full max-w-lg text-center lg:mx-0 lg:text-left">
            <img src={logoImage.src} alt="Megas Food" className="mx-auto h-auto w-64 max-w-full lg:mx-0 lg:w-72" />

            <div className="mx-auto mt-6 h-px w-72 max-w-full bg-gradient-to-r from-transparent via-orange-500/60 to-transparent lg:mx-0" />

            <h1 className="mt-8 max-w-md text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Cardápio digital, pedidos online e gestão completa para <span className="font-black text-orange-500">pizzarias e restaurantes.</span>
            </h1>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {highlights.map((item) => {
                const Icon = item.icon

                return (
                  <div key={item.title} className="rounded-2xl border border-orange-500/30 bg-white/[0.03] p-3 text-center shadow-[0_0_30px_rgba(255,106,0,0.08)]">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/40 text-orange-500">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-[11px] font-semibold leading-snug text-slate-200">{item.title}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[430px] rounded-[28px] border border-white/10 bg-[#111111]/85 p-7 shadow-[0_0_60px_rgba(255,60,0,0.18)] backdrop-blur-xl sm:p-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white">
                Bem-<span className="text-orange-500">vindo!</span>
              </h2>
              <p className="mt-2 text-sm text-slate-400">Faça login para acessar sua conta</p>
            </div>

            <form onSubmit={handleLogin} className="mt-9 space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-300">E-mail ou usuário</label>
                <div className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 transition focus-within:border-orange-500/70">
                  <User className="h-5 w-5 text-orange-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="seu@email.com" required />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">Senha</label>
                <div className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 transition focus-within:border-orange-500/70">
                  <Lock className="h-5 w-5 text-orange-500" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="text-orange-500 transition hover:text-orange-300" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded border-orange-500 bg-transparent accent-orange-600" />
                  Lembrar de mim
                </label>

                <span className="text-slate-500">Acesso seguro</span>
              </div>

              {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#ff6a00] via-[#ff3c00] to-[#e50914] text-sm font-black text-white shadow-[0_20px_45px_rgba(255,60,0,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Entrando...' : 'Entrar'}
                <ArrowRight className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 pt-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-slate-500">ou</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <p className="text-center text-xs text-slate-400">
                Deseja contratar o sistema?{' '}
                <a href="https://wa.me/5524998522102?text=Ol%C3%A1!%20Tenho%20interesse%20em%20contratar%20o%20Megas%20Food." target="_blank" rel="noopener noreferrer" className="font-semibold text-orange-500 transition hover:text-orange-300">
                  Fale conosco
                </a>
              </p>
            </form>
          </div>
        </div>

        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => {
            const Icon = benefit.icon

            return (
              <div key={benefit.title} className="flex items-start gap-3 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/30 text-orange-500">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{benefit.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{benefit.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-slate-500">© 2026 Megas Food. Pedidos • Gestão • Crescimento.</p>
        <nav className="flex justify-center gap-5 text-xs font-semibold text-slate-400">
          <Link href="/privacidade" className="hover:text-white">
            Política de Privacidade
          </Link>
          <Link href="/termos" className="hover:text-white">
            Termos de Uso
          </Link>
        </nav>
      </section>
    </main>
  )
}
