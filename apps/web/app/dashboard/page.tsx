import Link from 'next/link'

import {
  ArrowRight,
  ClipboardList,
  DollarSign,
  ImageIcon,
  MapPin,
  Paintbrush,
  Pizza,
  Settings,
  TrendingUp,
  Truck,
} from 'lucide-react'

import {
  PageContainer,
  PageHeader,
} from '@/components/layout/page-container'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const stats = [
  {
    label: 'Pedidos hoje',
    value: '84',
    delta: '+12 vs ontem',
    icon: ClipboardList,
    accent: 'from-orange-500 to-red-600',
  },
  {
    label: 'Pedidos aceitos',
    value: '11',
    delta: 'Aguardando retirada ou entrega',
    icon: ClipboardList,
    accent: 'from-amber-500 to-orange-600',
  },
  {
    label: 'Faturamento hoje',
    value: 'R$ 4.280',
    delta: '+R$ 620 vs ontem',
    icon: DollarSign,
    accent: 'from-emerald-500 to-green-600',
  },
  {
    label: 'Ticket médio',
    value: 'R$ 50,95',
    delta: 'Média por pedido',
    icon: TrendingUp,
    accent: 'from-sky-500 to-blue-600',
  },
]

const recentOrders = [
  {
    number: '#1042',
    customer: 'Maria Souza',
    items: 3,
    total: 'R$ 128,00',
    status: 'Pronto',
    variant: 'success' as const,
  },
  {
    number: '#1041',
    customer: 'João Silva',
    items: 2,
    total: 'R$ 84,00',
    status: 'Confirmado',
    variant: 'warning' as const,
  },
  {
    number: '#1040',
    customer: 'Delivery',
    items: 5,
    total: 'R$ 196,00',
    status: 'Saiu entrega',
    variant: 'info' as const,
  },
  {
    number: '#1039',
    customer: 'Retirada',
    items: 2,
    total: 'R$ 72,00',
    status: 'Finalizado',
    variant: 'default' as const,
  },
]

const bestSellers = [
  { name: 'Calabresa', quantity: 24 },
  { name: 'Frango Catupiry', quantity: 19 },
  { name: 'Quatro Queijos', quantity: 14 },
  { name: 'Portuguesa', quantity: 11 },
  { name: 'Coca-Cola 2L', quantity: 9 },
]

const quickActions = [
  {
    title: 'Abrir pedidos',
    description: 'Acompanhe pedidos em tempo real.',
    href: '/dashboard/pedidos',
    icon: ClipboardList,
  },
  {
    title: 'Editar cardápio',
    description: 'Atualize pizzas, bebidas e preços.',
    href: '/dashboard/cardapio',
    icon: Pizza,
  },
  {
    title: 'Gerenciar entregas',
    description: 'Configure bairros, taxas e prazos.',
    href: '/dashboard/entregas',
    icon: Truck,
  },
  {
    title: 'Personalizar cardapio',
    description: 'Ajuste logo, capa e cores do menu.',
    href: '/dashboard/personalizacao',
    icon: Paintbrush,
  },
  {
    title: 'Configurações',
    description: 'Ajuste dados da pizzaria.',
    href: '/dashboard/configuracoes',
    icon: Settings,
  },
]

export default function PizzariaDashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Visão geral"
        description="Resumo operacional da pizzaria em tempo real."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="primary" size="sm">
              <Link href="/dashboard/pedidos">
                <ClipboardList className="h-4 w-4" />
                Abrir pedidos
              </Link>
            </Button>
          </div>
        }
      />

      <section className="mb-7 overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_20px_70px_rgba(15,23,42,0.25)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="warning">
              Operação ativa
            </Badge>

            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-4xl">
              Sua pizzaria está pronta para vender online hoje.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Monitore pedidos online, cardápio e financeiro em uma única
              central simples para o dono da pizzaria usar sem complicação.
            </p>
          </div>

          <div className="grid min-w-[260px] grid-cols-2 gap-3 rounded-3xl bg-white/10 p-4 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Status
              </p>
              <p className="mt-1 text-lg font-black text-emerald-400">
                Online
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Hoje
              </p>
              <p className="mt-1 text-lg font-black">
                84 pedidos
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.label} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>

                    <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                      {stat.value}
                    </p>

                    <p className="mt-3 text-xs font-medium text-slate-500">
                      {stat.delta}
                    </p>
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.accent} text-white shadow-lg`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="mt-7 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Entregas</CardTitle>
                <CardDescription>
                  Gerencie areas, taxas e horarios de funcionamento.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/entregas">
                  Gerenciar
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <Truck className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">Status</p>
                <p className="mt-1 text-lg font-black text-emerald-600">Entregas ativas</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Bairros</span>
                    <strong>12</strong>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Taxas</span>
                    <strong>R$ 5 - R$ 12</strong>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Tempo</span>
                    <strong>35 - 55 min</strong>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {['Centro', 'Vista Alegre', 'Ano Bom', 'Saudade'].map((bairro, index) => (
                  <div key={bairro} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 font-bold text-slate-800">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      {bairro}
                    </span>
                    <span className="font-black">R$ {index + 5},00</span>
                    <Badge variant="success">Ativo</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Personalizacao do cardapio digital</CardTitle>
                <CardDescription>
                  Ajuste logo, capa e cores do menu publico.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/personalizacao">
                  Personalizar
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
              <div className="space-y-3">
                <div className="flex h-24 items-center justify-center rounded-3xl border border-slate-200 bg-orange-50 text-orange-600">
                  <Pizza className="h-12 w-12" />
                </div>
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                  <div className="h-28 bg-[url('https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80')] bg-cover bg-center" />
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-black text-slate-900">Cores do cardapio</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ['#D90416', '#FF4A00', '#FDBA21'],
                    ['#14532D', '#16A34A', '#BBF7D0'],
                    ['#0F172A', '#164E63', '#CBD5E1'],
                  ].map((colors, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 bg-white p-2">
                      <div className="flex overflow-hidden rounded-xl">
                        {colors.map((color) => (
                          <span key={color} className="h-10 flex-1" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-950 p-4 text-white">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-5 w-5 text-orange-400" />
                    <div>
                      <p className="text-sm font-black">Preview do cardapio</p>
                      <p className="text-xs text-slate-400">Logo, capa e botoes aplicados no menu publico.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-7 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Últimos pedidos</CardTitle>
                <CardDescription>
                  Pedidos mais recentes recebidos pela pizzaria.
                </CardDescription>
              </div>

              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/pedidos">
                  Ver todos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.number}
                className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-slate-50/60 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {order.number} · {order.customer}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {order.items} itens no pedido
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <span className="text-sm font-black text-slate-900">
                    {order.total}
                  </span>

                  <Badge variant={order.variant}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mais vendidos</CardTitle>
            <CardDescription>
              Produtos com maior saída hoje.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {bestSellers.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-xs font-black text-orange-700">
                    {index + 1}
                  </div>

                  <span className="text-sm font-semibold text-slate-800">
                    {product.name}
                  </span>
                </div>

                <Badge variant="primary">
                  {product.quantity}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-7">
        <div className="mb-4">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Ações rápidas
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Atalhos para as áreas mais usadas no dia a dia da pizzaria.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon

            return (
              <Link key={action.href} href={action.href}>
                <Card className="h-full transition hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="mt-5 text-lg font-black tracking-tight text-slate-950">
                      {action.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {action.description}
                    </p>

                    <div className="mt-5 flex items-center gap-2 text-sm font-bold text-orange-600">
                      Acessar
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>
    </PageContainer>
  )
}
