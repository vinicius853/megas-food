"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  DollarSign,
  ImageIcon,
  MapPin,
  Paintbrush,
  Pizza,
  RefreshCw,
  Settings,
  TrendingUp,
  Truck,
} from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Skeleton } from "@/components/feedback/loading-state";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  formatMoney,
  getActiveOrders,
  getBestSellers,
  getDeliverySummary,
  getOrderDisplayNumber,
  getValidOrders,
  hasCustomization,
  orderStatusLabels,
} from "./dashboard-data";
import { useDashboardOverview } from "./use-dashboard-overview";

const quickActions = [
  {
    title: "Abrir pedidos",
    description: "Acompanhe pedidos em tempo real.",
    href: "/dashboard/pedidos",
    icon: ClipboardList,
  },
  {
    title: "Editar cardápio",
    description: "Atualize produtos, opções e preços.",
    href: "/dashboard/cardapio",
    icon: Pizza,
  },
  {
    title: "Gerenciar entregas",
    description: "Configure bairros, taxas e prazos.",
    href: "/dashboard/entregas",
    icon: Truck,
  },
  {
    title: "Personalizar cardápio",
    description: "Ajuste logo, capa e cores do menu.",
    href: "/dashboard/personalizacao",
    icon: Paintbrush,
  },
  {
    title: "Configurações",
    description: "Ajuste os dados da sua loja.",
    href: "/dashboard/configuracoes",
    icon: Settings,
  },
];

export default function PizzariaDashboardPage() {
  const { orders, delivery, customization, loading, error, reload } =
    useDashboardOverview();

  const validOrders = getValidOrders(orders);
  const activeOrders = getActiveOrders(orders);
  const revenue = validOrders.reduce(
    (total, order) => total + Number(order.total || 0),
    0,
  );
  const averageTicket = validOrders.length ? revenue / validOrders.length : 0;
  const recentOrders = orders.slice(0, 4);
  const bestSellers = getBestSellers(orders);
  const deliverySummary = getDeliverySummary(delivery);
  const customizationConfigured = hasCustomization(customization);

  const stats = [
    {
      label: "Pedidos hoje",
      value: String(orders.length),
      detail: orders.length ? "Pedidos registrados hoje" : "Nenhum pedido hoje",
      icon: ClipboardList,
      accent: "from-orange-500 to-red-600",
    },
    {
      label: "Em andamento",
      value: String(activeOrders.length),
      detail: activeOrders.length
        ? "Aguardando preparo, retirada ou entrega"
        : "Nenhum pedido em andamento",
      icon: ClipboardList,
      accent: "from-amber-500 to-orange-600",
    },
    {
      label: "Faturamento hoje",
      value: formatMoney(revenue),
      detail: validOrders.length
        ? `${validOrders.length} pedidos não cancelados`
        : "Sem faturamento registrado",
      icon: DollarSign,
      accent: "from-emerald-500 to-green-600",
    },
    {
      label: "Ticket médio",
      value: formatMoney(averageTicket),
      detail: validOrders.length
        ? "Média dos pedidos de hoje"
        : "Aguardando o primeiro pedido",
      icon: TrendingUp,
      accent: "from-sky-500 to-blue-600",
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Visão geral"
        description="Resumo operacional com dados reais da sua loja."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link href="/dashboard/pedidos">
                <ClipboardList className="h-4 w-4" />
                Abrir pedidos
              </Link>
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <section className="mb-7 overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-[0_20px_70px_rgba(15,23,42,0.25)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant={orders.length ? "success" : "default"}>
              {loading ? "Atualizando dados" : "Dados do sistema"}
            </Badge>
            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-4xl">
              Acompanhe sua operação em um só lugar.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Pedidos, entregas e configurações aparecem aqui assim que forem
              registrados.
            </p>
          </div>

          <div className="grid min-w-[260px] grid-cols-2 gap-3 rounded-3xl bg-white/10 p-4">
            <div>
              <p className="text-xs uppercase text-slate-400">Pedidos hoje</p>
              <p className="mt-1 text-lg font-black">
                {loading ? "..." : orders.length}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Em andamento</p>
              <p className="mt-1 text-lg font-black text-emerald-400">
                {loading ? "..." : activeOrders.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>
                    {loading ? (
                      <Skeleton className="mt-3 h-9 w-28" />
                    ) : (
                      <p className="mt-2 text-3xl font-black text-slate-950">
                        {stat.value}
                      </p>
                    )}
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      {stat.detail}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.accent} text-white`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-7 grid gap-4 xl:grid-cols-2">
        <DeliveryCard
          loading={loading}
          deliveryOpen={delivery?.isDeliveryOpen === true}
          summary={deliverySummary}
        />
        <CustomizationCard
          loading={loading}
          settings={customization}
          configured={customizationConfigured}
        />
      </section>

      <section className="mt-7 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Últimos pedidos</CardTitle>
                <CardDescription>Pedidos recebidos hoje.</CardDescription>
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
            {loading &&
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-3xl" />
              ))}
            {!loading && recentOrders.length === 0 && (
              <EmptyState
                icon={ClipboardList}
                title="Nenhum pedido hoje"
                description="Os novos pedidos aparecerão aqui automaticamente."
                className="bg-slate-50/60"
              />
            )}
            {!loading &&
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-slate-50/60 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {getOrderDisplayNumber(order)} ·{" "}
                      {order.customerName || "Cliente não informado"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {order.items.reduce(
                        (total, item) => total + item.quantity,
                        0,
                      )}{" "}
                      itens no pedido
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-slate-900">
                      {formatMoney(Number(order.total || 0))}
                    </span>
                    <Badge
                      variant={
                        order.status === "CANCELLED"
                          ? "danger"
                          : order.status === "DELIVERED"
                            ? "success"
                            : "warning"
                      }
                    >
                      {orderStatusLabels[order.status]}
                    </Badge>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mais vendidos</CardTitle>
            <CardDescription>Produtos com maior saída hoje.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading &&
              Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-2xl" />
              ))}
            {!loading && bestSellers.length === 0 && (
              <EmptyState
                icon={TrendingUp}
                title="Sem vendas para classificar"
                description="O ranking será calculado a partir dos pedidos reais."
                className="border-0 bg-slate-50"
              />
            )}
            {!loading &&
              bestSellers.map((product, index) => (
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
                  <Badge variant="primary">{product.quantity}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-7">
        <h2 className="text-xl font-black text-slate-950">Ações rápidas</h2>
        <p className="mt-1 text-sm text-slate-500">
          Acesse as áreas mais usadas da operação.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="h-full transition hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-lg font-black text-slate-950">
                      {action.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {action.description}
                    </p>
                    <div className="mt-5 flex items-center gap-2 text-sm font-bold text-orange-600">
                      Acessar
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </PageContainer>
  );
}

function DeliveryCard({
  loading,
  deliveryOpen,
  summary,
}: {
  loading: boolean;
  deliveryOpen: boolean;
  summary: ReturnType<typeof getDeliverySummary>;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Entregas</CardTitle>
            <CardDescription>Áreas e taxas configuradas.</CardDescription>
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
        {loading ? (
          <Skeleton className="h-48 w-full rounded-3xl" />
        ) : summary.activeCount === 0 ? (
          <EmptyState
            icon={Truck}
            title="Nenhuma entrega cadastrada"
            description="Cadastre bairros, taxas e prazos para começar a receber entregas."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/entregas">Configurar entregas</Link>
              </Button>
            }
            className="bg-slate-50"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <Truck className="h-7 w-7 text-orange-600" />
              <p className="mt-4 text-sm text-slate-500">Status</p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {deliveryOpen ? "Entregas abertas" : "Entregas pausadas"}
              </p>
              <p className="mt-4 text-sm text-slate-500">
                {summary.activeCount} bairros ativos
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {formatMoney(summary.minFee ?? 0)} a{" "}
                {formatMoney(summary.maxFee ?? 0)}
              </p>
            </div>
            <div className="space-y-2">
              {summary.activeZones.slice(0, 4).map((zone) => (
                <div
                  key={zone.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2 font-bold">
                    <MapPin className="h-4 w-4 shrink-0 text-orange-500" />
                    <span className="truncate">{zone.name}</span>
                  </span>
                  <span className="font-black">{formatMoney(zone.fee)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomizationCard({
  loading,
  settings,
  configured,
}: {
  loading: boolean;
  settings: ReturnType<typeof useDashboardOverview>["customization"];
  configured: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Personalização</CardTitle>
            <CardDescription>
              Identidade visual do cardápio público.
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
        {loading ? (
          <Skeleton className="h-48 w-full rounded-3xl" />
        ) : !configured ? (
          <EmptyState
            icon={Paintbrush}
            title="Nenhuma personalização configurada"
            description="Adicione logo, capa e identidade da sua loja."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/personalizacao">Personalizar agora</Link>
              </Button>
            }
            className="bg-slate-50"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.brandName || "Logo da loja"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-slate-950">
                {settings?.brandName || "Identidade configurada"}
              </p>
              {settings?.tagline && (
                <p className="mt-2 text-sm text-slate-500">
                  {settings.tagline}
                </p>
              )}
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {settings?.coverUrl ? (
                  <img
                    src={settings.coverUrl}
                    alt="Capa do cardápio"
                    className="h-24 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 items-center justify-center text-sm text-slate-500">
                    Capa ainda não configurada
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
