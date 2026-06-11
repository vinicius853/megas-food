import { notFound } from 'next/navigation'

import { ExperimentalMenuV2Client } from '@/components/experimental-menu-v2/experimental-menu-v2-client'

type ExperimentalMenuV2PageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function ExperimentalMenuV2Page({
  params,
}: ExperimentalMenuV2PageProps) {
  if (process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL_MENU_V2 !== 'true') {
    notFound()
  }

  const { slug } = await params

  return <ExperimentalMenuV2Client slug={slug} />
}
